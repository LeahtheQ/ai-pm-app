import { useEffect, useState } from 'react'
import { useChat } from '../hooks/useChat'
import { useConversations } from '../hooks/useConversations'
import { ConversationSidebar } from '../components/chat/ConversationSidebar'
import { MessageBubble } from '../components/chat/MessageBubble'
import { ChatInput } from '../components/chat/ChatInput'

export default function UserChat() {
  const { conversations, loading, createConversation, deleteConversation } = useConversations()
  const [currentId, setCurrentId] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const { messages, isLoading, status, sendMessage, loadHistory, setMessages } = useChat(currentId)

  // 첫 대화 자동 생성 또는 마지막 대화 선택
  useEffect(() => {
    if (!loading && conversations.length === 0) {
      createConversation().then(setCurrentId)
    } else if (!loading && conversations.length > 0 && !currentId) {
      setCurrentId(conversations[0].id)
    }
  }, [loading, conversations])

  // 대화 변경 시 히스토리 로드
  useEffect(() => {
    if (currentId) {
      setMessages([])
      loadHistory()
    }
  }, [currentId])

  const handleNewConversation = async () => {
    const id = await createConversation()
    if (id) setCurrentId(id)
  }

  const handleFileUpload = (data) => {
    setUploadedFiles((prev) => [...prev, data.fileName])
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <ConversationSidebar
        conversations={conversations}
        currentId={currentId}
        onSelect={setCurrentId}
        onCreate={handleNewConversation}
        onDelete={deleteConversation}
        loading={loading}
      />

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 상단 상태 표시 */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">AI PM 어시스턴트</h2>
            {status && (
              <p className="text-xs text-primary-600 animate-pulse">{status}</p>
            )}
          </div>
          {uploadedFiles.length > 0 && (
            <div className="text-xs text-gray-500">
              Knowledge Base: {uploadedFiles.slice(-1)[0]}
              {uploadedFiles.length > 1 && ` 외 ${uploadedFiles.length - 1}개`}
            </div>
          )}
        </div>

        {/* 메시지 목록 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">AI PM 어시스턴트</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                제품 전략, 아이디어 검증, PRD 작성, 유저스토리 등<br />
                PM 관련 모든 질문에 답해드립니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  'OKR을 어떻게 세워야 하나요?',
                  '아이디어를 검증하고 싶어요',
                  '유저스토리 작성을 도와주세요',
                  'PRD 초안을 써줘',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs bg-white border border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-600 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* 입력창 */}
        <ChatInput
          onSend={sendMessage}
          onFileUpload={handleFileUpload}
          disabled={isLoading || !currentId}
        />
      </div>
    </div>
  )
}
