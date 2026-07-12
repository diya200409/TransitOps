import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

/**
 * PaginationBar — renders page navigation controls.
 *
 * Props:
 *   page       {number}  current 1-based page index
 *   pageSize   {number}  records per page
 *   total      {number}  total records from backend
 *   onPage     {fn}      called with new page number
 *   loading    {bool}    disables controls while fetching
 */
export default function PaginationBar({ page = 1, pageSize = 20, total = 0, onPage, loading = false }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)

  if (total === 0) return null

  function btn(label, target, disabled, icon) {
    return (
      <button
        key={label}
        onClick={() => !disabled && !loading && onPage(target)}
        disabled={disabled || loading}
        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title={typeof label === 'string' ? label : undefined}
      >
        {icon}
      </button>
    )
  }

  // Build page number buttons (show window of up to 5 pages)
  const pages = []
  const half  = 2
  let start   = Math.max(1, page - half)
  let end     = Math.min(totalPages, start + 4)
  if (end - start < 4) start = Math.max(1, end - 4)

  for (let p = start; p <= end; p++) {
    pages.push(p)
  }

  return (
    <div className="flex items-center justify-between px-1 py-2 border-t border-gray-100 mt-2">
      {/* Record count label */}
      <p className="text-xs text-gray-500">
        Showing <span className="font-medium text-gray-700">{from}–{to}</span> of{' '}
        <span className="font-medium text-gray-700">{total.toLocaleString()}</span> records
      </p>

      {/* Navigation controls */}
      <div className="flex items-center gap-0.5">
        {btn('First page', 1, page === 1, <ChevronsLeft size={14} />)}
        {btn('Previous page', page - 1, page === 1, <ChevronLeft size={14} />)}

        {start > 1 && <span className="px-1 text-xs text-gray-400">…</span>}

        {pages.map(p => (
          <button
            key={p}
            onClick={() => !loading && onPage(p)}
            disabled={loading}
            className={`w-7 h-7 text-xs rounded-md font-medium transition-colors
              ${p === page
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed'
              }`}
          >
            {p}
          </button>
        ))}

        {end < totalPages && <span className="px-1 text-xs text-gray-400">…</span>}

        {btn('Next page', page + 1, page === totalPages, <ChevronRight size={14} />)}
        {btn('Last page', totalPages, page === totalPages, <ChevronsRight size={14} />)}
      </div>
    </div>
  )
}
