import { VEHICLE_STATUS_COLORS } from '../../constants/vehicleStatus'
import { DRIVER_STATUS_COLORS }  from '../../constants/driverStatus'

const ALL_STATUS_COLORS = { ...VEHICLE_STATUS_COLORS, ...DRIVER_STATUS_COLORS }

/**
 * Reusable color-coded status pill.
 * Works for both vehicle and driver status values.
 */
export default function StatusBadge({ status }) {
  const colors = ALL_STATUS_COLORS[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.dot}`} />
      {status || 'Unknown'}
    </span>
  )
}
