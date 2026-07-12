import { apiClient } from './client'

// Backend FuelLog: { id, vehicle_id, trip_id, liters, cost, date }
// Frontend fuel display uses: record_number, vehicle_name, vehicle_reg,
//                             litres, cost_per_litre, total_cost, odometer, date, notes

export function normalizeFuelLog(f) {
  if (!f) return f
  return {
    ...f,
    record_number: `FUL-${String(f.id).padStart(4, '0')}`,
    vehicle_name:  f.vehicle_name || `Vehicle #${f.vehicle_id}`,
    vehicle_reg:   f.vehicle_reg  || '',
    // Backend uses 'liters' (American) vs frontend 'litres' (British)
    litres:        f.liters ?? f.litres ?? 0,
    total_cost:    f.cost ?? 0,
    cost_per_litre: (f.liters && f.cost) ? +(f.cost / f.liters).toFixed(2) : 0,
    date:          f.date ? f.date.split('T')[0] : '',
    notes:         f.notes || '',
  }
}

export async function getFuelLogs(params = {}) {
  const p = {}
  if (params.vehicle_id) p.vehicle_id = params.vehicle_id
  const query = new URLSearchParams(p).toString()
  const data  = await apiClient.get(`/fuel-logs${query ? `?${query}` : ''}`)
  return Array.isArray(data) ? data.map(normalizeFuelLog) : data
}

export async function createFuelLog(data) {
  // Frontend sends: vehicle_id, litres, cost_per_litre (we compute total cost)
  // Backend expects: vehicle_id, trip_id?, liters, cost
  const liters = Number(data.litres)
  const costPerLitre = Number(data.cost_per_litre)
  const payload = {
    vehicle_id: Number(data.vehicle_id),
    liters,
    cost: +(liters * costPerLitre).toFixed(2),
    ...(data.trip_id ? { trip_id: Number(data.trip_id) } : {}),
  }
  const result = await apiClient.post('/fuel-logs', payload)
  return normalizeFuelLog(result)
}
