import { api } from './client'
import type { AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'

export async function login(request: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', request)
  return data
}

export async function register(request: RegisterRequest): Promise<void> {
  await api.post('/api/auth/register', request)
}
