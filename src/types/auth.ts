// Mirrors the server DTOs in Tandem.Core/DTOs/Auth

export type AuthResponse = {
  token: string
  expiresAt: string
  userId: number
  fullName: string
  email: string
  role: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  fullName: string
  email: string
  password: string
  address?: string
}

// What the client keeps about the signed-in user
export type CurrentUser = {
  id: number
  fullName: string
  email: string
  role: string
}
