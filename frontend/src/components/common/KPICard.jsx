import { TrendingUp } from 'lucide-react'

/**
 * Reusable KPI card for the Dashboard.
 * Props:
 *   icon     – Lucide React icon component
 *   label    – metric label string
 *   value    – numeric (or string) value to display
 *   subtitle – optional small subtitle / trend text
 *   accent   – Tailwind color string for the icon background, e.g. 'bg-blue-500'
 *   loading  – shows skeleton placeholder when true
 */
export default function KPICard({ icon: Icon, label, value, subtitle, accent = 'bg-blue-500', loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-8 h-4 bg-gray-200 rounded" />
        </div>
        <div className="w-12 h-7 bg-gray-200 rounded mb-1" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${accent} rounded-lg flex items-center justify-center`}>
          {Icon && <Icon size={20} className="text-white" />}
        </div>
        {subtitle && (
          <div className="flex items-center gap-1 text-xs text-green-600">
            <TrendingUp size={12} />
            <span>{subtitle}</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 leading-none mb-1">
        {value ?? '—'}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}
