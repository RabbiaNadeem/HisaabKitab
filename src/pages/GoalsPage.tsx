import { useState } from 'react'
import { format, differenceInCalendarDays } from 'date-fns'
import { Plus, Pencil, Trash2, Target, Sparkles, Trophy, Flag } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useGoals, useDeleteGoal, useUpdateGoal } from '@/hooks/useGoals'
import { GoalForm } from '@/components/forms/GoalForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { CurrencyDisplay, formatCurrency } from '@/components/shared/CurrencyDisplay'
import type { Goal } from '@/types/database'
import { cn } from '@/lib/utils'

const AI_MOTIVATIONS = [
  'Every rupee saved brings you closer to your goal. Keep going!',
  'Consistency is key — even small amounts add up over time.',
  'You\'re building financial security, one step at a time. Great work!',
  'Stay focused on your goal. Future you will thank you!',
  'Small savings today create big opportunities tomorrow.',
  'Progress is progress, no matter how small. Keep it up!',
]

function getDaysBadge(targetDate: string, status: Goal['status']) {
  if (status === 'achieved') return { label: '🏆 Achieved', className: 'bg-primary/10 text-primary border-primary/30' }
  if (status === 'abandoned') return { label: 'Abandoned', className: 'bg-muted text-muted-foreground border-border' }
  const days = differenceInCalendarDays(new Date(targetDate), new Date())
  if (days < 0) return { label: 'Overdue', className: 'bg-red-500/10 text-red-500 border-red-500/30' }
  if (days === 0) return { label: 'Due today', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' }
  if (days <= 30) return { label: `${days}d left`, className: 'bg-amber-500/10 text-amber-600 border-amber-500/30' }
  return { label: `${days}d left`, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' }
}

function statusBadge(status: Goal['status']) {
  switch (status) {
    case 'achieved': return <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600 dark:text-green-400"><Trophy className="h-2.5 w-2.5 mr-1" />Achieved</Badge>
    case 'abandoned': return <Badge variant="outline" className="text-[10px] border-border text-muted-foreground"><Flag className="h-2.5 w-2.5 mr-1" />Abandoned</Badge>
    default: return <Badge variant="outline" className="text-[10px] border-primary/30 text-primary"><Target className="h-2.5 w-2.5 mr-1" />Active</Badge>
  }
}

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals()
  const deleteMutation = useDeleteGoal()
  const updateMutation = useUpdateGoal()

  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)

  const active = goals.filter((g) => g.status === 'active')
  const others = goals.filter((g) => g.status !== 'active')

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const pct = goal.target_amount > 0
      ? Math.min((goal.current_saved / goal.target_amount) * 100, 100)
      : 0
    const daysBadge = getDaysBadge(goal.target_date, goal.status)
    const motivationText = AI_MOTIVATIONS[Math.abs(goal.id.charCodeAt(0) - 97) % AI_MOTIVATIONS.length]

    return (
      <Card className={cn('flex flex-col', goal.status === 'abandoned' && 'opacity-60')}>
        <CardContent className="pt-5 pb-3 flex-1">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {statusBadge(goal.status)}
                <Badge
                  variant="outline"
                  className={cn('text-[10px]', daysBadge.className)}
                >
                  {daysBadge.label}
                </Badge>
              </div>
              <h3 className="text-base font-bold mt-2 leading-tight">{goal.name}</h3>
              {goal.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{goal.description}</p>
              )}
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <Pencil className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditingGoal(goal); setGoalFormOpen(true) }}>
                  <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                {goal.status === 'active' && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: goal.id, status: 'achieved' })}
                  >
                    <Trophy className="h-3.5 w-3.5 mr-2 text-green-500" /> Mark as Achieved
                  </DropdownMenuItem>
                )}
                {goal.status === 'active' && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: goal.id, status: 'abandoned' })}
                  >
                    <Flag className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Abandon
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeletingGoal(goal)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saved</p>
                <CurrencyDisplay amount={goal.current_saved} variant="income" size="lg" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Target</p>
                <CurrencyDisplay amount={goal.target_amount} variant="neutral" />
              </div>
            </div>
            <div className="space-y-1">
              <Progress
                value={pct}
                className="h-2.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{pct.toFixed(1)}% complete</span>
                <span>
                  {pct < 100
                    ? formatCurrency(goal.target_amount - goal.current_saved) + ' to go'
                    : '🎉 Goal reached!'}
                </span>
              </div>
            </div>
          </div>

          {/* Target date */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Target date</span>
            <span className="font-medium">{format(new Date(goal.target_date), 'dd MMM yyyy')}</span>
          </div>
        </CardContent>

        {/* AI Motivation (active goals only) */}
        {goal.status === 'active' && (
          <CardFooter className="pt-0 pb-4">
            {/* TODO: AI — replace static text with real AI motivation */}
            <div className="w-full flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{motivationText}</p>
            </div>
          </CardFooter>
        )}
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Savings Goals</h2>
          <p className="text-sm text-muted-foreground">{active.length} active goal{active.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditingGoal(null); setGoalFormOpen(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Add Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="py-20 flex flex-col items-center text-center">
            <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-base font-semibold mb-1">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Set savings targets and track your progress towards financial milestones.
            </p>
            <Button onClick={() => setGoalFormOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Create your first goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Active goals */}
          {active.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((g) => <GoalCard key={g.id} goal={g} />)}
            </div>
          )}

          {/* Completed/abandoned goals */}
          {others.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Past Goals</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((g) => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
        </>
      )}

      <GoalForm
        open={goalFormOpen}
        onOpenChange={(open) => { setGoalFormOpen(open); if (!open) setEditingGoal(null) }}
        goal={editingGoal}
      />

      <ConfirmDialog
        open={!!deletingGoal}
        onOpenChange={(open) => { if (!open) setDeletingGoal(null) }}
        title="Delete Goal"
        description={`Delete "${deletingGoal?.name}"? This cannot be undone.`}
        onConfirm={() => {
          if (deletingGoal) deleteMutation.mutate(deletingGoal.id, { onSuccess: () => setDeletingGoal(null) })
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
