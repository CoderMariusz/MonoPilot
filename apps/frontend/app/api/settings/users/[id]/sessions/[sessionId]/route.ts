import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { terminateSession } from '@/lib/services/session-service'

/**
 * Individual Session API
 * Story: 1.4 Session Management
 * Task 6: API Endpoints (AC-003.8)
 *
 * DELETE /api/settings/users/:id/sessions/:sessionId - Terminate specific session
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const { id: userId, sessionId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization
    const isAdmin = currentUser.role === 'admin'
    const isOwnSessions = user.id === userId

    if (!isOwnSessions && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot terminate other user sessions' },
        { status: 403 }
      )
    }

    // Get current JWT jti (cannot terminate own current session)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )
    const currentTokenId = payload.jti || payload.sub
    const tokenExpiry = payload.exp

    // Check if trying to terminate current session
    const { data: targetSession } = await supabase
      .from('user_sessions')
      .select('token_id')
      .eq('id', sessionId)
      .single()

    if (targetSession && targetSession.token_id === currentTokenId) {
      return NextResponse.json(
        { error: 'Cannot terminate your current session. Use normal logout instead.' },
        { status: 400 }
      )
    }

    // Terminate session
    await terminateSession(supabase, sessionId, 'manual_termination', user.id)

    return NextResponse.json(
      {
        success: true,
        message: 'Session terminated',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/users/:id/sessions/:sessionId:', error)
    
    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
