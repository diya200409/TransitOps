import { useState, useEffect, useCallback } from 'react'
import { mockVehicleService } from '../mock/vehiclesMock'

// ─── Toggle this to swap mock ↔ real API ─────────────────────────────────────
// When backend is ready:
//   1. Set USE_MOCK = false
//   2. Import the real API functions below instead of mockVehicleService
// import * as vehicleApi from '../api/vehicles'
const USE_MOCK = true
const service  = USE_MOCK ? mockVehicleService : null
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom hook — manages all vehicle data and CRUD operations.
 * Returns: { vehicles, loading, error, filters, setFilters,
 *            createVehicle, updateVehicle, deleteVehicle, refresh }
 */
export function useVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filters, setFilters]   = useState({ search: '', type: '', status: '' })

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.getAll(filters)
      setVehicles(data)
    } catch (err) {
      setError(err.message || 'Failed to load vehicles.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  async function createVehicle(data) {
    const created = await service.create(data)
    await fetchVehicles()
    return created
  }

  async function updateVehicle(id, data) {
    const updated = await service.update(id, data)
    await fetchVehicles()
    return updated
  }

  async function deleteVehicle(id) {
    await service.delete(id)
    await fetchVehicles()
  }

  return {
    vehicles,
    loading,
    error,
    filters,
    setFilters,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    refresh: fetchVehicles,
  }
}
