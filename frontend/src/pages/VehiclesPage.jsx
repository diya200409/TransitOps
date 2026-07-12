import { useState } from 'react'
import { Plus, Truck } from 'lucide-react'
import { useVehicles } from '../hooks/useVehicles'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/common/Toast'
import { VEHICLE_STATUSES } from '../constants/vehicleStatus'

import SearchBar           from '../components/common/SearchBar'
import FilterBar           from '../components/common/FilterBar'
import Modal               from '../components/common/Modal'
import ConfirmDialog       from '../components/common/ConfirmDialog'
import VehicleTable        from '../components/vehicles/VehicleTable'
import VehicleForm         from '../components/vehicles/VehicleForm'
import VehicleDetailModal  from '../components/vehicles/VehicleDetailModal'

const VEHICLE_TYPES = ['Truck', 'Van', 'Bike', 'Trailer']

const FILTER_CONFIG = [
  { key: 'type',   label: 'Types',    options: VEHICLE_TYPES    },
  { key: 'status', label: 'Statuses', options: VEHICLE_STATUSES },
]

export default function VehiclesPage() {
  const { isFleetManager } = useAuth()
  const toast = useToast()

  const {
    vehicles,
    loading,
    error,
    filters,
    setFilters,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refresh,
  } = useVehicles()

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [addOpen, setAddOpen]         = useState(false)
  const [editTarget, setEditTarget]   = useState(null)   // vehicle being edited
  const [viewTarget, setViewTarget]   = useState(null)   // vehicle being viewed
  const [deleteTarget, setDeleteTarget] = useState(null) // vehicle pending delete
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState(false)

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
      await createVehicle(data)
      setAddOpen(false)
      toast({ type: 'success', message: 'Vehicle added successfully.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(data) {
    setSaving(true)
    try {
      await updateVehicle(editTarget.id, data)
      setEditTarget(null)
      toast({ type: 'success', message: 'Vehicle updated successfully.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteVehicle(deleteTarget.id)
      setDeleteTarget(null)
      toast({ type: 'success', message: 'Vehicle deleted.' })
    } catch (err) {
      toast({ type: 'error', message: err.message || 'Failed to delete vehicle.' })
    } finally {
      setDeleting(false)
    }
  }

  // ── Summary counts ───────────────────────────────────────────────────────────
  const total     = vehicles.length
  const available = vehicles.filter(v => v.status === 'Available').length
  const onTrip    = vehicles.filter(v => v.status === 'On Trip').length
  const inShop    = vehicles.filter(v => v.status === 'In Shop').length

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Vehicle Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">Register and manage your fleet vehicles</p>
        </div>
        {isFleetManager && (
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm"
          >
            <Plus size={16} />
            Add Vehicle
          </button>
        )}
      </div>

      {/* ── Summary chips ── */}
      {!loading && !error && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Total',     count: total,     color: 'bg-gray-100 text-gray-600'    },
            { label: 'Available', count: available,  color: 'bg-green-100 text-green-700'  },
            { label: 'On Trip',   count: onTrip,     color: 'bg-blue-100 text-blue-700'    },
            { label: 'In Shop',   count: inShop,     color: 'bg-amber-100 text-amber-700'  },
          ].map(({ label, count, color }) => (
            <span key={label} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${color}`}>
              {label}: {count}
            </span>
          ))}
        </div>
      )}

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <SearchBar
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search by reg. number or name…"
          />
        </div>
        <FilterBar
          filters={FILTER_CONFIG}
          values={filters}
          onChange={handleFilterChange}
        />
      </div>

      {/* ── Vehicle Table ── */}
      <VehicleTable
        vehicles={vehicles}
        loading={loading}
        error={error ? 'Failed to load vehicles. Please try again.' : null}
        onRetry={refresh}
        onView={v => setViewTarget(v)}
        onEdit={v => setEditTarget(v)}
        onDelete={v => setDeleteTarget(v)}
        canMutate={isFleetManager}
        onAddVehicle={() => setAddOpen(true)}
      />

      {/* ── Add Vehicle Modal ── */}
      <Modal
        open={addOpen}
        onClose={() => !saving && setAddOpen(false)}
        title="Add Vehicle"
        size="lg"
      >
        <VehicleForm
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* ── Edit Vehicle Modal ── */}
      <Modal
        open={Boolean(editTarget)}
        onClose={() => !saving && setEditTarget(null)}
        title="Edit Vehicle"
        size="lg"
      >
        <VehicleForm
          initial={editTarget}
          onSubmit={handleUpdate}
          onCancel={() => setEditTarget(null)}
          loading={saving}
        />
      </Modal>

      {/* ── View Details Modal ── */}
      <VehicleDetailModal
        vehicle={viewTarget}
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
      />

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Vehicle"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}" (${deleteTarget.registration_number})? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Vehicle"
      />
    </div>
  )
}
