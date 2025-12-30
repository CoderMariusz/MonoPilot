/**
 * Session by ID API Route (Story 01.15)
 *
 * DELETE /api/v1/settings/sessions/:id - Terminate a specific session
 *
 * Authentication: Required
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { terminateSession, getSessions } from '@/lib/services/session-service'
import { ZodError } from 'zod'

/**
 * DELETE /api/v1/settings/sessions/:id
 *
 * Terminate a specific session
 * Users can terminate their own sessions
 * Cannot terminate current session (must use logout endpoint)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const userId = session.user.id
    const sessionId = id

    // Get current session token to prevent deleting current session
    const currentToken = request.headers.get('x-session-token')
    let currentSessionId: string | null = null

    if (currentToken) {
      const { data: current } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_token', currentToken)
        .single()

      currentSessionId = current?.id || null
    }

    // Prevent terminating current session
    if (sessionId === currentSessionId) {
      return NextResponse.json(
        { error: 'Cannot terminate current session. Use logout endpoint instead.' },
        { status: 400 }
      )
    }

    // Check if session belongs to user (RLS will enforce this, but we check for better error messages)
    const { data: targetSession } = await supabase
      .from('user_sessions')
        .select('user_id, org_id')
      .eq('id', sessionId)
      .single()

    if (!targetSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get user's org_id for cross-org check
    const { data: currentUser } = await supabase
      .from('users')
      .select('org_id, role_code')
      .eq('id', userId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user owns the session or is admin in same org
    const isOwner = targetSession.user_id === userId
    const isAdmin = ['owner', 'admin'].includes(currentUser.role_code)
    const sameOrg = targetSession.org_id === currentUser.org_id

    if (!isOwner && !(isAdmin && sameOrg)) {
      // Return 404 for cross-org (not 403) per multi-tenancy pattern
      if (!sameOrg) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Terminate session
    await terminateSession(supabase, sessionId, 'user_revoked', userId)

    return NextResponse.json(
      { message: 'Session terminated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error in DELETE /api/v1/settings/sessions/:id:', error)

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
