'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Printer, Loader2 } from 'lucide-react'
import { schedulesApi, clinicApi, type Schedule, type Clinic } from '@/lib/api'
import { getUser } from '@/lib/auth'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function RelatorioPage() {
  const router = useRouter()
  const user = getUser()
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)

  const months = Array.from({ length: 6 }, (_, i) => subMonths(new Date(), 5 - i))

  useEffect(() => {
    clinicApi.get().then(setClinic).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const from = startOfMonth(selectedMonth).toISOString()
    const to   = endOfMonth(selectedMonth).toISOString()
    schedulesApi.list({ from, to, status: 'completed' })
      .then(setSchedules)
      .finally(() => setLoading(false))
  }, [selectedMonth])

  const totalRevenue = schedules.reduce((sum, s) => sum + Number(s.price ?? 0), 0)

  const byClient = schedules.reduce<Record<string, { name: string; count: number; total: number }>>(
    (acc, s) => {
      if (!acc[s.client.id]) acc[s.client.id] = { name: s.client.name, count: 0, total: 0 }
      acc[s.client.id].count++
      acc[s.client.id].total += Number(s.price ?? 0)
      return acc
    }, {}
  )
  const clientRows = Object.values(byClient).sort((a, b) => b.total - a.total)

  const sorted = [...schedules].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-page { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <motion.div variants={container} initial="hidden" animate="show"
        className="flex flex-col gap-6 pb-24 md:pb-0 max-w-2xl">

        {/* Header — no-print */}
        <motion.div variants={item} className="no-print flex items-center gap-3">
          <button onClick={() => router.back()}
            className="text-warm-400 hover:text-warm-700 transition-calm p-1 -ml-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-display text-warm-900 flex-1">Relatório mensal</h1>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-calm">
            <Printer size={15} /> Imprimir
          </button>
        </motion.div>

        {/* Month selector — no-print */}
        <motion.div variants={item} className="no-print flex gap-2 overflow-x-auto pb-1">
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
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={24} className="text-warm-400 animate-spin" />
          </div>
        ) : (
          <motion.div variants={item} className="print-page bg-white rounded-2xl border border-warm-200 shadow-soft overflow-hidden">

            {/* Cabeçalho do relatório */}
            <div className="px-8 pt-8 pb-6 border-b border-warm-100">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-warm-900">
                    {clinic?.name ?? 'Clínica'}
                  </h2>
                  {clinic?.phone && <p className="text-sm text-warm-500 mt-0.5">{clinic.phone}</p>}
                  {user?.name && <p className="text-sm text-warm-500">{user.name}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-warm-700 capitalize">
                    {format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-warm-400 mt-0.5">
                    Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>
            </div>

            {schedules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <p className="text-sm text-warm-500">Nenhuma sessão concluída neste mês.</p>
              </div>
            ) : (
              <>
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-0 border-b border-warm-100">
                  {[
                    { label: 'Sessões', value: String(schedules.length) },
                    { label: 'Faturamento', value: fmtCurrency(totalRevenue) },
                    { label: 'Ticket médio', value: fmtCurrency(totalRevenue / schedules.length) },
                  ].map((kpi, i) => (
                    <div key={kpi.label} className={cn('px-6 py-5 text-center', i < 2 && 'border-r border-warm-100')}>
                      <p className="text-lg font-bold text-warm-900">{kpi.value}</p>
                      <p className="text-xs text-warm-400 mt-0.5">{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Por cliente */}
                <div className="px-8 py-5 border-b border-warm-100">
                  <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Por cliente</h3>
                  <div className="flex flex-col gap-1">
                    {clientRows.map(c => (
                      <div key={c.name} className="flex items-center gap-4 py-1">
                        <p className="flex-1 text-sm text-warm-900">{c.name}</p>
                        <p className="text-xs text-warm-400">{c.count} sessão{c.count !== 1 ? 'ões' : ''}</p>
                        <p className="text-sm font-semibold text-sage-600 w-28 text-right">{fmtCurrency(c.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista completa */}
                <div className="px-8 py-5">
                  <h3 className="text-xs font-semibold text-warm-500 uppercase tracking-wide mb-3">Sessões realizadas</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-warm-100">
                        <th className="text-left text-xs text-warm-400 font-medium pb-2">Data</th>
                        <th className="text-left text-xs text-warm-400 font-medium pb-2">Horário</th>
                        <th className="text-left text-xs text-warm-400 font-medium pb-2">Cliente</th>
                        <th className="text-right text-xs text-warm-400 font-medium pb-2">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-50">
                      {sorted.map(s => (
                        <tr key={s.id}>
                          <td className="py-2 text-warm-700 capitalize">
                            {format(new Date(s.startTime), "dd 'de' MMM", { locale: ptBR })}
                          </td>
                          <td className="py-2 text-warm-500">
                            {format(new Date(s.startTime), 'HH:mm')}
                          </td>
                          <td className="py-2 text-warm-900">{s.client.name}</td>
                          <td className="py-2 text-right text-sage-600 font-medium">
                            {s.price ? fmtCurrency(Number(s.price)) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-warm-200">
                        <td colSpan={3} className="pt-3 text-sm font-semibold text-warm-900">Total</td>
                        <td className="pt-3 text-right text-base font-bold text-sage-600">
                          {fmtCurrency(totalRevenue)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Rodapé */}
                <div className="px-8 py-4 bg-warm-50 border-t border-warm-100">
                  <p className="text-xs text-warm-400 text-center">
                    Precya — Sistema de gestão para clínicas · {clinic?.name ?? ''} · {format(new Date(), 'yyyy')}
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </>
  )
}
