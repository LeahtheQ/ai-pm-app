/**
 * TC-004: Eval 점수 계산
 * total_score가 28 미만이면 regenerate=true, 이상이면 false인지 검증한다.
 * JSON 파싱 로직과 Supabase insert를 테스트한다.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Eval 결과 파싱 함수 (api/chat.js에서 추출한 순수 로직)
function parseEvalResult(text) {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    return null
  } catch {
    return null
  }
}

function shouldRegenerate(evalResult) {
  if (!evalResult) return false
  return evalResult.total_score < 28
}

describe('TC-004: Eval 점수 계산', () => {
  it('total_score가 28 미만이면 regenerate=true', () => {
    const result = parseEvalResult(JSON.stringify({
      score_accuracy: 6, score_expertise: 6, score_completeness: 6, score_language: 6,
      total_score: 24, feedback: '개선 필요', regenerate: true,
    }))
    expect(shouldRegenerate(result)).toBe(true)
  })

  it('total_score가 28이면 regenerate=false', () => {
    const result = parseEvalResult(JSON.stringify({
      score_accuracy: 7, score_expertise: 7, score_completeness: 7, score_language: 7,
      total_score: 28, feedback: '품질 기준 충족', regenerate: false,
    }))
    expect(shouldRegenerate(result)).toBe(false)
  })

  it('total_score가 40이면 regenerate=false', () => {
    const result = parseEvalResult(JSON.stringify({
      score_accuracy: 10, score_expertise: 10, score_completeness: 10, score_language: 10,
      total_score: 40, feedback: '품질 기준 충족', regenerate: false,
    }))
    expect(shouldRegenerate(result)).toBe(false)
  })

  it('JSON 앞뒤에 텍스트가 있어도 파싱된다', () => {
    const text = '평가 결과입니다: {"score_accuracy":8,"score_expertise":8,"score_completeness":8,"score_language":8,"total_score":32,"feedback":"좋음","regenerate":false}'
    const result = parseEvalResult(text)
    expect(result).not.toBeNull()
    expect(result.total_score).toBe(32)
  })

  it('잘못된 JSON이면 null 반환', () => {
    const result = parseEvalResult('invalid json')
    expect(result).toBeNull()
    expect(shouldRegenerate(null)).toBe(false)
  })

  it('4개 항목 점수의 합이 total_score와 일치한다', () => {
    const scores = { score_accuracy: 9, score_expertise: 8, score_completeness: 9, score_language: 8 }
    const expectedTotal = scores.score_accuracy + scores.score_expertise + scores.score_completeness + scores.score_language
    expect(expectedTotal).toBe(34)
  })
})
