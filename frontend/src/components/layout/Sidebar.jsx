import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Truck,
  UserCircle,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { label: 'Dashboard',      icon: LayoutDashboard, to: '/',           active: true  },
  { label: 'Vehicles',       icon: Truck,           to: '/vehicles',   active: true  },
  { label: 'Drivers',        icon: UserCircle,      to: '/drivers',    active: true  },
  { label: 'Trips',          icon: Route,           to: '/trips',      active: true  },
  { label: 'Maintenance',    icon: Wrench,          to: '/maintenance',active: true  },
  { label: 'Fuel & Expenses',icon: Fuel,            to: '/expenses',   active: true  },
  { label: 'Reports',        icon: BarChart3,       to: '/reports',    active: true  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, isFleetManager } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`
        relative flex flex-col h-full bg-gray-900 text-white
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo / App Name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
        <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-lg font-bold tracking-tight">TransitOps</span>
            <p className="text-xs text-gray-400 leading-none mt-0.5">Fleet Operations</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="
          absolute -right-3 top-6 z-10
          flex items-center justify-center
          w-6 h-6 rounded-full
          bg-gray-700 hover:bg-blue-600
          border border-gray-600
          text-white text-xs
          shadow-md
        "
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {NAV_ITEMS.map(({ label, icon: Icon, to, active }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              group relative
              ${isActive
                ? 'bg-blue-600 text-white'
                : active
                  ? 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  : 'text-gray-500 hover:bg-gray-800/50 cursor-not-allowed'
              }
            `}
            onClick={e => !active && e.preventDefault()}
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && (
              <span className="flex-1">{label}</span>
            )}
            {!collapsed && !active && (
              <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                Soon
              </span>
            )}
            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="
                absolute left-full ml-2 px-2 py-1
                bg-gray-800 text-white text-xs rounded
                whitespace-nowrap opacity-0 pointer-events-none
                group-hover:opacity-100
                z-50
              ">
                {label}
                {!active && <span className="ml-1 text-gray-400">(Soon)</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + Logout */}
      <div className="border-t border-gray-700 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize truncate">
                {user?.role?.replace('_', ' ') || 'Guest'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="
            flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
            text-gray-400 hover:bg-red-900/40 hover:text-red-400
          "
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
