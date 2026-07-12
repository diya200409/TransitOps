import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Menu, Bell, LogOut, ChevronDown, UserCog } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const BREADCRUMBS = {
  '/':            'Dashboard',
  '/vehicles':    'Vehicles',
  '/drivers':     'Drivers',
  '/trips':       'Trips',
  '/maintenance': 'Maintenance',
  '/expenses':    'Fuel & Expenses',
  '/reports':     'Reports',
  '/profile':     'My Profile',
}

export default function TopBar({ onMenuClick }) {
  const { user, logout, isFleetManager } = useAuth()
  const location = useLocation()
  const navigate  = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const pageTitle = BREADCRUMBS[location.pathname] || 'TransitOps'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Left: hamburger (mobile) + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger — visible on mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{pageTitle}</h1>
          <p className="text-xs text-gray-400 hidden sm:block">
            TransitOps &rsaquo; {pageTitle}
          </p>
        </div>
      </div>

      {/* Right: notifications + user */}
      <div className="flex items-center gap-2">
        {/* Notification bell — placeholder */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(o => !o)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-none">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">
                {user?.role?.replace('_', ' ') || 'Guest'}
              </p>
            </div>
            <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                {isFleetManager && (
                  <div className="px-3 py-1.5">
                    <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Fleet Manager
                    </span>
                  </div>
                )}
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <UserCog size={14} />
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
