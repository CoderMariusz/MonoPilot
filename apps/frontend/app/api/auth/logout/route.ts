/**
 * API Route: Logout
 * POST /api/auth/logout - Logs out the current user and clears the session
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabase()

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('[Logout] Auth error:', error)
      return NextResponse.json(
        { error: error.message || 'Logout failed' },
        { status: 500 }
      )
    }

    // Create response with successful logout
    const response = NextResponse.json(
      { success: true, message: 'Logout successful' },
      { status: 200 }
    )

    // Clear auth cookies
    response.cookies.set('sb-access-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })

    response.cookies.set('sb-refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('[Logout] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
