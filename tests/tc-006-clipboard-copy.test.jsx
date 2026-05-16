/**
 * TC-006: 답변 복사 버튼
 * MessageBubble 컴포넌트의 복사 버튼이 navigator.clipboard.writeText를 올바르게 호출하는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MessageBubble } from '../src/components/chat/MessageBubble'

// react-markdown mock (jsdom에서 렌더링 단순화)
vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}))

describe('TC-006: 답변 복사 버튼', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.navigator.clipboard.writeText = vi.fn().mockResolvedValue(undefined)
  })

  const assistantMessage = {
    id: 'msg-1',
    role: 'assistant',
    content: 'AI PM 전략 분석 결과입니다.',
    agent_used: 'strategy-agent',
    evalScores: { accuracy: 9, expertise: 8, completeness: 9, language: 9, total: 35 },
    streaming: false,
  }

  it('복사 버튼이 렌더링된다', () => {
    render(<MessageBubble message={assistantMessage} />)
    expect(screen.getByRole('button', { name: /복사/i })).toBeInTheDocument()
  })

  it('복사 버튼 클릭 시 clipboard.writeText가 호출된다', async () => {
    render(<MessageBubble message={assistantMessage} />)
    const copyBtn = screen.getByRole('button', { name: /복사/i })
    fireEvent.click(copyBtn)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(assistantMessage.content)
    })
  })

  it('복사 후 "복사됨" 텍스트가 표시된다', async () => {
    render(<MessageBubble message={assistantMessage} />)
    fireEvent.click(screen.getByRole('button', { name: /복사/i }))

    await waitFor(() => {
      expect(screen.getByText(/복사됨/)).toBeInTheDocument()
    })
  })

  it('사용자 메시지에는 복사 버튼이 없다', () => {
    const userMessage = { id: 'msg-2', role: 'user', content: '질문입니다.', streaming: false }
    render(<MessageBubble message={userMessage} />)
    expect(screen.queryByRole('button', { name: /복사/i })).not.toBeInTheDocument()
  })

  it('스트리밍 중인 메시지에는 복사 버튼이 없다', () => {
    render(<MessageBubble message={{ ...assistantMessage, streaming: true }} />)
    expect(screen.queryByRole('button', { name: /복사/i })).not.toBeInTheDocument()
  })
})
