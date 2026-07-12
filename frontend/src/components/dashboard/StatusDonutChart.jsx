import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

/**
 * Donut chart for status distribution.
 * Root cause of "count count count" legend bug:
 *   Recharts <Legend> uses dataKey ("count") as the label — not nameKey ("status").
 * Fix: Remove Recharts <Legend> entirely and render a custom legend manually
 * from the raw data array so we always show status names, never dataKey names.
 *
 * Props:
 *   data  – [{ status, count, fill }]
 *   title – chart heading string
 */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const { status, count } = payload[0].payload
  const total = payload[0].payload._total || 1
  const pct = Math.round((count / total) * 100)
  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-0.5">{status}</p>
      <p className="text-gray-300">{count} {count === 1 ? 'unit' : 'units'} · {pct}%</p>
    </div>
  )
}

export default function StatusDonutChart({ data = [], title }) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  // Inject total into each entry so tooltip can compute percentage
  const enriched = data.map(d => ({ ...d, _total: total }))

  // Empty state
  if (!data.length || total === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col h-full">
        <p className="text-sm font-semibold text-gray-700 mb-3">{title}</p>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm font-semibold text-gray-700 mb-4">{title}</p>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={enriched}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={64}
                paddingAngle={2}
                strokeWidth={0}
              >
                {enriched.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-800 leading-none">{total}</span>
            <span className="text-xs text-gray-400 mt-0.5">Total</span>
          </div>
        </div>

        {/* Custom legend — renders status names from data, never from dataKey */}
        <div className="flex flex-col gap-2 flex-1">
          {data.map(entry => {
            const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0
            return (
              <div key={entry.status} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="text-xs text-gray-600 flex-1 leading-none">{entry.status}</span>
                <span className="text-xs font-semibold text-gray-800">{entry.count}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
