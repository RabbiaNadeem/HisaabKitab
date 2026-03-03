// ─── Shared enums ────────────────────────────────────────────────────────────

export type TransactionType = 'expense' | 'income'
export type GoalStatus = 'active' | 'achieved' | 'abandoned'

// ─── Table row types ─────────────────────────────────────────────────────────

export interface Category {
  id: string
  user_id: string
  name: string
  type: TransactionType
  is_default: boolean
  budget_amount: number | null
  icon: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  currency: string
  transaction_date: string
  description: string
  category_id: string | null
  tags: string[] | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  categories?: Category | null
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  month_year: string   // 'YYYY-MM'
  amount: number
  created_at: string
  updated_at: string
  // joined
  categories?: Category | null
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  target_date: string  // ISO date string
  current_saved: number
  description: string | null
  category_id: string | null
  status: GoalStatus
  created_at: string
  updated_at: string
  // joined
  categories?: Category | null
}

// ─── Insert / update payloads ─────────────────────────────────────────────────

export type TransactionInsert = Omit<Transaction, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>
export type TransactionUpdate = Partial<TransactionInsert>

export type CategoryInsert = Omit<Category, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type CategoryUpdate = Partial<CategoryInsert>

export type BudgetInsert = Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>
export type BudgetUpdate = Partial<BudgetInsert>

export type GoalInsert = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'categories'>
export type GoalUpdate = Partial<GoalInsert>

// ─── Derived / augmented types ────────────────────────────────────────────────

export interface CategoryWithBudget extends Category {
  budget?: Budget | null
  spent?: number
}

export interface TransactionFilters {
  type?: TransactionType | 'all'
  categoryId?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export interface MonthlyTrend {
  month: string   // e.g. 'Jan', 'Feb'
  income: number
  expenses: number
  balance: number
}

export interface CategoryBreakdown {
  name: string
  value: number
  color: string
}
