import { useState } from 'react'
import { Plus, Eye, Pencil, Trash2, Wrench, RefreshCw, AlertTriangle } from 'lucide-react'
import { useMaintenance }         from '../hooks/useMaintenance'
import { useAuth }                from '../context/AuthContext'
import { useToast }               from '../components/common/Toast'
import { MAINTENANCE_STATUSES, SERVICE_TYPES } from '../constants/maintenanceStatus'
import { formatCurrency, formatDate, isExpired } from '../utils/formatters'

import KPICard                    from '../components/common/KPICard'
import SearchBar                  from '../components/common/SearchBar'
import FilterBar                  from '../components/common/FilterBar'
import DataTable                  from '../components/common/DataTable'
import Modal                      from '../components/common/Modal'
import ConfirmDialog              from '../components/common/ConfirmDialog'
import MaintenanceStatusBadge     from '../components/maintenance/MaintenanceStatusBadge'
import MaintenanceForm            from '../components/maintenance/MaintenanceForm'
import MaintenanceDetailModal     from '../components/maintenance/MaintenanceDetailModal'

const FILTER_CONFIG = [
  { key: 'status',       label: 'Status',       options: MAINTENANCE_STATUSES },
  { key: 'service_type', label: 'Service Type',  options: SERVICE_TYPES        },
]

export default function MaintenancePage() {
  const { isFleetManager } = useAuth()
  const toast = useToast()
  const { records, loading, error, filters, setFilters, createRecord, updateRecord, deleteRecord, refresh } = useMaintenance()

  const [addOpen,      setAddOpen]      = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)
  const [viewTarget,   setViewTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Summary counts ──────────────────────────────────────────────────────
  const inShop     = records.filter(r => r.status === 'In Progress').length
  const scheduled  = records.filter(r => r.status === 'Scheduled').length
  const overdue    = records.filter(r => r.status === 'Overdue').length
  const totalCost  = records
    .filter(r => r.actual_cost != null)
    .reduce((s, r) => s + r.actual_cost, 0)

  // ── Handlers ────────────────────────────────────────────────────────────
  async function handleCreate(data) {
    setSaving(true)
    try   { await createRecord(data); setAddOpen(false); toast({ type: 'success', message: 'Maintenance scheduled.' }) }
    catch (e) { throw e }
    finally   { setSaving(false) }
  }

  async function handleUpdate(data) {
    setSaving(true)
    try   { await updateRecord(editTarget.id, data); setEditTarget(null); toast({ type: 'success', message: 'Record updated.' }) }
    catch (e) { throw e }
    finally   { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try   { await deleteRecord(deleteTarget.id); setDeleteTarget(null); toast({ type: 'success', message: 'Record deleted.' }) }
    catch (e) { toast({ type: 'error', message: e.message }) }
    finally   { setDeleting(false) }
  }

  // ── Table columns ────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'record_number', header: 'Record ID', sortable: true,
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
      key: 'service_type', header: 'Service Type', sortable: true,
      render: v => (
        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{v}</span>
      ),
    },
    {
      key: 'scheduled_date', header: 'Scheduled', sortable: true,
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-gray-700">{formatDate(v)}</span>
          {row.status === 'Overdue' && <AlertTriangle size={13} className="text-red-500" />}
        </div>
      ),
    },
    {
      key: 'completion_date', header: 'Completed', sortable: true,
      render: v => <span className="text-sm text-gray-600">{v ? formatDate(v) : <span className="text-gray-300">—</span>}</span>,
    },
    {
      key: 'estimated_cost', header: 'Est. Cost', sortable: true,
      render: (v, row) => (
        <div>
          <p className="text-sm text-gray-700 font-medium">{formatCurrency(v)}</p>
          {row.actual_cost != null && (
            <p className="text-xs text-gray-400">Actual: {formatCurrency(row.actual_cost)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', sortable: true,
      render: v => <MaintenanceStatusBadge status={v} />,
    },
    {
      key: 'actions', header: 'Actions', width: '110px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setViewTarget(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600" title="View details"><Eye size={14} /></button>
          {isFleetManager && row.status !== 'Completed' && (
            <button onClick={() => setEditTarget(row)} className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600" title="Edit"><Pencil size={14} /></button>
          )}
          {isFleetManager && row.status === 'Completed' && (
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
          <h2 className="text-lg font-semibold text-gray-800">Maintenance Management</h2>
          <p className="text-xs text-gray-400 mt-0.5">Schedule and track vehicle service records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} disabled={loading} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50" title="Refresh">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          {isFleetManager && (
            <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg shadow-sm">
              <Plus size={15} /> Schedule Maintenance
            </button>
          )}
        </div>
      </div>

      {/* ── Overdue alert banner ── */}
      {!loading && overdue > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            {overdue} maintenance {overdue === 1 ? 'record is' : 'records are'} overdue. Immediate attention required.
          </p>
        </div>
      )}

      {/* ── KPI Summary ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Wrench}  label="Vehicles In Shop"    value={loading ? null : inShop}            accent="bg-indigo-500" loading={loading} />
        <KPICard icon={Wrench}  label="Scheduled Services"  value={loading ? null : scheduled}         accent="bg-blue-500"   loading={loading} />
        <KPICard icon={AlertTriangle} label="Overdue"       value={loading ? null : overdue}           accent="bg-red-500"    loading={loading} />
        <KPICard icon={Wrench}  label="Total Cost (Actual)" value={loading ? null : formatCurrency(totalCost)} accent="bg-green-500"  loading={loading} />
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="w-full sm:w-72">
          <SearchBar value={filters.search} onChange={v => setFilters(f => ({ ...f, search: v }))} placeholder="Search record, vehicle, service type…" />
        </div>
        <FilterBar filters={FILTER_CONFIG} values={filters} onChange={(k, v) => setFilters(f => ({ ...f, [k]: v }))} />
        {(filters.search || filters.status || filters.service_type) && (
          <button onClick={() => setFilters({ search: '', status: '', service_type: '' })} className="text-xs text-blue-600 hover:underline self-center">Clear</button>
        )}
      </div>

      {/* ── Error Banner ── */}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">Failed to load maintenance records</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
          <button
            onClick={refresh}
            className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded font-medium hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}
      <DataTable
        columns={columns}
        rows={records}
        loading={loading}
        error={error ? 'Failed to load maintenance records. Please try again.' : null}
        onRetry={refresh}
        rowKey={r => r.id}
        empty={{
          title: 'No maintenance records',
          description: 'Schedule your first maintenance service to get started.',
          action: isFleetManager ? { label: 'Schedule Maintenance', onClick: () => setAddOpen(true) } : undefined,
        }}
      />

      {/* ── Modals ── */}
      <Modal open={addOpen} onClose={() => !saving && setAddOpen(false)} title="Schedule Maintenance" size="lg">
        <MaintenanceForm onSubmit={handleCreate} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>

      <Modal open={Boolean(editTarget)} onClose={() => !saving && setEditTarget(null)} title="Edit Maintenance Record" size="lg">
        <MaintenanceForm initial={editTarget} onSubmit={handleUpdate} onCancel={() => setEditTarget(null)} loading={saving} />
      </Modal>

      <MaintenanceDetailModal record={viewTarget} open={Boolean(viewTarget)} onClose={() => setViewTarget(null)} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Maintenance Record"
        message={deleteTarget ? `Delete record "${deleteTarget.record_number}" for ${deleteTarget.vehicle_name}? This cannot be undone.` : ''}
        confirmLabel="Delete Record"
      />
    </div>
  )
}
