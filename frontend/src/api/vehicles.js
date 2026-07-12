import { apiClient } from './client'

export function getVehicles(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiClient.get(`/vehicles${query ? `?${query}` : ''}`)
}

export function getVehicle(id) {
  return apiClient.get(`/vehicles/${id}`)
}

export function createVehicle(data) {
  return apiClient.post('/vehicles', data)
}

export function updateVehicle(id, data) {
  return apiClient.put(`/vehicles/${id}`, data)
}

export function deleteVehicle(id) {
  return apiClient.delete(`/vehicles/${id}`)
}
