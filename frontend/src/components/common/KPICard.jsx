/**
 * Reusable KPI card for the Dashboard.
 * Props:
 *   icon    – Lucide React icon component
 *   label   – metric label string
 *   value   – numeric (or string) value to display
 *   accent  – Tailwind bg class for icon box, e.g. 'bg-blue-500'
 *   loading – shows skeleton placeholder when true
 */
export default function KPICard({ icon: Icon, label, value, accent = 'bg-blue-500', loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="w-9 h-9 bg-gray-200 rounded-lg" />
        </div>
        <div className="w-10 h-7 bg-gray-200 rounded mb-1.5" />
        <div className="w-28 h-3.5 bg-gray-100 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150">
      {/* Icon */}
      <div className={`w-9 h-9 ${accent} rounded-lg flex items-center justify-center mb-3`}>
        {Icon && <Icon size={18} className="text-white" />}
      </div>
      {/* Value */}
      <p className="text-3xl font-bold text-gray-800 leading-none tracking-tight mb-1.5">
        {value ?? '—'}
      </p>
      {/* Label */}
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide leading-none">
        {label}
      </p>
    </div>
  )
}
