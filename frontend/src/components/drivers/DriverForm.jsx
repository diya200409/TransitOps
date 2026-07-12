import { useState, useEffect } from 'react'
import FormField from '../common/FormField'
import { validateDriver } from '../../utils/validators'
import { isExpired } from '../../utils/formatters'

const LICENSE_CATEGORIES = ['LMV', 'HMV', 'Commercial']

// On Trip is backend-controlled — never allow manual set
const EDITABLE_STATUSES = ['Available', 'Off Duty', 'Suspended']

const EMPTY_FORM = {
  name: '',
  license_number: '',
  license_category: '',
  license_expiry_date: '',
  contact_number: '',
  safety_score: '',
  status: 'Available',
}

/**
 * Driver create / edit form.
 * Props:
 *   initial  – driver object to pre-fill (edit mode); null = create mode
 *   onSubmit – async fn(data) called with validated form data
 *   onCancel – fn
 *   loading  – bool, disables submit while saving
 */
export default function DriverForm({ initial = null, onSubmit, onCancel, loading = false }) {
  const isEdit = Boolean(initial)
  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initial) {
      setForm({
        name:                initial.name                || '',
        license_number:      initial.license_number      || '',
        license_category:    initial.license_category    || '',
        license_expiry_date: initial.license_expiry_date || '',
        contact_number:      initial.contact_number      || '',
        safety_score:        initial.safety_score        ?? '',
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
    if (errors[name]) setErrors(e => ({ ...e, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateDriver(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    try {
      await onSubmit(form)
    } catch (err) {
      const msg = err.message || ''
      if (msg.toLowerCase().includes('license')) {
        setErrors({ license_number: msg })
      } else {
        setErrors({ _general: msg })
      }
    }
  }

  const expiryPast = form.license_expiry_date && isExpired(form.license_expiry_date)

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors._general && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errors._general}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Name */}
        <FormField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
          placeholder="e.g. Rajesh Kumar"
        />

        {/* License Number */}
        <FormField
          label="License Number"
          name="license_number"
          value={form.license_number}
          onChange={handleChange}
          error={errors.license_number}
          required
          placeholder="e.g. DL0120110012345"
        />

        {/* License Category */}
        <FormField
          label="License Category"
          name="license_category"
          type="select"
          value={form.license_category}
          onChange={handleChange}
          error={errors.license_category}
          required
          options={LICENSE_CATEGORIES}
        />

        {/* License Expiry Date */}
        <div>
          <FormField
            label="License Expiry Date"
            name="license_expiry_date"
            type="date"
            value={form.license_expiry_date}
            onChange={handleChange}
            error={errors.license_expiry_date}
            required
          />
          {expiryPast && !errors.license_expiry_date && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              ⚠ This license has already expired
            </p>
          )}
        </div>

        {/* Contact Number */}
        <FormField
          label="Contact Number"
          name="contact_number"
          type="tel"
          value={form.contact_number}
          onChange={handleChange}
          error={errors.contact_number}
          required
          placeholder="e.g. 9876543210"
          hint="7–15 digits"
        />

        {/* Safety Score */}
        <FormField
          label="Safety Score (0–100)"
          name="safety_score"
          type="number"
          value={form.safety_score}
          onChange={handleChange}
          error={errors.safety_score}
          required
          min="0"
          max="100"
          placeholder="e.g. 85"
        />

        {/* Status — edit only, On Trip excluded */}
        {isEdit && (
          <FormField
            label="Status"
            name="status"
            type="select"
            value={form.status}
            onChange={handleChange}
            options={EDITABLE_STATUSES}
            hint="'On Trip' is managed automatically by the system"
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
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Driver'}
        </button>
      </div>
    </form>
  )
}
