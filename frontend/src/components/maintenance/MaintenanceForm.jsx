import { useState, useEffect } from 'react'
import FormField from '../common/FormField'
import { SERVICE_TYPES } from '../../constants/maintenanceStatus'

const VEHICLE_OPTIONS = [
  { value: '1|Tata Prima 4028.S|MH12AB1234',      label: 'MH12AB1234 – Tata Prima 4028.S' },
  { value: '2|Ashok Leyland Dost|MH14CD5678',     label: 'MH14CD5678 – Ashok Leyland Dost' },
  { value: '3|Mahindra Supro|DL01EF9012',         label: 'DL01EF9012 – Mahindra Supro' },
  { value: '4|Eicher Pro 2095|KA03GH3456',        label: 'KA03GH3456 – Eicher Pro 2095' },
  { value: '5|Force Traveller 3700|TN07IJ7890',   label: 'TN07IJ7890 – Force Traveller 3700' },
  { value: '6|Hero Splendor Pro|GJ05KL2345',      label: 'GJ05KL2345 – Hero Splendor Pro' },
]

const EMPTY = { vehicle: '', service_type: '', description: '', scheduled_date: '', estimated_cost: '' }

function validate(f) {
  const e = {}
  if (!f.vehicle)           e.vehicle        = 'Vehicle is required'
  if (!f.service_type)      e.service_type   = 'Service type is required'
  if (!f.description?.trim()) e.description  = 'Description is required'
  if (!f.scheduled_date)    e.scheduled_date = 'Scheduled date is required'
  if (f.estimated_cost === '' || f.estimated_cost == null) {
    e.estimated_cost = 'Estimated cost is required'
  } else if (Number(f.estimated_cost) < 0) {
    e.estimated_cost = 'Cost cannot be negative'
  }
  return e
}

export default function MaintenanceForm({ initial = null, onSubmit, onCancel, loading = false }) {
  const isEdit = Boolean(initial)
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        vehicle:        `${initial.vehicle_id}|${initial.vehicle_name}|${initial.vehicle_reg}`,
        service_type:   initial.service_type   || '',
        description:    initial.description    || '',
        scheduled_date: initial.scheduled_date || '',
        estimated_cost: initial.estimated_cost ?? '',
      })
    } else { setForm(EMPTY) }
    setErrors({})
  }, [initial])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    const [vehicle_id, vehicle_name, vehicle_reg] = form.vehicle.split('|')
    try {
      await onSubmit({
        vehicle_id:     Number(vehicle_id),
        vehicle_name,
        vehicle_reg,
        service_type:   form.service_type,
        description:    form.description,
        scheduled_date: form.scheduled_date,
        estimated_cost: Number(form.estimated_cost),
      })
    } catch (err) {
      setErrors({ _general: err.message })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors._general && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errors._general}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle"      name="vehicle"      type="select" value={form.vehicle}      onChange={handleChange} error={errors.vehicle}      required options={VEHICLE_OPTIONS}            disabled={isEdit} />
        <FormField label="Service Type" name="service_type" type="select" value={form.service_type} onChange={handleChange} error={errors.service_type} required options={SERVICE_TYPES} />
        <FormField label="Scheduled Date"   name="scheduled_date" type="date"   value={form.scheduled_date} onChange={handleChange} error={errors.scheduled_date} required />
        <FormField label="Estimated Cost (₹)" name="estimated_cost" type="number" value={form.estimated_cost} onChange={handleChange} error={errors.estimated_cost} required min="0" placeholder="e.g. 5000" />
        <div className="sm:col-span-2">
          <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} error={errors.description} required placeholder="Describe the maintenance work required…" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Schedule Maintenance'}
        </button>
      </div>
    </form>
  )
}
