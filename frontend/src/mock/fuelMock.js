/**
 * MOCK DATA — Fuel Records
 * Swap by setting USE_MOCK = false in useFuel.js
 * and pointing to src/api/fuel.js (GET/POST/DELETE /fuel)
 */

let _fuel = [
  { id: 1, record_number: 'FUL-0001', vehicle_id: 2, vehicle_name: 'Ashok Leyland Dost',  vehicle_reg: 'MH14CD5678', date: '2026-07-08', litres: 45.0,  cost_per_litre: 104.5, total_cost: 4702.5,  odometer: 21800, notes: 'Full tank before Mumbai-Pune trip' },
  { id: 2, record_number: 'FUL-0002', vehicle_id: 1, vehicle_name: 'Tata Prima 4028.S',   vehicle_reg: 'MH12AB1234', date: '2026-07-09', litres: 120.0, cost_per_litre: 103.8, total_cost: 12456.0, odometer: 48900, notes: '' },
  { id: 3, record_number: 'FUL-0003', vehicle_id: 4, vehicle_name: 'Eicher Pro 2095',     vehicle_reg: 'KA03GH3456', date: '2026-07-10', litres: 60.0,  cost_per_litre: 105.2, total_cost: 6312.0,  odometer: 135400, notes: 'Route KA-TN' },
  { id: 4, record_number: 'FUL-0004', vehicle_id: 6, vehicle_name: 'Hero Splendor Pro',   vehicle_reg: 'GJ05KL2345', date: '2026-07-10', litres: 4.5,   cost_per_litre: 106.0, total_cost: 477.0,   odometer: 32300, notes: '' },
  { id: 5, record_number: 'FUL-0005', vehicle_id: 1, vehicle_name: 'Tata Prima 4028.S',   vehicle_reg: 'MH12AB1234', date: '2026-07-05', litres: 110.0, cost_per_litre: 103.5, total_cost: 11385.0, odometer: 48200, notes: 'Pre-trip top-up' },
  { id: 6, record_number: 'FUL-0006', vehicle_id: 4, vehicle_name: 'Eicher Pro 2095',     vehicle_reg: 'KA03GH3456', date: '2026-07-03', litres: 55.0,  cost_per_litre: 104.0, total_cost: 5720.0,  odometer: 134900, notes: '' },
]
let _nextFuelId = 7

function delay(ms = 400) { return new Promise(r => setTimeout(r, ms)) }

export const mockFuelService = {
  async getAll(params = {}) {
    await delay()
    let r = [..._fuel]
    if (params.search) {
      const q = params.search.toLowerCase()
      r = r.filter(f =>
        f.record_number.toLowerCase().includes(q) ||
        f.vehicle_name.toLowerCase().includes(q) ||
        f.vehicle_reg.toLowerCase().includes(q)
      )
    }
    if (params.vehicle_id) r = r.filter(f => String(f.vehicle_id) === String(params.vehicle_id))
    if (params.date)       r = r.filter(f => f.date >= params.date)
    return r
  },
  async getById(id) {
    await delay()
    const f = _fuel.find(f => f.id === id)
    if (!f) throw new Error('Fuel record not found')
    return { ...f }
  },
  async create(data) {
    await delay()
    const litres        = Number(data.litres)
    const costPerLitre  = Number(data.cost_per_litre)
    const rec = {
      ...data,
      id:            _nextFuelId++,
      record_number: `FUL-${String(_nextFuelId - 1).padStart(4, '0')}`,
      litres,
      cost_per_litre: costPerLitre,
      total_cost:    +(litres * costPerLitre).toFixed(2),
      odometer:      Number(data.odometer),
    }
    _fuel.unshift(rec)
    return { ...rec }
  },
  async delete(id) {
    await delay()
    const idx = _fuel.findIndex(f => f.id === id)
    if (idx === -1) throw new Error('Fuel record not found')
    _fuel.splice(idx, 1)
  },
}
