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

export default function FuelExpensesPage() {
  const { records: fuelRecords, loading: fuelLoading, error: fuelError, filters: fuelFilters, setFilters: setFuelFilters, createRecord, deleteRecord, refresh: refreshFuel } = useFuel()
  const { expenses, loading: expenseLoading, error: expenseError, filters: expenseFilters, setFilters: setExpenseFilters, createExpense, deleteExpense, refresh: refreshExpenses } = useExpenses()
  const { isFleetManager } = useAuth()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState('fuel')
  const [fuelModalOpen, setFuelModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteType, setDeleteType] = useState('fuel')
  const [actionLoading, setActionLoading] = useState(false)

  const currentLoading = activeTab === 'fuel' ? fuelLoading : expenseLoading
  const currentError = activeTab === 'fuel' ? fuelError : expenseError
  const currentFilters = activeTab === 'fuel' ? fuelFilters : expenseFilters
  const currentRecords = activeTab === 'fuel' ? fuelRecords : expenses

  const fuelTotalCost = fuelRecords.reduce((sum, rec) => sum + (rec.total_cost || 0), 0)
  const fuelTotalLitres = fuelRecords.reduce((sum, rec) => sum + (rec.litres || 0), 0)
  const fuelAvgCost = fuelTotalLitres ? fuelTotalCost / fuelTotalLitres : 0
  const fuelRecordCount = fuelRecords.length

  const expenseTotalAmount = expenses.reduce((sum, rec) => sum + (rec.amount || 0), 0)
  const expenseCount = expenses.length
  const expenseAvg = expenseCount ? expenseTotalAmount / expenseCount : 0
  const categoryTotals = expenses.reduce((acc, rec) => {
    acc[rec.category] = (acc[rec.category] || 0) + (rec.amount || 0)
    return acc
  }, {})
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  function handleTabChange(tab) {
    setActiveTab(tab)
  }

  function handleSearchChange(value) {
    if (activeTab === 'fuel') {
      setFuelFilters(f => ({ ...f, search: value }))
    } else {
      setExpenseFilters(f => ({ ...f, search: value }))
    }
  }

  function handleFilterChange(key, value) {
    if (activeTab === 'fuel') {
      setFuelFilters(f => ({ ...f, [key]: value }))
    } else {
      setExpenseFilters(f => ({ ...f, [key]: value }))
    }
  }

  async function handleCreateFuel(data) {
    setActionLoading(true)
    try {
      await createRecord(data)
      setFuelModalOpen(false)
      toast({ type: 'success', message: 'Fuel record added successfully.' })
    } catch (err) {
      toast({ type: 'error', message: err.message || 'Failed to add fuel record.' })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCreateExpense(data) {
    setActionLoading(true)
    try {
      await createExpense(data)
      setExpenseModalOpen(false)
      toast({ type: 'success', message: 'Expense added successfully.' })
    } catch (err) {
      toast({ type: 'error', message: err.message || 'Failed to add expense.' })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      if (deleteType === 'fuel') {
        await deleteRecord(deleteTarget.id)
        toast({ type: 'success', message: 'Fuel record deleted.' })
      } else {
        await deleteExpense(deleteTarget.id)
        toast({ type: 'success', message: 'Expense deleted.' })
      }
      setDeleteTarget(null)
    } catch (err) {
      toast({ type: 'error', message: err.message || 'Unable to delete record.' })
    } finally {
      setActionLoading(false)
    }
  }

  const fuelColumns = [
    { key: 'record_number', header: 'Record', sortable: true },
    { key: 'vehicle_name', header: 'Vehicle', render: (_, row) => `${row.vehicle_name} (${row.vehicle_reg})` },
    { key: 'date', header: 'Date', render: value => formatDate(value) },
    { key: 'litres', header: 'Litres', render: value => `${value} L` },
    { key: 'cost_per_litre', header: 'Cost/L', render: value => formatCurrency(value) },
    { key: 'total_cost', header: 'Total Cost', render: value => formatCurrency(value) },
    { key: 'odometer', header: 'Odometer', render: value => `${value} km` },
    { key: 'notes', header: 'Notes' },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDeleteType('fuel')
              setDeleteTarget(row)
            }}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600"
            aria-label="Delete fuel record"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  const expenseColumns = [
    { key: 'expense_number', header: 'Expense' },
    { key: 'vehicle_name', header: 'Vehicle', render: (_, row) => `${row.vehicle_name} (${row.vehicle_reg})` },
    { key: 'category', header: 'Category' },
    { key: 'date', header: 'Date', render: value => formatDate(value) },
    { key: 'amount', header: 'Amount', render: value => formatCurrency(value) },
    { key: 'description', header: 'Description' },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDeleteType('expense')
              setDeleteTarget(row)
            }}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-red-600"
            aria-label="Delete expense"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Fuel & Expenses</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track refuels, operational costs, and expense analytics for your fleet.</p>
        </div>
        <button
          onClick={() => {
            refreshFuel()
            refreshExpenses()
          }}
          disabled={fuelLoading || expenseLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw size={16} className={fuelLoading || expenseLoading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleTabChange('fuel')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'fuel' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <Fuel size={16} /> Fuel
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('expenses')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${activeTab === 'expenses' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          <DollarSign size={16} /> Expenses
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <KPICard icon={Fuel} label="Fuel Records" value={fuelRecordCount} accent="bg-sky-500" />
        <KPICard icon={Droplets} label="Total Fuel Spend" value={formatCurrency(fuelTotalCost)} accent="bg-blue-500" />
        <KPICard icon={DollarSign} label="Total Expense Spend" value={formatCurrency(expenseTotalAmount)} accent="bg-emerald-500" />
        <KPICard icon={BarChart3} label="Average Expense" value={formatCurrency(expenseAvg)} accent="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Fuel Summary</p>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between"><span>Total Litres</span><span className="font-semibold text-gray-800">{fuelTotalLitres.toLocaleString('en-IN')} L</span></div>
            <div className="flex items-center justify-between"><span>Average Cost/L</span><span className="font-semibold text-gray-800">{formatCurrency(fuelAvgCost)}</span></div>
            <div className="flex items-center justify-between"><span>Last refresh</span><span className="text-gray-500">{new Date().toLocaleDateString('en-IN')}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Expense Summary</p>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between"><span>Expense Count</span><span className="font-semibold text-gray-800">{expenseCount}</span></div>
            <div className="flex items-center justify-between"><span>Top Category</span><span className="font-semibold text-gray-800">{topCategory}</span></div>
            <div className="flex items-center justify-between"><span>Avg Expense</span><span className="font-semibold text-gray-800">{formatCurrency(expenseAvg)}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Active Filters</p>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-between"><span>Vehicle</span><span className="text-gray-800">{currentFilters.vehicle_id ? VEHICLE_OPTIONS.find(opt => opt.value === currentFilters.vehicle_id)?.label : 'All'}</span></div>
            <div className="flex items-center justify-between"><span>Category</span><span className="text-gray-800">{currentFilters.category || 'All'}</span></div>
            <div className="flex items-center justify-between"><span>From Date</span><span className="text-gray-800">{currentFilters.date || 'Any'}</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="w-full lg:w-80">
          <SearchBar
            value={currentFilters.search}
            onChange={handleSearchChange}
            placeholder={activeTab === 'fuel' ? 'Search fuel records…' : 'Search expenses…'}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterBar
            filters={activeTab === 'fuel' ? FUEL_FILTER_CONFIG : EXP_FILTER_CONFIG}
            values={currentFilters}
            onChange={handleFilterChange}
          />
          <button
            type="button"
            onClick={() => activeTab === 'fuel' ? setFuelModalOpen(true) : setExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
          >
            <Plus size={16} />
            {activeTab === 'fuel' ? 'Add Fuel' : 'Add Expense'}
          </button>
        </div>
      </div>

      {currentError && !currentLoading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 flex items-center justify-between">
          <div>
            <p className="font-semibold">⚠️ Error loading data</p>
            <p>{currentError}</p>
          </div>
          <button
            onClick={activeTab === 'fuel' ? refreshFuel : refreshExpenses}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      <DataTable
        columns={activeTab === 'fuel' ? fuelColumns : expenseColumns}
        rows={currentRecords}
        loading={currentLoading}
        error={currentError}
        empty={{
          title: activeTab === 'fuel' ? 'No fuel records' : 'No expense records',
          description: activeTab === 'fuel'
            ? 'Add fuel entries to begin tracking your fleet refuels.'
            : 'Add expense entries to keep operational costs under control.',
        }}
        onRetry={activeTab === 'fuel' ? refreshFuel : refreshExpenses}
        rowKey={row => row.id}
      />

      <Modal open={fuelModalOpen} onClose={() => !actionLoading && setFuelModalOpen(false)} title="Add Fuel Record" size="lg">
        <FuelForm onSubmit={handleCreateFuel} onCancel={() => setFuelModalOpen(false)} loading={actionLoading} />
      </Modal>

      <Modal open={expenseModalOpen} onClose={() => !actionLoading && setExpenseModalOpen(false)} title="Add Expense" size="lg">
        <ExpenseForm onSubmit={handleCreateExpense} onCancel={() => setExpenseModalOpen(false)} loading={actionLoading} />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !actionLoading && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title={deleteType === 'fuel' ? 'Delete Fuel Record' : 'Delete Expense'}
        message={deleteTarget ? `Are you sure you want to delete ${deleteType === 'fuel' ? deleteTarget.record_number : deleteTarget.expense_number}? This action cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  )
}

