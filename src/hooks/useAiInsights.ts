import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export type InsightType = 'positive' | 'warning' | 'info' | 'negative'

export interface AiInsight {
  type: InsightType
  text: string
}

export interface AiInsightsResult {
  insights: AiInsight[]
}

export interface FinancialSummaryInput {
  currentMonth: {
    name: string
    income: number
    expenses: number
    savingsRate: number
  }
  prevMonth: {
    name: string
    income: number
    expenses: number
  }
  categoryBreakdown: Array<{
    name: string
    amount: number
    percentage: number
  }>
  monthlyTrend: Array<{
    month: string
    income: number
    expenses: number
  }>
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Fetch AI-generated financial insights for the current month.
 * Results are cached indefinitely — use `refresh()` to force a new generation.
 *
 * @example
 * const { data, isPending, refresh } = useAiInsights(summary)
 */
export function useAiInsights(summary: FinancialSummaryInput | null) {
  const queryClient = useQueryClient()
  const [refreshKey, setRefreshKey] = useState(0)

  const monthKey = summary?.currentMonth?.name ?? ''
  const hasData =
    summary !== null &&
    (summary.currentMonth.income > 0 || summary.currentMonth.expenses > 0)

  const query = useQuery<AiInsightsResult>({
    queryKey: ['ai-insights', monthKey, refreshKey],
    // Cache indefinitely — only invalidated when refreshKey changes
    staleTime: Infinity,
    enabled: hasData,
    retry: 1,
    queryFn: async () => {
      if (!summary) throw new Error('No financial data available')

      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: summary,
      })

      if (error) {
        throw new Error(error.message || 'Failed to generate insights')
      }

      if (!data?.insights || !Array.isArray(data.insights) || data.insights.length === 0) {
        throw new Error('Unexpected response format from AI insights')
      }

      // Validate each insight has the expected shape
      const validTypes: InsightType[] = ['positive', 'warning', 'info', 'negative']
      const validated = (data.insights as AiInsight[]).filter(
        (i) => validTypes.includes(i.type) && typeof i.text === 'string' && i.text.length > 0,
      )

      if (validated.length === 0) throw new Error('No valid insights returned')

      return { insights: validated } satisfies AiInsightsResult
    },
  })

  const refresh = useCallback(() => {
    queryClient.removeQueries({ queryKey: ['ai-insights', monthKey, refreshKey] })
    setRefreshKey((k) => k + 1)
  }, [queryClient, monthKey, refreshKey])

  return { ...query, refresh }
}
