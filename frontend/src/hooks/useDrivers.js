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
  // backend doesn't filter by license_category directly — filter client-side
  const query = new URLSearchParams(p).toString()
  const data  = await apiClient.get(`/drivers${query ? `?${query}` : ''}`)
  let result  = Array.isArray(data) ? data.map(normalizeDriver) : []
  // Client-side filter for license_category (not supported as query param)
  if (params.license_category) {
    result = result.filter(d => d.license_category === params.license_category)
  }
  return result
}

export function useDrivers() {
  const [drivers, setDrivers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', license_category: '' })

  const fetchDrivers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setDrivers(await fetchAllDrivers(filters))
    } catch (e) {
      setError(e.message || 'Failed to load drivers.')
    } finally {
      setLoading(false)
    }
  }, [filters])

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

  return { drivers, loading, error, filters, setFilters, createDriver, updateDriver, deleteDriver, refresh: fetchDrivers }
}
