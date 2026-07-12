import Modal from '../common/Modal'
import { Zap, Info } from 'lucide-react'
import TripStatusBadge from './TripStatusBadge'

/**
 * Dispatch confirmation modal.
 * The backend owns ALL validation (vehicle/driver availability, license,
 * cargo capacity, maintenance). Frontend simply confirms intent and
 * surfaces any backend error returned from POST /trips/{id}/dispatch.
 */
export default function DispatchModal({ trip, open, onClose, onConfirm, loading = false }) {
  if (!trip) return null

  return (
    <Modal open={open} onClose={onClose} title="Dispatch Trip" size="md">
      {/* Trip summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Trip</p>
            <p className="text-base font-bold text-gray-800">{trip.trip_number}</p>
            <p className="text-sm text-gray-500 mt-0.5">
              {trip.origin || trip.source} → {trip.destination}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Vehicle</p>
            <p className="text-sm font-semibold text-gray-700">{trip.vehicle_reg || `#${trip.vehicle_id}`}</p>
            <p className="text-xs text-gray-400 mt-1">Driver</p>
            <p className="text-sm font-semibold text-gray-700">{trip.driver_name || `#${trip.driver_id}`}</p>
            <div className="mt-2">
              <TripStatusBadge status={trip.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Cargo info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Cargo</p>
        <p className="text-sm text-blue-800 font-medium">
          {Number(trip.cargo_weight).toLocaleString('en-IN')} kg
        </p>
      </div>

      {/* Backend validation notice */}
      <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6">
        <Info size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          The system will validate vehicle availability, driver license validity,
          cargo capacity, and maintenance status before dispatching.
          Any validation failure will be shown as an error.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Dispatching…</>
            : <><Zap size={14} />Dispatch Now</>
          }
        </button>
      </div>
    </Modal>
  )
}
