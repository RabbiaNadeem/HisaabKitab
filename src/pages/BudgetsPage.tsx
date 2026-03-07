import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, TrendingDown, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBudgets, useDeleteBudget } from '@/hooks/useBudgets'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { BudgetForm } from '@/components/forms/BudgetForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CurrencyDisplay, formatCurrency } from '@/components/shared/CurrencyDisplay'
import type { Budget } from '@/types/database'
import { cn } from '@/lib/utils'

function formatMonthYear(my: string) {
  const [year, month] = my.split('-')
  const d = new Date(Number(year), Number(month) - 1, 1)
  return d.toLocaleString('default', { month: 'long', year: 'numeric' })
}

function prevMonth(my: string) {
  const [year, month] = my.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(my: string) {
  const [year, month] = my.split('-').map(Number)
  const d = new Date(year, month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthYear() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function progressColor(pct: number) {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 90) return 'bg-red-400'
  if (pct >= 70) return 'bg-amber-400'
  return 'bg-green-500'
}

export default function BudgetsPage() {
  const [monthYear, setMonthYear] = useState(currentMonthYear)
  const [budgetFormOpen, setBudgetFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>()
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null)

  const deleteMutation = useDeleteBudget()

  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets(monthYear)
  const { data: categories = [], isLoading: catsLoading } = useCategories()
  const { data: allTransactions = [], isLoading: txLoading } = useTransactions()

  const isLoading = budgetsLoading || catsLoading || txLoading

  // Calculate spending per category for the selected month
  const spentByCategory = useMemo(() => {
    const [year, month] = monthYear.split('-').map(Number)
    const start = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const end = new Date(year, month, 0).toISOString().split('T')[0]

    const map: Record<string, number> = {}
    allTransactions.forEach((tx) => {
      if (tx.type !== 'expense') return
      const txDate = tx.transaction_date.split('T')[0]
      if (txDate < start || txDate > end) return
      const catId = tx.category_id ?? 'uncategorized'
      map[catId] = (map[catId] ?? 0) + tx.amount
    })
    return map
  }, [allTransactions, monthYear])

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const budgetMap = Object.fromEntries(budgets.map((b) => [b.category_id, b]))
  const categoriesWithBudgets = expenseCategories.filter((c) => budgetMap[c.id])
  const categoriesWithoutBudgets = expenseCategories.filter((c) => !budgetMap[c.id])

  // Totals
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spentByCategory[b.category_id] ?? 0), 0)
  const overallPct = totalBudgeted > 0 ? Math.min((totalSpent / totalBudgeted) * 100, 100) : 0

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonthYear(prevMonth(monthYear))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-base font-semibold">
            {formatMonthYear(monthYear)}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={monthYear === currentMonthYear()}
            onClick={() => setMonthYear(nextMonth(monthYear))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => { setEditingBudget(null); setEditingCategoryId(undefined); setBudgetFormOpen(true) }}
        >
          <Plus className="h-4 w-4 mr-1" /> Set Budget
        </Button>
      </div>

      {/* Summary card */}
      <Card>
        <CardContent className="pt-5">
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overall Budget</p>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <CurrencyDisplay amount={totalSpent} variant={totalSpent > totalBudgeted ? 'expense' : 'neutral'} size="lg" />
                    <span className="text-muted-foreground text-sm">
                      of <CurrencyDisplay amount={totalBudgeted} variant="neutral" size="sm" className="inline" /> budgeted
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <CurrencyDisplay
                    amount={Math.max(0, totalBudgeted - totalSpent)}
                    variant={totalSpent > totalBudgeted ? 'expense' : 'income'}
                    size="md"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{overallPct.toFixed(0)}% used</span>
                  <span>{budgets.length} categories budgeted</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', progressColor(overallPct))}
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget cards grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {categoriesWithBudgets.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categoriesWithBudgets.map((cat) => {
                const budget = budgetMap[cat.id]
                const spent = spentByCategory[cat.id] ?? 0
                const pct = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0
                const remaining = Math.max(0, budget.amount - spent)
                const isOver = spent > budget.amount

                return (
                  <Card key={cat.id} className="relative">
                    <CardContent className="pt-4 pb-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{cat.icon ?? '📦'}</span>
                          <span className="text-sm font-semibold">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isOver && (
                            <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500">
                              Over
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingBudget(budget)
                                  setEditingCategoryId(cat.id)
                                  setBudgetFormOpen(true)
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setDeletingBudget(budget)}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1.5 mb-3">
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', progressColor(pct))}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{pct.toFixed(0)}% used</span>
                          <span>{isOver ? 'Over by ' + formatCurrency(spent - budget.amount) : formatCurrency(remaining) + ' left'}</span>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                          <p className="text-muted-foreground mb-0.5">Spent</p>
                          <p className={cn('font-semibold', isOver ? 'text-red-500' : '')}>{formatCurrency(spent)}</p>
                        </div>
                        <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                          <p className="text-muted-foreground mb-0.5">Budget</p>
                          <p className="font-semibold">{formatCurrency(budget.amount)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Categories without budgets */}
          {categoriesWithoutBudgets.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Categories without a budget this month
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categoriesWithoutBudgets.map((cat) => {
                  const spent = spentByCategory[cat.id] ?? 0
                  return (
                    <Card key={cat.id} className="border-dashed opacity-70 hover:opacity-100 transition-opacity">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.icon ?? '📦'}</span>
                            <div>
                              <p className="text-sm font-medium">{cat.name}</p>
                              {spent > 0 && (
                                <p className="text-xs text-muted-foreground">{formatCurrency(spent)} spent</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => {
                              setEditingBudget(null)
                              setEditingCategoryId(cat.id)
                              setBudgetFormOpen(true)
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Set
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {expenseCategories.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <TrendingDown className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  No expense categories found. Add some transactions first.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <BudgetForm
        open={budgetFormOpen}
        onOpenChange={(open) => {
          setBudgetFormOpen(open)
          if (!open) { setEditingBudget(null); setEditingCategoryId(undefined) }
        }}
        budget={editingBudget}
        monthYear={monthYear}
        lockedCategoryId={editingCategoryId}
      />

      <ConfirmDialog
        open={!!deletingBudget}
        onOpenChange={(open) => { if (!open) setDeletingBudget(null) }}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (deletingBudget) {
            await deleteMutation.mutateAsync(deletingBudget.id)
            setDeletingBudget(null)
          }
        }}
      />
    </div>
  )
}
