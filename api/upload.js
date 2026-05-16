import { createClient } from '@supabase/supabase-js'
import { IncomingForm } from 'formidable'
import { readFileSync } from 'fs'

export const config = { api: { bodyParser: false } }

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

// 파일 내용에서 텍스트 추출 (TXT 전용 — PDF/DOCX는 별도 라이브러리 필요)
function extractText(filePath, mimeType) {
  if (mimeType === 'text/plain') {
    return readFileSync(filePath, 'utf8')
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '허용되지 않는 메서드' })
  }

  const userId = req.headers['x-user-id']
  if (!userId) {
    return res.status(400).json({ error: 'x-user-id 헤더 누락' })
  }

  const form = new IncomingForm({ maxFileSize: 10 * 1024 * 1024 }) // 10MB 제한

  form.parse(req, async (err, _fields, files) => {
    if (err) {
      return res.status(400).json({ error: '파일 파싱 오류: ' + err.message })
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) {
      return res.status(400).json({ error: '업로드할 파일이 없습니다' })
    }

    try {
      const fileBuffer = readFileSync(file.filepath)
      const storagePath = `${userId}/${Date.now()}_${file.originalFilename}`

      // Supabase Storage에 업로드
      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(storagePath, fileBuffer, { contentType: file.mimetype })

      if (uploadError) {
        return res.status(500).json({ error: 'Storage 업로드 실패: ' + uploadError.message })
      }

      const { data: urlData } = supabase.storage.from('knowledge-base').getPublicUrl(storagePath)
      const contentText = extractText(file.filepath, file.mimetype)

      // DB에 메타데이터 저장
      const { data: kbData, error: dbError } = await supabase
        .from('knowledge_base')
        .insert({
          user_id: userId,
          file_name: file.originalFilename,
          file_url: urlData?.publicUrl,
          content_text: contentText,
        })
        .select('id')
        .single()

      if (dbError) {
        return res.status(500).json({ error: 'DB 저장 실패: ' + dbError.message })
      }

      return res.status(200).json({
        fileId: kbData.id,
        fileName: file.originalFilename,
        fileUrl: urlData?.publicUrl,
        contentPreview: contentText ? contentText.slice(0, 200) : null,
      })
    } catch (e) {
      return res.status(500).json({ error: '서버 오류: ' + e.message })
    }
  })
}
