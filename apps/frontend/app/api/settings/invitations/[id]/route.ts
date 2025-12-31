import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { cancelInvitation } from '@/lib/services/invitation-service'

/**
 * Invitation Management API
 * Story: 1.3 User Invitations
 * Task 4: API Endpoints (AC-003.3)
 *
 * DELETE /api/settings/invitations/:id - Cancel invitation
 */

// ============================================================================
// DELETE /api/settings/invitations/:id - Cancel Invitation (AC-003.3)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role and org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin only
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Cancel invitation (updates status, deactivates user if still invited)
    await cancelInvitation(id, currentUser.org_id)

    return NextResponse.json(
      {
        success: true,
        message: 'Invitation cancelled',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/invitations/:id:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
