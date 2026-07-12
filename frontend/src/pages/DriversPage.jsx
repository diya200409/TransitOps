import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useDrivers } from '../hooks/useDrivers'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'
import { DRIVER_STATUSES } from '../constants/driverStatus'

import SearchBar          from '../components/common/SearchBar'
import FilterBar          from '../components/common/FilterBar'
import Modal              from '../components/common/Modal'
import ConfirmDialog      from '../components/common/ConfirmDialog'
import DriverTable        from '../components/drivers/DriverTable'
import DriverForm         from '../components/drivers/DriverForm'
import DriverDetailModal  from '../components/drivers/DriverDetailModal'

const LICENSE_CATEGORIES = ['LMV', 'HMV', 'Commercial']

const FILTER_CONFIG = [
  { key: 'status',           label: 'Statuses',   options: DRIVER_STATUSES    },
  { key: 'license_category', label: 'Categories', options: LICENSE_CATEGORIES },
]

export default function DriversPage() {
  const { isFleetManager } = useAuth()
  const toast = useToast()

  const {
    drivers,
    loading,
    error,
    filters,
    setFilters,
    createDriver,
    updateDriver,
    deleteDriver,
    refresh,
  } = useDrivers()

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen]           = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [viewTarget, setViewTarget]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(false)

  // ── Handlers ─────────────────────────────────────────────────────────────────

  function handleSearchChange(val) {
    setFilters(f => ({ ...f, search: val }))
  }

  function handleFilterChange(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  async function handleCreate(data) {
    setSaving(true)
    try {
      await createDriver(data)
      setAddOpen(false)
      toast({ type: 'success', message: 'Driver added successfully.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(data) {
    setSaving(true)
    try {
      await updateDriver(editTarget.id, data)
      setEditTarget(null)
      toast({ type: 'success', message: 'Driver updated successfully.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteDriver(deleteTarget.id)
      setDeleteTarget(null)
      toast({ type: 'success', message: 'Driver deleted.' })
    } catch (err) {
      toast({ type: 'error', message: err.message || 'Failed to delete driver.' })
    } finally {
      setDeleting(false)
    }
  }

  // ── Summary counts ───────────────────────────────────────────────────────────
  const total     = drivers.length
  const available = drivers.filter(d => d.status === 'Available').length
  const onTrip    = drivers.filter(d => d.status === 'On Trip').length
  const suspended = drivers.filter(d => d.status === 'Suspended').length

  // Compliance alert count (expired or expiring soon)
  const today = new Date()
  const complianceIssues = drivers.filter(d => {
    if (!d.license_expiry_date) return false
    const diff = (new Date(d.license_expiry_date) - today) / (1000 * 60 * 60 * 24)
    return diff <= 30
  }).length

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Driver Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">Manage driver profiles, licenses, and compliance</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus size={16} />
            Add Driver
          </button>
        )}
      </div>

      {/* ── Summary chips ── */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Total',     count: total,     color: 'bg-gray-100 text-gray-600'   },
            { label: 'Available', count: available,  color: 'bg-green-100 text-green-700' },
            { label: 'On Trip',   count: onTrip,     color: 'bg-blue-100 text-blue-700'   },
            { label: 'Suspended', count: suspended,  color: 'bg-red-100 text-red-700'     },
          ].map(({ label, count, color }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              {label}: {count}
            </span>
          ))}
          {complianceIssues > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              ⚠ {complianceIssues} License {complianceIssues === 1 ? 'Issue' : 'Issues'}
            </span>
          )}
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <SearchBar
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by name or license number…"
          />
        </div>
        <FilterBar
          filters={FILTER_CONFIG}
          values={filters}
          onChange={handleFilterChange}
        />
      </div>

      {/* ── Driver Table ── */}
      <DriverTable
        drivers={drivers}
        loading={loading}
        error={error ? 'Failed to load drivers. Please try again.' : null}
        onRetry={refresh}
        onView={d => setViewTarget(d)}
        onEdit={d => setEditTarget(d)}
        onDelete={d => setDeleteTarget(d)}
        canMutate={isFleetManager}
        onAddDriver={() => setAddOpen(true)}
      />

      {/* ── Add Driver Modal ── */}
      <Modal
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        title="Add Driver"
        size="lg"
      >
        <DriverForm
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* ── Edit Driver Modal ── */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => !saving && setEditTarget(null)}
        title="Edit Driver"
        size="lg"
      >
        <DriverForm
          initial={editTarget}
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      </Modal>

      {/* ── View Details Modal ── */}
      <DriverDetailModal
        driver={viewTarget}
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
      />

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Driver"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}" (${deleteTarget.license_number})? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Driver"
      />
    </div>
  )
}
