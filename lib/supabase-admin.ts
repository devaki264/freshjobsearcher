import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side admin client (only use in API routes/server components)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)