import Modal from '../common/Modal'
import StatusBadge from '../common/StatusBadge'
import SafetyScoreBadge from './SafetyScoreBadge'
import LicenseExpiryBadge from './LicenseExpiryBadge'
import { formatDate } from '../../utils/formatters'
import { UserCircle } from 'lucide-react'

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <div className="text-sm text-gray-800 font-medium">{value ?? '—'}</div>
    </div>
  )
}

/**
 * Read-only driver details modal.
 * Props:
 *   driver  – driver object
 *   open    – bool
 *   onClose – fn
 */
export default function DriverDetailModal({ driver, open, onClose }) {
  if (!driver) return null

  return (
    <Modal open={open} onClose={onClose} title="Driver Details" size="md">
      {/* Header strip */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-100">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <UserCircle size={22} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">{driver.name}</h3>
          <p className="text-sm text-gray-400 font-mono">{driver.license_number}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={driver.status} />
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <DetailRow label="Full Name"         value={driver.name} />
        <DetailRow label="License Number"    value={<span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{driver.license_number}</span>} />
        <DetailRow label="License Category"  value={driver.license_category} />
        <DetailRow
          label="License Expiry"
          value={
            <div className="flex items-center gap-2 flex-wrap">
              <span>{formatDate(driver.license_expiry_date)}</span>
              <LicenseExpiryBadge expiryDate={driver.license_expiry_date} />
            </div>
          }
        />
        <DetailRow label="Contact Number"    value={driver.contact_number} />
        <DetailRow label="Status"            value={<StatusBadge status={driver.status} />} />
        <DetailRow
          label="Safety Score"
          value={<SafetyScoreBadge score={driver.safety_score} showBar />}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
