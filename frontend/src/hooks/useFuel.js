import { useState, useEffect, useCallback } from 'react'
import { mockFuelService } from '../mock/fuelMock'

// ── Toggle to swap mock ↔ real API ─────────────────────────────────────────
// import * as fuelApi from '../api/fuel'
const USE_MOCK = true
const service  = USE_MOCK ? mockFuelService : null
// ──────────────────────────────────────────────────────────────────────────

export function useFuel() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', vehicle_id: '', date: '' })

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError(null)
    try   { setRecords(await service.getAll(filters)) }
    catch (e) { setError(e.message || 'Failed to load fuel records.') }
    finally   { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const createRecord = async d   => { const r = await service.create(d);  await fetchRecords(); return r }
  const deleteRecord = async id  => { await service.delete(id);            await fetchRecords()           }

  return { records, loading, error, filters, setFilters, createRecord, deleteRecord, refresh: fetchRecords }
}
