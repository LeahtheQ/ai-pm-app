import { useState, useCallback } from 'react'
import { supabase, getUserId } from '../lib/supabase'

const AGENT_LABELS = {
  'strategy-agent': '전략 에이전트',
  'discovery-agent': '디스커버리 에이전트',
  'execution-agent': '실행 에이전트',
}

export function useChat(conversationId) {
  const [messages, setMessages]     = useState([])
  const [isLoading, setIsLoading]   = useState(false)
  const [currentAgent, setCurrentAgent] = useState(null)
  const [status, setStatus]         = useState('')

  const userId = getUserId()

  // 대화 히스토리 로드
  const loadHistory = useCallback(async () => {
    if (!conversationId) return
    const { data } = await supabase
      .from('messages')
      .select('id, role, content, agent_used, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }, [conversationId])

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || !conversationId || isLoading) return

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setIsLoading(true)
    setStatus('분류 중...')

    const assistantMsgId = crypto.randomUUID()
    const assistantMsg = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      agent_used: null,
      evalScores: null,
      streaming: true,
    }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          message: text,
          conversationId,
          userId,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('API 오류: ' + res.status)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            handleSSEEvent(event, assistantMsgId)
          } catch { /* JSON 파싱 실패 무시 */ }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: '오류가 발생했습니다. 다시 시도해주세요.', streaming: false }
            : m,
        ),
      )
    } finally {
      setIsLoading(false)
      setStatus('')
    }
  }, [conversationId, isLoading, messages, userId])

  function handleSSEEvent(event, assistantMsgId) {
    switch (event.type) {
      case 'classifying':
        setStatus('질문 분류 중...')
        break
      case 'agent_selected':
        setCurrentAgent(event.agent)
        setStatus(`${AGENT_LABELS[event.agent] || event.agent} 응답 생성 중...`)
        setMessages((prev) =>
          prev.map((m) => m.id === assistantMsgId ? { ...m, agent_used: event.agent } : m),
        )
        break
      case 'token':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: m.content + event.text } : m,
          ),
        )
        break
      case 'regenerating':
        setStatus('품질 개선 중...')
        break
      case 'regenerated_response':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: event.text } : m,
          ),
        )
        break
      case 'evaluating':
        setStatus('품질 검증 중...')
        break
      case 'complete':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, streaming: false, evalScores: event.evalScores }
              : m,
          ),
        )
        setStatus('')
        break
      case 'error':
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: event.message, streaming: false }
              : m,
          ),
        )
        break
    }
  }

  return { messages, isLoading, currentAgent, status, sendMessage, loadHistory, setMessages }
}
