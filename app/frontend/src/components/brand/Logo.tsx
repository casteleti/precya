import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
}

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Ícone — pétala estilizada */}
      <div className={cn(
        'rounded-xl bg-rose-gradient flex items-center justify-center shadow-soft',
        size === 'sm' ? 'w-7 h-7' : size === 'md' ? 'w-9 h-9' : 'w-12 h-12'
      )}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7'}
        >
          <path
            d="M12 3C9 3 6 6 6 10c0 3 1.5 5.5 4 7l2 1.5 2-1.5c2.5-1.5 4-4 4-7 0-4-3-7-6-7z"
            fill="#C96F63"
            fillOpacity="0.7"
          />
          <path
            d="M12 7c-1.5 0-3 1.5-3 3.5 0 1.5.75 2.75 2 3.5l1 .75 1-.75c1.25-.75 2-2 2-3.5C15 8.5 13.5 7 12 7z"
            fill="#C96F63"
          />
        </svg>
      </div>
      <span className={cn('font-medium text-warm-900 tracking-tight', sizes[size])}>
        Precya
      </span>
    </div>
  )
}
