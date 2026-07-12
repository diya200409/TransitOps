import { Eye, Pencil, Trash2 } from 'lucide-react'
import DataTable from '../common/DataTable'
import StatusBadge from '../common/StatusBadge'
import SafetyScoreBadge from './SafetyScoreBadge'
import LicenseExpiryBadge from './LicenseExpiryBadge'
import { formatDate } from '../../utils/formatters'

/**
 * Driver list table.
 * Props:
 *   drivers      – array of driver objects
 *   loading      – bool
 *   error        – string | null
 *   onRetry      – fn
 *   onView       – fn(driver)
 *   onEdit       – fn(driver)
 *   onDelete     – fn(driver)
 *   canMutate    – bool (Fleet Manager only)
 *   onAddDriver  – fn (empty state CTA)
 */
export default function DriverTable({
  drivers,
  loading,
  error,
  onRetry,
  onView,
  onEdit,
  onDelete,
  canMutate,
  onAddDriver,
}) {
  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (val) => <span className="font-medium text-gray-800">{val}</span>,
    },
    {
      key: 'license_number',
      header: 'License No.',
      sortable: true,
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
          {val}
        </span>
      ),
    },
    {
      key: 'license_category',
      header: 'Category',
      sortable: true,
      render: (val) => (
        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
          {val}
        </span>
      ),
    },
    {
      key: 'license_expiry_date',
      header: 'License Expiry',
      sortable: true,
      render: (val) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-700">{formatDate(val)}</span>
          <LicenseExpiryBadge expiryDate={val} />
        </div>
      ),
    },
    {
      key: 'contact_number',
      header: 'Contact',
      render: (val) => <span className="text-gray-600 text-sm">{val}</span>,
    },
    {
      key: 'safety_score',
      header: 'Safety Score',
      sortable: true,
      render: (val) => <SafetyScoreBadge score={val} showBar />,
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
              title="Edit driver"
            >
              <Pencil size={15} />
            </button>
          )}

          {/* Delete — Fleet Manager only */}
          {canMutate && (
            <button
              onClick={() => onDelete(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Delete driver"
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
      rows={drivers}
      loading={loading}
      error={error}
      onRetry={onRetry}
      rowKey={row => row.id}
      empty={{
        title: 'No drivers found',
        description: 'Add your first driver to get started or adjust your search filters.',
        action: canMutate
          ? { label: 'Add Driver', onClick: onAddDriver }
          : undefined,
      }}
    />
  )
}
