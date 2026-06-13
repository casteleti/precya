'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { clinicApi, type Clinic } from '@/lib/api'
import { useToast } from '@/lib/toast'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: (clinic: Clinic) => void
}

export function ClinicModal({ open, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!open) return
    setFetching(true)
    clinicApi.get()
      .then(c => { setName(c.name); setPhone(c.phone) })
      .finally(() => setFetching(false))
  }, [open])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const clinic = await clinicApi.update({ name, phone })
      toast('Clínica atualizada.')
      onSaved(clinic)
      onClose()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erro ao salvar.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-warm-900">Dados da clínica</h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={18} />
          </button>
        </div>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="text-warm-400 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-warm-700">Nome da clínica *</label>
              <Input value={name} onChange={e => setName(e.target.value)} required minLength={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-warm-700">Telefone *</label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} required minLength={8} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
