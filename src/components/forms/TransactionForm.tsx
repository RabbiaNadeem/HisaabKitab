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
import { useAddTransaction, useUpdateTransaction } from '@/hooks/useTransactions'
import type { Transaction, TransactionType } from '@/types/database'

const schema = z.object({
  type: z.enum(['expense', 'income']),
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(200),
  category_id: z.string().nullable().optional(),
  transaction_date: z.date(),
  notes: z.string().max(500).nullable().optional(),
  tags: z.string().optional(),
  currency: z.string().default('PKR'),
})

type FormValues = z.infer<typeof schema>

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  defaultType?: TransactionType
}

export function TransactionForm({
  open,
  onOpenChange,
  transaction,
  defaultType = 'expense',
}: TransactionFormProps) {
  const { data: categories = [] } = useCategories()
  const addMutation = useAddTransaction()
  const updateMutation = useUpdateTransaction()
  const isEdit = !!transaction

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      type: defaultType,
      amount: undefined,
      description: '',
      category_id: null,
      transaction_date: new Date(),
      notes: '',
      tags: '',
      currency: 'PKR',
    },
  })

  // Populate form when editing
  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category_id: transaction.category_id,
        transaction_date: new Date(transaction.transaction_date),
        notes: transaction.notes ?? '',
        tags: transaction.tags?.join(', ') ?? '',
        currency: transaction.currency,
      })
    } else {
      reset({
        type: defaultType,
        amount: undefined,
        description: '',
        category_id: null,
        transaction_date: new Date(),
        notes: '',
        tags: '',
        currency: 'PKR',
      })
    }
  }, [transaction, open, defaultType, reset])

  const selectedType = watch('type')
  const filteredCategories = categories.filter((c) => c.type === selectedType)

  const onSubmit = async (values: FormValues) => {
    const payload = {
      type: values.type,
      amount: values.amount,
      description: values.description,
      category_id: values.category_id ?? null,
      transaction_date: values.transaction_date.toISOString(),
      notes: values.notes || null,
      tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
      currency: values.currency,
    }

    if (isEdit && transaction) {
      await updateMutation.mutateAsync({ id: transaction.id, ...payload })
    } else {
      await addMutation.mutateAsync(payload)
    }
    onOpenChange(false)
    reset()
  }

  const mutationError = addMutation.error ?? updateMutation.error

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Type toggle */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {(['expense', 'income'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => field.onChange(t)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm font-medium transition-colors border',
                      field.value === t
                        ? t === 'expense'
                          ? 'bg-red-500/20 border-red-500/60 text-red-400'
                          : 'bg-primary/15 border-primary/50 text-primary'
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    {t === 'expense' ? '↓ Expense' : '↑ Income'}
                  </button>
                ))}
              </div>
            )}
          />

          {/* Amount */}
          <div className="space-y-1">
            <Label htmlFor="amount">Amount (Rs.)</Label>
            <Input
              id="amount"
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

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="What was this for?"
              {...register('description')}
              className={errors.description ? 'border-destructive' : ''}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1">
            <Label>Category</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
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

          {/* Date */}
          <div className="space-y-1">
            <Label>Date</Label>
            <Controller
              name="transaction_date"
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
                        errors.transaction_date && 'border-destructive',
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
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            {errors.transaction_date && (
              <p className="text-xs text-destructive">{errors.transaction_date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={2}
              placeholder="Additional notes…"
              {...register('notes')}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <Label htmlFor="tags">Tags (optional, comma-separated)</Label>
            <Input id="tags" placeholder="e.g. groceries, weekly" {...register('tags')} />
          </div>

          {mutationError && (
            <p className="text-sm text-destructive">
              {(mutationError as Error).message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Update' : 'Add Transaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
