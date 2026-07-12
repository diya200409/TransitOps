import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi } from '../api/auth'

const AuthContext = createContext(null)

const TOKEN_KEY = 'transit_ops_token'
const USER_KEY  = 'transit_ops_user'

// ─── Mock login bypass ───────────────────────────────────────────────────────
// Set to true while backend is unavailable.
// Any email + password will log in as a fleet_manager.
// Flip to false once the FastAPI backend is running.
const USE_MOCK_LOGIN = true

const MOCK_USER = {
  id:    1,
  name:  'Diya Umale',
  email: 'diyaumale9@gmail.com',
  role:  'fleet_manager',
}
const MOCK_TOKEN = 'mock-token-dev'
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // { id, name, email, role }
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)   // hydrating from localStorage

  // Hydrate session from localStorage on first load
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser  = localStorage.getItem(USER_KEY)
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser)
        // If mock mode is on, always enforce fleet_manager role
        // so stale localStorage can't break the UI
        if (USE_MOCK_LOGIN) parsed.role = 'fleet_manager'
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
    // ── Mock bypass (remove when backend is ready) ──
    if (USE_MOCK_LOGIN) {
      localStorage.setItem(TOKEN_KEY, MOCK_TOKEN)
      localStorage.setItem(USER_KEY, JSON.stringify({ ...MOCK_USER, email }))
      setToken(MOCK_TOKEN)
      setUser({ ...MOCK_USER, email })
      return
    }
    // ── Real API call ──
    const data = await loginApi(email, password)
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
    return data
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  /** Convenience: true if logged-in user is a Fleet Manager (full CRUD access) */
  const isFleetManager = user?.role === 'fleet_manager'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isFleetManager }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
