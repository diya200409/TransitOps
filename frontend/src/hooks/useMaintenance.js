import { useState, useEffect, useCallback } from 'react'
import { getMaintenance, createMaintenance, closeMaintenance } from '../api/maintenance'

export function useMaintenance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', service_type: '' })

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (filters.status)  params.status  = filters.status
      const data = await getMaintenance(params)
      // Client-side search filter (backend doesn't support search on maintenance)
      const filtered = filters.search
        ? data.filter(r =>
            r.vehicle_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
            r.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
            r.service_type?.toLowerCase().includes(filters.search.toLowerCase()) ||
            r.record_number?.toLowerCase().includes(filters.search.toLowerCase())
          )
        : data
      setRecords(filtered)
    } catch (e) {
      setError(e.message || 'Failed to load maintenance records.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function createRecord(data) {
    const r = await createMaintenance(data)
    await fetchRecords()
    return r
  }

  // Backend uses close endpoint rather than generic update
  async function updateRecord(id, data) {
    // If status is being set to Completed → call close
    if (data.status === 'Completed' || data.status === 'Closed') {
      const r = await closeMaintenance(id, data.actual_cost ?? data.estimated_cost)
      await fetchRecords()
      return r
    }
    // Otherwise just refresh (no partial update endpoint available)
    await fetchRecords()
  }

  async function deleteRecord(id) {
    // Backend has no delete endpoint for maintenance — close it instead
    await closeMaintenance(id)
    await fetchRecords()
  }

  return { records, loading, error, filters, setFilters, createRecord, updateRecord, deleteRecord, refresh: fetchRecords }
}
