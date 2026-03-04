import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import type {
  Transaction,
  TransactionInsert,
  TransactionUpdate,
  TransactionFilters,
} from '@/types/database'

export function useTransactions(filters?: TransactionFilters) {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['transactions', user?.id, filters],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) return []

      let query = supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type)
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }
      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom)
      }
      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo)
      }
      if (filters?.search) {
        query = query.ilike('description', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Transaction[]
    },
    enabled: !!user,
  })
}

export function useAddTransaction() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: TransactionInsert) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...payload, user_id: user.id })
        .select('*, categories(*)')
        .single()
      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateTransaction() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: TransactionUpdate & { id: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, categories(*)')
        .single()
      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useDeleteTransaction() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
