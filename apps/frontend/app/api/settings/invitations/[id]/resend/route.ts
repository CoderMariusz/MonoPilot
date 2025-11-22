import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { resendInvitation } from '@/lib/services/invitation-service'
import { generateInvitationQRCode } from '@/lib/utils/qr-code-generator'
import { sendInvitationEmail } from '@/lib/services/email-service'

/**
 * Resend Invitation API
 * Story: 1.3 User Invitations
 * Task 4: API Endpoints (AC-003.2)
 *
 * POST /api/settings/invitations/:id/resend - Resend invitation email
 */

// ============================================================================
// POST /api/settings/invitations/:id/resend - Resend Invitation (AC-003.2)
// ============================================================================

export async function POST(
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

    // Resend invitation (generates new token, invalidates old)
    const invitation = await resendInvitation(id, currentUser.org_id)

    // Get organization name for email template
    const { data: org } = await supabase
      .from('organizations')
      .select('company_name')
      .eq('id', currentUser.org_id)
      .single()

    // Generate QR code for invitation
    const qrCode = await generateInvitationQRCode(
      invitation.token,
      invitation.email
    )

    // Send new invitation email
    await sendInvitationEmail({
      email: invitation.email,
      token: invitation.token,
      qrCodeDataUrl: qrCode,
      orgName: org?.company_name || 'MonoPilot',
      role: invitation.role,
      expiresAt: new Date(invitation.expires_at),
    })

    return NextResponse.json(
      {
        invitation,
        message: `Invitation resent to ${invitation.email}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/invitations/:id/resend:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Internal server error'

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
