import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getInvitations } from '@/lib/services/invitation-service'

/**
 * Invitations API Routes
 * Story: 1.3 User Invitations
 * Task 4: API Endpoints (AC-003.1)
 *
 * GET /api/settings/invitations - List invitations with filters
 */

// ============================================================================
// GET /api/settings/invitations - List Invitations (AC-003.1)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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
      .select('role, org_id')
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as
      | 'pending'
      | 'accepted'
      | 'expired'
      | 'cancelled'
      | null
    const search = searchParams.get('search')

    // Get invitations with filters
    const invitations = await getInvitations(currentUser.org_id, {
      status: status || undefined,
      search: search || undefined,
    })

    // Mark expired invitations (client-side check for display)
    // Server-side expiry enforcement happens in token validation
    const now = new Date()
    const enrichedInvitations = invitations.map((inv) => ({
      ...inv,
      is_expired: new Date(inv.expires_at) < now && inv.status === 'pending',
    }))

    return NextResponse.json(
      { invitations: enrichedInvitations },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/invitations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
