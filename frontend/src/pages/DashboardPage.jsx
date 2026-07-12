import {
  Truck, Users, Wrench, Route, Clock, UserCheck, Activity
} from 'lucide-react'
import KPICard from '../components/common/KPICard'

/**
 * Dashboard page — Phase 1 skeleton.
 * KPI cards are shown with placeholder values.
 * Real data integration (useDashboardKPIs hook) comes in Phase 4.
 */
const PLACEHOLDER_KPIS = [
  { label: 'Active Vehicles',          icon: Truck,      value: '—', accent: 'bg-blue-500'   },
  { label: 'Available Vehicles',       icon: Truck,      value: '—', accent: 'bg-green-500'  },
  { label: 'Vehicles in Maintenance',  icon: Wrench,     value: '—', accent: 'bg-amber-500'  },
  { label: 'Active Trips',             icon: Route,      value: '—', accent: 'bg-indigo-500' },
  { label: 'Pending Trips',            icon: Clock,      value: '—', accent: 'bg-purple-500' },
  { label: 'Drivers On Duty',          icon: UserCheck,  value: '—', accent: 'bg-teal-500'   },
  { label: 'Fleet Utilization',        icon: Activity,   value: '—', accent: 'bg-rose-500'   },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Fleet Overview</h2>
        <p className="text-sm text-gray-400 mt-0.5">Real-time snapshot of your transport operations</p>
      </div>

      {/* KPI Cards — 4 cols desktop, 2 tablet, 1 mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLACEHOLDER_KPIS.map(kpi => (
          <KPICard
            key={kpi.label}
            icon={kpi.icon}
            label={kpi.label}
            value={kpi.value}
            accent={kpi.accent}
          />
        ))}
      </div>

      {/* Charts placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <Activity size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Fleet Utilization Chart</p>
            <p className="text-xs">Will be wired in Phase 4</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <Truck size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Vehicle Status Distribution</p>
            <p className="text-xs">Will be wired in Phase 4</p>
          </div>
        </div>
      </div>
    </div>
  )
}
