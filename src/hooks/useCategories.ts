import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import type { Category, CategoryInsert } from '@/types/database'

const DEFAULT_CATEGORIES: Omit<CategoryInsert, 'is_default'>[] = [
  { name: 'Food & Dining',   type: 'expense', icon: '🍽️', budget_amount: null },
  { name: 'Transport',        type: 'expense', icon: '🚗', budget_amount: null },
  { name: 'Shopping',         type: 'expense', icon: '🛍️', budget_amount: null },
  { name: 'Utilities',        type: 'expense', icon: '💡', budget_amount: null },
  { name: 'Healthcare',       type: 'expense', icon: '🏥', budget_amount: null },
  { name: 'Entertainment',    type: 'expense', icon: '🎬', budget_amount: null },
  { name: 'Education',        type: 'expense', icon: '📚', budget_amount: null },
  { name: 'Housing',          type: 'expense', icon: '🏠', budget_amount: null },
  { name: 'Personal Care',    type: 'expense', icon: '💆', budget_amount: null },
  { name: 'Miscellaneous',    type: 'expense', icon: '📦', budget_amount: null },
  { name: 'Salary',           type: 'income',  icon: '💼', budget_amount: null },
  { name: 'Freelance',        type: 'income',  icon: '💻', budget_amount: null },
  { name: 'Business',         type: 'income',  icon: '🏢', budget_amount: null },
  { name: 'Investment',       type: 'income',  icon: '📈', budget_amount: null },
  { name: 'Gift',             type: 'income',  icon: '🎁', budget_amount: null },
  { name: 'Other Income',     type: 'income',  icon: '💰', budget_amount: null },
]

export function useCategories() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async (): Promise<Category[]> => {
      if (!user) return []

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      // Auto-seed default categories on first login
      if (!data || data.length === 0) {
        const seeds = DEFAULT_CATEGORIES.map((c) => ({
          ...c,
          user_id: user.id,
          is_default: true,
        }))
        const { data: seeded, error: seedError } = await supabase
          .from('categories')
          .insert(seeds)
          .select()
        if (seedError) throw seedError
        return (seeded ?? []) as Category[]
      }

      return (data ?? []) as Category[]
    },
    enabled: !!user,
  })
}

export function useAddCategory() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CategoryInsert) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', user?.id] })
    },
  })
}
