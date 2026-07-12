import { useState, useEffect } from 'react'
import FormField from '../common/FormField'

const VEHICLE_OPTIONS = [
  { value: '1|Tata Prima 4028.S|MH12AB1234|25000',     label: 'MH12AB1234 – Tata Prima 4028.S (25,000 kg)' },
  { value: '2|Ashok Leyland Dost|MH14CD5678|1500',     label: 'MH14CD5678 – Ashok Leyland Dost (1,500 kg)' },
  { value: '4|Eicher Pro 2095|KA03GH3456|9000',        label: 'KA03GH3456 – Eicher Pro 2095 (9,000 kg)' },
  { value: '6|Hero Splendor Pro|GJ05KL2345|150',       label: 'GJ05KL2345 – Hero Splendor Pro (150 kg)' },
]

const DRIVER_OPTIONS = [
  { value: '1|Rajesh Kumar',  label: 'Rajesh Kumar – HMV (Score: 92)' },
  { value: '3|Meena Sharma',  label: 'Meena Sharma – LMV (Score: 88)' },
  { value: '6|Vikram Desai',  label: 'Vikram Desai – HMV (Score: 97)' },
  { value: '4|Arjun Singh',   label: 'Arjun Singh – Commercial (Score: 55)' },
]

const EMPTY = { vehicle: '', driver: '', origin: '', destination: '', scheduled_date: '', cargo_weight: '', notes: '' }

function validate(f) {
  const e = {}
  if (!f.vehicle)        e.vehicle = 'Vehicle is required'
  if (!f.driver)         e.driver  = 'Driver is required'
  if (!f.origin?.trim()) e.origin  = 'Origin is required'
  if (!f.destination?.trim()) e.destination = 'Destination is required'
  if (!f.scheduled_date) e.scheduled_date = 'Schedule date is required'
  if (!f.cargo_weight || Number(f.cargo_weight) <= 0) e.cargo_weight = 'Cargo weight must be positive'
  return e
}

export default function TripForm({ initial = null, onSubmit, onCancel, loading = false }) {
  const isEdit = Boolean(initial)
  const [form, setForm]     = useState(EMPTY)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        vehicle:        `${initial.vehicle_id}|${initial.vehicle_name}|${initial.vehicle_reg}|0`,
        driver:         `${initial.driver_id}|${initial.driver_name}`,
        origin:         initial.origin || '',
        destination:    initial.destination || '',
        scheduled_date: initial.scheduled_date || '',
        cargo_weight:   initial.cargo_weight ?? '',
        notes:          initial.notes || '',
      })
    } else { setForm(EMPTY) }
    setErrors({})
  }, [initial])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    const [vehicle_id, vehicle_name, vehicle_reg, max_cap] = form.vehicle.split('|')
    const [driver_id, driver_name] = form.driver.split('|')
    try {
      await onSubmit({
        vehicle_id: Number(vehicle_id), vehicle_name, vehicle_reg,
        driver_id:  Number(driver_id),  driver_name,
        origin:         form.origin,
        destination:    form.destination,
        scheduled_date: form.scheduled_date,
        cargo_weight:   Number(form.cargo_weight),
        notes:          form.notes,
      })
    } catch (err) {
      setErrors({ _general: err.message })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors._general && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._general}</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle" name="vehicle" type="select" value={form.vehicle} onChange={handleChange} error={errors.vehicle} required options={VEHICLE_OPTIONS} />
        <FormField label="Driver"  name="driver"  type="select" value={form.driver}  onChange={handleChange} error={errors.driver}  required options={DRIVER_OPTIONS}  />
        <FormField label="Origin"       name="origin"       value={form.origin}       onChange={handleChange} error={errors.origin}       required placeholder="e.g. Mumbai" />
        <FormField label="Destination"  name="destination"  value={form.destination}  onChange={handleChange} error={errors.destination}  required placeholder="e.g. Pune" />
        <FormField label="Scheduled Date & Time" name="scheduled_date" type="datetime-local" value={form.scheduled_date} onChange={handleChange} error={errors.scheduled_date} required />
        <FormField label="Cargo Weight (kg)" name="cargo_weight" type="number" value={form.cargo_weight} onChange={handleChange} error={errors.cargo_weight} required min="1" placeholder="e.g. 5000" />
        <div className="sm:col-span-2">
          <FormField label="Trip Notes" name="notes" type="textarea" value={form.notes} onChange={handleChange} placeholder="Optional notes about this trip…" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Trip'}
        </button>
      </div>
    </form>
  )
}
