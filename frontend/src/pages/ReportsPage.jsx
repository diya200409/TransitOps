import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useReports, REPORT_TYPES } from '../hooks/useReports'
import { useToast } from '../components/common/Toast'
import KPICard from '../components/common/KPICard'
import FilterBar from '../components/common/FilterBar'
import DataTable from '../components/common/DataTable'
import SearchBar from '../components/common/SearchBar'
import { formatCurrency } from '../utils/formatters'

const REPORT_FILTERS = [
  { key: 'report_type', label: 'Report Type', options: REPORT_TYPES },
]

const VEHICLE_OPTIONS = [
  { value: '1', label: 'MH12AB1234 – Tata Prima 4028.S' },
  { value: '2', label: 'MH14CD5678 – Ashok Leyland Dost' },
  { value: '3', label: 'DL01EF9012 – Mahindra Supro' },
  { value: '4', label: 'KA03GH3456 – Eicher Pro 2095' },
  { value: '5', label: 'TN07IJ7890 – Force Traveller 3700' },
  { value: '6', label: 'GJ05KL2345 – Hero Splendor Pro' },
]

const VEHICLE_FILTER = [{ key: 'vehicle_id', label: 'Vehicles', options: VEHICLE_OPTIONS.map(v => ({ value: v.value, label: v.label })) }]

const KPI_CONFIG = [
  { label: 'Fleet Utilization', key: 'fleet_utilization', accent: 'bg-blue-600' },
  { label: 'Total Trips', key: 'total_trips', accent: 'bg-sky-500' },
  { label: 'Fuel Cost', key: 'total_fuel_cost', accent: 'bg-emerald-500' },
  { label: 'Operational Cost', key: 'total_operational_cost', accent: 'bg-amber-500' },
  { label: 'Avg Cost / Trip', key: 'avg_cost_per_trip', accent: 'bg-violet-500' },
  { label: 'Best Vehicle', key: 'best_vehicle', accent: 'bg-indigo-500' },
]

function TooltipBox({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs shadow-xl">
      {payload.map(entry => (
        <div key={entry.dataKey} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.name}: </span>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const { data, loading, error, filters, setFilters, refresh } = useReports()
  const toast = useToast()
  const [search, setSearch] = useState('')

  function handleFilterChange(key, value) {
    setFilters(f => ({ ...f, [key]: value }))
  }

  const insights = data?.insights ?? []
  const reportType = filters.report_type

  const driverColumns = [
    { key: 'rank', header: 'Rank', sortable: true },
    { key: 'driver', header: 'Driver' },
    { key: 'trips', header: 'Trips', sortable: true },
    { key: 'safety_score', header: 'Safety Score', sortable: true },
    { key: 'on_time_rate', header: 'On-time %', render: value => `${value}%`, sortable: true },
    { key: 'rating', header: 'Rating' },
  ]

  const filteredInsights = insights.filter(insight =>
    search ? insight.text.toLowerCase().includes(search.trim().toLowerCase()) : true
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Reports & Analytics</h2>
          <p className="text-sm text-gray-400 mt-0.5">Track fleet performance, fuel behavior, and operational spend in one place.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            refresh()
            toast({ type: 'info', message: 'Refreshing report data…' })
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          Refresh Reports
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <FilterBar filters={REPORT_FILTERS} values={filters} onChange={handleFilterChange} />
        <FilterBar filters={VEHICLE_FILTER} values={filters} onChange={handleFilterChange} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {KPI_CONFIG.map(({ label, key, accent }) => (
          <KPICard
            key={key}
            icon={null}
            label={label}
            value={loading ? null : data?.kpis?.[key] ?? '—'}
            accent={accent}
            loading={loading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Fuel Spend Trend</p>
              <p className="text-xs text-gray-400">Last 7 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.fuel_trend ?? []} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Legend verticalAlign="top" height={24} />
                <Line dataKey="cost" name="Cost" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line dataKey="litres" name="Litres" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">Expense Categories</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.expense_categories ?? []}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  paddingAngle={4}
                >
                  {(data?.expense_categories ?? []).map((entry, index) => (
                    <Cell key={entry.category} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipBox />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Fuel by Vehicle</p>
              <p className="text-xs text-gray-400">Total spend by vehicle</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.fuel_by_vehicle ?? []} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="vehicle" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={value => formatCurrency(value)} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Bar dataKey="cost" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Monthly Expense Trend</p>
              <p className="text-xs text-gray-400">Recent spend pattern</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthly_expenses ?? []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={value => formatCurrency(value)} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipBox />} />
                <Line dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Driver Performance</p>
              <p className="text-xs text-gray-400">Top performing drivers</p>
            </div>
          </div>
          <DataTable
            columns={driverColumns}
            rows={data?.driver_performance ?? []}
            loading={loading}
            error={error}
            empty={{ title: 'No driver data', description: 'Driver performance will appear here once report data is available.' }}
            onRetry={refresh}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">Operational Insights</p>
              <p className="text-xs text-gray-400">Actionable observations</p>
            </div>
          </div>
          <div className="space-y-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search insights…"
            />
            {loading ? (
              <div className="space-y-3 py-8">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredInsights.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">No insights match your search.</div>
            ) : (
              filteredInsights.map(insight => (
                <div key={insight.id} className="rounded-2xl border border-gray-100 p-4 bg-slate-50">
                  <p className="text-sm text-gray-700">{insight.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
