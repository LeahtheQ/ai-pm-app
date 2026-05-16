import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnon) {
  throw new Error('VITE_SUPABASE_URL 또는 VITE_SUPABASE_ANON_KEY가 설정되지 않았습니다.')
}

export const supabase = createClient(supabaseUrl, supabaseAnon)

// user_id는 localStorage의 익명 UUID (로그인 없는 MVP용)
export function getUserId() {
  let uid = localStorage.getItem('ai_pm_user_id')
  if (!uid) {
    uid = crypto.randomUUID()
    localStorage.setItem('ai_pm_user_id', uid)
  }
  return uid
}
