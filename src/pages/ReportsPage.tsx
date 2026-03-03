import { useState, useMemo } from 'react'
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from 'date-fns'
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { Download, CalendarIcon, TrendingDown, TrendingUp, BarChart3, Hash } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { formatCurrency, CurrencyDisplay } from '@/components/shared/CurrencyDisplay'
import { cn } from '@/lib/utils'
import Papa from 'papaparse'

type Preset = 'this-month' | 'last-3' | 'last-6' | 'custom'

const CHART_COLORS = ['#4ade80', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa', '#34d399', '#fb923c']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LineTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <p className="text-blue-400">Balance: {formatCurrency(payload[0]?.value ?? 0)}</p>
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

export default function ReportsPage() {
  const now = new Date()
  const [preset, setPreset] = useState<Preset>('last-3')
  const [customFrom, setCustomFrom] = useState<Date | undefined>(startOfMonth(now))
  const [customTo, setCustomTo] = useState<Date | undefined>(now)

  const { data: allTransactions = [], isLoading: txLoading } = useTransactions()
  const { data: categories = [], isLoading: catsLoading } = useCategories()
  const isLoading = txLoading || catsLoading

  // Resolve date range from preset
  const { dateFrom, dateTo } = useMemo(() => {
    switch (preset) {
      case 'this-month':
        return { dateFrom: startOfMonth(now), dateTo: now }
      case 'last-3':
        return { dateFrom: startOfMonth(subMonths(now, 2)), dateTo: now }
      case 'last-6':
        return { dateFrom: startOfMonth(subMonths(now, 5)), dateTo: now }
      case 'custom':
        return { dateFrom: customFrom ?? startOfMonth(now), dateTo: customTo ?? now }
    }
  }, [preset, customFrom, customTo])

  const fromStr = dateFrom.toISOString().split('T')[0]
  const toStr = dateTo.toISOString().split('T')[0]

  // Filtered transactions
  const filteredTx = useMemo(() => {
    return allTransactions.filter((tx) => {
      const d = tx.transaction_date.split('T')[0]
      return d >= fromStr && d <= toStr
    })
  }, [allTransactions, fromStr, toStr])

  // Summary stats
  const summaryStats = useMemo(() => {
    const income = filteredTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = filteredTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const days = Math.max(1, differenceInDays(dateTo, dateFrom) + 1)
    const avgDaily = expenses / days

    // Biggest category
    const catMap: Record<string, number> = {}
    filteredTx.filter((t) => t.type === 'expense').forEach((t) => {
      const name = t.categories?.name ?? 'Uncategorized'
      catMap[name] = (catMap[name] ?? 0) + t.amount
    })
    const biggestCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]

    return { income, expenses, avgDaily, biggestCat, txCount: filteredTx.length, balance: income - expenses }
  }, [filteredTx, dateFrom, dateTo])

  // Monthly bar chart data
  const monthlyData = useMemo(() => {
    const months: string[] = []
    let cur = startOfMonth(dateFrom)
    while (cur <= dateTo) {
      months.push(format(cur, 'MMM yyyy'))
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    }
    return months.map((label) => {
      const [mStr, yStr] = label.split(' ')
      const month = new Date(`${mStr} 1, ${yStr}`)
      const start = startOfMonth(month).toISOString().split('T')[0]
      const end = endOfMonth(month).toISOString().split('T')[0]
      const mTx = filteredTx.filter((t) => {
        const d = t.transaction_date.split('T')[0]
        return d >= start && d <= end
      })
      const income = mTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = mTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      return { month: format(month, 'MMM'), Income: income, Expenses: expenses }
    })
  }, [filteredTx, dateFrom, dateTo])

  // Cumulative balance line chart
  const cumulativeData = useMemo(() => {
    const sorted = [...filteredTx].sort(
      (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    )
    let balance = 0
    const result: { date: string; balance: number }[] = []
    sorted.forEach((tx) => {
      balance += tx.type === 'income' ? tx.amount : -tx.amount
      result.push({ date: format(new Date(tx.transaction_date), 'dd MMM'), balance })
    })
    // Deduplicate by date (keep last value per date)
    const map = new Map<string, number>()
    result.forEach(({ date, balance: b }) => map.set(date, b))
    return Array.from(map.entries()).map(([date, balance]) => ({ date, balance }))
  }, [filteredTx])

  // Category breakdown for pie
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    filteredTx.filter((t) => t.type === 'expense').forEach((t) => {
      const name = t.categories?.name ?? 'Uncategorized'
      map[name] = (map[name] ?? 0) + t.amount
    })
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
  }, [filteredTx])

  // Export CSV
  const exportCSV = () => {
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))
    const rows = filteredTx.map((tx) => ({
      Date: tx.transaction_date.split('T')[0],
      Description: tx.description,
      Type: tx.type,
      Amount: tx.amount,
      Currency: tx.currency,
      Category: tx.category_id ? catMap[tx.category_id] ?? '' : '',
      Notes: tx.notes ?? '',
      Tags: tx.tags?.join(', ') ?? '',
    }))
    const csv = Papa.unparse(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hisaabkitab-${fromStr}-to-${toStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const presets: { key: Preset; label: string }[] = [
    { key: 'this-month', label: 'This Month' },
    { key: 'last-3', label: 'Last 3 Months' },
    { key: 'last-6', label: 'Last 6 Months' },
    { key: 'custom', label: 'Custom' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Date range controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 bg-muted rounded-lg p-1">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                preset === p.key
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customFrom ? format(customFrom, 'dd MMM yyyy') : 'From'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-xs">→</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customTo ? format(customTo, 'dd MMM yyyy') : 'To'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus />
              </PopoverContent>
            </Popover>
          </>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={exportCSV} className="text-xs gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Range label */}
      <p className="text-xs text-muted-foreground">
        Showing {format(dateFrom, 'dd MMM yyyy')} – {format(dateTo, 'dd MMM yyyy')} · {summaryStats.txCount} transactions
      </p>

      {/* Summary stat cards */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingDown className="h-4 w-4" />
                <span className="text-xs font-medium">Avg Daily Spend</span>
              </div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(summaryStats.avgDaily)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium">Biggest Category</span>
              </div>
              <p className="text-xl font-bold text-foreground truncate">
                {summaryStats.biggestCat?.[0] ?? '—'}
              </p>
              {summaryStats.biggestCat && (
                <p className="text-xs text-muted-foreground">{formatCurrency(summaryStats.biggestCat[1])}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Net Balance</span>
              </div>
              <CurrencyDisplay amount={summaryStats.balance} variant="auto" size="lg" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Hash className="h-4 w-4" />
                <span className="text-xs font-medium">Transactions</span>
              </div>
              <p className="text-xl font-bold">{summaryStats.txCount}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row 1: Bar + Pie */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                  <Bar dataKey="Income" fill="#4ade80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : categoryBreakdown.length === 0 ? (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No expenses in range
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {categoryBreakdown.map((e) => (
                    <div key={e.name} className="flex items-center gap-2 text-xs">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="flex-1 truncate text-muted-foreground">{e.name}</span>
                      <span className="font-medium tabular-nums">{formatCurrency(e.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line chart — cumulative balance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cumulative Net Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : cumulativeData.length === 0 ? (
            <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
              No transactions in range
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={cumulativeData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={55} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<LineTooltip />} />
                <Line type="monotone" dataKey="balance" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
