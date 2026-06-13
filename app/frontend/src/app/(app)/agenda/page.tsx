'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Calendar, Loader2, Clock, Edit2, X, CheckCircle2, Ban, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { schedulesApi, type Schedule } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScheduleModal } from '@/components/schedules/ScheduleModal'

const statusConfig: Record<string, { label: string; color: string }> = {
  not_confirmed: { label: 'A confirmar', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  confirmed:     { label: 'Confirmado',  color: 'bg-sage-50 text-sage-600 border-sage-200' },
  completed:     { label: 'Concluído',   color: 'bg-warm-100 text-warm-500 border-warm-200' },
  cancelled:     { label: 'Cancelado',   color: 'bg-red-50 text-red-400 border-red-200' },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } }

export default function AgendaPage() {
  const { toast } = useToast()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [noteId, setNoteId] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const from = weekStart.toISOString()
      const to = addDays(weekStart, 7).toISOString()
      const data = await schedulesApi.list({ from, to })
      setSchedules(data)
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { load() }, [load])

  const daySchedules = schedules.filter(s => isSameDay(parseISO(s.startTime), selectedDay))

  function whatsappUrl(phone: string, name: string) {
    const clean = phone.replace(/\D/g, '')
    const full = clean.startsWith('55') ? clean : `55${clean}`
    const msg = encodeURIComponent(`Olá ${name.split(' ')[0]}, tudo bem? Passando para confirmar nossa sessão. 😊`)
    return `https://wa.me/${full}?text=${msg}`
  }

  async function handleSaveNote(id: string) {
    try {
      await schedulesApi.patch(id, { notes: noteText })
      toast('Nota salva.')
    } catch {
      toast('Erro ao salvar nota.', 'error')
    }
    setNoteId(null)
    setNoteText('')
    load()
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      await schedulesApi.patch(id, { status })
      const labels: Record<string, string> = { confirmed: 'Sessão confirmada.', completed: 'Sessão concluída.', cancelled: 'Sessão cancelada.' }
      toast(labels[status] ?? 'Status atualizado.')
    } catch {
      toast('Erro ao atualizar status.', 'error')
    }
    setActionId(null)
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este agendamento?')) return
    try {
      await schedulesApi.delete(id)
      toast('Agendamento removido.')
      load()
    } catch {
      toast('Erro ao remover.', 'error')
    }
  }

  function openCreate() { setEditSchedule(null); setModalOpen(true) }
  function openEdit(s: Schedule) { setEditSchedule(s); setModalOpen(true); setActionId(null) }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show"
        className="flex flex-col gap-6 pb-24 md:pb-0">

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-warm-900">Agenda</h1>
            <p className="text-sm text-warm-500 mt-1">
              {format(weekStart, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Agendar
          </Button>
        </motion.div>

        {/* Week nav */}
        <motion.div variants={item}>
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
              className="p-2 rounded-lg bg-white border border-warm-200 text-warm-500 hover:bg-warm-50 transition-calm">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-warm-700 flex-1 text-center">
              {format(weekStart, "dd 'de' MMM", { locale: ptBR })} – {format(addDays(weekStart, 6), "dd 'de' MMM", { locale: ptBR })}
            </span>
            <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
              className="p-2 rounded-lg bg-white border border-warm-200 text-warm-500 hover:bg-warm-50 transition-calm">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day pills */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map(day => {
              const dayCount = schedules.filter(s => isSameDay(parseISO(s.startTime), day)).length
              const isSelected = isSameDay(day, selectedDay)
              const isToday = isSameDay(day, new Date())
              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                  className={cn('flex flex-col items-center py-2 px-1 rounded-xl transition-calm',
                    isSelected ? 'bg-rose-500 text-white' : isToday ? 'bg-rose-50 text-rose-500' : 'bg-white text-warm-600 hover:bg-warm-50')}>
                  <span className="text-[10px] font-medium uppercase">
                    {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                  </span>
                  <span className="text-sm font-bold">{format(day, 'd')}</span>
                  {dayCount > 0 && (
                    <span className={cn('w-1.5 h-1.5 rounded-full mt-0.5', isSelected ? 'bg-white/60' : 'bg-rose-400')} />
                  )}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Day schedule */}
        <motion.div variants={item}>
          <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">
            {format(selectedDay, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="text-warm-400 animate-spin" />
            </div>
          ) : daySchedules.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                <Clock size={22} className="text-warm-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-warm-700">Nenhum agendamento neste dia</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                Criar agendamento
              </Button>
            </Card>
          ) : (
            <Card className="divide-y divide-warm-100">
              {daySchedules
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map(s => {
                  const cfg = statusConfig[s.status] ?? statusConfig.not_confirmed
                  const isActive = actionId === s.id
                  const isDone = s.status === 'completed' || s.status === 'cancelled'
                  return (
                    <div key={s.id}>
                      <div className="flex items-center gap-4 px-4 py-3.5">
                        <div className="flex flex-col items-center w-14 shrink-0">
                          <span className="text-sm font-bold text-warm-900">
                            {format(parseISO(s.startTime), 'HH:mm')}
                          </span>
                          <span className="text-[10px] text-warm-400">
                            {format(parseISO(s.endTime), 'HH:mm')}
                          </span>
                        </div>
                        <div className="w-0.5 h-10 bg-warm-100 rounded-full shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium truncate', isDone ? 'text-warm-400 line-through' : 'text-warm-900')}>{s.client.name}</p>
                          {s.notes && <p className="text-xs text-warm-400 truncate mt-0.5">{s.notes}</p>}
                          {s.price && (
                            <p className="text-xs text-sage-600 mt-0.5">
                              {Number(s.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', cfg.color)}>
                            {cfg.label}
                          </span>
                          <button
                            onClick={() => setActionId(isActive ? null : s.id)}
                            className={cn('p-1 rounded-lg transition-calm', isActive ? 'bg-warm-100 text-warm-700' : 'text-warm-300 hover:text-warm-600')}
                          >
                            {isActive ? <X size={15} /> : <Edit2 size={14} />}
                          </button>
                        </div>
                      </div>
                      {isActive && (
                        <div className="px-4 pb-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={() => openEdit(s)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warm-100 text-warm-700 text-xs font-medium hover:bg-warm-200 transition-calm">
                              <Edit2 size={12} /> Editar
                            </button>
                            <a href={whatsappUrl(s.client.phone, s.client.name)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-medium hover:bg-green-100 transition-calm">
                              <MessageCircle size={12} /> WhatsApp
                            </a>
                            {s.status === 'not_confirmed' && (
                              <button onClick={() => handleStatusChange(s.id, 'confirmed')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-calm">
                                <CheckCircle2 size={12} /> Confirmar
                              </button>
                            )}
                            {(s.status === 'not_confirmed' || s.status === 'confirmed') && (
                              <button onClick={() => { handleStatusChange(s.id, 'completed'); setNoteId(s.id); setNoteText(s.notes ?? '') }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sage-50 text-sage-600 text-xs font-medium hover:bg-sage-100 transition-calm">
                                <CheckCircle2 size={12} /> Concluir
                              </button>
                            )}
                            {s.status !== 'cancelled' && (
                              <button onClick={() => handleStatusChange(s.id, 'cancelled')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-400 text-xs font-medium hover:bg-red-100 transition-calm">
                                <Ban size={12} /> Cancelar
                              </button>
                            )}
                            <button onClick={() => handleDelete(s.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-medium hover:bg-red-100 transition-calm ml-auto">
                              <X size={12} /> Remover
                            </button>
                          </div>
                          {/* Nota inline */}
                          {noteId === s.id && (
                            <div className="flex gap-2 mt-1">
                              <input
                                autoFocus
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="Anotações da sessão..."
                                className="flex-1 text-xs px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100"
                              />
                              <button onClick={() => handleSaveNote(s.id)}
                                className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-calm">
                                Salvar
                              </button>
                              <button onClick={() => { setNoteId(null); setNoteText('') }}
                                className="px-3 py-1.5 rounded-lg bg-warm-100 text-warm-500 text-xs hover:bg-warm-200 transition-calm">
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
            </Card>
          )}
        </motion.div>
      </motion.div>

      <ScheduleModal
        open={modalOpen}
        schedule={editSchedule}
        defaultDate={selectedDay}
        onClose={() => { setModalOpen(false); setActionId(null) }}
        onSaved={() => { load(); setActionId(null) }}
      />
    </>
  )
}
