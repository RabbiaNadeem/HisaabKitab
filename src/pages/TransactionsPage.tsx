import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Search, Pencil, Trash2, CalendarIcon,
  FileText, ChevronLeft, ChevronRight, Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TransactionForm } from '@/components/forms/TransactionForm'
import type { Transaction, TransactionType } from '@/types/database'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 25

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [page, setPage] = useState(1)

  const [txFormOpen, setTxFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)

  const { data: allTransactions = [], isLoading } = useTransactions()
  const { data: categories = [] } = useCategories()
  const deleteMutation = useDeleteTransaction()

  // Client-side filtering
  const filtered = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false
      if (categoryFilter !== 'all' && tx.category_id !== categoryFilter) return false
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false
      if (dateFrom) {
        const txDate = new Date(tx.transaction_date)
        if (txDate < dateFrom) return false
      }
      if (dateTo) {
        const txDate = new Date(tx.transaction_date)
        const end = new Date(dateTo); end.setHours(23, 59, 59)
        if (txDate > end) return false
      }
      return true
    })
  }, [allTransactions, typeFilter, categoryFilter, search, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleFilterChange = () => setPage(1)

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Filters bar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions…"
                className="pl-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); handleFilterChange() }}
              />
            </div>

            {/* Type toggle */}
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['all', 'income', 'expense'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTypeFilter(t); handleFilterChange() }}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                    typeFilter === t
                      ? 'bg-background shadow text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t === 'all' ? 'All' : t === 'income' ? '↑ Income' : '↓ Expense'}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <Select
              value={categoryFilter}
              onValueChange={(v) => { setCategoryFilter(v); handleFilterChange() }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date from */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('text-xs gap-1.5', !dateFrom && 'text-muted-foreground')}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateFrom ? format(dateFrom, 'dd MMM') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); handleFilterChange() }} initialFocus />
              </PopoverContent>
            </Popover>

            {/* Date to */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn('text-xs gap-1.5', !dateTo && 'text-muted-foreground')}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {dateTo ? format(dateTo, 'dd MMM') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); handleFilterChange() }} initialFocus />
              </PopoverContent>
            </Popover>

            {/* Clear filters */}
            {(search || typeFilter !== 'all' || categoryFilter !== 'all' || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => {
                  setSearch(''); setTypeFilter('all'); setCategoryFilter('all')
                  setDateFrom(undefined); setDateTo(undefined); setPage(1)
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== allTransactions.length && ` (filtered from ${allTransactions.length})`}</p>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditingTx(null); setTxFormOpen(true) }}
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No transactions found</p>
              <p className="text-xs mt-1">Try adjusting your filters or add a new transaction.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6 w-28">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-10">Notes</TableHead>
                  <TableHead className="w-20 pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((tx) => (
                  <TableRow key={tx.id} className="group">
                    <TableCell className="pl-6 text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(tx.transaction_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{tx.categories?.icon ?? (tx.type === 'income' ? '💰' : '💸')}</span>
                        <span className="text-sm font-medium">{tx.description}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={tx.categories} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-medium capitalize',
                          tx.type === 'income'
                            ? 'border-green-500/30 text-green-600 dark:text-green-400'
                            : 'border-red-500/30 text-red-600 dark:text-red-400',
                        )}
                      >
                        {tx.type === 'income' ? '↑' : '↓'} {tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={tx.amount} variant={tx.type === 'income' ? 'income' : 'expense'} showSign />
                    </TableCell>
                    <TableCell>
                      {tx.notes && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <FileText className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-xs">{tx.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => { setEditingTx(tx); setTxFormOpen(true) }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeletingTx(tx)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground text-xs">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <TransactionForm
        open={txFormOpen}
        onOpenChange={(open) => { setTxFormOpen(open); if (!open) setEditingTx(null) }}
        transaction={editingTx}
      />

      <ConfirmDialog
        open={!!deletingTx}
        onOpenChange={(open) => { if (!open) setDeletingTx(null) }}
        title="Delete Transaction"
        description={`Delete "${deletingTx?.description}"? This cannot be undone.`}
        onConfirm={() => {
          if (deletingTx) deleteMutation.mutate(deletingTx.id, { onSuccess: () => setDeletingTx(null) })
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
