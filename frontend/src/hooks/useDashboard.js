import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import { mockDashboardService } from '../mock/dashboardMock'

// ── Actual backend endpoint: GET /analytics/dashboard ────────────────────────
// Returns: { active_vehicles, available_vehicles, vehicles_in_maintenance,
//            on_trip_vehicles, active_trips, pending_trips,
//            drivers_on_duty, fleet_utilization_percent }
//
// Charts (vehicle_status, driver_status, utilization_trend) have NO backend
// endpoint — those remain on mock data. The activity feed is also mock-only.

const INITIAL_KPIS = {
  active_vehicles:           null,
  available_vehicles:        null,
  vehicles_in_maintenance:   null,
  active_trips:              null,
  pending_trips:             null,
  drivers_on_duty:           null,
  fleet_utilization_percent: null,
}

export function useDashboard() {
  const [kpis, setKpis]         = useState(INITIAL_KPIS)
  const [charts, setCharts]     = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filters, setFilters]   = useState({ type: '', status: '', region: '' })

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      // ── Real KPIs from GET /analytics/dashboard ───────────────────────────
      const params = {}
      if (filters.type)   params.vehicle_type = filters.type
      if (filters.status) params.status       = filters.status
      if (filters.region) params.region       = filters.region
      const query   = new URLSearchParams(params).toString()
      const kpiData = await apiClient.get(`/analytics/dashboard${query ? `?${query}` : ''}`)

      setKpis({
        active_vehicles:          kpiData.active_vehicles,
        available_vehicles:       kpiData.available_vehicles,
        vehicles_in_maintenance:  kpiData.vehicles_in_maintenance,
        active_trips:             kpiData.active_trips,
        pending_trips:            kpiData.pending_trips,
        drivers_on_duty:          kpiData.drivers_on_duty,
        fleet_utilization_percent: kpiData.fleet_utilization_percent,
      })

      // ── Charts + Activity: no backend endpoint → stay on mock ─────────────
      // API gap: /analytics/dashboard does not return chart-level distributions.
      // Keeping mock chart data so the dashboard UI remains functional.
      const [chartData, activityData] = await Promise.all([
        mockDashboardService.getCharts(filters),
        mockDashboardService.getRecentActivity(),
      ])
      setCharts(chartData)
      setActivity(activityData)

    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchAll() }, [fetchAll])

  return { kpis, charts, activity, loading, error, filters, setFilters, refresh: fetchAll }
}
