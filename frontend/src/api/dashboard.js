import { apiClient } from './client'

export function getDashboardKPIs(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiClient.get(`/dashboard/kpis${query ? `?${query}` : ''}`)
}

export function getDashboardCharts(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiClient.get(`/dashboard/charts${query ? `?${query}` : ''}`)
}
