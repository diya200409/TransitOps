import { Eye, Pencil, Trash2 } from 'lucide-react'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'
import { formatCurrency } from '../../utils/formatters'

/**
 * Vehicle list table.
 * Props:
 *   vehicles      – array of vehicle objects
 *   loading       – bool
 *   error         – string | null
 *   onRetry       – fn
 *   onView        – fn(vehicle)
 *   onEdit        – fn(vehicle)
 *   onDelete      – fn(vehicle)
 *   canMutate     – bool (false = hide Edit/Delete, Fleet Manager only)
 *   onAddVehicle  – fn (used in empty state CTA)
 */
export default function VehicleTable({
  vehicles,
  loading,
  error,
  onRetry,
  onView,
  onEdit,
  onDelete,
  canMutate,
  onAddVehicle,
}) {
  const columns = [
    {
      key: 'registration_number',
      header: 'Reg. Number',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {val}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Name / Model',
      sortable: true,
      render: (val) => <span className="font-medium text-gray-800">{val}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (val) => (
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
          {val}
        </span>
      ),
    },
    {
      key: 'max_load_capacity',
      header: 'Max Load',
      sortable: true,
      render: (val) =>
        val != null ? (
          <span className="text-gray-700">
            {Number(val).toLocaleString('en-IN')}
            <span className="text-gray-400 text-xs ml-1">kg</span>
          </span>
        ) : '—',
    },
    {
      key: 'odometer',
      header: 'Odometer',
      sortable: true,
      render: (val) =>
        val != null ? (
          <span className="text-gray-700">
            {Number(val).toLocaleString('en-IN')}
            <span className="text-gray-400 text-xs ml-1">km</span>
          </span>
        ) : '—',
    },
    {
      key: 'acquisition_cost',
      header: 'Acq. Cost',
      sortable: true,
      render: (val) => (
        <span className="text-gray-700 font-medium">{formatCurrency(val)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {/* View */}
          <button
            onClick={() => onView(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="View details"
          >
            <Eye size={15} />
          </button>

          {/* Edit — Fleet Manager only */}
          {canMutate && (
            <button
              onClick={() => onEdit(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-amber-50 hover:text-amber-600"
              title="Edit vehicle"
            >
              <Pencil size={15} />
            </button>
          )}

          {/* Delete — Fleet Manager only */}
          {canMutate && (
            <button
              onClick={() => onDelete(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Delete vehicle"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      rows={vehicles}
      loading={loading}
      error={error}
      onRetry={onRetry}
      rowKey={row => row.id}
      empty={{
        title: 'No vehicles found',
        description: 'Add your first vehicle to get started or adjust your search filters.',
        action: canMutate
          ? { label: 'Add Vehicle', onClick: onAddVehicle }
          : undefined,
      }}
    />
  )
}
