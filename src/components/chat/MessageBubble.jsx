import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { AgentBadge } from './AgentBadge'
import { EvalScoreBadge } from './EvalScoreBadge'

export function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* 에이전트 정보 (어시스턴트 메시지) */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <AgentBadge agentName={message.agent_used} />
            <EvalScoreBadge scores={message.evalScores} />
            {message.streaming && (
              <span className="text-xs text-gray-400 animate-pulse">생성 중...</span>
            )}
          </div>
        )}

        {/* 말풍선 */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-primary-500 text-white rounded-br-sm'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{message.content || ' '}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* 복사 버튼 (어시스턴트 메시지에만) */}
        {!isUser && !message.streaming && message.content && (
          <button
            onClick={handleCopy}
            className="mt-1 ml-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="답변 복사"
          >
            {copied ? '✓ 복사됨' : '복사'}
          </button>
        )}
      </div>
    </div>
  )
}
