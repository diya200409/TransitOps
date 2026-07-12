/**
 * MOCK DATA — maintenance
 * Replace by setting USE_MOCK = false in useMaintenance.js and
 * pointing to src/api/maintenance.js (GET/POST/PUT/DELETE /maintenance)
 */

let _records = [
  { id: 1, record_number: 'MNT-0001', vehicle_id: 3, vehicle_name: 'Mahindra Supro',     vehicle_reg: 'DL01EF9012', service_type: 'Brake Service',      description: 'Front brake pads replacement',   scheduled_date: '2026-07-05', completion_date: null,         estimated_cost: 8500,  actual_cost: null,  status: 'In Progress' },
  { id: 2, record_number: 'MNT-0002', vehicle_id: 1, vehicle_name: 'Tata Prima 4028.S',  vehicle_reg: 'MH12AB1234', service_type: 'Oil Change',          description: 'Full synthetic oil change 15W40', scheduled_date: '2026-07-15', completion_date: null,         estimated_cost: 3200,  actual_cost: null,  status: 'Scheduled'   },
  { id: 3, record_number: 'MNT-0003', vehicle_id: 4, vehicle_name: 'Eicher Pro 2095',    vehicle_reg: 'KA03GH3456', service_type: 'Tyre Rotation',       description: 'All 6 tyres rotation and balance', scheduled_date: '2026-06-20', completion_date: null,        estimated_cost: 2000,  actual_cost: null,  status: 'Overdue'     },
  { id: 4, record_number: 'MNT-0004', vehicle_id: 6, vehicle_name: 'Hero Splendor Pro',  vehicle_reg: 'GJ05KL2345', service_type: 'General Service',     description: '10,000 km service',               scheduled_date: '2026-06-28', completion_date: '2026-06-29', estimated_cost: 1500,  actual_cost: 1650,  status: 'Completed'   },
  { id: 5, record_number: 'MNT-0005', vehicle_id: 2, vehicle_name: 'Ashok Leyland Dost', vehicle_reg: 'MH14CD5678', service_type: 'Battery Replacement', description: 'Battery weak — replacement needed', scheduled_date: '2026-07-20', completion_date: null,        estimated_cost: 4500,  actual_cost: null,  status: 'Scheduled'   },
  { id: 6, record_number: 'MNT-0006', vehicle_id: 5, vehicle_name: 'Force Traveller 3700',vehicle_reg:'TN07IJ7890', service_type: 'Engine Overhaul',     description: 'Major overhaul before decommission',scheduled_date: '2026-06-01', completion_date: '2026-06-15', estimated_cost: 85000, actual_cost: 92000, status: 'Completed'   },
]

let _nextId = 7

function delay(ms = 400) { return new Promise(r => setTimeout(r, ms)) }

export const mockMaintenanceService = {
  async getAll(params = {}) {
    await delay()
    let r = [..._records]
    if (params.search) {
      const q = params.search.toLowerCase()
      r = r.filter(m =>
        m.record_number.toLowerCase().includes(q) ||
        m.vehicle_name.toLowerCase().includes(q) ||
        m.service_type.toLowerCase().includes(q)
      )
    }
    if (params.status)       r = r.filter(m => m.status === params.status)
    if (params.service_type) r = r.filter(m => m.service_type === params.service_type)
    return r
  },
  async getById(id) {
    await delay()
    const m = _records.find(m => m.id === id)
    if (!m) throw new Error('Record not found')
    return { ...m }
  },
  async create(data) {
    await delay()
    const rec = {
      ...data,
      id: _nextId++,
      record_number: `MNT-${String(_nextId - 1).padStart(4, '0')}`,
      status: 'Scheduled',
      completion_date: null,
      actual_cost: null,
      estimated_cost: Number(data.estimated_cost),
    }
    _records.unshift(rec)
    return { ...rec }
  },
  async update(id, data) {
    await delay()
    const idx = _records.findIndex(m => m.id === id)
    if (idx === -1) throw new Error('Record not found')
    _records[idx] = { ..._records[idx], ...data, id }
    return { ..._records[idx] }
  },
  async delete(id) {
    await delay()
    const idx = _records.findIndex(m => m.id === id)
    if (idx === -1) throw new Error('Record not found')
    _records.splice(idx, 1)
  },
}
