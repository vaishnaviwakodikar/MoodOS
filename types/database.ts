// ─────────────────────────────────────────────────────────────────
//  Paisa Journal — Database Types
//  Place at: src/types/database.ts  (or lib/database.types.ts)
// ─────────────────────────────────────────────────────────────────

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {

      // ── expenses ─────────────────────────────────────────────────
      expenses: {
        Row: {
          id:             string
          user_id:        string
          title:          string
          amount:         number
          category:       string
          payment_method: string
          date:           string     // 'YYYY-MM-DD'
          notes:          string | null
          created_at:     string
        }
        Insert: {
          id?:            string
          user_id:        string
          title:          string
          amount:         number
          category?:      string
          payment_method?: string
          date?:          string
          notes?:         string | null
          created_at?:    string
        }
        Update: {
          title?:          string
          amount?:         number
          category?:       string
          payment_method?: string
          date?:           string
          notes?:          string | null
        }
      }

      // ── expense_budgets ───────────────────────────────────────────
      expense_budgets: {
        Row: {
          id:         string
          user_id:    string
          month:      string     // 'YYYY-MM'
          amount:     number
          created_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          month:      string
          amount:     number
          created_at?: string
        }
        Update: {
          amount?: number
        }
      }

      // ── savings_pot ───────────────────────────────────────────────
      savings_pot: {
        Row: {
          id:         string
          user_id:    string
          label:      string
          amount:     number
          type:       'add' | 'withdraw'
          date:       string
          created_at: string
        }
        Insert: {
          id?:        string
          user_id:    string
          label:      string
          amount:     number
          type:       'add' | 'withdraw'
          date?:      string
          created_at?: string
        }
        Update: {
          label?:  string
          amount?: number
          type?:   'add' | 'withdraw'
          date?:   string
        }
      }

      // ── ledger_entries ────────────────────────────────────────────
      ledger_entries: {
        Row: {
          id:           string
          user_id:      string
          name:         string
          amount:       number
          type:         'lent' | 'borrowed'
          date:         string
          notes:        string | null
          settled:      boolean
          settled_date: string | null
          created_at:   string
        }
        Insert: {
          id?:          string
          user_id:      string
          name:         string
          amount:       number
          type:         'lent' | 'borrowed'
          date?:        string
          notes?:       string | null
          settled?:     boolean
          settled_date?: string | null
          created_at?:  string
        }
        Update: {
          name?:         string
          amount?:       number
          type?:         'lent' | 'borrowed'
          date?:         string
          notes?:        string | null
          settled?:      boolean
          settled_date?: string | null
        }
      }
    }
  }
}

// ── Convenience row types (matches frontend usage) ────────────────

export type ExpenseRow      = Database['public']['Tables']['expenses']['Row']
export type BudgetRow       = Database['public']['Tables']['expense_budgets']['Row']
export type SavingsPotRow   = Database['public']['Tables']['savings_pot']['Row']
export type LedgerEntryRow  = Database['public']['Tables']['ledger_entries']['Row']