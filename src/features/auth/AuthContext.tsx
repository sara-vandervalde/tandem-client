import { createContext, useContext, useState, type ReactNode } from 'react'
import { TOKEN_KEY, USER_KEY } from '../../api/client'
import * as authApi from '../../api/auth'
import type { CurrentUser, LoginRequest, RegisterRequest } from '../../types/auth'

type AuthContextValue = {
  user: CurrentUser | null
  isAdmin: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// On page refresh the state is rebuilt from localStorage, so the user stays signed in
function readStoredUser(): CurrentUser | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw || !localStorage.getItem(TOKEN_KEY)) return null
  try {
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(readStoredUser)

  async function login(request: LoginRequest) {
    const response = await authApi.login(request)
    const current: CurrentUser = {
      id: response.userId,
      fullName: response.fullName,
      email: response.email,
      role: response.role,
    }
    localStorage.setItem(TOKEN_KEY, response.token)
    localStorage.setItem(USER_KEY, JSON.stringify(current))
    setUser(current)
  }

  // Register, then sign in right away with the same details
  async function register(request: RegisterRequest) {
    await authApi.register(request)
    await login({ email: request.email, password: request.password })
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'Admin', login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
