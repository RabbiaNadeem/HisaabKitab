import { RefreshCw, Sparkles, TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiInsights, type FinancialSummaryInput, type AiInsight, type InsightType } from '@/hooks/useAiInsights'

// ─── Insight type config ──────────────────────────────────────────────────────

const INSIGHT_CONFIG: Record<
  InsightType,
  { icon: React.ElementType; color: string; bg: string; border: string }
> = {
  positive: {
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  negative: {
    icon: TrendingDown,
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
}

// ─── Single insight row ───────────────────────────────────────────────────────

function InsightItem({ insight }: { insight: AiInsight }) {
  const config = INSIGHT_CONFIG[insight.type] ?? INSIGHT_CONFIG.info
  const Icon = config.icon

  return (
    <div
      className={`flex items-start gap-2.5 rounded-lg border ${config.border} ${config.bg} p-3`}
    >
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${config.color}`} />
      <p className="text-xs leading-relaxed text-foreground">{insight.text}</p>
    </div>
  )
}

// ─── Placeholder when there's no data ────────────────────────────────────────

function PlaceholderContent() {
  return (
    <div className="space-y-2">
      {[
        { icon: '📊', text: 'Add transactions to see your spending analysis' },
        { icon: '💡', text: 'Personalized savings tips based on your habits' },
        { icon: '⚠️', text: 'Budget alerts and anomaly detection' },
      ].map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3">
          <span className="shrink-0 text-base">{item.icon}</span>
          <p className="text-xs leading-relaxed text-muted-foreground">{item.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main card ───────────────────────────────────────────────────────────────

interface AiInsightsCardProps {
  summary: FinancialSummaryInput | null
}

export function AiInsightsCard({ summary }: AiInsightsCardProps) {
  const { data, isPending, isError, error, refresh, isFetching } = useAiInsights(summary)

  const hasData =
    summary !== null &&
    (summary.currentMonth.income > 0 || summary.currentMonth.expenses > 0)

  return (
    <Card className="lg:col-span-2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Insights
          </CardTitle>
          {hasData && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={refresh}
              disabled={isFetching}
              title="Regenerate insights"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        {!hasData ? (
          <PlaceholderContent />
        ) : isPending || isFetching ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : isError ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3">
              <p className="text-xs text-destructive">
                {error instanceof Error ? error.message : 'Failed to generate insights. Try again.'}
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={refresh}>
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.insights.map((insight, i) => (
              <InsightItem key={i} insight={insight} />
            ))}
          </div>
        )}

        <p className="pt-1 text-center text-[11px] text-muted-foreground">
          Powered by AI · Updates with your transactions
        </p>
      </CardContent>
    </Card>
  )
}
