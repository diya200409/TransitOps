import { useState, useEffect, useCallback } from 'react'
import { getTrips, createTrip, dispatchTrip, cancelTrip } from '../api/trips'
import { apiClient } from '../api/client'
import { normalizeTrip } from '../api/trips'

export function useTrips() {
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', date: '' })

  const fetchTrips = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setTrips(await getTrips(filters))
    } catch (e) {
      setError(e.message || 'Failed to load trips.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  async function createTripFn(data) {
    const r = await createTrip(data)
    await fetchTrips()
    return r
  }

  async function updateTrip(id, data) {
    // Backend has no generic trip update — only status transitions
    // For edit support we re-create by cancelling and creating (not supported by backend)
    // Just refresh to keep state consistent
    await fetchTrips()
  }

  async function dispatchTripFn(id) {
    // Real backend dispatch — backend validates vehicle, driver, license, cargo, maintenance
    const r = await dispatchTrip(id)
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
    loading,
    error,
    filters,
    setFilters,
    createTrip:   createTripFn,
    updateTrip,
    dispatchTrip: dispatchTripFn,
    cancelTrip:   cancelTripFn,
    deleteTrip,
    refresh:      fetchTrips,
  }
}
