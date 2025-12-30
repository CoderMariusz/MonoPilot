/**
 * GET /api/auth/invitation/:token
 * Story: 01.16 - User Invitations (Email)
 * Description: Get invitation details by token (PUBLIC - no auth required)
 * Permission: Public (anyone with valid token)
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/lib/services/invitation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    // 1. Validate token format (64-char hex)
    if (!token || token.length !== 64 || !/^[0-9a-f]{64}$/.test(token)) {
      return NextResponse.json({ error: 'Invalid invitation token format' }, { status: 400 })
    }

    // 2. Get invitation details (PUBLIC - no auth check)
    const invitation = await InvitationService.getInvitationByToken(token)

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found or has been used' }, { status: 404 })
    }

    // 3. Return invitation details
    return NextResponse.json({
      email: invitation.email,
      role_name: invitation.role_name,
      org_name: invitation.org_name,
      expires_at: invitation.expires_at,
      is_expired: invitation.is_expired,
    })
  } catch (error) {
    console.error('GET /api/auth/invitation/:token error:', error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
