import { getToken, clearAuth } from './auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5003/api'
const BASE = API_URL.replace('/api', '')

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()

  const res = await fetch(`${BASE}${path}`, {
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

  if (res.status === 204) return undefined as T

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? `Erro ${res.status}`)
  }

  return res.json() as Promise<T>
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Não foi possível entrar. Verifique seus dados.')
  return body as { token: string; user: import('./auth').AuthUser }
}

export async function apiRegister(data: {
  clinicName: string; clinicPhone: string; name: string; email: string; password: string
}) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Erro ao criar conta.')
  return body as { token: string; user: import('./auth').AuthUser }
}

export const authApi = {
  updateProfile: (data: { name?: string; email?: string }) =>
    apiFetch<import('./auth').AuthUser>('/auth/me', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch<{ ok: boolean }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  phone: string
  status: 'ativo' | 'risco' | 'inativo'
  birthDate: string | null
  lastSessionDate: string | null
  sessionCount: number
  lifetimeValue: string
  createdAt: string
  notes: string | null
}

export interface Schedule {
  id: string
  clientId: string
  client: { id: string; name: string; phone: string; status: string }
  startTime: string
  endTime: string
  status: 'not_confirmed' | 'confirmed' | 'completed' | 'cancelled'
  price: string | null
  notes: string | null
  confirmToken: string | null
  createdAt: string
}

export interface DashboardData {
  todaySchedules: number
  activeClients: number
  monthRevenue: number
  returnRate: number
  upcomingSchedules: Schedule[]
  monthlyRevenue: { month: string; total: number }[]
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clientsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<{ clients: Client[]; total: number }>(`/api/clients${qs}`)
  },
  get: (id: string) => apiFetch<Client & { schedules: Schedule[] }>(`/api/clients/${id}`),
  create: (data: { name: string; phone: string; birthDate?: string; status?: string }) =>
    apiFetch<Client>('/api/clients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Client>) =>
    apiFetch<Client>(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/clients/${id}`, { method: 'DELETE' }),
  autoStatus: () => apiFetch<{ toRisk: number; toInactive: number; total: number }>('/api/clients/auto-status', { method: 'POST' }),
}

// ─── Schedules ───────────────────────────────────────────────────────────────

export const schedulesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiFetch<Schedule[]>(`/api/schedules${qs}`)
  },
  get: (id: string) => apiFetch<Schedule>(`/api/schedules/${id}`),
  create: (data: {
    clientId: string; startTime: string; endTime: string;
    price?: number; notes?: string; protocolId?: string
  }) => apiFetch<Schedule>('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
  patch: (id: string, data: Partial<{ status: string; notes: string; price: number; startTime: string; endTime: string }>) =>
    apiFetch<Schedule>(`/api/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/schedules/${id}`, { method: 'DELETE' }),
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () => apiFetch<DashboardData>('/api/dashboard'),
}

// ─── Clinic ──────────────────────────────────────────────────────────────────

export type Clinic = { id: string; name: string; phone: string }

export const clinicApi = {
  get: () => apiFetch<Clinic>('/api/clinic'),
  update: (data: { name?: string; phone?: string }) =>
    apiFetch<Clinic>('/api/clinic', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ─── Anamnesis ────────────────────────────────────────────────────────────────

export type AnamnesisResponse = {
  id: string
  clientId: string
  responses: Record<string, string>
  createdAt: string
  updatedAt: string
} | null

export const anamnesisApi = {
  get: (clientId: string) =>
    apiFetch<AnamnesisResponse>(`/api/clients/${clientId}/anamnesis`),
  save: (clientId: string, responses: Record<string, string>) =>
    apiFetch<AnamnesisResponse>(`/api/clients/${clientId}/anamnesis`, {
      method: 'POST',
      body: JSON.stringify({ responses }),
    }),
}

// ─── Protocols ────────────────────────────────────────────────────────────────

export interface Protocol {
  id: string
  name: string
  description: string | null
  totalSessions: number
  successCount: number
  successRate: string
  avgRating: string
  createdAt: string
}

export const protocolsApi = {
  list: () => apiFetch<Protocol[]>('/api/protocols'),
  get: (id: string) => apiFetch<Protocol>(`/api/protocols/${id}`),
  create: (data: { name: string; description?: string; totalSessions?: number }) =>
    apiFetch<Protocol>('/api/protocols', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; description?: string; totalSessions?: number }) =>
    apiFetch<Protocol>(`/api/protocols/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/protocols/${id}`, { method: 'DELETE' }),
  sessions: (id: string) => apiFetch<import('./api').Schedule[]>(`/api/protocols/${id}/sessions`),
}
