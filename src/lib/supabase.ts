import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Legacy export for backward compatibility
export const supabase = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)

// Factory function for creating client
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}
