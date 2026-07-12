import { useState, useEffect, useCallback } from 'react'
import { mockMaintenanceService } from '../mock/maintenanceMock'

// ── Toggle to swap mock ↔ real API ──────────────────────────────────────────
// import * as maintenanceApi from '../api/maintenance'
const USE_MOCK = true
const service  = USE_MOCK ? mockMaintenanceService : null
// ───────────────────────────────────────────────────────────────────────────

export function useMaintenance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', service_type: '' })

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError(null)
    try   { setRecords(await service.getAll(filters)) }
    catch (e) { setError(e.message || 'Failed to load maintenance records.') }
    finally   { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const createRecord = async d     => { const r = await service.create(d);     await fetchRecords(); return r }
  const updateRecord = async (id,d)=> { const r = await service.update(id,d);  await fetchRecords(); return r }
  const deleteRecord = async id    => { await service.delete(id);               await fetchRecords()          }

  return { records, loading, error, filters, setFilters, createRecord, updateRecord, deleteRecord, refresh: fetchRecords }
}
