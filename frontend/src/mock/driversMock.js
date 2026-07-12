/**
 * MOCK DATA — drivers
 *
 * Used while the FastAPI backend is not yet available.
 * To switch to the real API, delete this file and update
 * src/hooks/useDrivers.js to call the real API functions
 * from src/api/drivers.js instead of the mock service below.
 */

let _drivers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    license_number: 'DL0120110012345',
    license_category: 'HMV',
    license_expiry_date: '2026-03-15',
    contact_number: '9876543210',
    safety_score: 92,
    status: 'Available',
  },
  {
    id: 2,
    name: 'Suresh Patil',
    license_number: 'MH1420090067890',
    license_category: 'HMV',
    license_expiry_date: '2025-01-10',   // expired
    contact_number: '9823456781',
    safety_score: 74,
    status: 'On Trip',
  },
  {
    id: 3,
    name: 'Meena Sharma',
    license_number: 'KA0320150023456',
    license_category: 'LMV',
    license_expiry_date: '2026-07-28',   // expiring within 30 days (relative to demo date)
    contact_number: '9912345670',
    safety_score: 88,
    status: 'Available',
  },
  {
    id: 4,
    name: 'Arjun Singh',
    license_number: 'UP3220180034567',
    license_category: 'Commercial',
    license_expiry_date: '2027-11-05',
    contact_number: '9765432109',
    safety_score: 55,
    status: 'Off Duty',
  },
  {
    id: 5,
    name: 'Priya Nair',
    license_number: 'TN0720170045678',
    license_category: 'LMV',
    license_expiry_date: '2024-08-20',   // expired
    contact_number: '9654321098',
    safety_score: 40,
    status: 'Suspended',
  },
  {
    id: 6,
    name: 'Vikram Desai',
    license_number: 'GJ0520160056789',
    license_category: 'HMV',
    license_expiry_date: '2028-04-30',
    contact_number: '9543210987',
    safety_score: 97,
    status: 'Available',
  },
]

let _nextId = 7

function delay(ms = 400) {
  return new Promise(res => setTimeout(res, ms))
}

export const mockDriverService = {
  async getAll(params = {}) {
    await delay()
    let results = [..._drivers]

    if (params.search) {
      const q = params.search.toLowerCase()
      results = results.filter(
        d =>
          d.name.toLowerCase().includes(q) ||
          d.license_number.toLowerCase().includes(q)
      )
    }
    if (params.status)           results = results.filter(d => d.status === params.status)
    if (params.license_category) results = results.filter(d => d.license_category === params.license_category)

    return results
  },

  async getById(id) {
    await delay()
    const d = _drivers.find(d => d.id === id)
    if (!d) throw new Error('Driver not found')
    return { ...d }
  },

  async create(data) {
    await delay()
    if (_drivers.find(d => d.license_number === data.license_number)) {
      throw new Error('License number already exists')
    }
    const newDriver = {
      ...data,
      id: _nextId++,
      status: 'Available',
      safety_score: Number(data.safety_score),
    }
    _drivers.push(newDriver)
    return { ...newDriver }
  },

  async update(id, data) {
    await delay()
    const idx = _drivers.findIndex(d => d.id === id)
    if (idx === -1) throw new Error('Driver not found')
    _drivers[idx] = {
      ..._drivers[idx],
      ...data,
      id,
      safety_score: Number(data.safety_score),
    }
    return { ..._drivers[idx] }
  },

  async delete(id) {
    await delay()
    const idx = _drivers.findIndex(d => d.id === id)
    if (idx === -1) throw new Error('Driver not found')
    _drivers.splice(idx, 1)
    return null
  },
}
