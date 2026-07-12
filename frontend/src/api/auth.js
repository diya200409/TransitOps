import { apiClient } from './client'

export async function login(email, password) {
  return apiClient.post('/auth/login', { email, password })
}

export async function signup(email, password, full_name, role = 'driver') {
  return apiClient.post('/auth/signup', { email, password, full_name, role })
}

export async function getMe() {
  return apiClient.get('/auth/me')
}

export async function updateProfile(data) {
  return apiClient.put('/users/me', data)
}

export async function changePassword(current_password, new_password) {
  return apiClient.put('/users/me/password', { current_password, new_password })
}
