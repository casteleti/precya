'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, Users, DollarSign, ArrowRight, Clock, Loader2, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth'
import { dashboardApi, type DashboardData } from '@/lib/api'
import { cn } from '@/lib/utils'
import { format, isSameDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function greeting(name: string) {
  const hour = new Date().getHours()
  const firstName = name.split(' ')[0]
  if (hour < 12) return `Bom dia, ${firstName} ☀️`
  if (hour < 18) return `Boa tarde, ${firstName} 🌸`
  return `Boa noite, ${firstName} 🌙`
}

function fmtCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  not_confirmed: { label: 'A confirmar', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  confirmed:     { label: 'Confirmado',  cls: 'bg-sage-50 text-sage-600 border border-sage-200' },
  completed:     { label: 'Concluído',   cls: 'bg-warm-100 text-warm-500 border border-warm-200' },
  cancelled:     { label: 'Cancelado',   cls: 'bg-red-50 text-red-400 border border-red-200' },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } } }

export default function DashboardPage() {
  const router = useRouter()
  const user = getUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Next session today (not yet completed/cancelled)
  const now = new Date()
  const nextToday = data?.upcomingSchedules
    ?.filter(s => isSameDay(new Date(s.startTime), now) && new Date(s.startTime) >= now)
    ?.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0]

  const kpis = [
    {
      label: 'Agendamentos hoje',
      value: loading ? '...' : String(data?.todaySchedules ?? 0),
      icon: Calendar,
      bg: 'bg-rose-50', iconColor: 'text-rose-400',
    },
    {
      label: 'Clientes ativos',
      value: loading ? '...' : String(data?.activeClients ?? 0),
      icon: Users,
      bg: 'bg-sage-50', iconColor: 'text-sage-400',
    },
    {
      label: 'Faturamento mês',
      value: loading ? '...' : fmtCurrency(data?.monthRevenue ?? 0),
      icon: DollarSign,
      bg: 'bg-sky-50', iconColor: 'text-sky-400',
    },
    {
      label: 'Taxa de retorno',
      value: loading ? '...' : `${data?.returnRate ?? 0}%`,
      icon: TrendingUp,
      bg: 'bg-amber-50', iconColor: 'text-amber-400',
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="flex flex-col gap-6 pb-24 md:pb-0">

      {/* Saudação */}
      <motion.div variants={item}>
        <h1 className="text-display text-warm-900">
          {user ? greeting(user.name) : 'Olá 👋'}
        </h1>
        <p className="text-sm text-warm-500 mt-1">Aqui está um resumo da sua clínica hoje.</p>
      </motion.div>

      {/* Próxima sessão de hoje */}
      {nextToday && (
        <motion.div variants={item}>
          <div className="rounded-xl bg-rose-gradient px-5 py-4 flex items-center gap-4 cursor-pointer hover:shadow-card transition-calm"
            onClick={() => router.push('/agenda')}>
            <div className="w-10 h-10 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-rose-500" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-warm-500 uppercase tracking-wide font-medium">Próxima sessão</p>
              <p className="text-sm font-semibold text-warm-900 truncate">{nextToday.client.name}</p>
              <p className="text-xs text-warm-500">
                {format(new Date(nextToday.startTime), 'HH:mm')} – {format(new Date(nextToday.endTime), 'HH:mm')}
              </p>
            </div>
            <ChevronRight size={16} className="text-warm-400 shrink-0" />
          </div>
        </motion.div>
      )}

      {/* KPIs */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <CardContent className="p-0 flex flex-col gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.bg)}>
                <kpi.icon size={18} className={kpi.iconColor} strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-xl font-medium text-warm-900">{kpi.value}</p>
                <p className="text-xs text-warm-500 mt-0.5">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Ações rápidas */}
      <motion.div variants={item}>
        <h2 className="text-xs font-medium text-warm-500 mb-3 uppercase tracking-wide">Ações rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Novo agendamento', href: '/agenda',   color: 'bg-rose-gradient' },
            { label: 'Adicionar cliente', href: '/clientes', color: 'bg-sage-gradient' },
            { label: 'Ver financeiro',    href: '/financeiro', color: 'bg-sky-gradient' },
          ].map((a) => (
            <button key={a.label} onClick={() => router.push(a.href)}
              className={cn('flex items-center justify-between px-5 py-4 rounded-xl transition-calm text-warm-900 text-sm font-medium shadow-soft hover:shadow-card hover:-translate-y-0.5', a.color)}>
              {a.label}
              <ArrowRight size={16} className="text-warm-500" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Próximos agendamentos */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide">Próximos agendamentos</h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => router.push('/agenda')}>
            Ver todos <ArrowRight size={12} />
          </Button>
        </div>

        {loading ? (
          <Card className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-warm-400 animate-spin" />
          </Card>
        ) : data?.upcomingSchedules?.length ? (
          <Card className="divide-y divide-warm-100">
            {data.upcomingSchedules.map((s) => {
              const cfg = statusConfig[s.status] ?? statusConfig.not_confirmed
              return (
                <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-warm-100 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-warm-700">
                      {format(new Date(s.startTime), 'dd', { locale: ptBR })}
                    </span>
                    <span className="text-[10px] text-warm-400 uppercase">
                      {format(new Date(s.startTime), 'MMM', { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-900 truncate">{s.client.name}</p>
                    <p className="text-xs text-warm-400">
                      {format(new Date(s.startTime), 'HH:mm')} – {format(new Date(s.endTime), 'HH:mm')}
                    </p>
                  </div>
                  <span className={cn('shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full', cfg.cls)}>{cfg.label}</span>
                </div>
              )
            })}
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
              <Clock size={22} className="text-warm-400" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-warm-700">Nenhum agendamento próximo</p>
            <p className="text-xs text-warm-400 mt-1">Seus próximos atendimentos aparecerão aqui.</p>
            <Button variant="outline" size="sm" className="mt-5" onClick={() => router.push('/agenda')}>
              Criar agendamento
            </Button>
          </Card>
        )}
      </motion.div>

      {/* Insight */}
      <motion.div variants={item}>
        <div className="rounded-xl bg-rose-gradient px-6 py-5 flex items-start gap-4">
          <span className="text-2xl">🌸</span>
          <div>
            <p className="text-sm font-medium text-warm-900">Sua clínica está tomando forma.</p>
            <p className="text-xs text-warm-600 mt-1 leading-relaxed">
              Continue adicionando seus clientes e agendamentos para que o Precya possa te ajudar a crescer com mais clareza e confiança.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
