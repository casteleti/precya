'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Phone, Calendar, TrendingUp, DollarSign, Edit2, Loader2, Clock, MessageCircle, FileText, ChevronDown, ChevronUp, Check, X, Pencil } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClientModal } from '@/components/clients/ClientModal'
import { clientsApi, schedulesApi, type Client, type Schedule } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } }

const statusConfig: Record<string, { label: string; cls: string }> = {
  not_confirmed: { label: 'A confirmar', cls: 'bg-amber-50 text-amber-600 border border-amber-200' },
  confirmed:     { label: 'Confirmado',  cls: 'bg-sage-50 text-sage-600 border border-sage-200' },
  completed:     { label: 'Concluído',   cls: 'bg-warm-100 text-warm-500 border border-warm-200' },
  cancelled:     { label: 'Cancelado',   cls: 'bg-red-50 text-red-400 border border-red-200' },
}

const clientStatusCls: Record<string, string> = {
  ativo:   'bg-sage-100 text-sage-600',
  risco:   'bg-amber-100 text-amber-600',
  inativo: 'bg-warm-100 text-warm-500',
}

function fmtCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function ClientDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router  = useRouter()

  const { toast } = useToast()
  const [client, setClient]       = useState<Client | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading]     = useState(true)
  const [editOpen, setEditOpen]   = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editNoteId, setEditNoteId] = useState<string | null>(null)
  const [noteText, setNoteText]     = useState('')
  const [editingGenNote, setEditingGenNote] = useState(false)
  const [genNoteText, setGenNoteText]       = useState('')

  async function handleSaveGenNote() {
    try {
      const updated = await clientsApi.update(client!.id, { notes: genNoteText })
      setClient(prev => prev ? { ...prev, notes: updated.notes } : prev)
      toast('Anotações salvas.')
      setEditingGenNote(false)
    } catch {
      toast('Erro ao salvar.', 'error')
    }
  }

  async function handleSaveNote(id: string) {
    try {
      await schedulesApi.patch(id, { notes: noteText })
      toast('Nota salva.')
      setEditNoteId(null)
      load()
    } catch {
      toast('Erro ao salvar nota.', 'error')
    }
  }

  async function load() {
    try {
      const [c, s] = await Promise.all([
        clientsApi.get(id),
        schedulesApi.list({ clientId: id, limit: '50' }),
      ])
      setClient(c)
      setSchedules(s)
    } catch {
      router.push('/clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="text-warm-400 animate-spin" />
      </div>
    )
  }

  if (!client) return null

  const completed  = schedules.filter(s => s.status === 'completed')
  const upcoming   = schedules.filter(s => s.status !== 'completed' && s.status !== 'cancelled' && new Date(s.startTime) >= new Date())
  const totalSpent = completed.reduce((sum, s) => sum + Number(s.price ?? 0), 0)

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show"
        className="flex flex-col gap-6 pb-24 md:pb-0 max-w-2xl">

        {/* Back + header */}
        <motion.div variants={item} className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="text-warm-400 hover:text-warm-700 transition-calm p-1 -ml-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-display text-warm-900 flex-1">Detalhes do cliente</h1>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditOpen(true)}>
            <Edit2 size={14} /> Editar
          </Button>
        </motion.div>

        {/* Profile card */}
        <motion.div variants={item}>
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-rose-500">{initials(client.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-warm-900">{client.name}</h2>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', clientStatusCls[client.status])}>
                    {client.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-sm text-warm-500">
                    <Phone size={13} strokeWidth={1.75} />
                    <span>{client.phone}</span>
                  </div>
                  <a
                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${client.name.split(' ')[0]}, tudo bem?`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-green-500 hover:text-green-700 font-medium transition-calm">
                    <MessageCircle size={13} strokeWidth={1.75} /> WhatsApp
                  </a>
                </div>
                {client.birthDate && (
                  <div className="flex items-center gap-1 mt-0.5 text-sm text-warm-400">
                    <Calendar size={13} strokeWidth={1.75} />
                    <span>{format(new Date(client.birthDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-warm-100">
              {[
                { icon: TrendingUp, label: 'Sessões',        value: String(client.sessionCount ?? 0), color: 'text-rose-400', bg: 'bg-rose-50' },
                { icon: DollarSign, label: 'Total investido', value: fmtCurrency(totalSpent),          color: 'text-sage-500', bg: 'bg-sage-50' },
                { icon: Clock,      label: 'Última sessão',   value: client.lastSessionDate ? format(new Date(client.lastSessionDate), 'dd/MM/yy') : '—', color: 'text-sky-400', bg: 'bg-sky-50' },
              ].map(stat => (
                <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center">
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bg)}>
                    <stat.icon size={16} className={stat.color} strokeWidth={1.75} />
                  </div>
                  <p className="text-base font-semibold text-warm-900">{stat.value}</p>
                  <p className="text-xs text-warm-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Notas gerais do cliente */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide">Anotações gerais</h2>
            {!editingGenNote && (
              <button onClick={() => { setGenNoteText(client.notes ?? ''); setEditingGenNote(true) }}
                className="flex items-center gap-1 text-xs text-warm-400 hover:text-warm-600 transition-calm">
                <Pencil size={11} /> {client.notes ? 'Editar' : 'Adicionar'}
              </button>
            )}
          </div>
          <Card className="p-4">
            {editingGenNote ? (
              <div className="flex flex-col gap-2">
                <textarea
                  autoFocus rows={4}
                  value={genNoteText}
                  onChange={e => setGenNoteText(e.target.value)}
                  placeholder="Histórico, diagnóstico, medicamentos, observações relevantes..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100 resize-none text-warm-700"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingGenNote(false)}
                    className="px-3 py-1.5 rounded-lg bg-warm-100 text-warm-500 text-xs hover:bg-warm-200 transition-calm">
                    Cancelar
                  </button>
                  <button onClick={handleSaveGenNote}
                    className="px-3 py-1.5 rounded-lg bg-rose-500 text-white text-xs font-medium hover:bg-rose-600 transition-calm">
                    Salvar
                  </button>
                </div>
              </div>
            ) : client.notes ? (
              <p className="text-sm text-warm-700 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
            ) : (
              <button onClick={() => { setGenNoteText(''); setEditingGenNote(true) }}
                className="w-full flex items-center gap-2 text-sm text-warm-300 hover:text-warm-400 transition-calm group">
                <FileText size={14} strokeWidth={1.5} />
                <span className="text-xs">Adicionar anotações sobre este cliente...</span>
              </button>
            )}
          </Card>
        </motion.div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">Próximos agendamentos</h2>
            <Card className="divide-y divide-warm-100">
              {upcoming.map(s => {
                const cfg = statusConfig[s.status] ?? statusConfig.not_confirmed
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-warm-100 flex flex-col items-center justify-center shrink-0 text-center">
                      <span className="text-xs font-medium text-warm-700 leading-none">
                        {format(new Date(s.startTime), 'dd', { locale: ptBR })}
                      </span>
                      <span className="text-[9px] text-warm-400 uppercase">
                        {format(new Date(s.startTime), 'MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-900">
                        {format(new Date(s.startTime), 'HH:mm')} – {format(new Date(s.endTime), 'HH:mm')}
                      </p>
                      {s.notes && <p className="text-xs text-warm-400 truncate">{s.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.price && <span className="text-sm font-medium text-sage-600">{fmtCurrency(Number(s.price))}</span>}
                      <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', cfg.cls)}>{cfg.label}</span>
                    </div>
                  </div>
                )
              })}
            </Card>
          </motion.div>
        )}

        {/* History / Prontuário */}
        <motion.div variants={item}>
          <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-3">
            Prontuário ({completed.length} sessões)
          </h2>
          {completed.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-10 text-center">
              <Clock size={28} className="text-warm-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-warm-500">Nenhuma sessão concluída ainda</p>
            </Card>
          ) : (
            <Card className="divide-y divide-warm-100">
              {[...completed].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).map(s => {
                const isExpanded = expandedId === s.id
                const isEditing  = editNoteId === s.id
                return (
                  <div key={s.id}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-warm-50 transition-calm text-left">
                      <div className="w-8 h-8 rounded-full bg-sage-50 flex items-center justify-center shrink-0">
                        <Check size={13} className="text-sage-500" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-warm-900">
                          {format(new Date(s.startTime), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-warm-400">
                          {format(new Date(s.startTime), 'HH:mm')} – {format(new Date(s.endTime), 'HH:mm')}
                          {s.notes ? <span className="ml-2 text-warm-300">· tem anotação</span> : null}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.price && <span className="text-sm font-semibold text-sage-600">{fmtCurrency(Number(s.price))}</span>}
                        {isExpanded ? <ChevronUp size={14} className="text-warm-400" /> : <ChevronDown size={14} className="text-warm-300" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 bg-warm-50/50">
                        {isEditing ? (
                          <div className="flex gap-2">
                            <textarea
                              autoFocus
                              rows={3}
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              placeholder="Anotações clínicas desta sessão..."
                              className="flex-1 text-xs px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100 resize-none bg-white"
                            />
                            <div className="flex flex-col gap-1">
                              <button onClick={() => handleSaveNote(s.id)}
                                className="p-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-calm">
                                <Check size={13} />
                              </button>
                              <button onClick={() => setEditNoteId(null)}
                                className="p-2 rounded-lg bg-warm-100 text-warm-500 hover:bg-warm-200 transition-calm">
                                <X size={13} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => { setEditNoteId(s.id); setNoteText(s.notes ?? '') }}
                            className="min-h-[48px] px-3 py-2.5 rounded-lg border border-dashed border-warm-200 bg-white cursor-text hover:border-rose-200 transition-calm group">
                            {s.notes ? (
                              <p className="text-xs text-warm-700 whitespace-pre-wrap leading-relaxed">{s.notes}</p>
                            ) : (
                              <p className="text-xs text-warm-300 group-hover:text-warm-400 flex items-center gap-1.5">
                                <FileText size={12} /> Clique para adicionar anotações clínicas...
                              </p>
                            )}
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

      <ClientModal
        open={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); load() }}
      />
    </>
  )
}
