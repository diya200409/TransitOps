import { useState, useEffect, useCallback } from 'react'
import { mockDriverService } from '../mock/driversMock'

// ─── Toggle this to swap mock ↔ real API ─────────────────────────────────────
// When backend is ready:
//   1. Set USE_MOCK = false
//   2. Uncomment the import below
// import * as driverApi from '../api/drivers'
const USE_MOCK = true
const service  = USE_MOCK ? mockDriverService : null
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom hook — manages all driver data and CRUD operations.
 * Returns: { drivers, loading, error, filters, setFilters,
 *            createDriver, updateDriver, deleteDriver, refresh }
 */
export function useDrivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', license_category: '' })

  const fetchDrivers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.getAll(filters)
      setDrivers(data)
    } catch (err) {
      setError(err.message || 'Failed to load drivers.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchDrivers()
  }, [fetchDrivers])

  async function createDriver(data) {
    const created = await service.create(data)
    await fetchDrivers()
    return created
  }

  async function updateDriver(id, data) {
    const updated = await service.update(id, data)
    await fetchDrivers()
    return updated
  }

  async function deleteDriver(id) {
    await service.delete(id)
    await fetchDrivers()
  }

  return {
    drivers,
    loading,
    error,
    filters,
    setFilters,
    createDriver,
    updateDriver,
    deleteDriver,
    refresh: fetchDrivers,
  }
}
