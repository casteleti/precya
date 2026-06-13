'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiLogin } from '@/lib/api'
import { saveAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')

    try {
      const { token, user } = await apiLogin(email, password)
      saveAuth(token, user)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-warm-50 flex flex-col items-center justify-center px-4">

      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-rose-100 opacity-40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-sage-100 opacity-40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card px-8 py-10">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          {/* Saudação */}
          <div className="text-center mb-8">
            <h1 className="text-title text-warm-900 mb-2">
              Bem-vinda de volta
            </h1>
            <p className="text-sm text-warm-500">
              Entre para continuar cuidando da sua clínica
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-warm-700">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className={cn(
                    'h-13 w-full rounded-[14px] border border-warm-200 bg-white px-4 pr-12',
                    'text-warm-900 placeholder:text-warm-400',
                    'shadow-input transition-calm',
                    'focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600 transition-calm"
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Esqueceu a senha */}
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                className="text-xs text-warm-500 hover:text-rose-500 transition-calm"
              >
                Esqueci minha senha
              </button>
            </div>

            {/* Erro */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-[#FFF0EE] px-4 py-3 text-sm text-[#C96F63]"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full mt-1"
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          {/* Rodapé */}
          <p className="text-center text-xs text-warm-400 mt-8">
            Ao entrar, você concorda com nossos{' '}
            <span className="text-warm-600 cursor-pointer hover:text-rose-500 transition-calm">
              Termos de uso
            </span>
          </p>
        </div>

        {/* Versão */}
        <p className="text-center text-xs text-warm-400 mt-6">
          Precya © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  )
}
