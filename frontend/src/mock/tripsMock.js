/**
 * MOCK DATA — trips
 * Replace by setting USE_MOCK = false in useTrips.js and
 * pointing to src/api/trips.js (GET/POST/PUT/DELETE /trips)
 */

let _trips = [
  { id: 1, trip_number: 'TRP-0001', vehicle_id: 2, vehicle_name: 'Ashok Leyland Dost', vehicle_reg: 'MH14CD5678', driver_id: 2, driver_name: 'Suresh Patil', origin: 'Mumbai', destination: 'Pune', scheduled_date: '2026-07-10T09:00', cargo_weight: 1200, notes: 'Handle with care', status: 'In Progress' },
  { id: 2, trip_number: 'TRP-0002', vehicle_id: 1, vehicle_name: 'Tata Prima 4028.S',   vehicle_reg: 'MH12AB1234', driver_id: 1, driver_name: 'Rajesh Kumar',  origin: 'Delhi',  destination: 'Agra',  scheduled_date: '2026-07-12T08:00', cargo_weight: 18000, notes: '',              status: 'Pending'     },
  { id: 3, trip_number: 'TRP-0003', vehicle_id: 4, vehicle_name: 'Eicher Pro 2095',     vehicle_reg: 'KA03GH3456', driver_id: 3, driver_name: 'Meena Sharma',  origin: 'Bengaluru', destination: 'Chennai', scheduled_date: '2026-07-11T07:30', cargo_weight: 7500, notes: 'Fragile goods', status: 'Dispatched'  },
  { id: 4, trip_number: 'TRP-0004', vehicle_id: 6, vehicle_name: 'Hero Splendor Pro',   vehicle_reg: 'GJ05KL2345', driver_id: 6, driver_name: 'Vikram Desai',  origin: 'Surat',  destination: 'Vadodara', scheduled_date: '2026-07-09T10:00', cargo_weight: 120, notes: '',             status: 'Completed'   },
  { id: 5, trip_number: 'TRP-0005', vehicle_id: 1, vehicle_name: 'Tata Prima 4028.S',   vehicle_reg: 'MH12AB1234', driver_id: 1, driver_name: 'Rajesh Kumar',  origin: 'Mumbai', destination: 'Nashik', scheduled_date: '2026-07-08T06:00', cargo_weight: 22000, notes: '',              status: 'Completed'   },
  { id: 6, trip_number: 'TRP-0006', vehicle_id: 4, vehicle_name: 'Eicher Pro 2095',     vehicle_reg: 'KA03GH3456', driver_id: 4, driver_name: 'Arjun Singh',   origin: 'Hyderabad', destination: 'Vijayawada', scheduled_date: '2026-07-13T11:00', cargo_weight: 5000, notes: 'Scheduled',  status: 'Pending'     },
  { id: 7, trip_number: 'TRP-0007', vehicle_id: 2, vehicle_name: 'Ashok Leyland Dost',  vehicle_reg: 'MH14CD5678', driver_id: 2, driver_name: 'Suresh Patil',  origin: 'Pune',   destination: 'Kolhapur', scheduled_date: '2026-07-07T08:00', cargo_weight: 1400, notes: '',              status: 'Cancelled'   },
]

let _nextId = 8

function delay(ms = 400) { return new Promise(r => setTimeout(r, ms)) }

export const mockTripService = {
  async getAll(params = {}) {
    await delay()
    let r = [..._trips]
    if (params.search) {
      const q = params.search.toLowerCase()
      r = r.filter(t =>
        t.trip_number.toLowerCase().includes(q) ||
        t.vehicle_name.toLowerCase().includes(q) ||
        t.driver_name.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q)
      )
    }
    if (params.status) r = r.filter(t => t.status === params.status)
    if (params.date)   r = r.filter(t => t.scheduled_date?.startsWith(params.date))
    return r
  },
  async getById(id) {
    await delay()
    const t = _trips.find(t => t.id === id)
    if (!t) throw new Error('Trip not found')
    return { ...t }
  },
  async create(data) {
    await delay()
    const newTrip = {
      ...data,
      id: _nextId++,
      trip_number: `TRP-${String(_nextId - 1).padStart(4, '0')}`,
      status: 'Pending',
      cargo_weight: Number(data.cargo_weight),
    }
    _trips.unshift(newTrip)
    return { ...newTrip }
  },
  async update(id, data) {
    await delay()
    const idx = _trips.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('Trip not found')
    _trips[idx] = { ..._trips[idx], ...data, id }
    return { ..._trips[idx] }
  },
  async dispatch(id) {
    await delay()
    const idx = _trips.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('Trip not found')
    _trips[idx].status = 'Dispatched'
    return { ..._trips[idx] }
  },
  async cancel(id) {
    await delay()
    const idx = _trips.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('Trip not found')
    _trips[idx].status = 'Cancelled'
    return { ..._trips[idx] }
  },
  async delete(id) {
    await delay()
    const idx = _trips.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('Trip not found')
    _trips.splice(idx, 1)
  },
}
