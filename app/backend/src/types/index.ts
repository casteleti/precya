export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

export type UserRole = 'owner' | 'therapist' | 'receptionist'
export type ClientStatus = 'ativo' | 'risco' | 'inativo'
export type ScheduleStatus = 'not_confirmed' | 'confirmed' | 'completed' | 'cancelled'
