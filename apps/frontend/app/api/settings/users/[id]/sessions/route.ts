import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getSessions, terminateAllSessions } from '@/lib/services/session-service'

/**
 * Sessions API Routes
 * Story: 1.4 Session Management
 * Task 6: API Endpoints (AC-003.1, AC-003.2, AC-003.3)
 *
 * GET /api/settings/users/:id/sessions - List user sessions
 * DELETE /api/settings/users/:id/sessions - Logout all devices
 */

// GET /api/settings/users/:id/sessions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
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

    // Authorization: User can view own sessions OR Admin can view any user's sessions
    const isAdmin = currentUser.role === 'admin'
    const isOwnSessions = user.id === userId

    if (!isOwnSessions && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You can only view your own sessions' },
        { status: 403 }
      )
    }

    // Get sessions
    const sessions = await getSessions(userId, false)

    return NextResponse.json({ sessions }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/users/:id/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/users/:id/sessions - Logout All Devices
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
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
        { error: 'Forbidden: You can only logout your own devices' },
        { status: 403 }
      )
    }

    // Get current JWT to extract jti (keep current session active)
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    // Extract JWT from header
    const token = authHeader.replace('Bearer ', '')
    
    // Decode JWT to get jti and exp (without verification, just parsing)
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )
    const currentTokenId = payload.jti || payload.sub // Fallback to sub if jti not present
    const tokenExpiry = payload.exp

    // Terminate all sessions except current
    const result = await terminateAllSessions(userId, currentTokenId, tokenExpiry)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to terminate sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        terminated_count: result.count || 0,
        message: `Logged out from ${result.count || 0} device(s)`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/users/:id/sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
