/**
 * MOCK DATA — Reports & Analytics
 * Swap by setting USE_MOCK = false in useReports.js
 * and pointing to src/api/reports.js endpoints.
 */

function delay(ms = 500) { return new Promise(r => setTimeout(r, ms)) }

// ── Report KPIs ───────────────────────────────────────────────────────────
const MOCK_REPORT_KPIS = {
  fleet_utilization:    67,
  total_trips:          7,
  total_fuel_cost:      41052,
  total_operational_cost: 93002,
  avg_cost_per_trip:    13286,
  best_vehicle:         'Tata Prima 4028.S',
}

// ── Fleet Performance ─────────────────────────────────────────────────────
const MOCK_FLEET_PERFORMANCE = [
  { vehicle: 'Tata Prima',    trips: 2, utilization: 80, cost: 23841 },
  { vehicle: 'Leyland Dost',  trips: 2, utilization: 60, cost: 5553  },
  { vehicle: 'Eicher Pro',    trips: 2, utilization: 70, cost: 18232 },
  { vehicle: 'Hero Splendor', trips: 1, utilization: 40, cost: 677   },
]

// ── Fuel trend (7 days) ───────────────────────────────────────────────────
const MOCK_FUEL_TREND = [
  { date: 'Jul 3',  cost: 5720,  litres: 55 },
  { date: 'Jul 5',  cost: 11385, litres: 110 },
  { date: 'Jul 8',  cost: 4703,  litres: 45 },
  { date: 'Jul 9',  cost: 12456, litres: 120 },
  { date: 'Jul 10', cost: 6789,  litres: 64.5 },
]

// ── Fuel by vehicle ───────────────────────────────────────────────────────
const MOCK_FUEL_BY_VEHICLE = [
  { vehicle: 'Tata Prima',    cost: 23841, litres: 230, fill: '#3b82f6' },
  { vehicle: 'Eicher Pro',    cost: 12032, litres: 115, fill: '#6366f1' },
  { vehicle: 'Leyland Dost',  cost: 4703,  litres: 45,  fill: '#22c55e' },
  { vehicle: 'Hero Splendor', cost: 477,   litres: 4.5, fill: '#f59e0b' },
]

// ── Expense categories ────────────────────────────────────────────────────
const MOCK_EXPENSE_CATEGORIES = [
  { category: 'Toll',      amount: 2050,  fill: '#3b82f6' },
  { category: 'Permit',    amount: 12000, fill: '#6366f1' },
  { category: 'Insurance', amount: 28000, fill: '#22c55e' },
  { category: 'Repair',    amount: 6500,  fill: '#f59e0b' },
  { category: 'Parking',   amount: 200,   fill: '#9ca3af' },
  { category: 'Other',     amount: 3200,  fill: '#ec4899' },
]

// ── Monthly expense trend ─────────────────────────────────────────────────
const MOCK_MONTHLY_EXPENSES = [
  { month: 'Feb', amount: 38000 },
  { month: 'Mar', amount: 45000 },
  { month: 'Apr', amount: 41000 },
  { month: 'May', amount: 52000 },
  { month: 'Jun', amount: 48000 },
  { month: 'Jul', amount: 51950 },
]

// ── Driver performance ────────────────────────────────────────────────────
const MOCK_DRIVER_PERFORMANCE = [
  { rank: 1, driver: 'Vikram Desai',  trips: 1, safety_score: 97, on_time_rate: 100, rating: 'Excellent' },
  { rank: 2, driver: 'Rajesh Kumar',  trips: 2, safety_score: 92, on_time_rate: 95,  rating: 'Excellent' },
  { rank: 3, driver: 'Meena Sharma',  trips: 1, safety_score: 88, on_time_rate: 100, rating: 'Good'      },
  { rank: 4, driver: 'Suresh Patil',  trips: 2, safety_score: 74, on_time_rate: 80,  rating: 'Fair'      },
  { rank: 5, driver: 'Arjun Singh',   trips: 1, safety_score: 55, on_time_rate: 75,  rating: 'Poor'      },
]

// ── Operational insights ──────────────────────────────────────────────────
const MOCK_INSIGHTS = [
  { id: 1, type: 'positive', icon: 'TrendingUp',   text: 'Fleet utilization improved 8% vs last month' },
  { id: 2, type: 'warning',  icon: 'AlertTriangle', text: 'Fuel costs up 12% — Tata Prima is highest consumer' },
  { id: 3, type: 'info',     icon: 'Star',          text: 'Vikram Desai has the highest safety score (97)' },
  { id: 4, type: 'warning',  icon: 'Wrench',        text: 'Eicher Pro 2095 has 1 overdue maintenance service' },
  { id: 5, type: 'positive', icon: 'CheckCircle',   text: '2 trips completed on time this week' },
]

export const mockReportService = {
  async getAll(params = {}) {
    await delay()
    return {
      kpis:               { ...MOCK_REPORT_KPIS },
      fleet_performance:  [...MOCK_FLEET_PERFORMANCE],
      fuel_trend:         [...MOCK_FUEL_TREND],
      fuel_by_vehicle:    [...MOCK_FUEL_BY_VEHICLE],
      expense_categories: [...MOCK_EXPENSE_CATEGORIES],
      monthly_expenses:   [...MOCK_MONTHLY_EXPENSES],
      driver_performance: [...MOCK_DRIVER_PERFORMANCE],
      insights:           [...MOCK_INSIGHTS],
    }
  },
}
