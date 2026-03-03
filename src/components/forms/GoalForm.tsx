import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useCategories } from '@/hooks/useCategories'
import { useAddGoal, useUpdateGoal } from '@/hooks/useGoals'
import type { Goal, GoalStatus } from '@/types/database'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  target_amount: z.coerce
    .number()
    .positive('Target amount must be positive'),
  current_saved: z.coerce.number().min(0).default(0),
  target_date: z.date(),
  description: z.string().max(500).nullable().optional(),
  category_id: z.string().nullable().optional(),
  status: z.enum(['active', 'achieved', 'abandoned']).default('active'),
})

type FormValues = z.infer<typeof schema>

interface GoalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal | null
}

export function GoalForm({ open, onOpenChange, goal }: GoalFormProps) {
  const { data: categories = [] } = useCategories()
  const addMutation = useAddGoal()
  const updateMutation = useUpdateGoal()
  const isEdit = !!goal

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      name: '',
      target_amount: undefined,
      current_saved: 0,
      target_date: undefined,
      description: '',
      category_id: null,
      status: 'active',
    },
  })

  useEffect(() => {
    if (goal) {
      reset({
        name: goal.name,
        target_amount: goal.target_amount,
        current_saved: goal.current_saved,
        target_date: new Date(goal.target_date),
        description: goal.description ?? '',
        category_id: goal.category_id,
        status: goal.status,
      })
    } else {
      reset({
        name: '',
        target_amount: undefined,
        current_saved: 0,
        target_date: undefined,
        description: '',
        category_id: null,
        status: 'active',
      })
    }
  }, [goal, open, reset])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      target_amount: values.target_amount,
      current_saved: values.current_saved,
      target_date: values.target_date.toISOString().split('T')[0],
      description: values.description || null,
      category_id: values.category_id ?? null,
      status: values.status as GoalStatus,
    }

    if (isEdit && goal) {
      await updateMutation.mutateAsync({ id: goal.id, ...payload })
    } else {
      await addMutation.mutateAsync(payload)
    }
    onOpenChange(false)
    reset()
  }

  const mutationError = addMutation.error ?? updateMutation.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Goal' : 'New Savings Goal'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              placeholder="e.g. Emergency Fund, New Laptop…"
              {...register('name')}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Target amount */}
          <div className="space-y-1">
            <Label htmlFor="target-amount">Target Amount (Rs.)</Label>
            <Input
              id="target-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('target_amount')}
              className={errors.target_amount ? 'border-destructive' : ''}
            />
            {errors.target_amount && (
              <p className="text-xs text-destructive">{errors.target_amount.message}</p>
            )}
          </div>

          {/* Current saved */}
          <div className="space-y-1">
            <Label htmlFor="current-saved">Already Saved (Rs.)</Label>
            <Input
              id="current-saved"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('current_saved')}
            />
          </div>

          {/* Target date */}
          <div className="space-y-1">
            <Label>Target Date</Label>
            <Controller
              name="target_date"
              control={control}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                        errors.target_date && 'border-destructive',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(d) => field.onChange(d ?? new Date())}
                      disabled={(d) => d < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.target_date && (
              <p className="text-xs text-destructive">{errors.target_date.message}</p>
            )}
          </div>

          {/* Category link */}
          <div className="space-y-1">
            <Label>Linked Category (optional)</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v || null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon && <span className="mr-1">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="goal-desc">Description (optional)</Label>
            <Textarea id="goal-desc" rows={2} placeholder="What's this goal for?" {...register('description')} />
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-1">
              <Label>Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="achieved">Achieved</SelectItem>
                      <SelectItem value="abandoned">Abandoned</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {mutationError && (
            <p className="text-sm text-destructive">{(mutationError as Error).message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
