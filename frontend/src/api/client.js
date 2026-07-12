/**
 * Centralized API client.
 * Base URL: http://localhost:8000 (no /api prefix — backend routes directly at root)
 * Token storage key: 'access_token' (matches backend demo credentials guide)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = { method, headers }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, config)

  if (!response.ok) {
    // Handle 401 Unauthorized — clear token and redirect to login
    if (response.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('transit_ops_user')
      // Only redirect if not already on login/signup page
      if (!window.location.pathname.match(/^\/(login|signup)$/)) {
        window.location.href = '/login'
      }
      throw new Error('Session expired. Please log in again.')
    }

    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      // FastAPI returns { detail: string } or { detail: [{msg, loc}] } for 422
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail
      } else if (Array.isArray(errorData.detail)) {
        // 422 validation errors — extract first message
        errorMessage = errorData.detail.map(e => e.msg || e.message).join('; ')
      } else {
        errorMessage = errorData.message || errorMessage
      }
    } catch {
      // ignore parse error, use HTTP status as message
    }
    throw new Error(errorMessage)
  }

  if (response.status === 204) return null

  return response.json()
}

export const apiClient = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  delete: (path)       => request('DELETE', path),
}
