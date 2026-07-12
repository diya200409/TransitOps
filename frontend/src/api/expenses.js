import { apiClient } from './client'

// Backend Expense type enum: Toll, Maintenance, Other
// Frontend has: Toll, Parking, Repair, Insurance, Permit, Other
// Map frontend categories to backend enum
const CATEGORY_MAP = {
  Toll:      'Toll',
  Parking:   'Other',
  Repair:    'Maintenance',
  Insurance: 'Other',
  Permit:    'Other',
  Other:     'Other',
}

export function normalizeExpense(e) {
  if (!e) return e
  return {
    ...e,
    expense_number: `EXP-${String(e.id).padStart(4, '0')}`,
    vehicle_name:   e.vehicle_name || `Vehicle #${e.vehicle_id}`,
    vehicle_reg:    e.vehicle_reg  || '',
    category:       e.type ?? e.category ?? 'Other',
    date:           e.date ? e.date.split('T')[0] : '',
    description:    e.description || '',
  }
}

export async function getExpenses(params = {}) {
  const p = {}
  if (params.vehicle_id) p.vehicle_id = params.vehicle_id
  if (params.category) p.type = CATEGORY_MAP[params.category] || 'Other'
  const query = new URLSearchParams(p).toString()
  const data  = await apiClient.get(`/expenses${query ? `?${query}` : ''}`)
  return Array.isArray(data) ? data.map(normalizeExpense) : data
}

export async function createExpense(data) {
  const payload = {
    vehicle_id:  Number(data.vehicle_id),
    type:        CATEGORY_MAP[data.category] || 'Other',
    amount:      Number(data.amount),
    description: data.description || null,
    ...(data.trip_id ? { trip_id: Number(data.trip_id) } : {}),
  }
  const result = await apiClient.post('/expenses', payload)
  return normalizeExpense(result)
}
