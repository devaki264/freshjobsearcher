import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gzfvajgeujslvnbnadgs.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6ZnZhamdldWpzbHZuYm5hZGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzYzNTcsImV4cCI6MjA4MjcxMjM1N30.-lmX4tm9Sm4BhmSjZu3MLKx6iQof2brMdGkop50O_Mg'
)