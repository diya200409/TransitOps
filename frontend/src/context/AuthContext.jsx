import { createContext, useContext, useState, useEffect } from 'react'
import { login as loginApi } from '../api/auth'

const AuthContext = createContext(null)

const TOKEN_KEY = 'transit_ops_token'
const USER_KEY  = 'transit_ops_user'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // { id, name, email, role }
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)   // hydrating from localStorage

  // Hydrate session from localStorage on first load
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser  = localStorage.getItem(USER_KEY)
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
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
