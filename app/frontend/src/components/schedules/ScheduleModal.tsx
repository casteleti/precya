'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { schedulesApi, clientsApi, type Schedule, type Client } from '@/lib/api'
import { format } from 'date-fns'

interface Props {
  open: boolean
  schedule: Schedule | null
  defaultDate?: Date
  onClose: () => void
  onSaved: () => void
}

export function ScheduleModal({ open, schedule, defaultDate, onClose, onSaved }: Props) {
  const [clientSearch, setClientSearch] = useState('')
  const [clientOptions, setClientOptions] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (schedule) {
      setDate(schedule.startTime.slice(0, 10))
      setStartTime(schedule.startTime.slice(11, 16))
      setEndTime(schedule.endTime.slice(11, 16))
      setPrice(schedule.price ? String(Number(schedule.price)) : '')
      setNotes(schedule.notes ?? '')
    } else {
      setDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))
      setStartTime('09:00'); setEndTime('10:00'); setPrice(''); setNotes('')
    }
    setSelectedClient(null); setClientSearch(''); setError('')
  }, [open, schedule, defaultDate])

  useEffect(() => {
    if (!clientSearch.trim()) { setClientOptions([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await clientsApi.list({ search: clientSearch, limit: '8' })
      setClientOptions(res.clients)
      setSearching(false)
    }, 300)
    return () => clearTimeout(t)
  }, [clientSearch])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!selectedClient && !schedule) { setError('Selecione um cliente.'); return }
    if (!date) { setError('Selecione uma data.'); return }

    const startISO = `${date}T${startTime}:00`
    const endISO   = `${date}T${endTime}:00`

    if (new Date(endISO) <= new Date(startISO)) {
      setError('O horário de término deve ser após o início.')
      return
    }

    setLoading(true)
    try {
      if (schedule) {
        await schedulesApi.patch(schedule.id, {
          startTime: startISO, endTime: endISO,
          price: price ? Number(price) : undefined,
          notes: notes || undefined,
        })
      } else {
        await schedulesApi.create({
          clientId: selectedClient!.id,
          startTime: startISO, endTime: endISO,
          price: price ? Number(price) : undefined,
          notes: notes || undefined,
        })
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-warm-900">
            {schedule ? 'Editar agendamento' : 'Novo agendamento'}
          </h2>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Client search */}
          {!schedule && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-warm-700">Cliente *</label>
              {selectedClient ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">
                  <span className="text-sm text-warm-900 flex-1">{selectedClient.name}</span>
                  <button type="button" onClick={() => setSelectedClient(null)}
                    className="text-warm-400 hover:text-warm-600"><X size={14} /></button>
                </div>
              ) : (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
                  <Input className="pl-8" placeholder="Buscar cliente..."
                    value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                  {clientOptions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-warm-200 shadow-lg z-10 max-h-40 overflow-y-auto">
                      {clientOptions.map(c => (
                        <button key={c.id} type="button"
                          className="w-full text-left px-3 py-2 text-sm text-warm-900 hover:bg-warm-50 transition-calm"
                          onClick={() => { setSelectedClient(c); setClientSearch(''); setClientOptions([]) }}>
                          {c.name} <span className="text-warm-400 text-xs">· {c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searching && (
                    <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 animate-spin" />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Data *</label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-warm-700">Início</label>
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-warm-700">Término</label>
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Valor (R$)</label>
            <Input type="number" placeholder="0,00" min="0" step="0.01"
              value={price} onChange={e => setPrice(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-warm-700">Observações</label>
            <Input placeholder="Anotações sobre a sessão..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : schedule ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
