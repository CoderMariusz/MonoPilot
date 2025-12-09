// API Route: Refresh Scanner Session
// Epic 5 Story 5.27: Scanner Session Timeout
// POST /api/scanner/session/refresh

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getSession, refreshSession } from '@/lib/scanner/session-store'

const SESSION_TIMEOUT_MINUTES = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized - please login again',
          sound: 'error',
          vibrate: false,
        },
        { status: 401 }
      )
    }

    // Parse body
    const body = await request.json()
    const { workflow_id } = body as { workflow_id?: string }

    // If workflow_id provided, refresh that session
    if (workflow_id) {
      const scannerSession = getSession(workflow_id)
      if (!scannerSession) {
        return NextResponse.json(
          {
            success: false,
            message: 'Workflow session not found or expired',
            sound: 'warning',
            vibrate: false,
          },
          { status: 404 }
        )
      }

      // Verify ownership
      if (scannerSession.user_id !== session.user.id) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unauthorized to access this workflow session',
            sound: 'error',
            vibrate: false,
          },
          { status: 403 }
        )
      }

      // Extend session
      const refreshedSession = refreshSession(workflow_id, SESSION_TIMEOUT_MINUTES)

      return NextResponse.json({
        success: true,
        message: 'Workflow session refreshed',
        sound: 'success',
        vibrate: false,
        data: {
          workflow_id,
          session_expires_at: refreshedSession?.expires_at,
        },
      })
    }

    // Otherwise just refresh auth session
    return NextResponse.json({
      success: true,
      message: 'Session active',
      sound: 'success',
      vibrate: false,
      data: {
        user_id: session.user.id,
        session_expires_at: new Date(
          Date.now() + SESSION_TIMEOUT_MINUTES * 60 * 1000
        ).toISOString(),
      },
    })
  } catch (error) {
    console.error('Error in POST /api/scanner/session/refresh:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        sound: 'error',
        vibrate: false,
      },
      { status: 500 }
    )
  }
}
