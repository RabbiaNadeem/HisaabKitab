import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import type { Goal, GoalInsert, GoalUpdate } from '@/types/database'

export function useGoals() {
  const { user } = useAuthContext()

  return useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async (): Promise<Goal[]> => {
      if (!user) return []
      const { data, error } = await supabase
        .from('goals')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Goal[]
    },
    enabled: !!user,
  })
}

export function useAddGoal() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: GoalInsert) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...payload, user_id: user.id })
        .select('*, categories(*)')
        .single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}

export function useUpdateGoal() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...payload }: GoalUpdate & { id: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('goals')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select('*, categories(*)')
        .single()
      if (error) throw error
      return data as Goal
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}

export function useDeleteGoal() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
    },
  })
}
