/**
 * Session API Routes (Story 01.15)
 *
 * GET /api/v1/settings/sessions - List user's active sessions
 * DELETE /api/v1/settings/sessions - Terminate all sessions except current
 *
 * Authentication: Required
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getSessions, terminateAllSessions } from '@/lib/services/session-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/sessions
 *
 * List all active sessions for the authenticated user
 * Returns sessions ordered by last_activity_at (descending)
 * Marks current session with is_current=true
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

    const userId = session.user.id

    // Get all active sessions
    const sessions = await getSessions(supabase, userId)

    // Mark current session (if we have session token in request)
    const sessionToken = request.headers.get('x-session-token')
    if (sessionToken) {
      sessions.forEach((s) => {
        s.is_current = s.session_token === sessionToken
      })
    }

    return NextResponse.json({ sessions }, { status: 200 })
  } catch (error) {
    console.error('[API] Error in GET /api/v1/settings/sessions:', error)

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

/**
 * DELETE /api/v1/settings/sessions
 *
 * Terminate all sessions except current
 * Current session is identified by x-session-token header
 */
export async function DELETE(request: NextRequest) {
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

    const userId = session.user.id

    // Get current session ID from header (or query param)
    const sessionToken = request.headers.get('x-session-token') ||
                         request.nextUrl.searchParams.get('current_session')

    let exceptSessionId: string | undefined

    if (sessionToken) {
      // Find current session ID by token
      const { data: currentSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_token', sessionToken)
        .single()

      exceptSessionId = currentSession?.id
    }

    // Terminate all other sessions
    const count = await terminateAllSessions(supabase, userId, exceptSessionId)

    return NextResponse.json(
      {
        message: `Terminated ${count} session(s)`,
        terminated_count: count,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error in DELETE /api/v1/settings/sessions:', error)

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
