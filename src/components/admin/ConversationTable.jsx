import { useState, Fragment } from 'react'
import { AgentBadge } from '../chat/AgentBadge'
import { EvalScoreBadge } from '../chat/EvalScoreBadge'

export function ConversationTable({ conversations }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">제목</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">사용자 ID</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">생성일</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">최근 활동</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {conversations?.map((conv) => (
            <Fragment key={conv.id}>
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{conv.title}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{conv.user_id?.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-gray-500">{new Date(conv.created_at).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(conv.updated_at).toLocaleDateString('ko-KR')}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setExpanded(expanded === conv.id ? null : conv.id)}
                    className="text-primary-500 hover:text-primary-700 text-xs"
                  >
                    {expanded === conv.id ? '닫기' : '상세'}
                  </button>
                </td>
              </tr>
              {expanded === conv.id && conv.messages && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 bg-gray-50">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {conv.messages.map((msg) => (
                        <div key={msg.id} className="flex items-start gap-2 text-xs">
                          <span className={`font-medium flex-shrink-0 ${msg.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                            {msg.role === 'user' ? '사용자' : 'AI'}
                          </span>
                          {msg.agent_used && <AgentBadge agentName={msg.agent_used} />}
                          {msg.evalScores && <EvalScoreBadge scores={msg.evalScores} />}
                          <span className="text-gray-600 line-clamp-2">{msg.content}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
