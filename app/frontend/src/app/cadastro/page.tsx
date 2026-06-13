'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiRegister } from '@/lib/api'
import { saveAuth } from '@/lib/auth'

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    clinicName: '', clinicPhone: '', name: '', email: '', password: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.clinicName || !form.clinicPhone || !form.name || !form.email || !form.password) {
      setError('Preencha todos os campos.')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const { token, user } = await apiRegister(form)
      saveAuth(token, user)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" />
          <h1 className="text-xl font-semibold text-warm-900">Crie sua conta</h1>
          <p className="text-sm text-warm-500 mt-1">Configure sua clínica em minutos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-soft p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div>
              <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-3">Dados da clínica</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-warm-700">Nome da clínica *</label>
                  <Input placeholder="Ex: Clínica Equilíbrio" value={form.clinicName} onChange={set('clinicName')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-warm-700">Telefone da clínica *</label>
                  <Input placeholder="(11) 99999-9999" value={form.clinicPhone} onChange={set('clinicPhone')} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide mb-3">Seu acesso</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-warm-700">Seu nome *</label>
                  <Input placeholder="Nome completo" value={form.name} onChange={set('name')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-warm-700">E-mail *</label>
                  <Input type="email" placeholder="voce@exemplo.com" value={form.email} onChange={set('email')} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-warm-700">Senha *</label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={form.password}
                      onChange={set('password')}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Criar conta'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-warm-500 mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-rose-500 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
