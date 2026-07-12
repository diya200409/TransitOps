import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../api/client'

// ── Field normalizer ──────────────────────────────────────────────────────────
// Backend returns license_expiry_date as ISO datetime; frontend uses date string
function normalizeDriver(d) {
  if (!d) return d
  return {
    ...d,
    // Trim datetime to date-only string for UI compatibility
    license_expiry_date: d.license_expiry_date
      ? d.license_expiry_date.split('T')[0]
      : '',
  }
}

async function fetchAllDrivers(params = {}) {
  const p = {}
  if (params.search) p.search = params.search
  if (params.status) p.status = params.status
  if (params.skip  !== undefined) p.skip  = params.skip
  if (params.limit !== undefined) p.limit = params.limit
  // backend doesn't filter by license_category directly — filter client-side
  const query = new URLSearchParams(p).toString()
  const data  = await apiClient.get(`/drivers${query ? `?${query}` : ''}`)
  // Backend returns { items, total, skip, limit }
  let items = []
  let total = 0
  if (data && Array.isArray(data.items)) {
    items = data.items.map(normalizeDriver)
    total = data.total
  } else if (Array.isArray(data)) {
    items = data.map(normalizeDriver)
    total = data.length
  }
  // Client-side filter for license_category (not supported as query param)
  if (params.license_category) {
    items = items.filter(d => d.license_category === params.license_category)
  }
  return { items, total }
}

export function useDrivers(paginationParams = {}) {
  const [drivers, setDrivers] = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', license_category: '' })

  const { skip = 0, limit = 20 } = paginationParams

  const fetchDrivers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await fetchAllDrivers({ ...filters, skip, limit })
      setDrivers(result.items)
      setTotal(result.total)
    } catch (e) {
      setError(e.message || 'Failed to load drivers.')
    } finally {
      setLoading(false)
    }
  }, [filters, skip, limit])

  useEffect(() => { fetchDrivers() }, [fetchDrivers])

  async function createDriver(data) {
    // Backend expects license_expiry_date as ISO datetime
    const payload = {
      ...data,
      license_expiry_date: data.license_expiry_date
        ? new Date(data.license_expiry_date).toISOString()
        : data.license_expiry_date,
      safety_score: Number(data.safety_score),
    }
    const result = await apiClient.post('/drivers', payload)
    await fetchDrivers()
    return normalizeDriver(result)
  }

  async function updateDriver(id, data) {
    const payload = {
      ...data,
      license_expiry_date: data.license_expiry_date
        ? new Date(data.license_expiry_date).toISOString()
        : data.license_expiry_date,
      safety_score: Number(data.safety_score),
    }
    const result = await apiClient.put(`/drivers/${id}`, payload)
    await fetchDrivers()
    return normalizeDriver(result)
  }

  async function deleteDriver(id) {
    await apiClient.delete(`/drivers/${id}`)
    await fetchDrivers()
  }

  return { drivers, total, loading, error, filters, setFilters, createDriver, updateDriver, deleteDriver, refresh: fetchDrivers }
}
