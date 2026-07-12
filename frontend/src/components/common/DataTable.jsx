import { useState } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import EmptyState from './EmptyState'
import LoadingSpinner from './LoadingSpinner'

/**
 * Generic sortable table.
 *
 * Props:
 *   columns – [{ key, header, render?: (value, row) => ReactNode, sortable?: bool, width?: string }]
 *   rows    – array of data objects
 *   loading – shows skeleton rows when true
 *   error   – shows error message when set
 *   empty   – EmptyState props: { title, description, action }
 *   onRetry – called when the retry button is clicked on error state
 *   rowKey  – function(row) => unique key (default: row.id)
 */
export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  error = null,
  empty = {},
  onRetry,
  rowKey = row => row.id,
}) {
  const [sortKey, setSortKey]   = useState(null)
  const [sortDir, setSortDir]   = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal == null) return 1
    if (bVal == null) return -1
    const cmp = typeof aVal === 'string'
      ? aVal.localeCompare(bVal)
      : aVal - bVal
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : {}}
                className={`
                  px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider
                  ${col.sortable ? 'cursor-pointer select-none hover:text-gray-700' : ''}
                `}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="text-gray-400">
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                        : <ChevronsUpDown size={12} />
                      }
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            // Skeleton rows
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <p className="text-gray-500 text-sm">{error}</p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Try again
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                <EmptyState
                  title={empty.title || 'No data found'}
                  description={empty.description}
                  action={empty.action}
                />
              </td>
            </tr>
          ) : (
            sorted.map(row => (
              <tr
                key={rowKey(row)}
                className="hover:bg-gray-50"
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {col.render
                      ? col.render(row[col.key], row)
                      : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
