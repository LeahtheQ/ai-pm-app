const AGENT_LABELS = {
  'strategy-agent':  '전략',
  'discovery-agent': '디스커버리',
  'execution-agent': '실행',
}

export function StatsPanel({ stats }) {
  if (!stats) return null
  const { agentCounts, avgEvalByAgent, dailyCounts, totalConversations } = stats

  const recentDays = Object.entries(dailyCounts || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 총 대화 수 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-500">총 대화 수</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{totalConversations}</p>
      </div>

      {/* 에이전트별 호출 수 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-500 mb-2">에이전트 호출 수</p>
        {Object.entries(agentCounts || {}).map(([agent, count]) => (
          <div key={agent} className="flex items-center justify-between text-sm py-0.5">
            <span className="text-gray-700">{AGENT_LABELS[agent] || agent}</span>
            <span className="font-semibold text-gray-800">{count}회</span>
          </div>
        ))}
      </div>

      {/* 평균 Eval 점수 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-sm text-gray-500 mb-2">평균 Eval 점수 (40점 만점)</p>
        {Object.entries(avgEvalByAgent || {}).map(([agent, avg]) => {
          const colorClass = avg >= 35 ? 'text-green-600' : avg >= 28 ? 'text-yellow-600' : 'text-red-600'
          return (
            <div key={agent} className="flex items-center justify-between text-sm py-0.5">
              <span className="text-gray-700">{AGENT_LABELS[agent] || agent}</span>
              <span className={`font-semibold ${colorClass}`}>{avg}</span>
            </div>
          )
        })}
      </div>

      {/* 일별 대화 수 (최근 7일) */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 md:col-span-3">
        <p className="text-sm text-gray-500 mb-3">일별 대화 수 (최근 7일)</p>
        <div className="flex items-end gap-2 h-20">
          {recentDays.map(([day, count]) => {
            const maxCount = Math.max(...recentDays.map(([, c]) => c), 1)
            const heightPct = (count / maxCount) * 100
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-600">{count}</span>
                <div
                  className="w-full bg-primary-200 rounded-t"
                  style={{ height: `${heightPct}%`, minHeight: '4px' }}
                />
                <span className="text-xs text-gray-400">{day.slice(5)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
