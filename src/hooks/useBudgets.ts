import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import type { Budget, BudgetInsert } from '@/types/database'

export function useCurrentMonthYear() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function useBudgets(monthYear?: string) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['budgets', user?.id, monthYear],
    queryFn: async (): Promise<Budget[]> => {
      if (!user) return []

      let query = supabase
        .from('budgets')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (monthYear) {
        query = query.eq('month_year', monthYear)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Budget[]
    },
    enabled: !!user,
  })
}

export function useUpsertBudget() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: BudgetInsert) => {
      if (!user) throw new Error('Not authenticated')
      // Upsert using unique constraint: user_id + category_id + month_year
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          { ...payload, user_id: user.id },
          { onConflict: 'user_id,category_id,month_year' }
        )
        .select('*, categories(*)')
        .single()
      if (error) throw error
      return data as Budget
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id, variables.month_year] })
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] })
    },
  })
}

export function useDeleteBudget() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', user?.id] })
    },
  })
}
