/**
 * Centralized API client.
 * Base URL is read from the environment variable VITE_API_BASE_URL.
 * Falls back to localhost:8000/api for local development.
 *
 * All requests automatically attach the Bearer token from localStorage.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

function getToken() {
  return localStorage.getItem('transit_ops_token')
}

async function request(method, path, body = null) {
  const headers = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config = {
    method,
    headers,
  }

  if (body) {
    config.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, config)

  if (!response.ok) {
    // Try to extract a detail message from FastAPI's error format
    let errorMessage = `HTTP ${response.status}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage)
  }

  // 204 No Content
  if (response.status === 204) return null

  return response.json()
}

export const apiClient = {
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  delete: (path)         => request('DELETE', path),
}
