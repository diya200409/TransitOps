import {
  Truck, UserCircle, Route, Wrench, CheckCircle, ShieldOff, Activity
} from 'lucide-react'

// Map activity type → icon + bg color
const TYPE_META = {
  vehicle_added:     { Icon: Truck,        bg: 'bg-blue-100',   icon: 'text-blue-600'   },
  driver_registered: { Icon: UserCircle,   bg: 'bg-green-100',  icon: 'text-green-600'  },
  trip_dispatched:   { Icon: Route,        bg: 'bg-indigo-100', icon: 'text-indigo-600' },
  maintenance:       { Icon: Wrench,       bg: 'bg-amber-100',  icon: 'text-amber-600'  },
  trip_completed:    { Icon: CheckCircle,  bg: 'bg-teal-100',   icon: 'text-teal-600'   },
  driver_suspended:  { Icon: ShieldOff,    bg: 'bg-red-100',    icon: 'text-red-600'    },
}

const DEFAULT_META = { Icon: Activity, bg: 'bg-gray-100', icon: 'text-gray-500' }

/**
 * Compact recent activity feed.
 * Props:
 *   activity – [{ id, type, message, time, color }]
 *   loading  – bool
 */
export default function RecentActivity({ activity = [], loading = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Recent Activity</p>
        <span className="text-xs text-gray-400">{activity.length} events</span>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3 flex-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-4/5" />
                <div className="h-2.5 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-gray-400">No recent activity</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {activity.map((item) => {
            const { Icon, bg, icon } = TYPE_META[item.type] || DEFAULT_META
            return (
              <div
                key={item.id}
                className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0"
              >
                {/* Icon badge */}
                <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon size={13} className={icon} />
                </div>
                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-700 leading-snug font-medium">
                    {item.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
