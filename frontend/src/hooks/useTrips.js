import { useState, useEffect, useCallback } from 'react'
import { getTrips, createTrip, dispatchTrip, cancelTrip, completeTrip } from '../api/trips'
import { apiClient } from '../api/client'
import { normalizeTrip } from '../api/trips'

export function useTrips(paginationParams = {}) {
  const [trips,    setTrips]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [filters,  setFilters]  = useState({ search: '', status: '', date: '' })

  const { skip = 0, limit = 20 } = paginationParams

  const fetchTrips = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await getTrips({ ...filters, skip, limit })
      if (result && result.items) {
        setTrips(result.items)
        setTotal(result.total)
      } else if (Array.isArray(result)) {
        setTrips(result)
        setTotal(result.length)
      }
    } catch (e) {
      setError(e.message || 'Failed to load trips.')
    } finally {
      setLoading(false)
    }
  }, [filters, skip, limit])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  async function createTripFn(data) {
    const r = await createTrip(data)
    await fetchTrips()
    return r
  }

  async function updateTrip(id, data) {
    // Backend has no generic trip update — only status transitions
    await fetchTrips()
  }

  async function dispatchTripFn(id) {
    const r = await dispatchTrip(id)
    await fetchTrips()
    return r
  }

  async function completeTripFn(id, data) {
    // Real backend: POST /trips/{id}/complete with { final_odometer, fuel_consumed, revenue? }
    const r = await completeTrip(id, data)
    await fetchTrips()
    return r
  }

  async function cancelTripFn(id) {
    const r = await cancelTrip(id)
    await fetchTrips()
    return r
  }

  async function deleteTrip(id) {
    // Backend has no delete endpoint for trips — cancel instead
    await cancelTrip(id)
    await fetchTrips()
  }

  return {
    trips,
    total,
    loading,
    error,
    filters,
    setFilters,
    createTrip:   createTripFn,
    updateTrip,
    dispatchTrip: dispatchTripFn,
    completeTrip: completeTripFn,
    cancelTrip:   cancelTripFn,
    deleteTrip,
    refresh:      fetchTrips,
  }
}
