import { apiClient } from './client'

export async function login(email, password) {
  return apiClient.post('/auth/login', { email, password })
}
