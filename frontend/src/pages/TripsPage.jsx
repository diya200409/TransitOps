import { useState, useMemo } from 'react'
import { Plus, Eye, Pencil, Trash2, Zap, XCircle, CheckCircle, Route, RefreshCw } from 'lucide-react'
import { useTrips }           from '../hooks/useTrips'
import { usePagination }      from '../hooks/usePagination'
import { useAuth }            from '../context/AuthContext'
import { useToast }           from '../components/common/Toast'
import { TRIP_STATUSES }      from '../constants/tripStatus'
import { formatDate }         from '../utils/formatters'

import KPICard          from '../components/common/KPICard'
import SearchBar        from '../components/common/SearchBar'
import FilterBar        from '../components/common/FilterBar'
import PaginationBar    from '../components/common/PaginationBar'
import DataTable        from '../components/common/DataTable'
import Modal            from '../components/common/Modal'
import ConfirmDialog    from '../components/common/ConfirmDialog'
import TripStatusBadge  from '../components/trips/TripStatusBadge'
import TripForm         from '../components/trips/TripForm'
import TripDetailModal  from '../components/trips/TripDetailModal'
import DispatchModal    from '../components/trips/DispatchModal'
import TripCompleteModal from '../components/trips/TripCompleteModal'

const FILTER_CONFIG = [
  { key: 'status', label: 'Status', options: TRIP_STATUSES },
]

