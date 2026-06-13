import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-calm disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-5',
  {
    variants: {
      variant: {
        primary:   'bg-rose-200 text-warm-900 hover:bg-rose-300 shadow-soft',
        secondary: 'bg-warm-100 text-warm-700 hover:bg-warm-200 border border-warm-200',
        ghost:     'text-warm-700 hover:bg-warm-100',
        success:   'bg-sage-100 text-sage-500 hover:bg-sage-200',
        outline:   'border border-rose-200 text-rose-500 hover:bg-rose-50',
        danger:    'bg-error-bg text-error-text hover:opacity-90',
      },
      size: {
        sm: 'h-9 px-4 text-sm rounded-lg',
        md: 'h-11 px-5 text-sm',
        lg: 'h-13 px-6 text-base',
        icon: 'h-11 w-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
