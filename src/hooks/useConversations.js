import { useState, useEffect, useCallback } from 'react'
import { supabase, getUserId } from '../lib/supabase'

export function useConversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const userId = getUserId()

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50)
    setConversations(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  const createConversation = useCallback(async () => {
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId, title: '새 대화' })
      .select('id')
      .single()
    if (error || !data) return null
    await load()
    return data.id
  }, [userId, load])

  const deleteConversation = useCallback(async (id) => {
    await supabase.from('conversations').delete().eq('id', id)
    await load()
  }, [load])

  return { conversations, loading, createConversation, deleteConversation, reload: load }
}
