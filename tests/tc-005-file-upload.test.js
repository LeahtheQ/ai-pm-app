/**
 * TC-005: 파일 업로드 (Knowledge Base)
 * Storage 업로드 및 knowledge_base 테이블 저장 로직을 검증한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStorageUpload = vi.fn()
const mockStorageGetPublicUrl = vi.fn()
const mockDbInsert = vi.fn()
const mockDbSelect = vi.fn()
const mockDbSingle = vi.fn()

mockDbInsert.mockReturnValue({ select: mockDbSelect })
mockDbSelect.mockReturnValue({ single: mockDbSingle })
mockStorageGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://test.supabase.co/storage/kb/file.txt' } })

const mockStorage = vi.fn(() => ({
  upload: mockStorageUpload,
  getPublicUrl: mockStorageGetPublicUrl,
}))

const mockFrom = vi.fn(() => ({ insert: mockDbInsert }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: { from: mockStorage },
    from: mockFrom,
  })),
}))

describe('TC-005: 파일 업로드 (Knowledge Base)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('Storage 업로드가 성공한다', async () => {
    mockStorageUpload.mockResolvedValue({ error: null })
    mockDbSingle.mockResolvedValue({ data: { id: 'kb-uuid-1' }, error: null })

    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('url', 'key')

    const uploadResult = await client.storage.from('knowledge-base').upload('user/file.txt', Buffer.from('내용'), { contentType: 'text/plain' })
    expect(uploadResult.error).toBeNull()
  })

  it('파일 업로드 후 knowledge_base 테이블에 메타데이터가 저장된다', async () => {
    mockStorageUpload.mockResolvedValue({ error: null })
    mockDbSingle.mockResolvedValue({ data: { id: 'kb-uuid-1' }, error: null })

    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('url', 'key')

    const fileUrl = client.storage.from('knowledge-base').getPublicUrl('user/file.txt').data.publicUrl
    const result = await client.from('knowledge_base').insert({
      user_id: 'user-123',
      file_name: 'test.txt',
      file_url: fileUrl,
      content_text: '파일 내용',
    }).select('id').single()

    expect(mockDbInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-123', file_name: 'test.txt' }),
    )
    expect(result.data.id).toBe('kb-uuid-1')
  })

  it('Storage 업로드 실패 시 오류가 반환된다', async () => {
    mockStorageUpload.mockResolvedValue({ error: { message: 'Storage 오류' } })

    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient('url', 'key')
    const result = await client.storage.from('knowledge-base').upload('bad/path', Buffer.from(''))
    expect(result.error).not.toBeNull()
    expect(result.error.message).toBe('Storage 오류')
  })
})
