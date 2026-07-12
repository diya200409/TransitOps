import Modal from '../common/Modal'
import TripStatusBadge from './TripStatusBadge'
import { MapPin, Truck, UserCircle, Package, CalendarClock, FileText } from 'lucide-react'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-blue-50 rounded flex items-center justify-center">
          <Icon size={13} className="text-blue-600" />
        </div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
      <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
        {children}
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-800">{value || '—'}</p>
    </div>
  )
}

// Mini trip timeline
const STATUS_STEPS = ['Pending', 'Dispatched', 'In Progress', 'Completed']

function TripTimeline({ status }) {
  const idx = STATUS_STEPS.indexOf(status)
  const isCancelled = status === 'Cancelled'
  return (
    <div className="flex items-center gap-1 mt-2">
      {STATUS_STEPS.map((step, i) => {
        const done    = !isCancelled && i <= idx
        const current = !isCancelled && i === idx
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2
                ${done    ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'}
                ${current ? 'ring-2 ring-blue-200' : ''}
              `}>
                {i + 1}
              </div>
              <p className={`text-xs mt-1 whitespace-nowrap ${done ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                {step}
              </p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < idx && !isCancelled ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function TripDetailModal({ trip, open, onClose }) {
  if (!trip) return null
  return (
    <Modal open={open} onClose={onClose} title="Trip Details" size="lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xl font-bold text-gray-800">{trip.trip_number}</p>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1">
            <MapPin size={13} />{trip.origin} → {trip.destination}
          </p>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* Timeline */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Trip Progress</p>
        <TripTimeline status={trip.status} />
      </div>

      <Section icon={MapPin} title="Route">
        <Field label="Origin"         value={trip.origin} />
        <Field label="Destination"    value={trip.destination} />
        <Field label="Scheduled Date" value={trip.scheduled_date?.replace('T', ' ')} />
        <Field label="Status"         value={<TripStatusBadge status={trip.status} />} />
      </Section>

      <Section icon={Truck} title="Vehicle">
        <Field label="Registration"  value={trip.vehicle_reg} />
        <Field label="Vehicle Name"  value={trip.vehicle_name} />
      </Section>

      <Section icon={UserCircle} title="Driver">
        <Field label="Driver Name"   value={trip.driver_name} />
        <Field label="Driver ID"     value={`DRV-${String(trip.driver_id).padStart(4,'0')}`} />
      </Section>

      <Section icon={Package} title="Cargo">
        <Field label="Cargo Weight"  value={trip.cargo_weight ? `${Number(trip.cargo_weight).toLocaleString('en-IN')} kg` : '—'} />
        <Field label="Trip Notes"    value={trip.notes || 'None'} />
      </Section>

      <div className="flex justify-end mt-2">
        <button onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Close</button>
      </div>
    </Modal>
  )
}
