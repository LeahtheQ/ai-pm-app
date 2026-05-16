import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// 모델 설정
const CLASSIFIER_MODEL  = 'gemini-2.5-flash'    // 분류 및 eval용
const SPECIALIST_MODEL  = 'gemini-2.5-flash'    // 전문가 응답용

// .md 파일에서 YAML 프론트매터를 제거하고 마크다운 바디만 반환
function loadAgentPrompt(agentName) {
  const filePath = join(ROOT, '.claude', 'agents', `${agentName}.md`)
  const raw = readFileSync(filePath, 'utf8')
  const { content } = matter(raw)
  return content.trim()
}

// 사용자 질문을 분석해 적합한 에이전트를 선택
async function classifyIntent(message) {
  const orchestratorPrompt = loadAgentPrompt('pm-orchestrator')
  const model = genAI.getGenerativeModel({
    model: CLASSIFIER_MODEL,
    systemInstruction: `${orchestratorPrompt}

사용자 질문을 분석해 다음 3개 에이전트 중 하나를 선택하십시오.
반드시 아래 JSON 형식만 출력하고 다른 텍스트는 포함하지 마십시오:
{"agent": "strategy-agent" | "discovery-agent" | "execution-agent"}`,
  })

  try {
    const result = await model.generateContent(message)
    const text = result.response.text().trim()
    const parsed = JSON.parse(text)
    return parsed.agent || 'strategy-agent'
  } catch {
    return 'strategy-agent'
  }
}

// 전문가 에이전트로 응답 생성 (스트리밍)
async function* streamSpecialistResponse(agentName, history, newMessage, systemExtra = '') {
  const agentPrompt = loadAgentPrompt(agentName)
  const systemInstruction = systemExtra
    ? `${agentPrompt}\n\n## 재생성 지시사항\n${systemExtra}`
    : agentPrompt

  const model = genAI.getGenerativeModel({
    model: SPECIALIST_MODEL,
    systemInstruction,
  })

  const chat = model.startChat({
    history: history.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
  })

  const stream = await chat.sendMessageStream(newMessage)
  let fullText = ''

  for await (const chunk of stream.stream) {
    const text = chunk.text()
    if (text) {
      fullText += text
      yield { type: 'token', text }
    }
  }
  yield { type: 'done', fullText }
}

// eval-agent로 품질 채점
async function evaluateResponse(responseText) {
  const evalPrompt = loadAgentPrompt('eval-agent')
  const model = genAI.getGenerativeModel({
    model: CLASSIFIER_MODEL,
    systemInstruction: evalPrompt,
  })

  try {
    const result = await model.generateContent(
      `다음 AI PM 답변을 평가해주십시오:\n\n${responseText}`,
    )
    const text = result.response.text().trim()
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return null
  } catch {
    return null
  }
}

// Supabase에 메시지와 Eval 결과 저장
async function persistMessage({ conversationId, role, content, agentUsed, skillsUsed, evalResult }) {
  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, role, content, agent_used: agentUsed, skills_used: skillsUsed })
    .select('id')
    .single()

  if (msgErr || !msg) return null

  if (evalResult && role === 'assistant') {
    await supabase.from('evaluations').insert({
      message_id: msg.id,
      score_accuracy: evalResult.score_accuracy,
      score_expertise: evalResult.score_expertise,
      score_completeness: evalResult.score_completeness,
      score_language: evalResult.score_language,
      feedback: evalResult.feedback,
    })
  }

  return msg.id
}

// 대화 제목 자동 생성 또는 updated_at 갱신
async function touchConversation(conversationId, firstMessage) {
  const { data } = await supabase
    .from('conversations')
    .select('title')
    .eq('id', conversationId)
    .single()

  if (data?.title === '새 대화') {
    const title = firstMessage.slice(0, 50)
    await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', conversationId)
  } else {
    await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드' })
  }

  const { message, conversationId, userId, history = [] } = req.body

  if (!message || !conversationId || !userId) {
    return res.status(400).json({ error: '필수 파라미터 누락: message, conversationId, userId' })
  }

  // SSE 헤더 설정
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`)

  try {
    // 1. 사용자 메시지 저장
    await persistMessage({ conversationId, role: 'user', content: message, agentUsed: null, skillsUsed: [] })
    await touchConversation(conversationId, message)

    // 2. 에이전트 분류
    sendEvent({ type: 'classifying' })
    const selectedAgent = await classifyIntent(message)
    sendEvent({ type: 'agent_selected', agent: selectedAgent })

    // 3. 대화 히스토리 구성 (최근 10개)
    const chatHistory = history.slice(-10)

    // 4. 전문가 응답 생성 (최대 2회 시도)
    let finalResponse = ''
    let evalResult = null
    let attempts = 0
    let systemExtra = ''

    while (attempts < 2) {
      attempts++
      finalResponse = ''

      if (attempts === 1) {
        sendEvent({ type: 'stream_start' })
        for await (const chunk of streamSpecialistResponse(selectedAgent, chatHistory, message, systemExtra)) {
          if (chunk.type === 'token') {
            sendEvent({ type: 'token', text: chunk.text })
            finalResponse += chunk.text
          }
        }
        sendEvent({ type: 'stream_end' })
      } else {
        sendEvent({ type: 'regenerating', feedback: evalResult?.feedback })
        for await (const chunk of streamSpecialistResponse(selectedAgent, chatHistory, message, systemExtra)) {
          if (chunk.type === 'done') finalResponse = chunk.fullText
        }
        sendEvent({ type: 'regenerated_response', text: finalResponse })
      }

      // 5. Eval 채점
      sendEvent({ type: 'evaluating' })
      evalResult = await evaluateResponse(finalResponse)

      if (!evalResult || !evalResult.regenerate) break
      systemExtra = `이전 답변의 품질이 기준에 미달했습니다. 다음 피드백을 반영해 더 나은 답변을 작성하십시오:\n${evalResult.feedback}`
    }

    // 6. 최종 응답 저장
    const skillsMap = {
      'strategy-agent':  ['product-strategy', 'okr-analysis'],
      'discovery-agent': ['idea-diagnosis', 'jtbd', 'prd-writing'],
      'execution-agent': ['user-story', 'user-interview', 'usability-test-plan', 'priority-validation'],
    }
    const messageId = await persistMessage({
      conversationId,
      role: 'assistant',
      content: finalResponse,
      agentUsed: selectedAgent,
      skillsUsed: skillsMap[selectedAgent] || [],
      evalResult,
    })

    // 7. 완료 이벤트
    sendEvent({
      type: 'complete',
      messageId,
      agent: selectedAgent,
      evalScores: evalResult
        ? {
            accuracy: evalResult.score_accuracy,
            expertise: evalResult.score_expertise,
            completeness: evalResult.score_completeness,
            language: evalResult.score_language,
            total: evalResult.total_score,
          }
        : null,
    })
  } catch (err) {
    console.error('chat API 오류:', err)
    sendEvent({ type: 'error', message: '응답 생성 중 오류가 발생했습니다.' })
  } finally {
    res.end()
  }
}
