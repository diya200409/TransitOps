import Modal from '../common/Modal'
import StatusBadge from '../common/StatusBadge'
import { formatCurrency } from '../../utils/formatters'
import { Truck } from 'lucide-react'

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  )
}

/**
 * Read-only vehicle details modal.
 * Props:
 *   vehicle  – vehicle object to display
 *   open     – boolean
 *   onClose  – fn
 */
export default function VehicleDetailModal({ vehicle, open, onClose }) {
  if (!vehicle) return null

  return (
    <Modal open={open} onClose={onClose} title="Vehicle Details" size="md">
      {/* Header strip */}
      <div className="flex items-center gap-4 pb-4 mb-4 border-b border-gray-100">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Truck size={22} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">{vehicle.name}</h3>
          <p className="text-sm text-gray-400">{vehicle.registration_number}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={vehicle.status} />
        </div>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        <DetailRow label="Registration Number" value={vehicle.registration_number} />
        <DetailRow label="Vehicle Name / Model" value={vehicle.name} />
        <DetailRow label="Type" value={vehicle.type} />
        <DetailRow label="Status" value={<StatusBadge status={vehicle.status} />} />
        <DetailRow
          label="Max Load Capacity"
          value={vehicle.max_load_capacity != null ? `${Number(vehicle.max_load_capacity).toLocaleString('en-IN')} kg` : '—'}
        />
        <DetailRow
          label="Odometer"
          value={vehicle.odometer != null ? `${Number(vehicle.odometer).toLocaleString('en-IN')} km` : '—'}
        />
        <DetailRow
          label="Acquisition Cost"
          value={formatCurrency(vehicle.acquisition_cost)}
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
