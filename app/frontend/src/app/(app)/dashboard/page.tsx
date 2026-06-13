'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, TrendingUp, Users, DollarSign, ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getUser } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'
import { cn } from '@/lib/utils'

function greeting(name: string) {
  const hour = new Date().getHours()
  const firstName = name.split(' ')[0]
  if (hour < 12) return `Bom dia, ${firstName} ☀️`
  if (hour < 18) return `Boa tarde, ${firstName} 🌸`
  return `Boa noite, ${firstName} 🌙`
}

const kpis = [
  {
    label: 'Agendamentos hoje',
    value: '—',
    sub: 'Nenhum dado ainda',
    icon: Calendar,
    color: 'rose',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-400',
  },
  {
    label: 'Clientes ativos',
    value: '—',
    sub: 'Nenhum dado ainda',
    icon: Users,
    color: 'sage',
    bg: 'bg-sage-50',
    iconColor: 'text-sage-400',
  },
  {
    label: 'Faturamento mês',
    value: '—',
    sub: 'Nenhum dado ainda',
    icon: DollarSign,
    color: 'sky',
    bg: 'bg-sky-50',
    iconColor: 'text-sky-400',
  },
  {
    label: 'Taxa de retorno',
    value: '—',
    sub: 'Nenhum dado ainda',
    icon: TrendingUp,
    color: 'champagne',
    bg: 'bg-amber-50',
    iconColor: 'text-amber-400',
  },
]

const quickActions = [
  { label: 'Novo agendamento', href: '/agenda/novo',   color: 'bg-rose-gradient'  },
  { label: 'Adicionar cliente', href: '/clientes/novo', color: 'bg-sage-gradient'  },
  { label: 'Ver financeiro',    href: '/financeiro',    color: 'bg-sky-gradient'   },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setUser(getUser())
  }, [])

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 pb-24 md:pb-0"
    >
      {/* Saudação */}
      <motion.div variants={item}>
        <h1 className="text-display text-warm-900">
          {user ? greeting(user.name) : 'Olá 👋'}
        </h1>
        <p className="text-sm text-warm-500 mt-1">
          Aqui está um resumo da sua clínica hoje.
        </p>
      </motion.div>

      {/* KPI Cards */}
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
              <p className="text-xs text-warm-400">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Ações rápidas */}
      <motion.div variants={item}>
        <h2 className="text-sm font-medium text-warm-500 mb-3 uppercase tracking-wide">
          Ações rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              className={cn(
                'flex items-center justify-between px-5 py-4 rounded-xl transition-calm',
                'text-warm-900 text-sm font-medium shadow-soft hover:shadow-card hover:-translate-y-0.5',
                action.color
              )}
            >
              {action.label}
              <ArrowRight size={16} className="text-warm-500" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Próximos agendamentos — placeholder */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-warm-500 uppercase tracking-wide">
            Próximos agendamentos
          </h2>
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            Ver todos <ArrowRight size={12} />
          </Button>
        </div>

        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
            <Clock size={22} className="text-warm-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-warm-700">Nenhum agendamento para hoje</p>
          <p className="text-xs text-warm-400 mt-1">
            Seus próximos atendimentos aparecerão aqui.
          </p>
          <Button variant="outline" size="sm" className="mt-5">
            Criar agendamento
          </Button>
        </Card>
      </motion.div>

      {/* Insight emocional */}
      <motion.div variants={item}>
        <div className="rounded-xl bg-rose-gradient px-6 py-5 flex items-start gap-4">
          <span className="text-2xl">🌸</span>
          <div>
            <p className="text-sm font-medium text-warm-900">
              Sua clínica está tomando forma.
            </p>
            <p className="text-xs text-warm-600 mt-1 leading-relaxed">
              Continue adicionando seus clientes e agendamentos para que o Precya possa
              te ajudar a crescer com mais clareza e confiança.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
