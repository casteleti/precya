'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, ClipboardList, Pencil, Trash2, ChevronRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { protocolsApi, type Protocol } from '@/lib/api'
import { useToast } from '@/lib/toast'
import { ProtocolModal } from '@/components/protocols/ProtocolModal'
import { cn } from '@/lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } }

function rateColor(rate: number) {
  if (rate >= 70) return 'text-sage-600'
  if (rate >= 40) return 'text-amber-600'
  return 'text-warm-400'
}

export default function ProtocolosPage() {
  const { toast } = useToast()
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editProtocol, setEditProtocol] = useState<Protocol | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const data = await protocolsApi.list()
      setProtocols(data)
    } catch {
      toast('Erro ao carregar protocolos.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Remover este protocolo?')) return
    setDeletingId(id)
    try {
      await protocolsApi.delete(id)
      toast('Protocolo removido.')
      load()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao remover.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  function openCreate() { setEditProtocol(null); setModalOpen(true) }
  function openEdit(p: Protocol) { setEditProtocol(p); setModalOpen(true) }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show"
        className="flex flex-col gap-6 pb-24 md:pb-0">

        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-warm-900">Protocolos</h1>
            <p className="text-sm text-warm-500 mt-1">
              Metodologias e planos de tratamento
            </p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Novo protocolo
          </Button>
        </motion.div>

        {/* KPIs */}
        {!loading && protocols.length > 0 && (
          <motion.div variants={item} className="grid grid-cols-3 gap-3">
            <Card className="px-4 py-3">
              <p className="text-xs text-warm-400">Total</p>
              <p className="text-xl font-bold text-warm-900">{protocols.length}</p>
            </Card>
            <Card className="px-4 py-3">
              <p className="text-xs text-warm-400">Sessões mapeadas</p>
              <p className="text-xl font-bold text-warm-900">
                {protocols.reduce((s, p) => s + (p.totalSessions || 0), 0) || '—'}
              </p>
            </Card>
            <Card className="px-4 py-3">
              <p className="text-xs text-warm-400">Taxa média sucesso</p>
              <p className={cn('text-xl font-bold', rateColor(
                protocols.reduce((s, p) => s + Number(p.successRate), 0) / protocols.length
              ))}>
                {protocols.length
                  ? Math.round(protocols.reduce((s, p) => s + Number(p.successRate), 0) / protocols.length) + '%'
                  : '—'}
              </p>
            </Card>
          </motion.div>
        )}

        {/* List */}
        <motion.div variants={item}>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="text-warm-400 animate-spin" />
            </div>
          ) : protocols.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mb-4">
                <ClipboardList size={24} className="text-warm-400" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-warm-700 mb-1">Nenhum protocolo cadastrado</p>
              <p className="text-xs text-warm-400 mb-5 max-w-xs">
                Crie protocolos para padronizar seus tratamentos e acompanhar resultados.
              </p>
              <Button onClick={openCreate} className="gap-2">
                <Plus size={14} /> Criar primeiro protocolo
              </Button>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {protocols.map(p => {
                const rate = Number(p.successRate)
                return (
                  <Card key={p.id} className="px-5 py-4 flex items-center gap-4 hover:shadow-card transition-calm">
                    <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                      <ClipboardList size={18} className="text-rose-400" strokeWidth={1.75} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-warm-900 truncate">{p.name}</p>
                      {p.description && (
                        <p className="text-xs text-warm-400 truncate mt-0.5">{p.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        {p.totalSessions > 0 && (
                          <span className="text-[11px] text-warm-400">
                            {p.totalSessions} sessões
                          </span>
                        )}
                        {p.successCount > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-warm-200" />
                            <span className={cn('text-[11px] font-medium', rateColor(rate))}>
                              {p.successCount} concluídos · {Math.round(rate)}% sucesso
                            </span>
                          </>
                        )}
                        {p.avgRating && Number(p.avgRating) > 0 && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-warm-200" />
                            <span className="text-[11px] text-amber-500">
                              ★ {Number(p.avgRating).toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEdit(p)}
                        className="p-2 rounded-lg text-warm-400 hover:text-warm-700 hover:bg-warm-100 transition-calm"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="p-2 rounded-lg text-warm-400 hover:text-red-500 hover:bg-red-50 transition-calm disabled:opacity-40"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ChevronRight size={14} className="text-warm-200 ml-1" />
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </motion.div>
      </motion.div>

      <ProtocolModal
        open={modalOpen}
        protocol={editProtocol}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  )
}
