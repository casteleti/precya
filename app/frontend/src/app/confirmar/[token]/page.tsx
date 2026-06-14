'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircle2, Clock, Calendar, Loader2, AlertCircle } from 'lucide-react'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5003/api').replace('/api', '')

interface SessionInfo {
  id: string
  status: string
  startTime: string
  endTime: string
  clientName: string
  clinicName: string
  clinicPhone: string
}

export default function ConfirmarPage() {
  const params = useParams()
  const token = (params?.token as string) ?? ''

  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/public/confirm/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else {
          setSession(data)
          if (data.status === 'confirmed') setConfirmed(true)
        }
      })
      .catch(() => setError('Não foi possível carregar os dados da sessão.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleConfirm() {
    setConfirming(true)
    try {
      const r = await fetch(`${API_BASE}/public/confirm/${token}`, { method: 'POST' })
      const data = await r.json()
      if (data.ok) setConfirmed(true)
      else setError(data.error ?? 'Erro ao confirmar.')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-warm-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 shadow-sm">
            <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">P</span>
            </div>
            <span className="text-sm font-semibold text-warm-800">Precya</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 size={28} className="text-rose-400 animate-spin" />
              <p className="text-sm text-warm-500">Carregando...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertCircle size={22} className="text-red-400" />
              </div>
              <p className="text-sm font-medium text-warm-800">Link inválido</p>
              <p className="text-xs text-warm-400">{error}</p>
            </div>
          )}

          {!loading && session && (
            <>
              <div className="text-center mb-6">
                <p className="text-xs text-warm-400 uppercase tracking-wide font-medium mb-1">
                  {session.clinicName}
                </p>
                <h1 className="text-lg font-bold text-warm-900">
                  Olá, {session.clientName.split(' ')[0]}!
                </h1>
                <p className="text-sm text-warm-500 mt-1">
                  {confirmed
                    ? 'Sua sessão está confirmada.'
                    : 'Confirme sua presença na sessão abaixo.'}
                </p>
              </div>

              {/* Session card */}
              <div className="rounded-xl bg-warm-50 border border-warm-100 p-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-rose-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-900 capitalize">
                      {format(parseISO(session.startTime), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={12} className="text-warm-400" />
                      <span className="text-xs text-warm-500">
                        {format(parseISO(session.startTime), 'HH:mm')} – {format(parseISO(session.endTime), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {confirmed ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                  <p className="text-sm font-semibold text-green-700">Presença confirmada!</p>
                  <p className="text-xs text-warm-400 text-center">
                    Até lá! Em caso de dúvidas, entre em contato.
                  </p>
                  {session.clinicPhone && (
                    <a
                      href={`https://wa.me/55${session.clinicPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Falar pelo WhatsApp →
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {confirming ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {confirming ? 'Confirmando...' : 'Confirmar presença'}
                  </button>
                  {session.clinicPhone && (
                    <a
                      href={`https://wa.me/55${session.clinicPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá, ${session.clientName.split(' ')[0]} aqui! Preciso reagendar minha sessão.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-600 text-sm font-medium text-center hover:bg-green-100 transition-colors"
                    >
                      Preciso reagendar →
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-warm-400 mt-6">
          Powered by Precya · gestão de clínica
        </p>
      </div>
    </div>
  )
}
