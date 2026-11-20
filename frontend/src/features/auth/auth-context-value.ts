import { createContext, useContext } from 'react'
import type { AuthUser } from './auth-api'

export interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (payload: { email: string; password: string }) => Promise<void>
  register: (payload: { email: string; full_name: string; password: string }) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
