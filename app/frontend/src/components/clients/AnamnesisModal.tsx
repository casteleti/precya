'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { anamnesisApi } from '@/lib/api'
import { useToast } from '@/lib/toast'

const QUESTIONS: { key: string; label: string; placeholder: string; rows?: number }[] = [
  { key: 'motivo', label: 'Motivo da consulta', placeholder: 'Por que busca atendimento?', rows: 3 },
  { key: 'historico', label: 'Histórico de tratamentos anteriores', placeholder: 'Já fez psicoterapia, psiquiatria ou outro tratamento?', rows: 2 },
  { key: 'medicamentos', label: 'Medicamentos em uso', placeholder: 'Psicofármacos ou outros medicamentos contínuos...', rows: 2 },
  { key: 'indicacao', label: 'Como chegou até aqui?', placeholder: 'Indicação, pesquisa, plano de saúde...', rows: 1 },
  { key: 'objetivos', label: 'Objetivos com a terapia', placeholder: 'O que espera alcançar?', rows: 2 },
  { key: 'observacoes', label: 'Observações adicionais', placeholder: 'Outras informações relevantes...', rows: 2 },
]

interface Props {
  open: boolean
  clientId: string
  clientName: string
  onClose: () => void
}

export function AnamnesisModal({ open, clientId, clientName, onClose }: Props) {
  const { toast } = useToast()
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFetching(true)
    anamnesisApi.get(clientId)
      .then(a => {
        if (a) {
          setResponses(a.responses ?? {})
          setLastUpdated(a.updatedAt)
        } else {
          setResponses({})
          setLastUpdated(null)
        }
      })
      .finally(() => setFetching(false))
  }, [open, clientId])

  if (!open) return null

  function set(key: string, val: string) {
    setResponses(r => ({ ...r, [key]: val }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      const result = await anamnesisApi.save(clientId, responses)
      toast('Anamnese salva.')
      setLastUpdated((result as NonNullable<typeof result>)?.updatedAt ?? null)
      onClose()
    } catch {
      toast('Erro ao salvar anamnese.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-warm-100 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
            <ClipboardList size={16} className="text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-warm-900">Anamnese</h2>
            <p className="text-xs text-warm-400">{clientName}</p>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {fetching ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-warm-400 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {lastUpdated && (
                <p className="text-xs text-warm-400">
                  Última atualização: {new Date(lastUpdated).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'numeric' })}
                </p>
              )}
              {QUESTIONS.map(q => (
                <div key={q.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-warm-700">{q.label}</label>
                  <textarea
                    rows={q.rows ?? 2}
                    value={responses[q.key] ?? ''}
                    onChange={e => set(q.key, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100 resize-none text-warm-700 placeholder:text-warm-300"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-warm-100 shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSave} disabled={loading || fetching}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Salvar anamnese'}
          </Button>
        </div>
      </div>
    </div>
  )
}
