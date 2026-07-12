import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/common/Toast'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import VehiclesPage from './pages/VehiclesPage'
import DriversPage from './pages/DriversPage'
import TripsPage from './pages/TripsPage'
import MaintenancePage from './pages/MaintenancePage'
import FuelExpensesPage from './pages/FuelExpensesPage'
import ReportsPage from './pages/ReportsPage'
import ProfilePage from './pages/ProfilePage'
import LoadingSpinner from './components/common/LoadingSpinner'

/**
 * Route guard — redirects to /login if user is not authenticated.
 * Shows a spinner while the auth state is being hydrated from localStorage.
 */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" center />
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected — wrapped in AppLayout (sidebar + topbar) */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="vehicles"    element={<VehiclesPage />} />
        <Route path="drivers"     element={<DriversPage />} />
        <Route path="trips"       element={<TripsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="expenses"    element={<FuelExpensesPage />} />
        <Route path="reports"     element={<ReportsPage />} />
        <Route path="profile"     element={<ProfilePage />} />
      </Route>

      {/* Fallback — redirect unknown paths to dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
