import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-blue-300">{val}% utilization</p>
    </div>
  )
}

// Color based on utilization level
function getBarColor(val) {
  if (val >= 75) return '#3b82f6'   // blue-500  high
  if (val >= 50) return '#818cf8'   // indigo-400 medium
  return '#c7d2fe'                  // indigo-200 low
}

export default function UtilizationChart({ data = [] }) {
  const avg = data.length
    ? Math.round(data.reduce((s, d) => s + d.utilization, 0) / data.length)
    : 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Fleet Utilization</p>
          <p className="text-xs text-gray-400 mt-0.5">Last 7 days · % of fleet on trip</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-blue-600 leading-none">{avg}%</p>
          <p className="text-xs text-gray-400 mt-0.5">7-day avg</p>
        </div>
      </div>

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barSize={24}
            margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={v => `${v}%`}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              ticks={[0, 25, 50, 75, 100]}
            />
            {/* Average reference line */}
            <ReferenceLine
              y={avg}
              stroke="#3b82f6"
              strokeDasharray="4 3"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
            <Bar dataKey="utilization" radius={[4, 4, 0, 0]}>
              {data.map((entry, i) => (
                <rect key={i} fill={getBarColor(entry.utilization)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
        {[
          { color: '#3b82f6', label: 'High (≥75%)' },
          { color: '#818cf8', label: 'Medium (50–74%)' },
          { color: '#c7d2fe', label: 'Low (<50%)' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
