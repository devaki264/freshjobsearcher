import { createClient } from '@supabase/supabase-js'

let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (!supabaseInstance) {
    // Use real values - they're public keys anyway (Supabase anon key is meant to be in browser)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzfvajgeujslvnbnadgs.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZnZhamdldWpzbHZuYm5hZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzYzNTcsImV4cCI6MjA4MjcxMjM1N30.-lmX4tm9Sm4BhmSjZu3MLKx6iQof2brMdGkop50O_Mg'
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// For backward compatibility
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get: (target, prop) => {
    return getSupabase()[prop as keyof ReturnType<typeof createClient>]
  }
})