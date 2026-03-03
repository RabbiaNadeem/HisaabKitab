import { useState } from 'react'
import {
  AreaChart, Area,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Wallet, Percent,
  Plus, Sparkles, Pencil, Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthContext } from '@/contexts/AuthContext'
import { useDashboard } from '@/hooks/useDashboard'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { CurrencyDisplay, formatCurrency } from '@/components/shared/CurrencyDisplay'
import { CategoryBadge } from '@/components/shared/CategoryBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TransactionForm } from '@/components/forms/TransactionForm'
import type { Transaction } from '@/types/database'
import { format } from 'date-fns'

function StatCard({
  title,
  value,
  icon: Icon,
  variant,
  sub,
}: {
  title: string
  value: string
  icon: React.ElementType
  variant: 'income' | 'expense' | 'balance' | 'savings'
  sub?: string
}) {
  const colorMap = {
    income:  { bg: 'bg-primary/10',  text: 'text-primary',  icon: 'text-primary' },
    expense: { bg: 'bg-red-500/10',    text: 'text-red-500 dark:text-red-400',      icon: 'text-red-500'   },
    balance: { bg: 'bg-blue-500/10',   text: 'text-blue-500 dark:text-blue-400',    icon: 'text-blue-500'  },
    savings: { bg: 'bg-purple-500/10', text: 'text-purple-500 dark:text-purple-400', icon: 'text-purple-500' },
  }
  const c = colorMap[variant]
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`mt-1 text-2xl font-bold ${c.text} truncate`}>{value}</p>
            {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg} ml-3`}>
            <Icon className={`h-5 w-5 ${c.icon}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: { dataKey: string; value: number; color: string }) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey === 'income' ? '↑ Income' : '↓ Expenses'}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover p-2 shadow-lg text-xs">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthContext()
  const { stats, monthlyTrend, categoryBreakdown, recentTransactions, isLoading } = useDashboard()
  const deleteMutation = useDeleteTransaction()

  const [txFormOpen, setTxFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null)

  const fullName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? 'there'
  const firstName = fullName.split(' ')[0]
  const currentMonth = format(new Date(), 'MMMM yyyy')

  const savingsLabel = `${stats.savingsRate.toFixed(1)}%`

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back, {firstName} 👋
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's your financial overview for {currentMonth}
        </p>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Income"
            value={formatCurrency(stats.income)}
            icon={TrendingUp}
            variant="income"
            sub={currentMonth}
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(stats.expenses)}
            icon={TrendingDown}
            variant="expense"
            sub={currentMonth}
          />
          <StatCard
            title="Net Balance"
            value={formatCurrency(stats.balance)}
            icon={Wallet}
            variant="balance"
            sub={stats.balance >= 0 ? 'Positive balance' : 'Overspent'}
          />
          <StatCard
            title="Savings Rate"
            value={savingsLabel}
            icon={Percent}
            variant="savings"
            sub="of income saved"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Area Chart — 6-month trend */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Income vs Expenses (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke="#4ade80" strokeWidth={2} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart — category breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[220px] w-full rounded-full mx-auto" />
            ) : categoryBreakdown.length === 0 ? (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground text-sm">
                No expenses this month
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {categoryBreakdown.slice(0, 4).map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="flex-1 truncate text-muted-foreground">{entry.name}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(entry.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Transactions */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <a href="/transactions" className="text-xs text-primary">View all →</a>
            </Button>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {isLoading ? (
              <div className="px-6 pb-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : recentTransactions.length === 0 ? (
              <p className="px-6 pb-4 text-sm text-muted-foreground">No transactions yet. Add your first one!</p>
            ) : (
              <div className="divide-y divide-border">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors group">
                    {/* Category icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-base">
                      {tx.categories?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
                    </div>
                    {/* Description + date */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(tx.transaction_date), 'dd MMM')}
                        </span>
                        <CategoryBadge category={tx.categories} size="sm" showIcon={false} />
                      </div>
                    </div>
                    {/* Amount */}
                    <CurrencyDisplay amount={tx.amount} variant={tx.type === 'income' ? 'income' : 'expense'} showSign size="sm" />
                    {/* Actions (visible on hover) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Insights placeholder */}
        <Card className="lg:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Insights
              <span className="text-[10px] font-normal bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                Coming Soon
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { icon: '📊', text: 'Your spending pattern analysis will appear here' },
              { icon: '💡', text: 'Personalized savings tips based on your habits' },
              { icon: '⚠️', text: 'Budget alerts and anomaly detection' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3">
                <span className="text-base shrink-0">{item.icon}</span>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              {/* TODO: AI — Connect to AI service here */}
              Powered by AI · Analysis engine coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Floating + button */}
      <button
        onClick={() => { setEditingTx(null); setTxFormOpen(true) }}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Transaction form dialog */}
      <TransactionForm
        open={txFormOpen}
        onOpenChange={(open) => {
          setTxFormOpen(open)
          if (!open) setEditingTx(null)
        }}
        transaction={editingTx}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!deletingTx}
        onOpenChange={(open) => { if (!open) setDeletingTx(null) }}
        title="Delete Transaction"
        description={`Delete "${deletingTx?.description}"? This cannot be undone.`}
        onConfirm={() => {
          if (deletingTx) {
            deleteMutation.mutate(deletingTx.id, { onSuccess: () => setDeletingTx(null) })
          }
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
