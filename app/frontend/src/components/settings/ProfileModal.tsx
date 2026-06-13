'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api'
import { getUser, saveAuth, getToken, type AuthUser } from '@/lib/auth'
import { useToast } from '@/lib/toast'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (user: AuthUser) => void
}

export function ProfileModal({ open, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const user = getUser()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && user) {
      setName(user.name)
      setEmail(user.email)
      setError('')
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim()) { setError('Nome e e-mail são obrigatórios.'); return }
    setLoading(true)
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), email: email.trim() })
      const token = getToken() ?? ''
      saveAuth(token, updated)
      toast('Perfil atualizado.')
      onSaved(updated)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar.'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-warm-900">Editar perfil</h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Nome *</label>
            <Input placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">E-mail *</label>
            <Input type="email" placeholder="voce@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
