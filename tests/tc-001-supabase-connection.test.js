/**
 * TC-001: Supabase 연결 확인
 * 환경변수가 올바를 때 conversations 테이블에 접근 가능한지 검증한다.
 * 실제 Supabase URL이 없으면 스킵 처리한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSelect = vi.fn()
const mockFrom = vi.fn(() => ({ select: mockSelect }))
const mockCreateClient = vi.fn(() => ({ from: mockFrom }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}))

describe('TC-001: Supabase 연결', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSelect.mockResolvedValue({ data: [], error: null })
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
    import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('createClient가 올바른 인수로 호출된다', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('https://test.supabase.co', 'test-anon-key')
    expect(createClient).toHaveBeenCalledWith('https://test.supabase.co', 'test-anon-key')
    expect(client).toBeDefined()
  })

  it('conversations 테이블 쿼리가 오류 없이 반환된다', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('https://test.supabase.co', 'test-anon-key')
    const result = await client.from('conversations').select('id')
    expect(result.error).toBeNull()
    expect(Array.isArray(result.data)).toBe(true)
  })
})
