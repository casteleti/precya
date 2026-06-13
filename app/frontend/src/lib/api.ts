import { getToken, clearAuth } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5003/api'

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()

  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...init,
  })

  if (res.status === 401) {
    clearAuth()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Sessão expirada')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_URL.replace('/api', '')}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = await res.json()

  if (!res.ok) {
    throw new Error(body.error ?? 'Não foi possível entrar. Verifique seus dados.')
  }

  return body as { token: string; user: import('./auth').AuthUser }
}
