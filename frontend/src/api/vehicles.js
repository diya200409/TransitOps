import { apiClient } from './client'

// ── Field mapping helpers ─────────────────────────────────────────────────────
//
// Backend schema uses `name_model`; the frontend UI uses `name` everywhere.
// These two functions keep the translation in ONE place so no page component
// needs to know about the mismatch.

/**
 * Normalize a vehicle coming FROM the backend → frontend shape.
 * Maps name_model → name so all existing UI code keeps working.
 */
export function normalizeVehicle(v) {
  if (!v) return v
  return {
    ...v,
    name: v.name_model ?? v.name ?? '',   // name_model → name
  }
}

/**
 * Prepare a vehicle payload going TO the backend.
 * Maps frontend `name` → `name_model`.
 */
function toBackend(data) {
  const { name, ...rest } = data
  return {
    ...rest,
    name_model: name,           // name → name_model
    max_load_capacity: Number(data.max_load_capacity),
    odometer:          Number(data.odometer),
    acquisition_cost:  Number(data.acquisition_cost),
  }
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getVehicles(params = {}) {
  const query = new URLSearchParams(params).toString()
  const data  = await apiClient.get(`/vehicles${query ? `?${query}` : ''}`)
  return Array.isArray(data) ? data.map(normalizeVehicle) : data
}

export async function getVehicle(id) {
  const data = await apiClient.get(`/vehicles/${id}`)
  return normalizeVehicle(data)
}

export async function createVehicle(data) {
  const result = await apiClient.post('/vehicles', toBackend(data))
  return normalizeVehicle(result)
}

export async function updateVehicle(id, data) {
  const result = await apiClient.put(`/vehicles/${id}`, toBackend(data))
  return normalizeVehicle(result)
}

export async function deleteVehicle(id) {
  return apiClient.delete(`/vehicles/${id}`)
}
