/**
 * Current Session API Route (Story 01.15)
 *
 * GET /api/v1/settings/sessions/current - Get current session details
 *
 * Authentication: Required
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCurrentSession } from '@/lib/services/session-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/sessions/current
 *
 * Get details of the current session
 * Requires x-session-token header
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session token from header
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token required' },
        { status: 400 }
      )
    }

    // Get current session
    const currentSession = await getCurrentSession(supabase, sessionToken)

    if (!currentSession) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      )
    }

    // Mark as current
    currentSession.is_current = true

    return NextResponse.json({ session: currentSession }, { status: 200 })
  } catch (error) {
    console.error('[API] Error in GET /api/v1/settings/sessions/current:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
