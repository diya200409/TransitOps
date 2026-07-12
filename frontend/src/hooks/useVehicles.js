import { useState, useEffect, useCallback } from 'react'
import * as vehicleApi from '../api/vehicles'

/**
 * Custom hook — manages all vehicle data and CRUD operations.
 * Now connected to the real FastAPI backend via src/api/vehicles.js.
 *
 * Field mapping (name ↔ name_model) is handled entirely inside
 * src/api/vehicles.js — this hook and all UI components continue
 * to use the `name` field as before.
 *
 * Returns: { vehicles, total, loading, error, filters, setFilters,
 *            createVehicle, updateVehicle, deleteVehicle, refresh }
 */
export function useVehicles(paginationParams = {}) {
  const [vehicles, setVehicles] = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [filters,  setFilters]  = useState({ search: '', type: '', status: '' })

  const { skip = 0, limit = 20 } = paginationParams

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { skip, limit }
      if (filters.search) params.search = filters.search
      if (filters.type)   params.type   = filters.type
      if (filters.status) params.status = filters.status

      const data = await vehicleApi.getVehicles(params)
      // Backend returns { items, total, skip, limit }
      if (data && Array.isArray(data.items)) {
        setVehicles(data.items)
        setTotal(data.total)
      } else if (Array.isArray(data)) {
        setVehicles(data)
        setTotal(data.length)
      }
    } catch (err) {
      setError(err.message || 'Failed to load vehicles.')
    } finally {
      setLoading(false)
    }
  }, [filters, skip, limit])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  async function createVehicle(data) {
    const created = await vehicleApi.createVehicle(data)
    await fetchVehicles()
    return created
  }

  async function updateVehicle(id, data) {
    const updated = await vehicleApi.updateVehicle(id, data)
    await fetchVehicles()
    return updated
  }

  async function deleteVehicle(id) {
    // Backend blocks delete if vehicle has trip history and returns a
    // descriptive 400 message: "Cannot delete … it has N trip(s). Set status to 'Retired'"
    // We let the error bubble up so the caller can display it in the UI.
    await vehicleApi.deleteVehicle(id)
    await fetchVehicles()
  }

  return {
    vehicles,
    total,
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