export default function TripsPage() {
  const { isFleetManager } = useAuth()
  const toast = useToast()
  const pagination = usePagination()
  const { trips, total: totalTrips, loading, error, filters, setFilters, createTrip, updateTrip, dispatchTrip, cancelTrip, completeTrip, deleteTrip, refresh } = useTrips({ skip: pagination.skip, limit: pagination.limit })

  const [createOpen,   setCreateOpen]   = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [dispatchTarget, setDispatchTarget] = useState(null)
  const [completeTarget, setCompleteTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [dispatching, setDispatching] = useState(false)
  const [completing,  setCompleting]  = useState(false)

  // ── Summary counts ──────────────────────────────────────────────────────
  const pending   = trips.filter(t => t.status === 'Pending' || t.status === 'Draft').length
  const active    = trips.filter(t => t.status === 'Dispatched').length
  const completed = trips.filter(t => t.status === 'Completed').length

  // ── Handlers ────────────────────────────────────────────────────────────
  async function handleCreate(data) {
    setSaving(true)
    try   { await createTrip(data); setCreateOpen(false); toast({ type: 'success', message: 'Trip created.' }) }
    catch (e) { throw e }
    finally   { setSaving(false) }
  }

  async function handleUpdate(data) {
    setSaving(true)
    try   { await updateTrip(editTarget.id, data); setEditTarget(null); toast({ type: 'success', message: 'Trip updated.' }) }
    catch (e) { throw e }
    finally   { setSaving(false) }
  }

  async function handleDispatch() {
    setDispatching(true)
    try   { await dispatchTrip(dispatchTarget.id); setDispatchTarget(null); toast({ type: 'success', message: `${dispatchTarget.trip_number} dispatched.` }) }
    catch (e) { toast({ type: 'error', message: e.message }) }
    finally   { setDispatching(false) }
  }

  async function handleComplete(data) {
    setCompleting(true)
    try {
      await completeTrip(completeTarget.id, data)
      setCompleteTarget(null)
      toast({ type: 'success', message: `${completeTarget.trip_number} marked as Completed.` })
    } catch (e) {
      toast({ type: 'error', message: e.message })
    } finally {
      setCompleting(false)
    }
  }

  async function handleCancel(trip) {
    try   { await cancelTrip(trip.id); toast({ type: 'success', message: `${trip.trip_number} cancelled.` }) }
    catch (e) { toast({ type: 'error', message: e.message }) }
  }

  async function handleDelete() {
    setDeleting(true)
    try   { await deleteTrip(deleteTarget.id); setDeleteTarget(null); toast({ type: 'success', message: 'Trip deleted.' }) }
    catch (e) { toast({ type: 'error', message: e.message }) }
    finally   { setDeleting(false) }
  }

  // ── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'trip_number', header: 'Trip ID', sortable: true,
      render: v => <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{v}</span>,
    },
    {
      key: 'vehicle_name', header: 'Vehicle', sortable: true,
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-gray-800 leading-none">{v}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{row.vehicle_reg}</p>
        </div>
      ),
    },
    {
      key: 'driver_name', header: 'Driver', sortable: true,
      render: v => <span className="text-sm text-gray-700">{v}</span>,
    },
    {
      key: 'origin', header: 'Route', sortable: false,
      render: (v, row) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-700">
          <span>{v}</span>
          <span className="text-gray-300">→</span>
          <span>{row.destination}</span>
        </div>
      ),
    },
    {
      key: 'scheduled_date', header: 'Scheduled', sortable: true,
      render: v => <span className="text-sm text-gray-600">{v?.replace('T', ' ')?.slice(0,16)}</span>,
    },
    {
      key: 'cargo_weight', header: 'Cargo', sortable: true,
      render: v => v != null ? (
        <span className="text-sm text-gray-700">{Number(v).toLocaleString('en-IN')} <span className="text-xs text-gray-400">kg</span></span>
      ) : '—',
    },
    {
      key: 'status', header: 'Status', sortable: true,
      render: v => <TripStatusBadge status={v} />,
    },
    {
      key: 'actions', header: 'Actions', width: '150px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewTarget(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View details"><Eye size={14} /></button>
          {isFleetManager && row.status === 'Pending' && (
            <button onClick={() => setDispatchTarget(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-indigo-50 hover:text-indigo-600" title="Dispatch"><Zap size={14} /></button>
          )}
          {isFleetManager && row.status === 'Dispatched' && (
            <button onClick={() => setCompleteTarget(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600" title="Complete trip"><CheckCircle size={14} /></button>
          )}
          {isFleetManager && ['Pending','Dispatched'].includes(row.status) && (
            <button onClick={() => setEditTarget(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil size={14} /></button>
          )}
          {isFleetManager && row.status === 'Pending' && (
            <button onClick={() => handleCancel(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-orange-50 hover:text-orange-600" title="Cancel trip"><XCircle size={14} /></button>
          )}
          {isFleetManager && ['Cancelled','Completed'].includes(row.status) && (
            <button onClick={() => setDeleteTarget(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={14} /></button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Trip Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Create, dispatch and track fleet trips</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {isFleetManager && (
            <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm">
              <Plus size={15} /> Create Trip
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Route}   label="Total Trips"     value={loading ? null : totalTrips} accent="bg-blue-500"   loading={loading} />
        <KPICard icon={Route}   label="Pending"         value={loading ? null : pending}   accent="bg-amber-500"  loading={loading} />
        <KPICard icon={Zap}     label="Active"          value={loading ? null : active}    accent="bg-indigo-500" loading={loading} />
        <KPICard icon={Route}   label="Completed"       value={loading ? null : completed} accent="bg-green-500"  loading={loading} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <SearchBar value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} placeholder="Search trip, vehicle, driver, route…" />
        </div>
        <FilterBar filters={FILTER_CONFIG} values={filters} onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />
        <input
          type="date"
          value={filters.date}
          onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {(filters.search || filters.status || filters.date) && (
          <button onClick={() => setFilters({ search: '', status: '', date: '' })} className="text-xs text-blue-600 hover:underline self-center">Clear</button>
        )}
      </div>

      {/* ── Table ── */}
      <DataTable
        columns={columns}
        rows={trips}
        loading={loading}
        error={error ? 'Failed to load trips. Please try again.' : null}
        onRetry={refresh}
        rowKey={r => r.id}
        empty={{
          title: 'No trips found',
          description: 'Create your first trip to get started.',
          action: isFleetManager ? { label: 'Create Trip', onClick: () => setCreateOpen(true) } : undefined,
        }}
      />
      <PaginationBar {...pagination.barProps(totalTrips)} loading={loading} />

      {/* ── Modals ── */}
      <Modal open={createOpen} onClose={() => !saving && setCreateOpen(false)} title="Create Trip" size="lg">
        <TripForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
      </Modal>

      <Modal open={Boolean(editTarget)} onClose={() => !saving && setEditTarget(null)} title="Edit Trip" size="lg">
        <TripForm initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} loading={saving} />
      </Modal>

      <TripDetailModal trip={viewTarget} open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} />

      <DispatchModal
        trip={dispatchTarget}
        open={Boolean(dispatchTarget)}
        onClose={() => setDispatchTarget(null)}
        onConfirm={handleDispatch}
        loading={dispatching}
      />

      <TripCompleteModal
        trip={completeTarget}
        open={Boolean(completeTarget)}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleComplete}
        loading={completing}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Trip"
        message={deleteTarget ? `Delete trip "${deleteTarget.trip_number}" (${deleteTarget.origin} → ${deleteTarget.destination})? This cannot be undone.` : ''}
        confirmLabel="Delete Trip"
      />
    </div>
  )
}
