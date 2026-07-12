import { useState, useEffect, useCallback } from 'react'
import { getFuelLogs, createFuelLog } from '../api/fuel'

export function useFuel() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', vehicle_id: '', date: '' })

  const fetchRecords = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (filters.vehicle_id) params.vehicle_id = filters.vehicle_id
      let data = await getFuelLogs(params)
      // Client-side search
      if (filters.search) {
        const q = filters.search.toLowerCase()
        data = data.filter(r =>
          r.vehicle_name?.toLowerCase().includes(q) ||
          r.record_number?.toLowerCase().includes(q)
        )
      }
      setRecords(data)
    } catch (e) {
      setError(e.message || 'Failed to load fuel records.')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  async function createRecord(data) {
    const r = await createFuelLog(data)
    await fetchRecords()
    return r
  }

  // Backend has no delete for fuel logs — no-op with refresh
  async function deleteRecord(id) {
    await fetchRecords()
  }

  return { records, loading, error, filters, setFilters, createRecord, deleteRecord, refresh: fetchRecords }
}
