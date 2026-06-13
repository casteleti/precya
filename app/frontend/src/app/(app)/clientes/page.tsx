'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, Users, Phone, Calendar, TrendingUp, MoreVertical, Loader2, MessageCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { clientsApi, type Client } from '@/lib/api'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClientModal } from '@/components/clients/ClientModal'
import { useRouter } from 'next/navigation'

const statusConfig = {
  ativo:   { label: 'Ativo',   class: 'bg-sage-50 text-sage-600 border-sage-200' },
  risco:   { label: 'Risco',   class: 'bg-amber-50 text-amber-600 border-amber-200' },
  inativo: { label: 'Inativo', class: 'bg-warm-100 text-warm-500 border-warm-200' },
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } }

export default function ClientesPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<Client | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (search) params.search = search
      if (status) params.status = status
      const res = await clientsApi.list(params)
      setClients(res.clients)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  function openCreate() { setEditClient(null); setModalOpen(true) }
  function openEdit(c: Client) { setEditClient(c); setModalOpen(true) }

  async function handleDelete(id: string) {
    if (!confirm('Remover este cliente?')) return
    await clientsApi.delete(id)
    load()
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show"
        className="flex flex-col gap-6 pb-24 md:pb-0">

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-warm-900">Clientes</h1>
            <p className="text-sm text-warm-500 mt-1">{total} cliente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Novo cliente
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div variants={item} className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
            <Input placeholder="Buscar por nome..." className="pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {(['', 'ativo', 'risco', 'inativo'] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-calm',
                  status === s ? 'bg-rose-100 text-rose-600' : 'bg-white border border-warm-200 text-warm-500 hover:bg-warm-50')}>
                {s === '' ? 'Todos' : statusConfig[s]?.label ?? s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-warm-400 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <motion.div variants={item}>
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-xl bg-warm-100 flex items-center justify-center mb-4">
                <Users size={24} className="text-warm-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-warm-700">Nenhum cliente encontrado</p>
              <p className="text-xs text-warm-400 mt-1">Adicione seu primeiro cliente para começar.</p>
              <Button variant="outline" size="sm" className="mt-5" onClick={openCreate}>
                Adicionar cliente
              </Button>
            </Card>
          </motion.div>
        ) : (
          <motion.div variants={item}>
            <Card className="divide-y divide-warm-100 overflow-hidden">
              {clients.map((c) => {
                const cfg = statusConfig[c.status] ?? statusConfig.ativo
                return (
                  <div key={c.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-warm-50 transition-calm cursor-pointer"
                    onClick={() => router.push(`/clientes/${c.id}`)}>
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-rose-500">
                        {c.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-900 truncate">{c.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-warm-400">
                          <Phone size={11} /> {c.phone}
                        </span>
                        {c.lastSessionDate && (
                          <span className="flex items-center gap-1 text-xs text-warm-400">
                            <Calendar size={11} />
                            {format(new Date(c.lastSessionDate), "dd 'de' MMM", { locale: ptBR })}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-warm-400">
                          <TrendingUp size={11} /> {c.sessionCount} sessões
                        </span>
                      </div>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', cfg.class)}>
                      {cfg.label}
                    </span>
                    <a
                      href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${c.name.split(' ')[0]}, tudo bem?`)}`}
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-green-400 hover:text-green-600 transition-calm p-1">
                      <MessageCircle size={16} />
                    </a>
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(c) }}
                      className="text-warm-300 hover:text-warm-600 transition-calm p-1">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )
              })}
            </Card>
          </motion.div>
        )}
      </motion.div>

      <ClientModal
        open={modalOpen}
        client={editClient}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  )
}
