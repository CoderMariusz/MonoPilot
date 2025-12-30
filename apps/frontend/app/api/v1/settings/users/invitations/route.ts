/**
 * GET /api/v1/settings/users/invitations
 * Story: 01.16 - User Invitations (Email)
 * Description: List pending invitations for organization
 * Permission: ADMIN, SUPER_ADMIN, VIEWER (read-only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { InvitationService } from '@/lib/services/invitation-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user org
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') || 'pending'
    // Map 'all' to undefined (get all statuses), otherwise pass the specific status
    const status = statusParam === 'all' ? undefined : statusParam as 'pending' | 'expired' | 'cancelled' | 'accepted'

    // 4. List invitations
    const invitations = await InvitationService.listInvitations(userData.org_id, status)

    // 5. Return response
    return NextResponse.json({
      invitations,
      total: invitations.length,
    })
  } catch (error) {
    console.error('GET /api/v1/settings/users/invitations error:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
