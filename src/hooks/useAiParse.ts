import { useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AiParsedTransaction {
  amount: number
  type: 'income' | 'expense'
  category: string
  date: string        // YYYY-MM-DD
  description: string
}

export interface ApiTestResult {
  success: boolean
  message: string
  model?: string
  timestamp?: string
}

// ─── Main Hook ───────────────────────────────────────────────────────────────

/**
 * Parse natural language text into structured transaction data
 * Uses the ai-parse edge function which calls OpenRouter API
 * 
 * @example
 * const { mutate, isPending } = useAiParse()
 * mutate('Paid $50 for groceries', {
 *   onSuccess: (data) => console.log('Parsed:', data)
 * })
 */
export function useAiParse() {
  return useMutation({
    mutationFn: async (text: string): Promise<AiParsedTransaction> => {
      if (!text || text.trim().length === 0) {
        throw new Error('Text input is required')
      }

      const { data, error } = await supabase.functions.invoke('ai-parse', {
        body: { text: text.trim() },
      })

      if (error) {
        console.error('Edge function error:', error)
        throw new Error(error.message || 'Failed to parse transaction')
      }

      if (!data) {
        throw new Error('No data returned from AI parser')
      }

      // Validate the response structure
      if (typeof data.amount !== 'number' || 
          !['income', 'expense'].includes(data.type) ||
          !data.category || !data.date || !data.description) {
        console.error('Invalid response structure:', data)
        throw new Error('Invalid response from AI parser')
      }

      return data as AiParsedTransaction
    },
  })
}

// ─── Test Hook ───────────────────────────────────────────────────────────────

/**
 * Test the connection to OpenRouter API via the edge function
 * Sends a simple test transaction to verify the API key is configured correctly
 * 
 * @example
 * const { mutate: testConnection, isPending } = useAiParseTest()
 * testConnection(undefined, {
 *   onSuccess: (result) => {
 *     if (result.success) {
 *       console.log('✅ API connection verified')
 *     }
 *   }
 * })
 */
export function useAiParseTest() {
  return useMutation({
    mutationFn: async (): Promise<ApiTestResult> => {
      try {
        // Send a simple test transaction
        const testText = 'Spent 10 dollars on coffee today'
        
        const { data, error } = await supabase.functions.invoke('ai-parse', {
          body: { text: testText },
        })

        if (error) {
          // FunctionsHttpError has a .context property with the response
          const detail = (error as any)?.context?.json?.detail ?? ''
          return {
            success: false,
            message: `Connection failed: ${error.message}${detail ? ` — ${detail}` : ''}`,
          }
        }

        if (!data) {
          return {
            success: false,
            message: 'No response from edge function',
          }
        }

        // Verify the response has the expected structure
        const hasValidStructure = 
          typeof data.amount === 'number' &&
          ['income', 'expense'].includes(data.type) &&
          data.category && 
          data.date && 
          data.description

        if (!hasValidStructure) {
          return {
            success: false,
            message: 'Invalid response structure from API',
          }
        }

        return {
          success: true,
          message: 'API connection verified successfully',
          model: 'google/gemma-3-4b-it:free',
          timestamp: new Date().toISOString(),
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        return {
          success: false,
          message: `Test failed: ${errorMessage}`,
        }
      }
    },
  })
}
