'use client'

import { useState, useEffect } from 'react'
import { X, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { protocolsApi, type Protocol } from '@/lib/api'
import { useToast } from '@/lib/toast'

interface Props {
  open: boolean
  protocol: Protocol | null
  onClose: () => void
  onSaved: () => void
}

export function ProtocolModal({ open, protocol, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalSessions, setTotalSessions] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(protocol?.name ?? '')
      setDescription(protocol?.description ?? '')
      setTotalSessions(protocol?.totalSessions ? String(protocol.totalSessions) : '')
    }
  }, [open, protocol])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || undefined,
        totalSessions: totalSessions ? parseInt(totalSessions) : 0,
      }
      if (protocol) {
        await protocolsApi.update(protocol.id, data)
        toast('Protocolo atualizado.')
      } else {
        await protocolsApi.create(data)
        toast('Protocolo criado.')
      }
      onSaved()
      onClose()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-warm-100">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-warm-500" />
            <h2 className="text-sm font-semibold text-warm-900">
              {protocol ? 'Editar protocolo' : 'Novo protocolo'}
            </h2>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-warm-700 mb-1.5">Nome *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Terapia cognitivo-comportamental"
              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-700 mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Objetivos, metodologia, indicações..."
              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-700 mb-1.5">
              Número de sessões previstas
            </label>
            <input
              type="number"
              min="0"
              value={totalSessions}
              onChange={e => setTotalSessions(e.target.value)}
              placeholder="Ex: 12"
              className="w-full px-3 py-2 rounded-lg border border-warm-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100"
            />
            <p className="text-[11px] text-warm-400 mt-1">Deixe em branco ou 0 se não houver limite definido.</p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={saving || !name.trim()}>
              {saving ? 'Salvando...' : protocol ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
