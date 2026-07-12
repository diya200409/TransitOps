/**
 * MOCK DATA — Dashboard
 *
 * Used while the FastAPI backend /dashboard/kpis and /dashboard/charts
 * endpoints are not yet available.
 *
 * To switch to the real API, delete this file and update
 * src/hooks/useDashboard.js to call the real API functions
 * from src/api/dashboard.js instead of the mock service below.
 */

function delay(ms = 500) {
  return new Promise(res => setTimeout(res, ms))
}

// ── KPI data ─────────────────────────────────────────────────────────────────
const MOCK_KPIS = {
  active_vehicles:          4,
  available_vehicles:       3,
  vehicles_in_maintenance:  1,
  active_trips:             2,
  pending_trips:            3,
  drivers_on_duty:          2,
  fleet_utilization_percent: 67,
}

// ── Vehicle status distribution ───────────────────────────────────────────────
const MOCK_VEHICLE_STATUS = [
  { status: 'Available', count: 3,  fill: '#22c55e' },
  { status: 'On Trip',   count: 2,  fill: '#3b82f6' },
  { status: 'In Shop',   count: 1,  fill: '#f59e0b' },
  { status: 'Retired',   count: 1,  fill: '#9ca3af' },
]

// ── Driver status distribution ────────────────────────────────────────────────
const MOCK_DRIVER_STATUS = [
  { status: 'Available', count: 3,  fill: '#22c55e' },
  { status: 'On Trip',   count: 2,  fill: '#3b82f6' },
  { status: 'Off Duty',  count: 1,  fill: '#64748b' },
  { status: 'Suspended', count: 1,  fill: '#ef4444' },
]

// ── Fleet utilization (last 7 days) ──────────────────────────────────────────
const MOCK_UTILIZATION_TREND = [
  { day: 'Mon', utilization: 45 },
  { day: 'Tue', utilization: 60 },
  { day: 'Wed', utilization: 55 },
  { day: 'Thu', utilization: 72 },
  { day: 'Fri', utilization: 80 },
  { day: 'Sat', utilization: 67 },
  { day: 'Sun', utilization: 50 },
]

// ── Recent activity ───────────────────────────────────────────────────────────
const MOCK_RECENT_ACTIVITY = [
  {
    id: 1,
    type: 'vehicle_added',
    message: 'Vehicle MH12AB1234 (Tata Prima) was registered',
    time: '2 hours ago',
    color: 'bg-blue-500',
  },
  {
    id: 2,
    type: 'driver_registered',
    message: 'Driver Rajesh Kumar was added to the fleet',
    time: '4 hours ago',
    color: 'bg-green-500',
  },
  {
    id: 3,
    type: 'trip_dispatched',
    message: 'Vehicle MH14CD5678 dispatched on Trip #TRP-0021',
    time: '5 hours ago',
    color: 'bg-indigo-500',
  },
  {
    id: 4,
    type: 'maintenance',
    message: 'Vehicle DL01EF9012 entered maintenance shop',
    time: '7 hours ago',
    color: 'bg-amber-500',
  },
  {
    id: 5,
    type: 'trip_completed',
    message: 'Trip #TRP-0019 completed by Suresh Patil',
    time: '1 day ago',
    color: 'bg-teal-500',
  },
  {
    id: 6,
    type: 'driver_suspended',
    message: 'Driver Priya Nair status updated to Suspended',
    time: '1 day ago',
    color: 'bg-red-500',
  },
]

// ── Filter-aware KPI variants ─────────────────────────────────────────────────
// Simulates how the real backend would return different aggregates
// depending on the type / status / region filters passed.

const KPI_VARIANTS = {
  // By vehicle type
  Truck:   { active_vehicles: 2, available_vehicles: 1, vehicles_in_maintenance: 1, active_trips: 1, pending_trips: 1, drivers_on_duty: 1, fleet_utilization_percent: 50 },
  Van:     { active_vehicles: 2, available_vehicles: 2, vehicles_in_maintenance: 0, active_trips: 1, pending_trips: 1, drivers_on_duty: 1, fleet_utilization_percent: 40 },
  Bike:    { active_vehicles: 1, available_vehicles: 1, vehicles_in_maintenance: 0, active_trips: 0, pending_trips: 1, drivers_on_duty: 0, fleet_utilization_percent: 0  },
  Trailer: { active_vehicles: 1, available_vehicles: 0, vehicles_in_maintenance: 0, active_trips: 1, pending_trips: 0, drivers_on_duty: 1, fleet_utilization_percent: 100 },

  // By status
  Available: { active_vehicles: 3, available_vehicles: 3, vehicles_in_maintenance: 0, active_trips: 0, pending_trips: 2, drivers_on_duty: 0, fleet_utilization_percent: 0  },
  'On Trip': { active_vehicles: 2, available_vehicles: 0, vehicles_in_maintenance: 0, active_trips: 2, pending_trips: 0, drivers_on_duty: 2, fleet_utilization_percent: 100 },
  'In Shop': { active_vehicles: 1, available_vehicles: 0, vehicles_in_maintenance: 1, active_trips: 0, pending_trips: 1, drivers_on_duty: 0, fleet_utilization_percent: 0  },
  Retired:   { active_vehicles: 1, available_vehicles: 0, vehicles_in_maintenance: 0, active_trips: 0, pending_trips: 0, drivers_on_duty: 0, fleet_utilization_percent: 0  },

  // By region
  North:   { active_vehicles: 2, available_vehicles: 1, vehicles_in_maintenance: 1, active_trips: 1, pending_trips: 1, drivers_on_duty: 1, fleet_utilization_percent: 55 },
  South:   { active_vehicles: 1, available_vehicles: 1, vehicles_in_maintenance: 0, active_trips: 1, pending_trips: 0, drivers_on_duty: 1, fleet_utilization_percent: 75 },
  East:    { active_vehicles: 3, available_vehicles: 2, vehicles_in_maintenance: 0, active_trips: 1, pending_trips: 2, drivers_on_duty: 1, fleet_utilization_percent: 45 },
  West:    { active_vehicles: 2, available_vehicles: 1, vehicles_in_maintenance: 1, active_trips: 1, pending_trips: 1, drivers_on_duty: 2, fleet_utilization_percent: 60 },
  Central: { active_vehicles: 4, available_vehicles: 3, vehicles_in_maintenance: 0, active_trips: 2, pending_trips: 1, drivers_on_duty: 2, fleet_utilization_percent: 72 },
}

