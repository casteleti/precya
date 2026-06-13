'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, ChevronRight, Shield, Bell, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getUser, clearAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } } }

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  therapist: 'Terapeuta',
  receptionist: 'Recepcionista',
}

export default function ConfiguracoesPage() {
  const user = getUser()
  const router = useRouter()

  function handleLogout() {
    clearAuth()
    router.push('/login')
  }

  const sections = [
    {
      title: 'Conta',
      items: [
        { icon: User, label: 'Perfil', sub: user?.email ?? '', onClick: () => {} },
        { icon: Shield, label: 'Segurança', sub: 'Alterar senha', onClick: () => {} },
        { icon: Bell, label: 'Notificações', sub: 'WhatsApp e lembretes', onClick: () => {} },
      ],
    },
    {
      title: 'Suporte',
      items: [
        { icon: HelpCircle, label: 'Ajuda', sub: 'Central de suporte', onClick: () => {} },
      ],
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show"
      className="flex flex-col gap-6 pb-24 md:pb-0">

      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-display text-warm-900">Configurações</h1>
      </motion.div>

      {/* User card */}
      <motion.div variants={item}>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <span className="text-base font-semibold text-rose-500">
              {user?.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-warm-900">{user?.name}</p>
            <p className="text-xs text-warm-400">{user?.email}</p>
            <p className="text-xs text-rose-400 mt-0.5">{roleLabels[user?.role ?? ''] ?? user?.role}</p>
          </div>
        </Card>
      </motion.div>

      {/* Sections */}
      {sections.map(section => (
        <motion.div key={section.title} variants={item}>
          <h2 className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-2">{section.title}</h2>
          <Card className="divide-y divide-warm-100">
            {section.items.map(i => (
              <button key={i.label} onClick={i.onClick}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-warm-50 transition-calm text-left">
                <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center shrink-0">
                  <i.icon size={16} className="text-warm-500" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-warm-900">{i.label}</p>
                  <p className="text-xs text-warm-400">{i.sub}</p>
                </div>
                <ChevronRight size={16} className="text-warm-300 shrink-0" />
              </button>
            ))}
          </Card>
        </motion.div>
      ))}

      {/* Logout */}
      <motion.div variants={item}>
        <Button variant="outline" className="w-full gap-2 text-rose-500 border-rose-200 hover:bg-rose-50"
          onClick={handleLogout}>
          <LogOut size={16} />
          Sair da conta
        </Button>
      </motion.div>

      <motion.div variants={item}>
        <p className="text-center text-xs text-warm-300">Precya © {new Date().getFullYear()} — v0.1.0</p>
      </motion.div>
    </motion.div>
  )
}
