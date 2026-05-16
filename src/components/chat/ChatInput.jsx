import { useState, useRef } from 'react'
import { getUserId } from '../../lib/supabase'

export function ChatInput({ onSend, onFileUpload, disabled }) {
  const [text, setText] = useState('')
  const fileRef = useRef(null)
  const userId = getUserId()

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-user-id': userId },
        body: formData,
      })
      const data = await res.json()
      if (res.ok && onFileUpload) onFileUpload(data)
    } catch (err) {
      console.error('파일 업로드 오류:', err)
    }

    // 파일 입력 초기화
    e.target.value = ''
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        {/* 파일 업로드 */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="파일 업로드 (Knowledge Base)"
          disabled={disabled}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".txt,.pdf,.md"
          onChange={handleFileChange}
        />

        {/* 텍스트 입력 */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="AI PM에게 질문하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
          className="flex-1 resize-none border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-40"
          rows={1}
          style={{ minHeight: '44px' }}
          disabled={disabled}
        />

        {/* 전송 버튼 */}
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="flex-shrink-0 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-xl px-4 py-2.5 transition-colors text-sm font-medium"
        >
          전송
        </button>
      </div>
    </div>
  )
}
