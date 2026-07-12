import { MAINTENANCE_STATUS_COLORS } from '../../constants/maintenanceStatus'

export default function MaintenanceStatusBadge({ status }) {
  const c = MAINTENANCE_STATUS_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-500', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  )
}
