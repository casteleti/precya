'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Search,
  TrendingUp,
  ClipboardList,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getUser, clearAuth } from '@/lib/auth'
import type { AuthUser } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { ToastProvider } from '@/lib/toast'
import { GlobalSearch } from '@/components/search/GlobalSearch'
import { ShortcutsModal } from '@/components/shortcuts/ShortcutsModal'
import { schedulesApi } from '@/lib/api'
import { isSameDay } from 'date-fns'

const navItems = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Início' },
  { href: '/agenda',       icon: Calendar,        label: 'Agenda' },
  { href: '/clientes',     icon: Users,           label: 'Clientes' },
  { href: '/financeiro',   icon: BarChart2,       label: 'Financeiro' },
  { href: '/stats',        icon: TrendingUp,      label: 'Stats' },
  { href: '/protocolos',   icon: ClipboardList,   label: 'Protocolos' },
  { href: '/configuracoes',icon: Settings,        label: 'Config.' },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [pendingToday, setPendingToday] = useState(0)

  useEffect(() => {
    const u = getUser()
    if (!u) { router.push('/login'); return }
    setUser(u)
  }, [router])

  useEffect(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    const to   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString()
    schedulesApi.list({ from, to, status: 'not_confirmed' })
      .then(list => setPendingToday(list.length))
      .catch(() => {})
  }, [pathname])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(o => !o)
      }
      if (e.key === '?' && !(e.target as HTMLElement).matches('input,textarea')) {
        setShortcutsOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleLogout() {
    clearAuth()
    router.push('/login')
  }

  return (
    <ToastProvider>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    <div className="min-h-screen bg-warm-50 flex">

      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-warm-200 fixed inset-y-0 left-0 shadow-soft z-30">
        <div className="p-6 border-b border-warm-100">
          <Logo size="md" />
        </div>

        {/* Busca global */}
        <div className="px-4 pb-3">
          <button onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-warm-50 border border-warm-200 text-warm-400 text-sm hover:bg-warm-100 transition-calm">
            <Search size={14} strokeWidth={1.75} />
            <span className="flex-1 text-left text-xs">Buscar...</span>
            <kbd className="text-[10px] font-mono bg-white border border-warm-200 px-1.5 py-0.5 rounded">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 p-4 pt-0 flex flex-col gap-1">
          {navItems.map(item => {
            const active = pathname?.startsWith(item.href) ?? false
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-calm',
                  active
                    ? 'bg-rose-100 text-rose-500 font-medium'
                    : 'text-warm-500 hover:bg-warm-100 hover:text-warm-900'
                )}
              >
                <div className="relative shrink-0">
                  <item.icon size={18} strokeWidth={1.75} />
                  {item.href === '/agenda' && pendingToday > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">
                      {pendingToday}
                    </span>
                  )}
                </div>
                {item.label}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Usuário */}
        <div className="p-4 border-t border-warm-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {user ? initials(user.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-warm-900 truncate">{user?.name}</p>
              <p className="text-xs text-warm-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-warm-400 hover:text-rose-500 transition-calm"
              title="Sair"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 md:ml-60 flex flex-col min-h-screen">
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>

        {/* Bottom nav — mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-warm-200 z-30">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.slice(0, 4).map(item => {
              const active = pathname?.startsWith(item.href) ?? false
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-calm min-w-[44px] min-h-[44px] justify-center',
                    active ? 'text-rose-500' : 'text-warm-400'
                  )}
                >
                  <div className="relative">
                    <item.icon size={20} strokeWidth={active ? 2 : 1.75} />
                    {item.href === '/agenda' && pendingToday > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">
                        {pendingToday}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </main>
    </div>
    </ToastProvider>
  )
}
