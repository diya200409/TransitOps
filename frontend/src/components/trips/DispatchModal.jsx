import Modal from '../common/Modal'
import { CheckCircle2, XCircle, AlertTriangle, Zap } from 'lucide-react'

/**
 * Dispatch confirmation modal with visual validation checklist.
 * All checks are frontend-only visualizations — no backend logic.
 */
function CheckRow({ label, status }) {
  const cfg = {
    pass:    { Icon: CheckCircle2,  cls: 'text-green-600', bg: 'bg-green-50',  label: 'Passed'  },
    fail:    { Icon: XCircle,       cls: 'text-red-600',   bg: 'bg-red-50',    label: 'Failed'  },
    warning: { Icon: AlertTriangle, cls: 'text-amber-600', bg: 'bg-amber-50',  label: 'Warning' },
  }[status] || { Icon: CheckCircle2, cls: 'text-gray-400', bg: 'bg-gray-50', label: '—' }

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${cfg.bg}`}>
      <div className="flex items-center gap-3">
        <cfg.Icon size={16} className={cfg.cls} />
        <span className="text-sm text-gray-700 font-medium">{label}</span>
      </div>
      <span className={`text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
    </div>
  )
}

export default function DispatchModal({ trip, open, onClose, onConfirm, loading = false }) {
  if (!trip) return null

  // Derive mock validation results from trip data
  const licenseOk   = true   // Rajesh, Meena, Vikram all valid
  const vehicleAvail = trip.status === 'Pending'
  const driverAvail  = true
  const cargoOk      = trip.cargo_weight < 25000  // simplified check
  const notInShop    = trip.vehicle_reg !== 'DL01EF9012'

  const checks = [
    { label: 'Vehicle is available',               status: vehicleAvail ? 'pass' : 'fail'    },
    { label: 'Driver is available',                status: driverAvail  ? 'pass' : 'fail'    },
    { label: 'Driver license valid',               status: licenseOk    ? 'pass' : 'fail'    },
    { label: 'Cargo within vehicle capacity',      status: cargoOk      ? 'pass' : 'warning' },
    { label: 'Vehicle not in maintenance',         status: notInShop    ? 'pass' : 'fail'    },
  ]

  const canDispatch = checks.every(c => c.status !== 'fail')

  return (
    <Modal open={open} onClose={onClose} title="Dispatch Trip" size="md">
      {/* Trip summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Trip</p>
            <p className="text-base font-bold text-gray-800">{trip.trip_number}</p>
            <p className="text-sm text-gray-500 mt-0.5">{trip.origin} → {trip.destination}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Vehicle</p>
            <p className="text-sm font-semibold text-gray-700">{trip.vehicle_reg}</p>
            <p className="text-xs text-gray-400 mt-1">Driver</p>
            <p className="text-sm font-semibold text-gray-700">{trip.driver_name}</p>
          </div>
        </div>
      </div>

      {/* Validation checklist */}
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Pre-Dispatch Validation</p>
      <div className="space-y-2 mb-6">
        {checks.map(c => <CheckRow key={c.label} label={c.label} status={c.status} />)}
      </div>

      {!canDispatch && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <XCircle size={15} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">One or more checks failed. Dispatch is blocked.</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={!canDispatch || loading}
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
