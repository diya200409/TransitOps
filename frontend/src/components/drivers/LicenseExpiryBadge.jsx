import { AlertTriangle, AlertCircle } from 'lucide-react'
import { isExpired, isExpiringSoon, formatDate } from '../../utils/formatters'

/**
 * License expiry status badge.
 * Shows nothing if valid and not expiring soon.
 * Shows amber warning if expiring within 30 days.
 * Shows red warning if already expired.
 *
 * Props:
 *   expiryDate – date string (YYYY-MM-DD)
 *   showDate   – if true, also shows the formatted date alongside the badge
 */
export default function LicenseExpiryBadge({ expiryDate, showDate = false }) {
  if (!expiryDate) return <span className="text-gray-400 text-sm">—</span>

  const expired  = isExpired(expiryDate)
  const expiring = !expired && isExpiringSoon(expiryDate, 30)

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
        <AlertCircle size={11} />
        Expired
        {showDate && <span className="font-normal ml-0.5">· {formatDate(expiryDate)}</span>}
      </span>
    )
  }

  if (expiring) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
        <AlertTriangle size={11} />
        Expiring Soon
        {showDate && <span className="font-normal ml-0.5">· {formatDate(expiryDate)}</span>}
      </span>
    )
  }

  // Valid — show date only if requested, no badge
  if (showDate) {
    return <span className="text-sm text-gray-700">{formatDate(expiryDate)}</span>
  }

  return null
}
