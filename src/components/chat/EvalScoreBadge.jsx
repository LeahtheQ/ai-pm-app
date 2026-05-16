export function EvalScoreBadge({ scores }) {
  if (!scores) return null

  const { total } = scores
  const colorClass =
    total >= 35 ? 'bg-green-100 text-green-700' :
    total >= 28 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'

  const tooltip = [
    `정확성: ${scores.accuracy}/10`,
    `전문성: ${scores.expertise}/10`,
    `완결성: ${scores.completeness}/10`,
    `한국어: ${scores.language}/10`,
  ].join(' | ')

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-help ${colorClass}`}
      title={tooltip}
    >
      Eval {total}/40
    </span>
  )
}
