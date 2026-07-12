import { apiClient } from './client'

// Backend schema: { id, vehicle_id, description, cost, status(Open/Closed), created_at, closed_at }
// Frontend schema expects: record_number, vehicle_name, vehicle_reg, service_type,
//                          scheduled_date, completion_date, estimated_cost, actual_cost, status

export function normalizeMaintenance(m) {
  if (!m) return m
  return {
    ...m,
    record_number:   `MNT-${String(m.id).padStart(4, '0')}`,
    vehicle_name:    m.vehicle_name || `Vehicle #${m.vehicle_id}`,
    vehicle_reg:     m.vehicle_reg  || '',
    service_type:    m.service_type || m.description?.split(' ').slice(0, 3).join(' ') || 'Service',
    scheduled_date:  m.scheduled_date || m.created_at?.split('T')[0] || '',
    completion_date: m.closed_at ? m.closed_at.split('T')[0] : null,
    estimated_cost:  m.estimated_cost ?? m.cost ?? 0,
    actual_cost:     m.status === 'Closed' ? (m.actual_cost ?? m.cost) : null,
    // Map backend Open/Closed → frontend Scheduled/In Progress/Completed
    status: m.status === 'Closed'
      ? 'Completed'
      : (m.status === 'Open' ? 'In Progress' : m.status),
  }
}

export async function getMaintenance(params = {}) {
  const p = {}
  if (params.vehicle_id) p.vehicle_id = params.vehicle_id
  // Map frontend status to backend: Completed→Closed, In Progress→Open, Scheduled→Open
  if (params.status) {
    if (params.status === 'Completed') p.status = 'Closed'
    else if (params.status === 'In Progress' || params.status === 'Scheduled') p.status = 'Open'
  }
  const query = new URLSearchParams(p).toString()
  const data  = await apiClient.get(`/maintenance${query ? `?${query}` : ''}`)
  return Array.isArray(data) ? data.map(normalizeMaintenance) : data
}

export async function getMaintenanceRecord(id) {
  const data = await apiClient.get(`/maintenance/${id}`)
  return normalizeMaintenance(data)
}

export async function createMaintenance(data) {
  const payload = {
    vehicle_id:  Number(data.vehicle_id),
    description: data.description || data.service_type || 'Service',
    cost:        Number(data.estimated_cost || data.cost || 0),
  }
  const result = await apiClient.post('/maintenance', payload)
  return normalizeMaintenance(result)
}

export async function closeMaintenance(id, finalCost) {
  const body = finalCost != null ? { final_cost: Number(finalCost) } : {}
  const result = await apiClient.post(`/maintenance/${id}/close`, body)
  return normalizeMaintenance(result)
}
