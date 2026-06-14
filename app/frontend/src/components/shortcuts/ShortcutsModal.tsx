'use client'

import { X, Keyboard } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const shortcuts = [
  { section: 'Navegação', items: [
    { keys: ['⌘', 'K'], label: 'Busca global de clientes' },
    { keys: ['?'], label: 'Mostrar atalhos de teclado' },
    { keys: ['Esc'], label: 'Fechar modal / painel' },
  ]},
  { section: 'Agenda', items: [
    { keys: ['←', '→'], label: 'Semana anterior / próxima' },
  ]},
  { section: 'Busca global', items: [
    { keys: ['↑', '↓'], label: 'Navegar resultados' },
    { keys: ['↵'], label: 'Abrir cliente selecionado' },
  ]},
]

export function ShortcutsModal({ open, onClose }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-warm-500" />
            <h2 className="text-sm font-semibold text-warm-900">Atalhos de teclado</h2>
          </div>
          <button onClick={onClose} className="text-warm-400 hover:text-warm-600 transition-calm">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-5">
          {shortcuts.map(section => (
            <div key={section.section}>
              <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wide mb-2">{section.section}</p>
              <div className="flex flex-col gap-2">
                {section.items.map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-warm-700">{s.label}</span>
                    <div className="flex items-center gap-1">
                      {s.keys.map(k => (
                        <kbd key={k} className="px-2 py-0.5 rounded-md bg-warm-100 border border-warm-200 text-[11px] font-mono text-warm-600">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-warm-300 text-center mt-5">Precya · atalhos do teclado</p>
      </div>
    </div>
  )
}
