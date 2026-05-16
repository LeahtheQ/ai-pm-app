import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: '허용되지 않는 메서드' })
  }

  const adminPassword = req.headers['x-admin-password']
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '인증 실패' })
  }

  try {
    // 전체 대화 목록 (최근 100개)
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, user_id, title, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100)

    // 에이전트별 호출 통계
    const { data: agentStats } = await supabase
      .from('messages')
      .select('agent_used')
      .eq('role', 'assistant')
      .not('agent_used', 'is', null)

    const agentCounts = {}
    agentStats?.forEach(({ agent_used }) => {
      agentCounts[agent_used] = (agentCounts[agent_used] || 0) + 1
    })

    // 평균 Eval 점수 (에이전트별)
    const { data: evalData } = await supabase
      .from('evaluations')
      .select('total_score, message_id, messages(agent_used)')

    const evalByAgent = {}
    evalData?.forEach(({ total_score, messages }) => {
      const agent = messages?.agent_used
      if (!agent) return
      if (!evalByAgent[agent]) evalByAgent[agent] = { sum: 0, count: 0 }
      evalByAgent[agent].sum += total_score
      evalByAgent[agent].count += 1
    })
    const avgEvalByAgent = {}
    Object.entries(evalByAgent).forEach(([agent, { sum, count }]) => {
      avgEvalByAgent[agent] = Math.round((sum / count) * 10) / 10
    })

    // 일별 대화 수 (최근 30일)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: dailyData } = await supabase
      .from('conversations')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)

    const dailyCounts = {}
    dailyData?.forEach(({ created_at }) => {
      const day = created_at.slice(0, 10)
      dailyCounts[day] = (dailyCounts[day] || 0) + 1
    })

    return res.status(200).json({
      conversations,
      stats: {
        agentCounts,
        avgEvalByAgent,
        dailyCounts,
        totalConversations: conversations?.length ?? 0,
      },
    })
  } catch (e) {
    return res.status(500).json({ error: '서버 오류: ' + e.message })
  }
}
