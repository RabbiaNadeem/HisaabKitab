import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useTransactions } from './useTransactions'
import { useBudgets, useCurrentMonthYear } from './useBudgets'
import { useGoals } from './useGoals'
import { useDashboard } from './useDashboard'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Keep a ref to the latest messages for building the API payload
  const messagesRef = useRef<ChatMessage[]>([])
  messagesRef.current = messages

  // Financial data hooks
  const { data: allTransactions = [] } = useTransactions()
  const currentMonthYear = useCurrentMonthYear()
  const { data: budgets = [] } = useBudgets(currentMonthYear)
  const { data: goals = [] } = useGoals()
  const { stats, categoryBreakdown, monthlyTrend } = useDashboard()

  const buildFinancialContext = useCallback(() => {
    const now = new Date()
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' })

    // Recent transactions snapshot
    const recentTransactions = allTransactions.slice(0, 10).map((t) => ({
      date: t.transaction_date.split('T')[0],
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.categories?.name ?? 'Uncategorized',
    }))

    // Compute spending per category_id for the current month
    const startOfMonth = `${currentMonthYear}-01`
    const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const endOfMonth = endOfMonthDate.toISOString().split('T')[0]

    const spentByCategoryId: Record<string, number> = {}
    allTransactions
      .filter((t) => {
        const d = t.transaction_date.split('T')[0]
        return d >= startOfMonth && d <= endOfMonth && t.type === 'expense'
      })
      .forEach((t) => {
        const key = t.category_id ?? '__none__'
        spentByCategoryId[key] = (spentByCategoryId[key] ?? 0) + t.amount
      })

    const budgetSummary = budgets.map((b) => ({
      category: b.categories?.name ?? 'Unknown',
      budgeted: b.amount,
      spent: spentByCategoryId[b.category_id] ?? 0,
    }))

    const goalsSummary = goals.map((g) => ({
      name: g.name,
      target: g.target_amount,
      current: g.current_saved,
      progressPct: g.target_amount > 0 ? (g.current_saved / g.target_amount) * 100 : 0,
      status: g.status,
      deadline: g.target_date,
    }))

    return {
      currentMonth: {
        name: monthName,
        income: stats.income,
        expenses: stats.expenses,
        balance: stats.balance,
        savingsRate: stats.savingsRate,
      },
      recentTransactions,
      budgets: budgetSummary,
      goals: goalsSummary,
      categoryBreakdown: categoryBreakdown.map((c) => ({ name: c.name, value: c.value })),
      monthlyTrend: monthlyTrend.map((m) => ({
        month: m.month,
        income: m.income,
        expenses: m.expenses,
      })),
    }
  }, [allTransactions, budgets, goals, stats, categoryBreakdown, monthlyTrend, currentMonthYear])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)

      try {
        const financialContext = buildFinancialContext()

        // Build the messages array for the API (role + content only)
        const apiMessages = [...messagesRef.current, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: { messages: apiMessages, financialContext },
        })

        if (error) {
          // Log the full error object — the raw context often contains the real reason
          console.error('[ai-chat] Supabase function error:', error)
          console.error('[ai-chat] error.context:', (error as any).context)
          throw new Error(error.message || 'Chat request failed')
        }
        if (!data?.message) {
          console.error('[ai-chat] Unexpected response shape:', data)
          throw new Error('Empty response from AI')
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        console.error('[ai-chat] sendMessage error:', err)
        const detail = err instanceof Error ? err.message : String(err)
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content:
              `Oops! Something went wrong 😅 — ${detail}. Please try again!`,
            timestamp: new Date(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading, buildFinancialContext],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, isLoading, sendMessage, clearMessages }
}
