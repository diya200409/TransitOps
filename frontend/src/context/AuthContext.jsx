import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi, signup as signupApi, updateProfile as updateProfileApi, changePassword as changePasswordApi } from '../api/auth'

const AuthContext = createContext(null)

// Keys must match client.js — 'access_token' is what client.js reads
const TOKEN_KEY = 'access_token'
const USER_KEY  = 'transit_ops_user'

// ─── Mock login bypass ───────────────────────────────────────────────────────
// Set USE_MOCK_LOGIN = true while backend is unavailable.
// Set USE_MOCK_LOGIN = false to use the real FastAPI backend.
// Demo credentials: fleetmanager@transitops.com / password123
const USE_MOCK_LOGIN = false

const MOCK_USER = {
  id:    1,
  name:  'Diya Umale',
  email: 'diyaumale9@gmail.com',
  role:  'fleet_manager',
}
const MOCK_TOKEN = 'mock-token-dev'
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalize a backend user object to the frontend shape.
 * Backend returns { full_name, ... } — frontend expects { name, ... }.
 */
function normalizeUser(apiUser) {
  return {
    id:        apiUser.id,
    email:     apiUser.email,
    name:      apiUser.full_name ?? apiUser.name ?? 'User',  // full_name → name
    role:      apiUser.role,
    is_active: apiUser.is_active,
    driver_id: apiUser.driver_id ?? null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Hydrate session from localStorage on first load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser  = localStorage.getItem(USER_KEY)
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsed)
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    // ── Mock bypass ──────────────────────────────────────────────────────────────────────
    if (USE_MOCK_LOGIN) {
      localStorage.setItem(TOKEN_KEY, MOCK_TOKEN)
      localStorage.setItem(USER_KEY, JSON.stringify({ ...MOCK_USER, email }))
      setToken(MOCK_TOKEN)
      setUser({ ...MOCK_USER, email })
      return
    }

    // ── Real FastAPI call ────────────────────────────────────────────────────────────────────
    // Response shape: { access_token, token_type, user: { id, email, full_name, role, ... } }
    const data        = await loginApi(email, password)
    const normalized  = normalizeUser(data.user)

    localStorage.setItem(TOKEN_KEY, data.access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(normalized))
    setToken(data.access_token)
    setUser(normalized)
    return data
  }

  async function signup(email, password, full_name, role = 'driver') {
    // Signup creates the user and then auto-logs them in by calling login
    await signupApi(email, password, full_name, role)
    await login(email, password)
  }

  async function updateProfile(data) {
    const updated = await updateProfileApi(data)
    const normalized = normalizeUser(updated)
    localStorage.setItem(USER_KEY, JSON.stringify(normalized))
    setUser(normalized)
    return normalized
  }

  async function changePassword(current_password, new_password) {
    return changePasswordApi(current_password, new_password)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  const isFleetManager = user?.role === 'fleet_manager'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, signup, updateProfile, changePassword, isFleetManager }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
