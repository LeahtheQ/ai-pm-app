const AGENT_CONFIG = {
  'strategy-agent':   { label: '전략', color: 'bg-blue-100 text-blue-700' },
  'discovery-agent':  { label: '디스커버리', color: 'bg-purple-100 text-purple-700' },
  'execution-agent':  { label: '실행', color: 'bg-green-100 text-green-700' },
}

export function AgentBadge({ agentName }) {
  if (!agentName) return null
  const cfg = AGENT_CONFIG[agentName] || { label: agentName, color: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}
