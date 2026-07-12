import Modal from '../common/Modal'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Truck, Wrench, CalendarDays, DollarSign, AlertTriangle } from 'lucide-react'

function Section({ icon: Icon, title, children }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-amber-50 rounded flex items-center justify-center">
          <Icon size={13} className="text-amber-600" />
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
      <div className="text-sm font-semibold text-gray-800">{value ?? '—'}</div>
    </div>
  )
}

const MNT_STEPS = ['Scheduled', 'In Progress', 'Completed']

function MaintenanceTimeline({ status }) {
  const idx = MNT_STEPS.indexOf(status)
  const isOverdue = status === 'Overdue'
  return (
    <div className="flex items-center gap-1">
      {MNT_STEPS.map((step, i) => {
        const done    = !isOverdue && i <= idx
        const current = !isOverdue && i === idx
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2
                ${done    ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300 text-gray-400'}
                ${current ? 'ring-2 ring-amber-200' : ''}
                ${isOverdue ? 'bg-red-100 border-red-400 text-red-600' : ''}
              `}>
                {isOverdue ? '!' : i + 1}
              </div>
              <p className={`text-xs mt-1 whitespace-nowrap
                ${done ? 'text-amber-600 font-semibold' : 'text-gray-400'}
                ${isOverdue ? 'text-red-500' : ''}
              `}>
                {step}
              </p>
            </div>
            {i < MNT_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 mb-4
                ${i < idx && !isOverdue ? 'bg-amber-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function MaintenanceDetailModal({ record, open, onClose }) {
  if (!record) return null
  const isOverdue = record.status === 'Overdue'

  return (
    <Modal open={open} onClose={onClose} title="Maintenance Details" size="lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xl font-bold text-gray-800">{record.record_number}</p>
          <p className="text-sm text-gray-400 mt-0.5">{record.service_type} · {record.vehicle_name}</p>
        </div>
        <MaintenanceStatusBadge status={record.status} />
      </div>

      {/* Overdue warning */}
      {isOverdue && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-5">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            This service is overdue. Scheduled for {formatDate(record.scheduled_date)}.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Service Progress</p>
        <MaintenanceTimeline status={record.status} />
      </div>

      <Section icon={Truck} title="Vehicle">
        <Field label="Vehicle Name"     value={record.vehicle_name} />
        <Field label="Registration"     value={record.vehicle_reg} />
      </Section>

      <Section icon={Wrench} title="Service">
        <Field label="Service Type"     value={record.service_type} />
        <Field label="Status"           value={<MaintenanceStatusBadge status={record.status} />} />
        <div className="col-span-2">
          <Field label="Description"    value={record.description} />
        </div>
      </Section>

      <Section icon={CalendarDays} title="Schedule">
        <Field label="Scheduled Date"   value={formatDate(record.scheduled_date)} />
        <Field label="Completion Date"  value={record.completion_date ? formatDate(record.completion_date) : 'Not completed'} />
      </Section>

      <Section icon={DollarSign} title="Cost">
        <Field label="Estimated Cost"   value={formatCurrency(record.estimated_cost)} />
        <Field label="Actual Cost"      value={record.actual_cost != null ? formatCurrency(record.actual_cost) : 'Pending'} />
      </Section>

      <div className="flex justify-end mt-2">
        <button onClick={onClose} className="px-5 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
          Close
        </button>
      </div>
    </Modal>
  )
}
