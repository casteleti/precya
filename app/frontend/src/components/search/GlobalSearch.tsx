'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Users, Loader2 } from 'lucide-react'
import { clientsApi, type Client } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setQuery(''); setResults([]); setSelected(0) }
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(() => {
      clientsApi.list({ search: query, limit: '8' })
        .then(r => { setResults(r.clients); setSelected(0) })
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  function go(client: Client) {
    router.push(`/clientes/${client.id}`)
    onClose()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) go(results[selected])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-warm-100">
          {loading ? (
            <Loader2 size={18} className="text-warm-400 animate-spin shrink-0" />
          ) : (
            <Search size={18} className="text-warm-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar cliente..."
            className="flex-1 text-sm text-warm-900 placeholder:text-warm-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-warm-300 hover:text-warm-500 transition-calm">
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center px-1.5 py-0.5 rounded text-[10px] text-warm-400 border border-warm-200 font-mono">
            esc
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="max-h-72 overflow-y-auto py-2">
            {results.map((c, i) => (
              <li key={c.id}>
                <button
                  onClick={() => go(c)}
                  onMouseEnter={() => setSelected(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-calm',
                    selected === i ? 'bg-rose-50' : 'hover:bg-warm-50'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-rose-500">
                      {c.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-900 truncate">{c.name}</p>
                    <p className="text-xs text-warm-400 truncate">{c.phone}</p>
                  </div>
                  <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
                    c.status === 'ativo' ? 'bg-sage-50 text-sage-500' :
                    c.status === 'risco' ? 'bg-amber-50 text-amber-500' :
                    'bg-warm-100 text-warm-500')}>
                    {c.status}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : query && !loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Users size={24} className="text-warm-300 mb-2" strokeWidth={1.5} />
            <p className="text-sm text-warm-500">Nenhum cliente encontrado para "{query}"</p>
          </div>
        ) : !query ? (
          <div className="px-4 py-3">
            <p className="text-xs text-warm-400">Digite para buscar clientes...</p>
          </div>
        ) : null}

        {results.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 border-t border-warm-100 text-[10px] text-warm-400">
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>esc fechar</span>
          </div>
        )}
      </div>
    </div>
  )
}
