'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Calendar, CheckCircle, Loader2, Printer, Target, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { schedulesApi, type Schedule } from '@/lib/api'
import { cn } from '@/lib/utils'
import { format, startOfMonth, endOfMonth, subMonths, getDate, getDaysInMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } }

function fmtCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const GOAL_KEY = 'precya_monthly_goal'

export default function FinanceiroPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [goal, setGoal] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return Number(localStorage.getItem(GOAL_KEY) ?? 0)
  })
  const [editingGoal, setEditingGoal] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  useEffect(() => {
    setLoading(true)
    const from = startOfMonth(selectedMonth).toISOString()
    const to   = endOfMonth(selectedMonth).toISOString()
    schedulesApi.list({ from, to, status: 'completed' })
      .then(setSchedules)
      .finally(() => setLoading(false))
  }, [selectedMonth])

  function saveGoal() {
    const v = Number(goalInput.replace(',', '.'))
    if (!isNaN(v) && v >= 0) {
      setGoal(v)
      localStorage.setItem(GOAL_KEY, String(v))
    }
    setEditingGoal(false)
  }

  const totalRevenue = schedules.reduce((sum, s) => sum + Number(s.price ?? 0), 0)
  const sessionCount = schedules.length
  const avgPerSession = sessionCount > 0 ? totalRevenue / sessionCount : 0

  // Group by client
  const byClient = schedules.reduce<Record<string, { name: string; count: number; total: number }>>(
    (acc, s) => {
      const id = s.client.id
      if (!acc[id]) acc[id] = { name: s.client.name, count: 0, total: 0 }
      acc[id].count++
      acc[id].total += Number(s.price ?? 0)
      return acc
    }, {}
  )
  const topClients = Object.values(byClient).sort((a, b) => b.total - a.total).slice(0, 5)

  const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))

  // Build daily revenue data for bar chart
  const daysInMonth = getDaysInMonth(selectedMonth)
  const dailyRevenue = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const total = schedules
      .filter(s => getDate(new Date(s.startTime)) === day)
      .reduce((sum, s) => sum + Number(s.price ?? 0), 0)
    return { day, total }
  })
  const maxDaily = Math.max(...dailyRevenue.map(d => d.total), 1)

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="flex flex-col gap-6 pb-24 md:pb-0">

      {/* Header */}
      <motion.div variants={item} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-display text-warm-900">Financeiro</h1>
          <p className="text-sm text-warm-500 mt-1">Acompanhe o faturamento da sua clínica</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 shrink-0 print:hidden"
          onClick={() => window.print()}>
          <Printer size={14} /> Imprimir
        </Button>
      </motion.div>

      {/* Month selector */}
      <motion.div variants={item}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {months.map(m => {
            const isSelected = format(m, 'yyyy-MM') === format(selectedMonth, 'yyyy-MM')
            return (
              <button key={m.toISOString()} onClick={() => setSelectedMonth(m)}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-calm shrink-0',
                  isSelected ? 'bg-rose-500 text-white' : 'bg-white border border-warm-200 text-warm-600 hover:bg-warm-50')}>
                {format(m, 'MMM yyyy', { locale: ptBR })}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Faturamento', value: fmtCurrency(totalRevenue), icon: DollarSign, bg: 'bg-sage-50', color: 'text-sage-500' },
          { label: 'Sessões',     value: String(sessionCount),        icon: CheckCircle,  bg: 'bg-sky-50',  color: 'text-sky-500' },
          { label: 'Ticket médio', value: fmtCurrency(avgPerSession), icon: TrendingUp,   bg: 'bg-rose-50', color: 'text-rose-400' },
        ].map(kpi => (
          <Card key={kpi.label} className="p-4">
            <CardContent className="p-0 flex items-center gap-4">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', kpi.bg)}>
                <kpi.icon size={20} className={kpi.color} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-lg font-semibold text-warm-900">{kpi.value}</p>
                <p className="text-xs text-warm-500">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Meta mensal */}
      {!loading && (
        <motion.div variants={item}>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={15} className="text-rose-400" />
                <span className="text-sm font-medium text-warm-700">Meta do mês</span>
              </div>
              {editingGoal ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-warm-400">R$</span>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="100"
                    value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditingGoal(false) }}
                    className="w-28 text-xs px-2 py-1 rounded-lg border border-warm-200 focus:outline-none focus:border-rose-300"
                  />
                  <button onClick={saveGoal}
                    className="text-xs px-2 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-calm">OK</button>
                </div>
              ) : (
                <button onClick={() => { setGoalInput(String(goal)); setEditingGoal(true) }}
                  className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 transition-calm">
                  <Pencil size={11} /> {goal > 0 ? fmtCurrency(goal) : 'Definir meta'}
                </button>
              )}
            </div>
            {goal > 0 ? (
              <>
                <div className="w-full h-2 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', totalRevenue >= goal ? 'bg-sage-400' : 'bg-rose-400')}
                    style={{ width: `${Math.min((totalRevenue / goal) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-warm-400">{fmtCurrency(totalRevenue)} atingidos</span>
                  <span className={cn('text-xs font-medium', totalRevenue >= goal ? 'text-sage-500' : 'text-warm-500')}>
                    {Math.round((totalRevenue / goal) * 100)}%
                    {totalRevenue >= goal && ' ✓'}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-xs text-warm-400">Defina uma meta para acompanhar seu progresso.</p>
            )}
          </Card>
        </motion.div>
      )}

      {/* Bar chart */}
      {!loading && schedules.length > 0 && (
        <motion.div variants={item}>
          <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">Faturamento por dia</h2>
          <Card className="p-4">
            <div className="flex items-end gap-[3px] h-24 w-full">
              {dailyRevenue.map(({ day, total }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    className="w-full rounded-t-sm bg-rose-200 group-hover:bg-rose-400 transition-colors relative"
                    style={{ height: `${Math.max((total / maxDaily) * 80, total > 0 ? 4 : 0)}px` }}
                    title={`Dia ${day}: ${fmtCurrency(total)}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-warm-400">1</span>
              <span className="text-[10px] text-warm-400">{Math.ceil(daysInMonth / 2)}</span>
              <span className="text-[10px] text-warm-400">{daysInMonth}</span>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Sessions list */}
      <motion.div variants={item}>
        <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">Sessões concluídas</h2>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="text-warm-400 animate-spin" /></div>
        ) : schedules.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar size={32} className="text-warm-300 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-warm-500">Nenhuma sessão concluída neste mês</p>
          </Card>
        ) : (
          <Card className="divide-y divide-warm-100">
            {schedules
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
              .map(s => (
                <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-rose-500">
                      {s.client.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-900 truncate">{s.client.name}</p>
                    <p className="text-xs text-warm-400">
                      {format(new Date(s.startTime), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-sage-600 shrink-0">
                    {s.price ? fmtCurrency(Number(s.price)) : '—'}
                  </p>
                </div>
              ))}
          </Card>
        )}
      </motion.div>

      {/* Top clients */}
      {topClients.length > 0 && (
        <motion.div variants={item}>
          <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">Top clientes</h2>
          <Card className="divide-y divide-warm-100">
            {topClients.map((c, i) => (
              <div key={c.name} className="flex items-center gap-4 px-4 py-3">
                <span className="text-sm font-bold text-warm-300 w-5">{i + 1}</span>
                <p className="text-sm text-warm-900 flex-1">{c.name}</p>
                <p className="text-xs text-warm-400">{c.count} sessões</p>
                <p className="text-sm font-semibold text-sage-600">{fmtCurrency(c.total)}</p>
              </div>
            ))}
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
