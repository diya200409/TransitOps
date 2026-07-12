import { useState } from 'react'
import { CheckCircle, Gauge, Droplets, DollarSign, AlertCircle } from 'lucide-react'
import Modal from '../common/Modal'

/**
 * TripCompleteModal — collects final_odometer, fuel_consumed, and optional revenue
 * then calls onConfirm({ final_odometer, fuel_consumed, revenue }).
 *
 * Props:
 *   trip       {object}  — the trip being completed (must be in Dispatched status)
 *   open       {bool}
 *   onClose    {fn}
 *   onConfirm  {fn(data)}  — receives { final_odometer, fuel_consumed, revenue }
 *   loading    {bool}
 */
export default function TripCompleteModal({ trip, open, onClose, onConfirm, loading }) {
  const [form, setForm] = useState({
    final_odometer: '',
    fuel_consumed:  '',
    revenue:        trip?.revenue ?? '',
  })
  const [error, setError] = useState('')

  if (!trip) return null

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const odometer = parseFloat(form.final_odometer)
    const fuel     = parseFloat(form.fuel_consumed)
    const revenue  = form.revenue !== '' ? parseFloat(form.revenue) : undefined

    if (!form.final_odometer || isNaN(odometer) || odometer <= 0) {
      setError('Final odometer reading is required and must be a positive number.')
      return
    }
    if (!form.fuel_consumed || isNaN(fuel) || fuel < 0) {
      setError('Fuel consumed is required and must be ≥ 0.')
      return
    }
    if (revenue !== undefined && (isNaN(revenue) || revenue < 0)) {
      setError('Revenue must be a positive number or leave blank to keep the original.')
      return
    }

    try {
      await onConfirm({ final_odometer: odometer, fuel_consumed: fuel, revenue })
    } catch (err) {
      setError(err.message || 'Failed to complete trip.')
    }
  }

  return (
    <Modal open={open} onClose={() => !loading && onClose()} title="Complete Trip" size="sm">
      <div className="space-y-4">
        {/* Trip summary */}
        <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm">
          <p className="font-semibold text-blue-800">{trip.trip_number}</p>
          <p className="text-blue-600 mt-0.5">{trip.origin} → {trip.destination}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Final Odometer */}
          <div>
            <label htmlFor="final_odometer" className="block text-sm font-medium text-gray-700 mb-1">
              <Gauge size={14} className="inline mr-1 text-gray-400" />
              Final Odometer Reading (km) <span className="text-red-500">*</span>
            </label>
            <input
              id="final_odometer"
              name="final_odometer"
              type="number"
              min="0"
              step="0.1"
              value={form.final_odometer}
              onChange={handleChange}
              placeholder="e.g. 15750.5"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Must be greater than the vehicle's current odometer.</p>
          </div>

          {/* Fuel Consumed */}
          <div>
            <label htmlFor="fuel_consumed" className="block text-sm font-medium text-gray-700 mb-1">
              <Droplets size={14} className="inline mr-1 text-gray-400" />
              Fuel Consumed (litres) <span className="text-red-500">*</span>
            </label>
            <input
              id="fuel_consumed"
              name="fuel_consumed"
              type="number"
              min="0"
              step="0.01"
              value={form.fuel_consumed}
              onChange={handleChange}
              placeholder="e.g. 45.5"
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Revenue (optional) */}
          <div>
            <label htmlFor="revenue" className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign size={14} className="inline mr-1 text-gray-400" />
              Actual Revenue (₹) <span className="text-xs text-gray-400 font-normal">optional</span>
            </label>
            <input
              id="revenue"
              name="revenue"
              type="number"
              min="0"
              step="0.01"
              value={form.revenue}
              onChange={handleChange}
              placeholder={`Current: ₹${Number(trip.revenue || 0).toLocaleString('en-IN')}`}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Completing…</>
              ) : (
                <><CheckCircle size={15} />Complete Trip</>
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
