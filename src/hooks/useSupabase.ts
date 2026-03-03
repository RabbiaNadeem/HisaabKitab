import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { auth, db } from '../lib/supabase-utils'
import type { User } from '@supabase/supabase-js'

// Auth hooks
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    auth.getCurrentSession().then((session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export const useSignIn = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      auth.signIn(email, password),
  })
}

export const useSignUp = () => {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      auth.signUp(email, password),
  })
}

export const useSignOut = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => auth.signOut(),
    onSuccess: () => {
      // Clear all queries on sign out
      queryClient.clear()
    }
  })
}

// Generic data hooks
export const useSupabaseQuery = <T>(
  table: string,
  columns = '*',
  filters?: Record<string, any>,
  queryKey?: string[]
) => {
  return useQuery({
    queryKey: queryKey || [table, columns, filters],
    queryFn: async () => {
      const { data, error } = await db.select(table, columns, filters)
      if (error) throw error
      return data as T[]
    },
  })
}

export const useSupabaseInsert = <T>(table: string) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<T>) => db.insert(table, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
    }
  })
}

export const useSupabaseUpdate = <T>(table: string) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<T> }) =>
      db.update(table, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
    }
  })
}

export const useSupabaseDelete = (table: string) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => db.delete(table, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
    }
  })
}

// Real-time subscription hook
export const useSupabaseSubscription = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  useEffect(() => {
    let channel = supabase.channel(`${table}_changes`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter
      }, callback)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, callback, filter])
}