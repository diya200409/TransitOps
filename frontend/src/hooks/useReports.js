import { useState, useEffect, useCallback } from 'react'
import { mockReportService } from '../mock/reportsMock'

// ── Toggle to swap mock ↔ real API ─────────────────────────────────────────
// import * as reportsApi from '../api/reports'
const USE_MOCK = true
const service  = USE_MOCK ? mockReportService : null
// ──────────────────────────────────────────────────────────────────────────

export const REPORT_TYPES = ['Fleet Performance', 'Fuel Analysis', 'Expense Analysis', 'Driver Performance']

export function useReports() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ report_type: 'Fleet Performance', vehicle_id: '', date_from: '', date_to: '' })

  const fetchReports = useCallback(async () => {
    setLoading(true); setError(null)
    try   { setData(await service.getAll(filters)) }
    catch (e) { setError(e.message || 'Failed to load reports.') }
    finally   { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchReports() }, [fetchReports])

  return { data, loading, error, filters, setFilters, refresh: fetchReports }
}
