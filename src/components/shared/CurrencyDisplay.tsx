import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  amount: number
  variant?: 'income' | 'expense' | 'neutral' | 'auto'
  className?: string
  showSign?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function formatCurrency(amount: number): string {
  return (
    'Rs.\u00a0' +
    new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(amount))
  )
}

export function CurrencyDisplay({
  amount,
  variant = 'neutral',
  className,
  showSign = false,
  size = 'md',
}: CurrencyDisplayProps) {
  const effectiveVariant =
    variant === 'auto' ? (amount >= 0 ? 'income' : 'expense') : variant

  const colorClass =
    effectiveVariant === 'income'
      ? 'text-primary'
      : effectiveVariant === 'expense'
        ? 'text-red-500 dark:text-red-400'
        : 'text-foreground'

  const sizeClass =
    size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl font-bold' : 'text-base font-medium'

  const sign = showSign ? (amount >= 0 ? '+' : '−') : ''

  return (
    <span className={cn(colorClass, sizeClass, 'tabular-nums', className)}>
      {sign}
      {formatCurrency(amount)}
    </span>
  )
}
