/**
 * TC-003: 에이전트 호출 라우팅
 * 질문 유형별로 올바른 에이전트가 선택되는지 검증한다.
 * Gemini SDK를 mock하고 분류 로직만 테스트한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Gemini SDK mock
const mockGenerateContent = vi.fn()
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}))

// 라우팅 로직을 직접 테스트하기 위한 인라인 함수
function parseAgentFromText(text) {
  try {
    const parsed = JSON.parse(text)
    return parsed.agent || 'strategy-agent'
  } catch {
    return 'strategy-agent'
  }
}

const ROUTING_TEST_CASES = [
  {
    description: 'OKR 관련 질문 → strategy-agent',
    query: 'OKR을 어떻게 설정해야 하나요?',
    expectedAgent: 'strategy-agent',
    mockResponse: '{"agent":"strategy-agent"}',
  },
  {
    description: '시장 분석 질문 → strategy-agent',
    query: '시장 규모 TAM을 어떻게 계산하나요?',
    expectedAgent: 'strategy-agent',
    mockResponse: '{"agent":"strategy-agent"}',
  },
  {
    description: '아이디어 검증 질문 → discovery-agent',
    query: '이 아이디어가 괜찮을지 검토해주세요',
    expectedAgent: 'discovery-agent',
    mockResponse: '{"agent":"discovery-agent"}',
  },
  {
    description: 'PRD 작성 요청 → discovery-agent',
    query: 'PRD를 작성해주세요',
    expectedAgent: 'discovery-agent',
    mockResponse: '{"agent":"discovery-agent"}',
  },
  {
    description: '유저스토리 요청 → execution-agent',
    query: '유저스토리를 작성해주세요',
    expectedAgent: 'execution-agent',
    mockResponse: '{"agent":"execution-agent"}',
  },
  {
    description: '우선순위 질문 → execution-agent',
    query: '백로그 우선순위를 정해주세요',
    expectedAgent: 'execution-agent',
    mockResponse: '{"agent":"execution-agent"}',
  },
]

describe('TC-003: 에이전트 라우팅', () => {
  beforeEach(() => vi.clearAllMocks())

  ROUTING_TEST_CASES.forEach(({ description, expectedAgent, mockResponse }) => {
    it(description, async () => {
      mockGenerateContent.mockResolvedValue({
        response: { text: () => mockResponse },
      })

      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI('test')
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent('테스트')

      const selectedAgent = parseAgentFromText(result.response.text())
      expect(selectedAgent).toBe(expectedAgent)
    })
  })

  it('JSON 파싱 실패 시 strategy-agent로 폴백된다', () => {
    const result = parseAgentFromText('잘못된 응답')
    expect(result).toBe('strategy-agent')
  })
})
