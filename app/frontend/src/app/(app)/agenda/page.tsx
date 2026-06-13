'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, Calendar, Loader2, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { schedulesApi, type Schedule } from '@/lib/api'
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
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)

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

  async function handleStatusChange(id: string, status: string) {
    await schedulesApi.patch(id, { status })
    load()
  }

  function openCreate() { setEditSchedule(null); setModalOpen(true) }

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
                  return (
                    <div key={s.id} className="flex items-center gap-4 px-4 py-3.5">
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
                        <p className="text-sm font-medium text-warm-900 truncate">{s.client.name}</p>
                        {s.notes && <p className="text-xs text-warm-400 truncate mt-0.5">{s.notes}</p>}
                        {s.price && (
                          <p className="text-xs text-sage-600 mt-0.5">
                            {Number(s.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', cfg.color)}>
                          {cfg.label}
                        </span>
                        {s.status === 'confirmed' && (
                          <button onClick={() => handleStatusChange(s.id, 'completed')}
                            className="text-[11px] text-sage-500 hover:text-sage-700 transition-calm">
                            Concluir →
                          </button>
                        )}
                        {s.status === 'not_confirmed' && (
                          <button onClick={() => handleStatusChange(s.id, 'confirmed')}
                            className="text-[11px] text-amber-500 hover:text-amber-700 transition-calm">
                            Confirmar →
                          </button>
                        )}
                      </div>
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
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  )
}
