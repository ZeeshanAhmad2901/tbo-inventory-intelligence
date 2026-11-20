import { apiRequest } from '../../lib/api-client'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'viewer'
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  user: AuthUser
  csrf_token: string
}

export interface MessageResponse {
  message: string
}

export interface RegisterPayload {
  email: string
  full_name: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  })
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export async function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me')
}

export async function logout(): Promise<void> {
  await apiRequest<MessageResponse>('/auth/logout', { method: 'POST' })
}

export async function requestPasswordReset(email: string): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  })
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/auth/reset-password', {
    method: 'POST',
    body: { token, new_password: newPassword },
  })
}

