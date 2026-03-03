import { cn } from '@/lib/utils'
import type { Category } from '@/types/database'

// Derive a stable color from category id or name
const PALETTE = [
  'bg-green-500/15 text-green-600 dark:text-green-400',
  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  'bg-pink-500/15 text-pink-600 dark:text-pink-400',
  'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400',
  'bg-red-500/15 text-red-600 dark:text-red-400',
  'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
]

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

interface CategoryBadgeProps {
  category?: Category | null
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md'
}

export function CategoryBadge({
  category,
  className,
  showIcon = true,
  size = 'md',
}: CategoryBadgeProps) {
  if (!category) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
          'bg-muted text-muted-foreground',
          size === 'sm' && 'text-[11px]',
          className,
        )}
      >
        Uncategorized
      </span>
    )
  }

  const colorClass = PALETTE[hashStr(category.id) % PALETTE.length]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass,
        size === 'sm' && 'text-[11px]',
        className,
      )}
    >
      {showIcon && category.icon && (
        <span className="leading-none">{category.icon}</span>
      )}
      {category.name}
    </span>
  )
}
