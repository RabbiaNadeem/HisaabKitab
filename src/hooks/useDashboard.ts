import { useMemo } from 'react'
import { useTransactions } from './useTransactions'
import { useCategories } from './useCategories'
import type { MonthlyTrend, CategoryBreakdown, Transaction } from '@/types/database'

const CATEGORY_COLORS = [
  '#4ade80', '#f87171', '#60a5fa', '#fbbf24', '#a78bfa',
  '#34d399', '#fb923c', '#38bdf8', '#f472b6', '#a3e635',
]

function getMonthLabel(date: Date) {
  return date.toLocaleString('default', { month: 'short' })
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

export function useDashboard() {
  const now = new Date()
  const currentMonthStart = startOfMonth(now).toISOString().split('T')[0]
  const currentMonthEnd = endOfMonth(now).toISOString().split('T')[0]

  // All transactions (no filter) – we'll slice in JS for performance
  const { data: allTransactions = [], isLoading: txLoading } = useTransactions()
  const { data: categories = [], isLoading: catLoading } = useCategories()

  const stats = useMemo(() => {
    const thisMonthTx = allTransactions.filter((t) => {
      const d = t.transaction_date.split('T')[0]
      return d >= currentMonthStart && d <= currentMonthEnd
    })

    const income = thisMonthTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)

    const expenses = thisMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    const balance = income - expenses
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0

    return { income, expenses, balance, savingsRate }
  }, [allTransactions, currentMonthStart, currentMonthEnd])

  const monthlyTrend = useMemo((): MonthlyTrend[] => {
    const result: MonthlyTrend[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = startOfMonth(d).toISOString().split('T')[0]
      const end = endOfMonth(d).toISOString().split('T')[0]
      const monthTx = allTransactions.filter((t) => {
        const date = t.transaction_date.split('T')[0]
        return date >= start && date <= end
      })
      const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      result.push({ month: getMonthLabel(d), income, expenses, balance: income - expenses })
    }
    return result
  }, [allTransactions])

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const thisMon = allTransactions.filter((t) => {
      const d = t.transaction_date.split('T')[0]
      return d >= currentMonthStart && d <= currentMonthEnd && t.type === 'expense'
    })

    const grouped: Record<string, number> = {}
    thisMon.forEach((t) => {
      const catName = t.categories?.name ?? 'Uncategorized'
      grouped[catName] = (grouped[catName] ?? 0) + t.amount
    })

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value], i) => ({
        name,
        value,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }))
  }, [allTransactions, currentMonthStart, currentMonthEnd])

  const recentTransactions: Transaction[] = useMemo(
    () => allTransactions.slice(0, 10),
    [allTransactions]
  )

  return {
    stats,
    monthlyTrend,
    categoryBreakdown,
    recentTransactions,
    categories,
    isLoading: txLoading || catLoading,
  }
}
