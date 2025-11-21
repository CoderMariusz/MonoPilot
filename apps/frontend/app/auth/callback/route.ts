import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createServerSupabase()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      // Redirect to login with error
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_callback_error`
      )
    }

    // Successful authentication, redirect to next URL or dashboard
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  }

  // No code provided, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
