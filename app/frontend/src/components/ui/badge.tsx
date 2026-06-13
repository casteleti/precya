import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-calm',
  {
    variants: {
      variant: {
        default:  'bg-warm-100 text-warm-700',
        rose:     'bg-rose-100 text-rose-500',
        sage:     'bg-sage-100 text-sage-500',
        sky:      'bg-sky-100 text-sky-500',
        gold:     'bg-amber-50 text-amber-700',
        success:  'bg-[#EFF8F0] text-[#5F8D61]',
        warning:  'bg-[#FFF4EC] text-[#D08B5A]',
        error:    'bg-[#FFF0EE] text-[#C96F63]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
