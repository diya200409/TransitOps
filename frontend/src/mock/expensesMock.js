/**
 * MOCK DATA — Operational Expenses
 * Swap by setting USE_MOCK = false in useExpenses.js
 * and pointing to src/api/expenses.js (GET/POST/DELETE /expenses)
 */

let _expenses = [
  { id: 1, expense_number: 'EXP-0001', vehicle_id: 2, vehicle_name: 'Ashok Leyland Dost', vehicle_reg: 'MH14CD5678', category: 'Toll',      date: '2026-07-08', amount: 850,   description: 'Mumbai Pune Expressway toll' },
  { id: 2, expense_number: 'EXP-0002', vehicle_id: 1, vehicle_name: 'Tata Prima 4028.S',  vehicle_reg: 'MH12AB1234', category: 'Permit',    date: '2026-07-01', amount: 12000, description: 'Annual state permit renewal' },
  { id: 3, expense_number: 'EXP-0003', vehicle_id: 4, vehicle_name: 'Eicher Pro 2095',    vehicle_reg: 'KA03GH3456', category: 'Repair',    date: '2026-07-07', amount: 6500,  description: 'Rear axle bearing replacement' },
  { id: 4, expense_number: 'EXP-0004', vehicle_id: 3, vehicle_name: 'Mahindra Supro',     vehicle_reg: 'DL01EF9012', category: 'Insurance', date: '2026-07-01', amount: 28000, description: 'Comprehensive insurance renewal' },
  { id: 5, expense_number: 'EXP-0005', vehicle_id: 6, vehicle_name: 'Hero Splendor Pro',  vehicle_reg: 'GJ05KL2345', category: 'Parking',   date: '2026-07-10', amount: 200,   description: 'Overnight parking — Vadodara depot' },
  { id: 6, expense_number: 'EXP-0006', vehicle_id: 1, vehicle_name: 'Tata Prima 4028.S',  vehicle_reg: 'MH12AB1234', category: 'Toll',      date: '2026-07-09', amount: 1200,  description: 'Delhi Agra NH toll' },
  { id: 7, expense_number: 'EXP-0007', vehicle_id: 4, vehicle_name: 'Eicher Pro 2095',    vehicle_reg: 'KA03GH3456', category: 'Other',     date: '2026-07-11', amount: 3200,  description: 'Driver accommodation — overnight stay' },
]
let _nextExpId = 8

function delay(ms = 400) { return new Promise(r => setTimeout(r, ms)) }

export const mockExpenseService = {
  async getAll(params = {}) {
    await delay()
    let r = [..._expenses]
    if (params.search) {
      const q = params.search.toLowerCase()
      r = r.filter(e =>
        e.expense_number.toLowerCase().includes(q) ||
        e.vehicle_name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      )
    }
    if (params.category)   r = r.filter(e => e.category === params.category)
    if (params.vehicle_id) r = r.filter(e => String(e.vehicle_id) === String(params.vehicle_id))
    if (params.date)       r = r.filter(e => e.date >= params.date)
    return r
  },
  async getById(id) {
    await delay()
    const e = _expenses.find(e => e.id === id)
    if (!e) throw new Error('Expense not found')
    return { ...e }
  },
  async create(data) {
    await delay()
    const rec = {
      ...data,
      id:             _nextExpId++,
      expense_number: `EXP-${String(_nextExpId - 1).padStart(4, '0')}`,
      amount:         Number(data.amount),
    }
    _expenses.unshift(rec)
    return { ...rec }
  },
  async delete(id) {
    await delay()
    const idx = _expenses.findIndex(e => e.id === id)
    if (idx === -1) throw new Error('Expense not found')
    _expenses.splice(idx, 1)
  },
}
