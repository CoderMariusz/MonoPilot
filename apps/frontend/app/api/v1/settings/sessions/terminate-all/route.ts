/**
 * Terminate All Sessions API Route (Story 01.15)
 *
 * POST /api/v1/settings/sessions/terminate-all - Logout from all devices
 *
 * Authentication: Required
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { terminateAllSessions } from '@/lib/services/session-service'
import { ZodError } from 'zod'

/**
 * POST /api/v1/settings/sessions/terminate-all
 *
 * Terminate ALL sessions including current (complete logout)
 * Used for "Logout from all devices" functionality
 */
export async function POST(request: NextRequest) {
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

    // Terminate ALL sessions (no exceptions)
    const count = await terminateAllSessions(supabase, userId)

    return NextResponse.json(
      {
        message: `Terminated all ${count} session(s)`,
        terminated_count: count,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[API] Error in POST /api/v1/settings/sessions/terminate-all:', error)

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
