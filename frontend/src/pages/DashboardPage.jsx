import {
  Truck, Wrench, Route, Clock, UserCheck, Activity, RefreshCw
} from 'lucide-react'
import KPICard          from '../components/common/KPICard'
import FilterBar        from '../components/common/FilterBar'
import StatusDonutChart from '../components/dashboard/StatusDonutChart'
import UtilizationChart from '../components/dashboard/UtilizationChart'
import RecentActivity   from '../components/dashboard/RecentActivity'
import { useDashboard } from '../hooks/useDashboard'

const VEHICLE_TYPES    = ['Truck', 'Van', 'Bike', 'Trailer']
const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired']
const REGIONS          = ['North', 'South', 'East', 'West', 'Central']

const FILTER_CONFIG = [
  { key: 'type',   label: 'Vehicle Types', options: VEHICLE_TYPES    },
  { key: 'status', label: 'Statuses',      options: VEHICLE_STATUSES },
  { key: 'region', label: 'Regions',       options: REGIONS          },
]

export default function DashboardPage() {
  const { kpis, charts, activity, loading, error, filters, setFilters, refresh } = useDashboard()

  function handleFilterChange(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
  }

  const hasActiveFilter = filters.type || filters.status || filters.region

  // ── Error state ──────────────────────────────────────────────────────────
  if (error && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <Activity size={20} className="text-red-500" />
        </div>
        <p className="text-sm text-gray-600 font-medium">{error}</p>
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    )
  }

  const util        = kpis.fleet_utilization_percent
  const utilDisplay = util != null ? `${util}%` : '—'

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Fleet Overview</h2>
          <p className="text-xs text-gray-400 mt-0.5">Live snapshot of your transport operations</p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterBar filters={FILTER_CONFIG} values={filters} onChange={handleFilterChange} />
        {hasActiveFilter && (
          <button
            onClick={() => setFilters({ type: '', status: '', region: '' })}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* ── KPI Grid: 4 cols desktop, 2 tablet, 2 mobile ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard icon={Truck}     label="Active Vehicles"        value={loading ? null : (kpis.active_vehicles          != null ? kpis.active_vehicles          : '—')} accent="bg-blue-500"   loading={loading} />
        <KPICard icon={Truck}     label="Available Vehicles"     value={loading ? null : (kpis.available_vehicles       != null ? kpis.available_vehicles       : '—')} accent="bg-green-500"  loading={loading} />
        <KPICard icon={Wrench}    label="In Maintenance"         value={loading ? null : (kpis.vehicles_in_maintenance  != null ? kpis.vehicles_in_maintenance  : '—')} accent="bg-amber-500"  loading={loading} />
        <KPICard icon={Route}     label="Active Trips"           value={loading ? null : (kpis.active_trips             != null ? kpis.active_trips             : '—')} accent="bg-indigo-500" loading={loading} />
        <KPICard icon={Clock}     label="Pending Trips"          value={loading ? null : (kpis.pending_trips            != null ? kpis.pending_trips            : '—')} accent="bg-purple-500" loading={loading} />
        <KPICard icon={UserCheck} label="Drivers On Duty"        value={loading ? null : (kpis.drivers_on_duty          != null ? kpis.drivers_on_duty          : '—')} accent="bg-teal-500"   loading={loading} />
        <KPICard icon={Activity}  label="Fleet Utilization"      value={loading ? null : utilDisplay}                                                                    accent="bg-rose-500"   loading={loading} />
      </div>

      {/* ── Charts: donut pair + utilization + activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* Vehicle + Driver donuts stacked in col 1 */}
        <div className="flex flex-col gap-3">
          <StatusDonutChart
            title="Vehicle Status"
            data={loading || !charts ? [] : charts.vehicle_status}
          />
          <StatusDonutChart
            title="Driver Status"
            data={loading || !charts ? [] : charts.driver_status}
          />
        </div>

        {/* Utilization bar chart col 2 */}
        <div className="lg:col-span-1">
          <UtilizationChart
            data={loading || !charts ? [] : charts.utilization_trend}
          />
        </div>

        {/* Recent activity col 3 */}
        <div className="lg:col-span-1">
          <RecentActivity activity={activity} loading={loading} />
        </div>

      </div>
    </div>
  )
}
