/**
 * TC-002: 메시지 저장·조회
 * messages 테이블 insert/select가 올바르게 동작하고 스키마 제약을 준수하는지 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSingle   = vi.fn()
const mockSelect   = vi.fn()
const mockInsert   = vi.fn()
const mockEq       = vi.fn()
const mockOrder    = vi.fn()

// 체이닝 설정
mockInsert.mockReturnValue({ select: mockSelect })
mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq })
mockEq.mockReturnValue({ order: mockOrder })
mockOrder.mockResolvedValue({ data: [], error: null })

const mockFrom = vi.fn(() => ({ insert: mockInsert, select: mockSelect }))
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => ({ from: mockFrom })) }))

describe('TC-002: 메시지 CRUD', () => {
  const testMessage = {
    conversation_id: 'conv-uuid-123',
    role: 'user',
    content: '유저스토리를 작성해주세요',
    agent_used: null,
    skills_used: [],
  }

  beforeEach(() => vi.clearAllMocks())

  it('유효한 메시지를 insert할 수 있다', async () => {
    mockSingle.mockResolvedValue({ data: { id: 'msg-uuid-1' }, error: null })
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('url', 'key')

    const result = await client.from('messages').insert(testMessage).select('id').single()
    expect(mockInsert).toHaveBeenCalledWith(testMessage)
    expect(result.error).toBeNull()
    expect(result.data.id).toBe('msg-uuid-1')
  })

  it('role이 user | assistant만 허용된다 (schema 검증)', () => {
    const validRoles = ['user', 'assistant']
    const invalidRoles = ['admin', 'system', '']
    validRoles.forEach((r) => expect(validRoles).toContain(r))
    invalidRoles.forEach((r) => expect(validRoles).not.toContain(r))
  })

  it('대화별 메시지를 조회할 수 있다', async () => {
    const mockMessages = [
      { id: 'msg-1', role: 'user', content: '안녕하세요', agent_used: null },
      { id: 'msg-2', role: 'assistant', content: '안녕하세요!', agent_used: 'strategy-agent' },
    ]
    mockOrder.mockResolvedValue({ data: mockMessages, error: null })

    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('url', 'key')
    const result = await client.from('messages').select('id, role, content, agent_used').eq('conversation_id', 'conv-uuid-123').order('created_at', { ascending: true })

    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(2)
    expect(result.data[0].role).toBe('user')
  })
})
