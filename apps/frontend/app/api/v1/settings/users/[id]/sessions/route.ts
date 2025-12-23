/**
 * User Sessions API Route (Story 01.15 - Admin)
 *
 * GET /api/v1/settings/users/:id/sessions - List user's sessions (admin only)
 * DELETE /api/v1/settings/users/:id/sessions - Terminate all user sessions (admin only)
 *
 * Authentication: Required
 * Authorization: Admin only (owner, admin roles)
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getSessions, terminateAllSessions } from '@/lib/services/session-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/users/:id/sessions
 *
 * List all active sessions for a specific user (admin only)
 * Used for admin session management
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const currentUserId = session.user.id
    const targetUserId = params.id

    // Get current user's role and org
    const { data: currentUser } = await supabase
      .from('users')
      .select('org_id, role_code')
      .eq('id', currentUserId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin
    const isAdmin = ['owner', 'admin'].includes(currentUser.role_code)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get target user's org to verify same org
    const { data: targetUser } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', targetUserId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check same org (multi-tenancy isolation)
    if (targetUser.org_id !== currentUser.org_id) {
      // Return 404 for cross-org (not 403) per multi-tenancy pattern
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user's sessions
    const sessions = await getSessions(supabase, targetUserId)

    return NextResponse.json({ sessions }, { status: 200 })
  } catch (error) {
    console.error(`[API] Error in GET /api/v1/settings/users/${params.id}/sessions:`, error)

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
 * DELETE /api/v1/settings/users/:id/sessions
 *
 * Terminate all sessions for a specific user (admin only)
 * Used for admin session management (e.g., security incidents)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const currentUserId = session.user.id
    const targetUserId = params.id

    // Get current user's role and org
    const { data: currentUser } = await supabase
      .from('users')
      .select('org_id, role_code')
      .eq('id', currentUserId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is admin
    const isAdmin = ['owner', 'admin'].includes(currentUser.role_code)

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get target user's org to verify same org
    const { data: targetUser } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', targetUserId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check same org (multi-tenancy isolation)
    if (targetUser.org_id !== currentUser.org_id) {
      // Return 404 for cross-org (not 403) per multi-tenancy pattern
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Terminate all user's sessions
    const count = await terminateAllSessions(supabase, targetUserId)

    return NextResponse.json(
      {
        message: `Terminated all ${count} session(s) for user`,
        terminated_count: count,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Error in DELETE /api/v1/settings/users/${params.id}/sessions:`, error)

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
