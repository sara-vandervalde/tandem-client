import axios from 'axios'

// The server address comes from an environment variable on Render,
// and falls back to the local API while developing
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5223',
  headers: { 'Content-Type': 'application/json' },
})

export const TOKEN_KEY = 'tandem.token'
export const USER_KEY = 'tandem.user'

// Before every request: attach the JWT, if we have one
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// After every response: a 401 on a protected call means the token expired.
// Clear the session and send the user to the login screen.
api.interceptors.response.use(
  response => response,
  error => {
    const isAuthCall = error.config?.url?.startsWith('/api/auth')
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.assign('/login?expired=1')
    }
    return Promise.reject(error)
  },
)
