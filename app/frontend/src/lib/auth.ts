'use client'

const TOKEN_KEY = 'precya_token'
const USER_KEY  = 'precya_user'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  clinicId: string
}

export function saveAuth(token: string, user: AuthUser) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  // Cookie para o middleware de proteção de rotas
  document.cookie = `precya_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function clearAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  document.cookie = 'precya_token=; path=/; max-age=0'
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
