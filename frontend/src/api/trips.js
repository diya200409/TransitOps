import { apiClient } from './client'

// Backend field mapping:
// - Uses source/destination (not origin/destination)
// - Status: Draft/Dispatched/Completed/Cancelled (not Pending/In Progress)
// - No trip_number field — use id
// - No vehicle_name/vehicle_reg on response — only vehicle_id/driver_id

export function normalizeTrip(t) {
  if (!t) return t
  return {
    ...t,
    // Map backend fields to frontend-friendly names
    trip_number:   `TRP-${String(t.id).padStart(4, '0')}`,
    origin:        t.source,
    // status mapping: Draft → Pending for UI consistency
    status:        t.status === 'Draft' ? 'Pending' : t.status,
    // vehicle_name/driver_name not in response — will be enriched by caller if needed
    vehicle_name:  t.vehicle_name  || `Vehicle #${t.vehicle_id}`,
    vehicle_reg:   t.vehicle_reg   || '',
    driver_name:   t.driver_name   || `Driver #${t.driver_id}`,
  }
}

export async function getTrips(params = {}) {
  const p = {}
  if (params.search) p.search = params.search
  // Map frontend 'Pending' filter → backend 'Draft'
  if (params.status) p.status = params.status === 'Pending' ? 'Draft' : params.status
  const query = new URLSearchParams(p).toString()
  const data  = await apiClient.get(`/trips${query ? `?${query}` : ''}`)
  return Array.isArray(data) ? data.map(normalizeTrip) : data
}

export async function getTrip(id) {
  const data = await apiClient.get(`/trips/${id}`)
  return normalizeTrip(data)
}

export async function createTrip(data) {
  // Map frontend fields → backend schema
  // Backend requires: source, destination, vehicle_id, driver_id,
  //                   cargo_weight, planned_distance, revenue
  const payload = {
    source:           data.origin || data.source,
    destination:      data.destination,
    vehicle_id:       Number(data.vehicle_id),
    driver_id:        Number(data.driver_id),
    cargo_weight:     Number(data.cargo_weight),
    planned_distance: Number(data.planned_distance || 100), // default 100km if not provided
    revenue:          Number(data.revenue || 0),
  }
  const result = await apiClient.post('/trips', payload)
  return normalizeTrip(result)
}

export async function dispatchTrip(id) {
  const result = await apiClient.post(`/trips/${id}/dispatch`)
  return normalizeTrip(result)
}

export async function completeTrip(id, data) {
  const result = await apiClient.post(`/trips/${id}/complete`, data)
  return normalizeTrip(result)
}

export async function cancelTrip(id) {
  const result = await apiClient.post(`/trips/${id}/cancel`)
  return normalizeTrip(result)
}

export async function getAvailableVehicles() {
  const data = await apiClient.get('/vehicles/available/pool')
  return Array.isArray(data) ? data : []
}

export async function getAvailableDrivers() {
  const data = await apiClient.get('/drivers/available/pool')
  return Array.isArray(data) ? data : []
}
