import { useState, useEffect, useCallback } from 'react'
import { mockDashboardService } from '../mock/dashboardMock'

// ─── Toggle this to swap mock ↔ real API ─────────────────────────────────────
// When backend is ready:
//   1. Set USE_MOCK = false
//   2. Uncomment the import below
// import { getDashboardKPIs, getDashboardCharts } from '../api/dashboard'
const USE_MOCK = true
const service  = USE_MOCK ? mockDashboardService : null
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_KPIS = {
  active_vehicles:           null,
  available_vehicles:        null,
  vehicles_in_maintenance:   null,
  active_trips:              null,
  pending_trips:             null,
  drivers_on_duty:           null,
  fleet_utilization_percent: null,
}

/**
 * Custom hook — loads all dashboard data (KPIs, charts, activity).
 * Returns:
 *   kpis, charts, activity
 *   loading, error
 *   filters, setFilters
 *   refresh
 */
export function useDashboard() {
  const [kpis, setKpis]         = useState(INITIAL_KPIS)
  const [charts, setCharts]     = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filters, setFilters]   = useState({ type: '', status: '', region: '' })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [kpiData, chartData, activityData] = await Promise.all([
        service.getKPIs(filters),
        service.getCharts(filters),
        service.getRecentActivity(),
      ])
      setKpis(kpiData)
      setCharts(chartData)
      setActivity(activityData)
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    kpis,
    charts,
    activity,
    loading,
    error,
    filters,
    setFilters,
    refresh: fetchAll,
  }
}
