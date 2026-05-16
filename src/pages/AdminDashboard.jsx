import { useState, useEffect } from 'react'
import { ConversationTable } from '../components/admin/ConversationTable'
import { StatsPanel } from '../components/admin/StatsPanel'

const STORAGE_KEY = 'ai_pm_admin_auth'

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(false)

  const handleLogin = () => {
    if (password === import.meta.env.VITE_APP_ADMIN_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, 'true')
      setAuthenticated(true)
      setError('')
    } else {
      setError('비밀번호가 올바르지 않습니다.')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setAuthenticated(false)
    setData(null)
  }

  useEffect(() => {
    if (!authenticated) return
    setLoading(true)
    fetch('/api/admin', {
      headers: { 'x-admin-password': import.meta.env.VITE_APP_ADMIN_PASSWORD },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [authenticated])

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-6">관리자 로그인</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder="관리자 비밀번호"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 rounded-lg transition-colors"
          >
            로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">관리자 대시보드</h1>
            <p className="text-sm text-gray-500">AI PM 서비스 현황</p>
          </div>
          <div className="flex gap-3">
            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">← 채팅으로</a>
            <button
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">데이터 불러오는 중...</p>
        ) : data ? (
          <div className="space-y-6">
            <StatsPanel stats={data.stats} />
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">전체 대화 기록</h2>
              <ConversationTable conversations={data.conversations} />
            </div>
          </div>
        ) : (
          <p className="text-center text-red-500 py-12">데이터를 불러올 수 없습니다.</p>
        )}
      </div>
    </div>
  )
}
