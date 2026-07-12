import { useState, useEffect, useCallback } from 'react'
import { mockTripService } from '../mock/tripsMock'

// ── Toggle to swap mock ↔ real API ──────────────────────────────────────────
// import * as tripApi from '../api/trips'
const USE_MOCK = true
const service  = USE_MOCK ? mockTripService : null
// ───────────────────────────────────────────────────────────────────────────

export function useTrips() {
  const [trips, setTrips]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', date: '' })

  const fetchTrips = useCallback(async () => {
    setLoading(true); setError(null)
    try   { setTrips(await service.getAll(filters)) }
    catch (e) { setError(e.message || 'Failed to load trips.') }
    finally   { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const createTrip  = async d    => { const r = await service.create(d);       await fetchTrips(); return r }
  const updateTrip  = async (id,d)=> { const r = await service.update(id,d);   await fetchTrips(); return r }
  const dispatchTrip= async id   => { const r = await service.dispatch(id);    await fetchTrips(); return r }
  const cancelTrip  = async id   => { const r = await service.cancel(id);      await fetchTrips(); return r }
  const deleteTrip  = async id   => { await service.delete(id);                await fetchTrips()           }

  return { trips, loading, error, filters, setFilters, createTrip, updateTrip, dispatchTrip, cancelTrip, deleteTrip, refresh: fetchTrips }
}
