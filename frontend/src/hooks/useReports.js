import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'
import { mockReportService } from '../mock/reportsMock'

// ── Backend analytics endpoints available ────────────────────────────────────
// GET /analytics/vehicles          → per-vehicle analytics list (VehicleAnalytics[])
// GET /analytics/vehicles/{id}     → single vehicle analytics
// GET /analytics/vehicles/export/csv   → CSV download
// GET /analytics/vehicles/export/pdf   → PDF download
//
// ── No backend endpoints for: ────────────────────────────────────────────────
// - Fuel trend over time (mock)
// - Monthly expense trend (mock)
// - Driver performance ranking (mock)
// - Operational insights text (mock)

export const REPORT_TYPES = ['Fleet Performance', 'Fuel Analysis', 'Expense Analysis', 'Driver Performance']

// Normalize VehicleAnalytics[] from backend → chart-friendly shape
function buildReportData(analyticsArray, mockData) {
  const kpis = {
    fleet_utilization:      mockData.kpis.fleet_utilization,    // no backend field for this
    total_trips:            mockData.kpis.total_trips,
    total_fuel_cost:        analyticsArray.reduce((s, v) => s + v.total_fuel_cost, 0),
    total_operational_cost: analyticsArray.reduce((s, v) => s + v.total_operational_cost, 0),
    avg_cost_per_trip:      mockData.kpis.avg_cost_per_trip,
    best_vehicle:           analyticsArray.length
      ? [...analyticsArray].sort((a, b) => (b.roi ?? -Infinity) - (a.roi ?? -Infinity))[0]?.name_model
      : mockData.kpis.best_vehicle,
  }

  // Fuel by vehicle — real data
  const fuel_by_vehicle = analyticsArray.map((v, i) => ({
    vehicle: v.name_model?.split(' ').slice(0, 2).join(' ') || v.registration_number,
    cost:    v.total_fuel_cost,
    litres:  v.total_fuel_liters,
    fill:    ['#3b82f6','#6366f1','#22c55e','#f59e0b','#ec4899','#14b8a6'][i % 6],
  }))

  return {
    kpis,
    fleet_performance:  analyticsArray.map(v => ({
      vehicle:     v.name_model?.split(' ').slice(0, 2).join(' ') || v.registration_number,
      trips:       0,                      // not in analytics response
      utilization: 0,
      cost:        v.total_operational_cost,
    })),
    fuel_trend:         mockData.fuel_trend,          // no backend endpoint
    fuel_by_vehicle,
    expense_categories: mockData.expense_categories,  // no backend endpoint
    monthly_expenses:   mockData.monthly_expenses,    // no backend endpoint
    driver_performance: mockData.driver_performance,  // no backend endpoint
    insights:           mockData.insights,            // no backend endpoint
  }
}

export function useReports() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ report_type: 'Fleet Performance', vehicle_id: '', date_from: '', date_to: '' })

  const fetchReports = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id

      // Fetch real vehicle analytics + mock fallback data in parallel
      const [analyticsRaw, mockData] = await Promise.all([
        apiClient.get('/analytics/vehicles'),
        mockReportService.getAll(filters),
      ])

      const analyticsArray = Array.isArray(analyticsRaw) ? analyticsRaw : []
      setData(buildReportData(analyticsArray, mockData))
    } catch (e) {
      // On error fall back to mock so page doesn't break
      try {
        const mockData = await mockReportService.getAll(filters)
        setData(mockData)
      } catch {
        setError(e.message || 'Failed to load reports.')
      }
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchReports() }, [fetchReports])

  return { data, loading, error, filters, setFilters, refresh: fetchReports }
}
