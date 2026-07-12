import { useState, useCallback } from 'react'

/**
 * usePagination — manages page / pageSize state and computes skip/limit.
 *
 * Usage:
 *   const pagination = usePagination()
 *   // In fetch: apiClient.get(`/vehicles?skip=${pagination.skip}&limit=${pagination.pageSize}`)
 *   // Pass to PaginationBar: <PaginationBar {...pagination.barProps(total)} onPage={pagination.setPage} />
 *
 * Returns:
 *   page, pageSize, skip, limit, setPage, setPageSize, reset, barProps
 */
export function usePagination(defaultPageSize = 20) {
  const [page, setPageRaw]     = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)

  const setPage = useCallback((p) => setPageRaw(p), [])

  /** Reset to first page — call this whenever filters change. */
  const reset = useCallback(() => setPageRaw(1), [])

  const skip  = (page - 1) * pageSize
  const limit = pageSize

  /**
   * Returns props to spread onto <PaginationBar />.
   * @param {number} total  — total record count returned by the API
   */
  function barProps(total) {
    return { page, pageSize, total, onPage: setPage }
  }

  return { page, pageSize, skip, limit, setPage, setPageSize, reset, barProps }
}
