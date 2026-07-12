/**
 * MOCK DATA — vehicles
 *
 * Used while the FastAPI backend is not yet available.
 * To switch to the real API, delete this file and update
 * src/hooks/useVehicles.js to call the real API functions
 * from src/api/vehicles.js instead of the mock service below.
 */

let _vehicles = [
  {
    id: 1,
    registration_number: 'MH12AB1234',
    name: 'Tata Prima 4028.S',
    type: 'Truck',
    max_load_capacity: 25000,
    odometer: 48200,
    acquisition_cost: 3200000,
    status: 'Available',
  },
  {
    id: 2,
    registration_number: 'MH14CD5678',
    name: 'Ashok Leyland Dost',
    type: 'Van',
    max_load_capacity: 1500,
    odometer: 21300,
    acquisition_cost: 850000,
    status: 'On Trip',
  },
  {
    id: 3,
    registration_number: 'DL01EF9012',
    name: 'Mahindra Supro',
    type: 'Van',
    max_load_capacity: 900,
    odometer: 8700,
    acquisition_cost: 620000,
    status: 'In Shop',
  },
  {
    id: 4,
    registration_number: 'KA03GH3456',
    name: 'Eicher Pro 2095',
    type: 'Truck',
    max_load_capacity: 9000,
    odometer: 135000,
    acquisition_cost: 1750000,
    status: 'Available',
  },
  {
    id: 5,
    registration_number: 'TN07IJ7890',
    name: 'Force Traveller 3700',
    type: 'Trailer',
    max_load_capacity: 40000,
    odometer: 210000,
    acquisition_cost: 5500000,
    status: 'Retired',
  },
  {
    id: 6,
    registration_number: 'GJ05KL2345',
    name: 'Hero Splendor Pro',
    type: 'Bike',
    max_load_capacity: 150,
    odometer: 32100,
    acquisition_cost: 75000,
    status: 'Available',
  },
]

let _nextId = 7

/** Simulate network delay */
function delay(ms = 400) {
  return new Promise(res => setTimeout(res, ms))
}

export const mockVehicleService = {
  async getAll(params = {}) {
    await delay()
    let results = [..._vehicles]

    if (params.search) {
      const q = params.search.toLowerCase()
      results = results.filter(
        v =>
          v.registration_number.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q)
      )
    }
    if (params.type)   results = results.filter(v => v.type === params.type)
    if (params.status) results = results.filter(v => v.status === params.status)

    return results
  },

  async getById(id) {
    await delay()
    const v = _vehicles.find(v => v.id === id)
    if (!v) throw new Error('Vehicle not found')
    return { ...v }
  },

  async create(data) {
    await delay()
    // Simulate uniqueness check
    if (_vehicles.find(v => v.registration_number === data.registration_number)) {
      throw new Error('Registration number already exists')
    }
    const newVehicle = {
      ...data,
      id: _nextId++,
      status: 'Available',
      max_load_capacity: Number(data.max_load_capacity),
      odometer: Number(data.odometer),
      acquisition_cost: Number(data.acquisition_cost),
    }
    _vehicles.push(newVehicle)
    return { ...newVehicle }
  },

  async update(id, data) {
    await delay()
    const idx = _vehicles.findIndex(v => v.id === id)
    if (idx === -1) throw new Error('Vehicle not found')
    _vehicles[idx] = {
      ..._vehicles[idx],
      ...data,
      id,
      max_load_capacity: Number(data.max_load_capacity),
      odometer: Number(data.odometer),
      acquisition_cost: Number(data.acquisition_cost),
    }
    return { ..._vehicles[idx] }
  },

  async delete(id) {
    await delay()
    const idx = _vehicles.findIndex(v => v.id === id)
    if (idx === -1) throw new Error('Vehicle not found')
    _vehicles.splice(idx, 1)
    return null
  },
}
