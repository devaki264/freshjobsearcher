import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // Hardcode production URL
  const baseUrl = 'https://ai-job-match-agent-686566480080.us-central1.run.app'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Success! Redirect to dashboard or specified page
      return NextResponse.redirect(new URL(next, baseUrl))
    }
  }

  // If no code or error occurred, redirect to login
  return NextResponse.redirect(new URL('/auth/login', baseUrl))
}