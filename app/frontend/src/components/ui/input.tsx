import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, type, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-warm-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'h-13 w-full rounded-[14px] border border-warm-200 bg-white px-4',
            'text-warm-900 placeholder:text-warm-400',
            'shadow-input transition-calm',
            'focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="text-xs text-warm-500">{hint}</p>
        )}
        {error && (
          <p className="text-xs text-rose-500">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
