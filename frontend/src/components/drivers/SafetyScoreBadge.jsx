/**
 * Visual safety score display.
 * Score 0–100 mapped to color bands:
 *   80–100 → green (good)
 *   60–79  → amber (fair)
 *   0–59   → red   (poor)
 *
 * Props:
 *   score   – number 0–100
 *   showBar – if true, also renders a thin progress bar
 */
export default function SafetyScoreBadge({ score, showBar = false }) {
  if (score == null) return <span className="text-gray-400 text-sm">—</span>

  const num = Number(score)

  const { bg, text, bar } =
    num >= 80 ? { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500' } :
    num >= 60 ? { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-400' } :
                { bg: 'bg-red-100',   text: 'text-red-700',   bar: 'bg-red-500'   }

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${bg} ${text}`}>
        {num}
      </span>
      {showBar && (
        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${bar}`}
            style={{ width: `${Math.min(num, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
