import { useState, useEffect } from 'react'
import FormField from '../common/FormField'
import { validateVehicle } from '../../utils/validators'

const VEHICLE_TYPES = ['Truck', 'Van', 'Bike', 'Trailer']

// Statuses a user is allowed to manually set (On Trip / In Shop are backend-controlled)
const EDITABLE_STATUSES = ['Available', 'Retired']

const EMPTY_FORM = {
  registration_number: '',
  name: '',
  type: '',
  max_load_capacity: '',
  odometer: '',
  acquisition_cost: '',
  status: 'Available',
}

/**
 * Vehicle create / edit form.
 * Props:
 *   initial   – vehicle object to pre-fill (edit mode); null = create mode
 *   onSubmit  – async fn(data) called with validated form data
 *   onCancel  – called when Cancel is clicked
 *   loading   – disables submit button while saving
 */
export default function VehicleForm({ initial = null, onSubmit, onCancel, loading = false }) {
  const isEdit = Boolean(initial)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  // Pre-fill when editing
  useEffect(() => {
    if (initial) {
      setForm({
        registration_number: initial.registration_number || '',
        name:                initial.name                || '',
        type:                initial.type                || '',
        max_load_capacity:   initial.max_load_capacity   ?? '',
        odometer:            initial.odometer            ?? '',
        acquisition_cost:    initial.acquisition_cost    ?? '',
        status:              initial.status              || 'Available',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
  }, [initial])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    // Clear error on change
    if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateVehicle(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    try {
      await onSubmit(form)
    } catch (err) {
      // Surface backend field errors (e.g. duplicate reg number)
      const msg = err.message || ''
      if (msg.toLowerCase().includes('registration')) {
        setErrors({ registration_number: msg })
      } else {
        setErrors({ _general: msg })
      }
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
        {/* Registration Number */}
        <FormField
          label="Registration Number"
          name="registration_number"
          value={form.registration_number}
          onChange={handleChange}
          error={errors.registration_number}
          required
          disabled={isEdit}
          placeholder="e.g. MH12AB1234"
          hint={isEdit ? 'Registration number cannot be changed' : ''}
        />

        {/* Vehicle Name / Model */}
        <FormField
          label="Vehicle Name / Model"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="e.g. Tata Prima 4028.S"
        />

        {/* Vehicle Type */}
        <FormField
          label="Vehicle Type"
          name="type"
          type="select"
          value={form.type}
          onChange={handleChange}
          error={errors.type}
          required
          options={VEHICLE_TYPES}
        />

        {/* Max Load Capacity */}
        <FormField
          label="Max Load Capacity (kg)"
          name="max_load_capacity"
          type="number"
          value={form.max_load_capacity}
          onChange={handleChange}
          error={errors.max_load_capacity}
          required
          min="1"
          placeholder="e.g. 5000"
        />

        {/* Odometer */}
        <FormField
          label="Odometer (km)"
          name="odometer"
          type="number"
          value={form.odometer}
          onChange={handleChange}
          error={errors.odometer}
          required
          min="0"
          placeholder="e.g. 12000"
        />

        {/* Acquisition Cost */}
        <FormField
          label="Acquisition Cost (₹)"
          name="acquisition_cost"
          type="number"
          value={form.acquisition_cost}
          onChange={handleChange}
          error={errors.acquisition_cost}
          required
          min="1"
          placeholder="e.g. 1500000"
        />

        {/* Status — edit mode only, limited to safe values */}
        {isEdit && (
          <FormField
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={handleChange}
            options={EDITABLE_STATUSES}
            hint="On Trip and In Shop are managed automatically by the system"
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  )
}
