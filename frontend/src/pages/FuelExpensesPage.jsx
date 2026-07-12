import { useState } from 'react'
import { Plus, Eye, Trash2, Fuel, DollarSign, Droplets, RefreshCw, BarChart3 } from 'lucide-react'
import { useFuel }           from '../hooks/useFuel'
import { useExpenses, EXPENSE_CATEGORIES } from '../hooks/useExpenses'
import { useAuth }           from '../context/AuthContext'
import { useToast }          from '../components/common/Toast'
import { formatCurrency, formatDate } from '../utils/formatters'

import KPICard       from '../components/common/KPICard'
import SearchBar     from '../components/common/SearchBar'
import FilterBar     from '../components/common/FilterBar'
import DataTable     from '../components/common/DataTable'
import Modal         from '../components/common/Modal'
import ConfirmDialog from '../components/common/ConfirmDialog'
import FormField     from '../components/common/FormField'


const VEHICLE_OPTIONS = [
  { value: '1', label: 'MH12AB1234 – Tata Prima 4028.S' },
  { value: '2', label: 'MH14CD5678 – Ashok Leyland Dost' },
  { value: '3', label: 'DL01EF9012 – Mahindra Supro' },
  { value: '4', label: 'KA03GH3456 – Eicher Pro 2095' },
  { value: '5', label: 'TN07IJ7890 – Force Traveller 3700' },
  { value: '6', label: 'GJ05KL2345 – Hero Splendor Pro' },
]

const VEHICLE_NAME_MAP = {
  '1': { name: 'Tata Prima 4028.S',   reg: 'MH12AB1234' },
  '2': { name: 'Ashok Leyland Dost',  reg: 'MH14CD5678' },
  '3': { name: 'Mahindra Supro',      reg: 'DL01EF9012' },
  '4': { name: 'Eicher Pro 2095',     reg: 'KA03GH3456' },
  '5': { name: 'Force Traveller 3700',reg: 'TN07IJ7890' },
  '6': { name: 'Hero Splendor Pro',   reg: 'GJ05KL2345' },
}

const FUEL_FILTER_CONFIG  = [{ key: 'vehicle_id', label: 'Vehicles', options: VEHICLE_OPTIONS.map(v => ({ value: v.value, label: v.label })) }]
const EXP_FILTER_CONFIG   = [
  { key: 'category',   label: 'Categories', options: EXPENSE_CATEGORIES },
  { key: 'vehicle_id', label: 'Vehicles',   options: VEHICLE_OPTIONS.map(v => ({ value: v.value, label: v.label })) },
]


// ── Fuel Form ─────────────────────────────────────────────────────────────
const EMPTY_FUEL = { vehicle_id: '', date: '', litres: '', cost_per_litre: '', odometer: '', notes: '' }

function FuelForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY_FUEL)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }))
  }

  const totalCost = form.litres && form.cost_per_litre
    ? (Number(form.litres) * Number(form.cost_per_litre)).toFixed(2)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.vehicle_id)                              errs.vehicle_id     = 'Vehicle is required'
    if (!form.date)                                    errs.date           = 'Date is required'
    if (!form.litres || Number(form.litres) <= 0)      errs.litres         = 'Litres must be > 0'
    if (!form.cost_per_litre || Number(form.cost_per_litre) <= 0) errs.cost_per_litre = 'Cost per litre must be > 0'
    if (form.odometer !== '' && Number(form.odometer) < 0) errs.odometer  = 'Odometer cannot be negative'
    if (Object.keys(errs).length) { setErrors(errs); return }
    const v = VEHICLE_NAME_MAP[form.vehicle_id]
    try {
      await onSubmit({ ...form, vehicle_name: v?.name, vehicle_reg: v?.reg })
    } catch (err) { setErrors({ _general: err.message }) }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors._general && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle" name="vehicle_id" type="select" value={form.vehicle_id} onChange={handleChange} error={errors.vehicle_id} required options={VEHICLE_OPTIONS} />
        <FormField label="Date" name="date" type="date" value={form.date} onChange={handleChange} error={errors.date} required />
        <FormField label="Fuel Quantity (Litres)" name="litres" type="number" value={form.litres} onChange={handleChange} error={errors.litres} required min="0.1" step="0.1" placeholder="e.g. 60" />
        <FormField label="Cost per Litre (₹)" name="cost_per_litre" type="number" value={form.cost_per_litre} onChange={handleChange} error={errors.cost_per_litre} required min="0.01" step="0.01" placeholder="e.g. 104.5" />
        <FormField label="Odometer (km)" name="odometer" type="number" value={form.odometer} onChange={handleChange} error={errors.odometer} min="0" placeholder="e.g. 48900" />
        <div className="flex flex-col gap-1 justify-end">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Fuel Cost</p>
          <p className="text-2xl font-bold text-blue-600">{totalCost ? formatCurrency(parseFloat(totalCost)) : '—'}</p>
          <p className="text-xs text-gray-400">Auto-calculated</p>
        </div>
        <div className="sm:col-span-2">
          <FormField label="Notes" name="notes" type="textarea" value={form.notes} onChange={handleChange} placeholder="Optional notes…" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Saving…' : 'Add Fuel Record'}
        </button>
      </div>
    </form>
  )
}


// ── Expense Form ──────────────────────────────────────────────────────────
const EMPTY_EXP = { vehicle_id: '', category: '', date: '', amount: '', description: '' }

function ExpenseForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(EMPTY_EXP)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.vehicle_id)                         errs.vehicle_id  = 'Vehicle is required'
    if (!form.category)                           errs.category    = 'Category is required'
    if (!form.date)                               errs.date        = 'Date is required'
    if (!form.amount || Number(form.amount) <= 0) errs.amount      = 'Amount must be > 0'
    if (!form.description?.trim())                errs.description = 'Description is required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    const v = VEHICLE_NAME_MAP[form.vehicle_id]
    try {
      await onSubmit({ ...form, vehicle_name: v?.name, vehicle_reg: v?.reg, amount: Number(form.amount) })
    } catch (err) { setErrors({ _general: err.message }) }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errors._general && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors._general}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Vehicle"  name="vehicle_id" type="select" value={form.vehicle_id} onChange={handleChange} error={errors.vehicle_id} required options={VEHICLE_OPTIONS} />
        <FormField label="Category" name="category"   type="select" value={form.category}   onChange={handleChange} error={errors.category}   required options={EXPENSE_CATEGORIES} />
        <FormField label="Date"   name="date"   type="date"   value={form.date}   onChange={handleChange} error={errors.date}   required />
        <FormField label="Amount (₹)" name="amount" type="number" value={form.amount} onChange={handleChange} error={errors.amount} required min="1" placeholder="e.g. 1500" />
        <div className="sm:col-span-2">
          <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} error={errors.description} required placeholder="Describe the expense…" />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Saving…' : 'Add Expense'}
        </button>
      </div>
    </form>
  )
}

