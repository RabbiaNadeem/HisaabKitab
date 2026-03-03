import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/useCategories'
import { useUpsertBudget } from '@/hooks/useBudgets'
import type { Budget } from '@/types/database'

const schema = z.object({
  category_id: z.string().min(1, 'Please select a category'),
  amount: z.coerce.number().positive('Amount must be positive'),
})

type FormValues = z.infer<typeof schema>

interface BudgetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  budget?: Budget | null
  monthYear: string
  /** If provided, category selector is locked to this value */
  lockedCategoryId?: string
}

export function BudgetForm({
  open,
  onOpenChange,
  budget,
  monthYear,
  lockedCategoryId,
}: BudgetFormProps) {
  const { data: categories = [] } = useCategories()
  const upsertMutation = useUpsertBudget()
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      category_id: lockedCategoryId ?? '',
      amount: undefined,
    },
  })

  useEffect(() => {
    if (budget) {
      reset({ category_id: budget.category_id, amount: budget.amount })
    } else {
      reset({ category_id: lockedCategoryId ?? '', amount: undefined })
    }
  }, [budget, open, lockedCategoryId, reset])

  const onSubmit = async (values: FormValues) => {
    await upsertMutation.mutateAsync({
      category_id: values.category_id,
      amount: values.amount,
      month_year: monthYear,
    })
    onOpenChange(false)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{budget ? 'Edit Budget' : 'Set Budget'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category */}
          <div className="space-y-1">
            <Label>Category</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={!!lockedCategoryId}
                >
                  <SelectTrigger className={errors.category_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon && <span className="mr-1">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category_id && (
              <p className="text-xs text-destructive">{errors.category_id.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="budget-amount">Monthly Budget (Rs.)</Label>
            <Input
              id="budget-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('amount')}
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">Month: {monthYear}</p>

          {upsertMutation.error && (
            <p className="text-sm text-destructive">
              {(upsertMutation.error as Error).message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
