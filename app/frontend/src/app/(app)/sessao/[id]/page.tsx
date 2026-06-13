'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Clock, CheckCircle2, Loader2, Save } from 'lucide-react'
import { schedulesApi, type Schedule } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { format, differenceInSeconds } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function SessaoPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { toast } = useToast()

  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [timerStarted, setTimerStarted] = useState(false)

  useEffect(() => {
    schedulesApi.get(id).then(s => {
      setSchedule(s)
      setNotes(s.notes ?? '')
      setLoading(false)
    }).catch(() => router.push('/agenda'))
  }, [id, router])

  useEffect(() => {
    if (!timerStarted) return
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [timerStarted])

  const duration = schedule
    ? Math.round(differenceInSeconds(new Date(schedule.endTime), new Date(schedule.startTime)) / 60)
    : 50

  const elapsedMin = Math.floor(elapsed / 60)
  const elapsedSec = elapsed % 60
  const progressPct = Math.min((elapsed / (duration * 60)) * 100, 100)
  const remaining = Math.max(duration * 60 - elapsed, 0)
  const remainMin = Math.floor(remaining / 60)
  const remainSec = remaining % 60

  async function handleComplete() {
    setSaving(true)
    try {
      await schedulesApi.patch(id, { status: 'completed', notes: notes || undefined })
      toast('Sessão concluída e nota salva.')
      router.push('/agenda')
    } catch {
      toast('Erro ao concluir sessão.', 'error')
      setSaving(false)
    }
  }

  async function handleSaveNote() {
    setSaving(true)
    try {
      await schedulesApi.patch(id, { notes: notes || undefined })
      toast('Nota salva.')
    } catch {
      toast('Erro ao salvar nota.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="text-warm-400 animate-spin" />
      </div>
    )
  }

  if (!schedule) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="flex flex-col gap-6 max-w-lg mx-auto pb-24 md:pb-0"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()}
          className="text-warm-400 hover:text-warm-700 transition-calm p-1 -ml-1">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-display text-warm-900">Em atendimento</h1>
          <p className="text-sm text-warm-500">
            {format(new Date(schedule.startTime), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Cliente */}
      <div className="rounded-xl bg-rose-gradient px-5 py-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/60 flex items-center justify-center shrink-0">
          <span className="text-base font-semibold text-rose-500">
            {schedule.client.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-base font-semibold text-warm-900">{schedule.client.name}</p>
          <p className="text-sm text-warm-500">
            {format(new Date(schedule.startTime), 'HH:mm')} – {format(new Date(schedule.endTime), 'HH:mm')}
            {schedule.price && (
              <span className="ml-2 text-sage-600 font-medium">
                {Number(schedule.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Timer */}
      <div className="rounded-2xl bg-white border border-warm-200 shadow-soft p-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-warm-500">
          <Clock size={16} strokeWidth={1.75} />
          <span className="text-xs font-medium uppercase tracking-wide">Timer da sessão</span>
        </div>

        <div className="text-5xl font-mono font-bold text-warm-900 tabular-nums">
          {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-1000', progressPct >= 100 ? 'bg-amber-400' : 'bg-rose-400')}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <p className="text-xs text-warm-400">
          {progressPct >= 100
            ? 'Tempo da sessão atingido'
            : `${remainMin}m ${String(remainSec).padStart(2, '0')}s restantes`}
        </p>

        {!timerStarted ? (
          <button onClick={() => setTimerStarted(true)}
            className="px-6 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-calm shadow-soft">
            Iniciar timer
          </button>
        ) : (
          <button onClick={() => setTimerStarted(false)}
            className="px-6 py-2.5 rounded-xl bg-warm-100 text-warm-600 text-sm font-medium hover:bg-warm-200 transition-calm">
            Pausar
          </button>
        )}
      </div>

      {/* Notas */}
      <div className="rounded-2xl bg-white border border-warm-200 shadow-soft p-5 flex flex-col gap-3">
        <p className="text-xs font-medium text-warm-500 uppercase tracking-wide">Anotações da sessão</p>
        <textarea
          rows={6}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Registro clínico, observações, temas abordados..."
          className="w-full text-sm text-warm-700 placeholder:text-warm-300 border border-warm-200 rounded-xl px-4 py-3 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100 resize-none leading-relaxed"
        />
        <button onClick={handleSaveNote} disabled={saving}
          className="flex items-center gap-1.5 self-end text-xs text-warm-400 hover:text-warm-600 transition-calm">
          <Save size={13} /> Salvar rascunho
        </button>
      </div>

      {/* Concluir */}
      <button onClick={handleComplete} disabled={saving}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-sage-400 hover:bg-sage-500 text-white font-medium transition-calm shadow-soft">
        {saving ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
        Concluir sessão
      </button>
    </motion.div>
  )
}