// Chart variants by region (type/status keep same distribution shape, just different totals)
const CHART_VARIANTS = {
  North:   { vehicle_status: [{ status:'Available',count:1,fill:'#22c55e'},{status:'On Trip',count:1,fill:'#3b82f6'},{status:'In Shop',count:1,fill:'#f59e0b'},{status:'Retired',count:0,fill:'#9ca3af'}], driver_status: [{ status:'Available',count:2,fill:'#22c55e'},{status:'On Trip',count:1,fill:'#3b82f6'},{status:'Off Duty',count:1,fill:'#64748b'},{status:'Suspended',count:0,fill:'#ef4444'}], utilization_trend:[{day:'Mon',utilization:40},{day:'Tue',utilization:55},{day:'Wed',utilization:50},{day:'Thu',utilization:60},{day:'Fri',utilization:55},{day:'Sat',utilization:45},{day:'Sun',utilization:40}] },
  South:   { vehicle_status: [{ status:'Available',count:1,fill:'#22c55e'},{status:'On Trip',count:1,fill:'#3b82f6'},{status:'In Shop',count:0,fill:'#f59e0b'},{status:'Retired',count:0,fill:'#9ca3af'}], driver_status: [{ status:'Available',count:1,fill:'#22c55e'},{status:'On Trip',count:1,fill:'#3b82f6'},{status:'Off Duty',count:0,fill:'#64748b'},{status:'Suspended',count:0,fill:'#ef4444'}], utilization_trend:[{day:'Mon',utilization:65},{day:'Tue',utilization:70},{day:'Wed',utilization:80},{day:'Thu',utilization:75},{day:'Fri',utilization:85},{day:'Sat',utilization:70},{day:'Sun',utilization:60}] },
  East:    { vehicle_status: [{ status:'Available',count:2,fill:'#22c55e'},{status:'On Trip',count:1,fill:'#3b82f6'},{status:'In Shop',count:0,fill:'#f59e0b'},{status:'Retired',count:1,fill:'#9ca3af'}], driver_status: [{ status:'Available',count:2,fill:'#22c55e'},{status:'On Trip',count:1,fill:'#3b82f6'},{status:'Off Duty',count:1,fill:'#64748b'},{status:'Suspended',count:1,fill:'#ef4444'}], utilization_trend:[{day:'Mon',utilization:35},{day:'Tue',utilization:45},{day:'Wed',utilization:40},{day:'Thu',utilization:50},{day:'Fri',utilization:60},{day:'Sat',utilization:45},{day:'Sun',utilization:35}] },
  West:    { vehicle_status: [{ status:'Available',count:1,fill:'#22c55e'},{status:'On Trip',count:1,fill:'#3b82f6'},{status:'In Shop',count:1,fill:'#f59e0b'},{status:'Retired',count:0,fill:'#9ca3af'}], driver_status: [{ status:'Available',count:2,fill:'#22c55e'},{status:'On Trip',count:2,fill:'#3b82f6'},{status:'Off Duty',count:0,fill:'#64748b'},{status:'Suspended',count:0,fill:'#ef4444'}], utilization_trend:[{day:'Mon',utilization:50},{day:'Tue',utilization:55},{day:'Wed',utilization:65},{day:'Thu',utilization:60},{day:'Fri',utilization:70},{day:'Sat',utilization:60},{day:'Sun',utilization:55}] },
  Central: { vehicle_status: [{ status:'Available',count:3,fill:'#22c55e'},{status:'On Trip',count:2,fill:'#3b82f6'},{status:'In Shop',count:0,fill:'#f59e0b'},{status:'Retired',count:0,fill:'#9ca3af'}], driver_status: [{ status:'Available',count:3,fill:'#22c55e'},{status:'On Trip',count:2,fill:'#3b82f6'},{status:'Off Duty',count:0,fill:'#64748b'},{status:'Suspended',count:0,fill:'#ef4444'}], utilization_trend:[{day:'Mon',utilization:55},{day:'Tue',utilization:65},{day:'Wed',utilization:70},{day:'Thu',utilization:75},{day:'Fri',utilization:80},{day:'Sat',utilization:70},{day:'Sun',utilization:60}] },
}

// ── Mock service ──────────────────────────────────────────────────────────────
export const mockDashboardService = {
  async getKPIs(params = {}) {
    await delay()
    // Priority: status filter > type filter > region filter > default
    const variant =
      KPI_VARIANTS[params.status] ||
      KPI_VARIANTS[params.type]   ||
      KPI_VARIANTS[params.region] ||
      MOCK_KPIS
    return { ...variant }
  },

  async getCharts(params = {}) {
    await delay()
    const variant = CHART_VARIANTS[params.region] || {
      vehicle_status:    MOCK_VEHICLE_STATUS,
      driver_status:     MOCK_DRIVER_STATUS,
      utilization_trend: MOCK_UTILIZATION_TREND,
    }
    return { ...variant }
  },

  async getRecentActivity() {
    await delay(300)
    return [...MOCK_RECENT_ACTIVITY]
  },
}
