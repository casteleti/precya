'use client'

import { useState } from 'react'
import { X, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api'
import { useToast } from '@/lib/toast'

interface Props {
  open: boolean
  onClose: () => void
}

export function ChangePasswordModal({ open, onClose }: Props) {
  const { toast } = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setCurrent(''); setNext(''); setConfirm(''); setError('')
  }

  function handleClose() { reset(); onClose() }

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!current) { setError('Informe a senha atual.'); return }
    if (next.length < 6) { setError('A nova senha deve ter pelo menos 6 caracteres.'); return }
    if (next !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    try {
      await authApi.changePassword(current, next)
      toast('Senha alterada com sucesso.')
      reset()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar senha.'
      setError(msg)
      toast(msg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-warm-900">Alterar senha</h2>
          <button onClick={handleClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Senha atual *</label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                placeholder="Senha atual"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Nova senha *</label>
            <div className="relative">
              <Input
                type={showNext ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={next}
                onChange={e => setNext(e.target.value)}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowNext(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600">
                {showNext ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Confirmar nova senha *</label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Alterar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
