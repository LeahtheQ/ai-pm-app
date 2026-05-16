export function ConversationSidebar({ conversations, currentId, onSelect, onCreate, onDelete, loading }) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">AI PM</h1>
        <button
          onClick={onCreate}
          className="mt-2 w-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
        >
          + 새 대화
        </button>
      </div>

      {/* 대화 목록 */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-4">불러오는 중...</p>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">대화가 없습니다</p>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer text-sm transition-colors ${
                conv.id === currentId
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="truncate flex-1 mr-2">{conv.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                className="hidden group-hover:block text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                aria-label="삭제"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      {/* 관리자 링크 */}
      <div className="p-4 border-t border-gray-200">
        <a href="/admin" className="text-xs text-gray-400 hover:text-gray-600">관리자 대시보드 →</a>
      </div>
    </div>
  )
}
