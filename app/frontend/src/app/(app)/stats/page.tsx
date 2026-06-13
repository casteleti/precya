'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, TrendingUp, Calendar, Users, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { schedulesApi, type Schedule } from '@/lib/api'
import { cn } from '@/lib/utils'
import { format, subMonths, startOfMonth, endOfMonth, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

function fmtPct(n: number) { return `${Math.round(n)}%` }

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function StatsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch last 3 months of all schedules
    const from = startOfMonth(subMonths(new Date(), 2)).toISOString()
    const to   = endOfMonth(new Date()).toISOString()
    schedulesApi.list({ from, to })
      .then(setSchedules)
      .finally(() => setLoading(false))
  }, [])

  const total      = schedules.length
  const completed  = schedules.filter(s => s.status === 'completed')
  const cancelled  = schedules.filter(s => s.status === 'cancelled')
  const confirmed  = schedules.filter(s => s.status === 'confirmed')
  const pending    = schedules.filter(s => s.status === 'not_confirmed')

  const completionRate  = total > 0 ? (completed.length / total) * 100 : 0
  const cancellationRate = total > 0 ? (cancelled.length / total) * 100 : 0
  const confirmationRate = (completed.length + confirmed.length + cancelled.length) > 0
    ? ((completed.length + confirmed.length) / (completed.length + confirmed.length + cancelled.length)) * 100 : 0

  // Sessions by weekday
  const byWeekday = Array(7).fill(0)
  for (const s of completed) byWeekday[getDay(new Date(s.startTime))]++
  const maxWd = Math.max(...byWeekday, 1)

  // Top clients (completed sessions)
  const clientMap: Record<string, { name: string; count: number; revenue: number }> = {}
  for (const s of completed) {
    if (!clientMap[s.client.id]) clientMap[s.client.id] = { name: s.client.name, count: 0, revenue: 0 }
    clientMap[s.client.id].count++
    clientMap[s.client.id].revenue += Number(s.price ?? 0)
  }
  const topClients = Object.values(clientMap).sort((a, b) => b.count - a.count).slice(0, 7)
  const maxCount = Math.max(...topClients.map(c => c.count), 1)

  // Revenue by month (last 3)
  const revenueMonths = Array.from({ length: 3 }, (_, i) => {
    const d = subMonths(new Date(), 2 - i)
    const key = format(d, 'yyyy-MM')
    const label = format(d, 'MMM', { locale: ptBR })
    const total = completed
      .filter(s => format(new Date(s.startTime), 'yyyy-MM') === key)
      .reduce((sum, s) => sum + Number(s.price ?? 0), 0)
    return { key, label, total }
  })
  const maxRev = Math.max(...revenueMonths.map(r => r.total), 1)

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="flex flex-col gap-6 pb-24 md:pb-0">

      <motion.div variants={item}>
        <h1 className="text-display text-warm-900">Estatísticas</h1>
        <p className="text-sm text-warm-500 mt-1">Últimos 3 meses de atendimentos</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="text-warm-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPIs de taxa */}
          <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total sessões', value: String(total), icon: Calendar, bg: 'bg-rose-50', color: 'text-rose-400' },
              { label: 'Concluídas', value: fmtPct(completionRate), icon: TrendingUp, bg: 'bg-sage-50', color: 'text-sage-500' },
              { label: 'Canceladas', value: fmtPct(cancellationRate), icon: BarChart2, bg: 'bg-amber-50', color: 'text-amber-500' },
              { label: 'A confirmar', value: String(pending.length), icon: Users, bg: 'bg-sky-50', color: 'text-sky-500' },
            ].map(kpi => (
              <Card key={kpi.label} className="p-4 flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', kpi.bg)}>
                  <kpi.icon size={16} className={kpi.color} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-warm-900">{kpi.value}</p>
                  <p className="text-xs text-warm-400">{kpi.label}</p>
                </div>
              </Card>
            ))}
          </motion.div>

          {/* Por dia da semana */}
          <motion.div variants={item}>
            <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">Sessões por dia da semana</h2>
            <Card className="p-5">
              <div className="flex items-end gap-3 h-20">
                {byWeekday.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] text-warm-400 group-hover:text-warm-600">{count}</span>
                    <div
                      className="w-full rounded-t-md bg-rose-200 group-hover:bg-rose-400 transition-colors"
                      style={{ height: `${Math.max((count / maxWd) * 56, count > 0 ? 4 : 0)}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                {WEEKDAYS.map(d => (
                  <div key={d} className="flex-1 text-center text-[10px] text-warm-400">{d}</div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Receita por mês */}
          <motion.div variants={item}>
            <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">Receita por mês</h2>
            <Card className="p-5">
              <div className="flex items-end gap-6 h-20">
                {revenueMonths.map(m => (
                  <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group">
                    <span className="text-[10px] text-warm-400">
                      {m.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                    <div
                      className="w-full rounded-t-md bg-sage-200 group-hover:bg-sage-400 transition-colors"
                      style={{ height: `${Math.max((m.total / maxRev) * 56, m.total > 0 ? 4 : 0)}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-6 mt-2">
                {revenueMonths.map(m => (
                  <div key={m.key} className="flex-1 text-center text-[10px] text-warm-400 capitalize">{m.label}</div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Top clientes */}
          {topClients.length > 0 && (
            <motion.div variants={item}>
              <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">Clientes mais frequentes</h2>
              <Card className="p-5 flex flex-col gap-3">
                {topClients.map(c => (
                  <div key={c.name} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-rose-500">
                        {c.name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-xs font-medium text-warm-900 truncate">{c.name}</p>
                        <span className="text-xs text-warm-400 shrink-0 ml-2">{c.count} sessões</span>
                      </div>
                      <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-300 rounded-full"
                          style={{ width: `${(c.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-sage-600 w-20 text-right shrink-0">
                      {c.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                ))}
              </Card>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  )
}
