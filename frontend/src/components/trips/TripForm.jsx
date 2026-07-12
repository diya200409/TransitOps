import { useState, useEffect } from 'react'
import FormField from '../common/FormField'
import { getAvailableVehicles, getAvailableDrivers } from '../../api/trips'

const EMPTY = {
  vehicle_id: '', driver_id: '', origin: '', destination: '',
  planned_distance: '', cargo_weight: '', revenue: '',
}

function validate(f) {
  const e = {}
  if (!f.vehicle_id)         e.vehicle_id     = 'Vehicle is required'
  if (!f.driver_id)          e.driver_id      = 'Driver is required'
  if (!f.origin?.trim())     e.origin         = 'Origin is required'
  if (!f.destination?.trim()) e.destination   = 'Destination is required'
  if (f.origin?.trim() && f.destination?.trim() && f.origin.trim() === f.destination.trim())
    e.destination = 'Origin and destination cannot be the same'
  if (!f.cargo_weight || Number(f.cargo_weight) <= 0) e.cargo_weight = 'Cargo weight must be positive'
  if (!f.planned_distance || Number(f.planned_distance) <= 0) e.planned_distance = 'Planned distance must be positive'
  return e
}

export default function TripForm({ initial = null, onSubmit, onCancel, loading = false }) {
  const isEdit = Boolean(initial)
  const [form, setForm]         = useState(EMPTY)
  const [errors, setErrors]     = useState({})
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers]   = useState([])
  const [poolLoading, setPoolLoading] = useState(true)

  // Load available vehicles and drivers from real API
  useEffect(() => {
    setPoolLoading(true)
    Promise.all([getAvailableVehicles(), getAvailableDrivers()])
      .then(([v, d]) => { setVehicles(v); setDrivers(d) })
      .catch(() => { /* silently keep empty */ })
      .finally(() => setPoolLoading(false))
  }, [])

  useEffect(() => {
    if (initial) {
      setForm({
        vehicle_id:       String(initial.vehicle_id  || ''),
        driver_id:        String(initial.driver_id   || ''),
        origin:           initial.origin || initial.source || '',
        destination:      initial.destination || '',
        planned_distance: initial.planned_distance ?? '',
        cargo_weight:     initial.cargo_weight      ?? '',
        revenue:          initial.revenue           ?? '',
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [initial])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      await onSubmit({
        vehicle_id:       Number(form.vehicle_id),
        driver_id:        Number(form.driver_id),
        origin:           form.origin,
        destination:      form.destination,
        planned_distance: Number(form.planned_distance),
        cargo_weight:     Number(form.cargo_weight),
        revenue:          Number(form.revenue || 0),
      })
    } catch (err) {
      setErrors({ _general: err.message })
    }
  }

  const vehicleOptions = vehicles.map(v => ({
    value: String(v.id),
    label: `${v.registration_number} – ${v.name_model} (${v.max_load_capacity?.toLocaleString('en-IN')} kg)`,
  }))

  const driverOptions = drivers.map(d => ({
    value: String(d.id),
    label: `${d.name} – ${d.license_category} (Score: ${d.safety_score})`,
  }))

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors._general && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errors._general}
        </div>
      )}
      {poolLoading && (
        <p className="text-xs text-gray-400 mb-3">Loading available vehicles and drivers…</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle" name="vehicle_id" type="select" value={form.vehicle_id}
          onChange={handleChange} error={errors.vehicle_id} required
          options={vehicleOptions}
          hint={vehicles.length === 0 && !poolLoading ? 'No available vehicles' : ''} />
        <FormField label="Driver" name="driver_id" type="select" value={form.driver_id}
          onChange={handleChange} error={errors.driver_id} required
          options={driverOptions}
          hint={drivers.length === 0 && !poolLoading ? 'No available drivers with valid licenses' : ''} />
        <FormField label="Origin" name="origin" value={form.origin}
          onChange={handleChange} error={errors.origin} required placeholder="e.g. Mumbai" />
        <FormField label="Destination" name="destination" value={form.destination}
          onChange={handleChange} error={errors.destination} required placeholder="e.g. Pune" />
        <FormField label="Planned Distance (km)" name="planned_distance" type="number"
          value={form.planned_distance} onChange={handleChange} error={errors.planned_distance}
          required min="1" placeholder="e.g. 150" />
        <FormField label="Cargo Weight (kg)" name="cargo_weight" type="number"
          value={form.cargo_weight} onChange={handleChange} error={errors.cargo_weight}
          required min="1" placeholder="e.g. 5000" />
        <FormField label="Revenue (₹)" name="revenue" type="number"
          value={form.revenue} onChange={handleChange}
          min="0" placeholder="e.g. 15000 (optional)" />
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} disabled={loading}
          className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={loading || poolLoading}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Trip'}
        </button>
      </div>
    </form>
  )
}
