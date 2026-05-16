import { useState, useRef } from 'react'
import { getUserId } from '../../lib/supabase'

export function ChatInput({ onSend, onFileUpload, disabled, attachedFile, onRemoveFile }) {
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

    e.target.value = ''
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* 첨부 파일 배지 */}
      {attachedFile && (
        <div className="max-w-3xl mx-auto mb-2">
          <span className="inline-flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full border border-primary-200">
            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {attachedFile.name}
            <button
              onClick={onRemoveFile}
              className="ml-0.5 text-primary-400 hover:text-primary-700 font-bold leading-none"
              title="첨부 파일 제거"
            >
              ×
            </button>
          </span>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        {/* 파일 업로드 */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          title="파일 업로드 (.txt, .xlsx, .xls, .csv)"
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
          accept=".txt,.pdf,.md,.xlsx,.xls,.csv"
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
