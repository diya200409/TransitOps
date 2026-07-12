import { apiClient } from './client'

export function getDrivers(params = {}) {
  const query = new URLSearchParams(params).toString()
  return apiClient.get(`/drivers${query ? `?${query}` : ''}`)
}

export function getDriver(id) {
  return apiClient.get(`/drivers/${id}`)
}

export function createDriver(data) {
  return apiClient.post('/drivers', data)
}

export function updateDriver(id, data) {
  return apiClient.put(`/drivers/${id}`, data)
}

export function deleteDriver(id) {
  return apiClient.delete(`/drivers/${id}`)
}
