'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { clientsApi, type Client } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  client: Client | null
  onClose: () => void
  onSaved: () => void
}

const statusOptions = [
  { value: 'ativo',   label: 'Ativo' },
  { value: 'risco',   label: 'Risco' },
  { value: 'inativo', label: 'Inativo' },
]

export function ClientModal({ open, client, onClose, onSaved }: Props) {
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [birth, setBirth]     = useState('')
  const [status, setStatus]   = useState('ativo')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (client) {
      setName(client.name)
      setPhone(client.phone)
      setBirth(client.birthDate ? client.birthDate.slice(0, 10) : '')
      setStatus(client.status)
    } else {
      setName(''); setPhone(''); setBirth(''); setStatus('ativo')
    }
    setError('')
  }, [client, open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !phone.trim()) { setError('Nome e telefone são obrigatórios.'); return }
    setLoading(true)
    try {
      if (client) {
        await clientsApi.update(client.id, { name: name.trim(), phone: phone.trim(), birthDate: birth || undefined, status: status as 'ativo' | 'risco' | 'inativo' })
      } else {
        await clientsApi.create({ name: name.trim(), phone: phone.trim(), birthDate: birth || undefined, status: status as 'ativo' | 'risco' | 'inativo' })
      }
      onSaved()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-warm-900">
            {client ? 'Editar cliente' : 'Novo cliente'}
          </h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Nome *</label>
            <Input placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Telefone / WhatsApp *</label>
            <Input placeholder="(11) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Data de nascimento</label>
            <Input type="date" value={birth} onChange={e => setBirth(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Status</label>
            <div className="flex gap-2">
              {statusOptions.map(opt => (
                <button key={opt.value} type="button" onClick={() => setStatus(opt.value)}
                  className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-calm',
                    status === opt.value
                      ? 'bg-rose-100 text-rose-600 border-rose-200'
                      : 'bg-white text-warm-500 border-warm-200 hover:bg-warm-50')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : client ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
