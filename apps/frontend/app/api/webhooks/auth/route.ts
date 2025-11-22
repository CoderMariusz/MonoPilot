/**
 * Supabase Auth Webhook Handler
 * Story: 1.14 (Batch 1)
 * AC: AC-1.4 (Signup Status Automation)
 *
 * Purpose: Auto-activate users when they signup via invitation link
 *
 * Webhook Event: auth.users.created
 * Trigger: User completes signup via /signup?token=xxx
 * Action: Update user.status = 'active' + invitation.status = 'accepted'
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 1. Verify webhook signature (Supabase secret)
    const signature = request.headers.get('x-webhook-signature')
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('[Webhook] SUPABASE_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Simple signature verification (Supabase uses webhook secret)
    // In production, implement proper HMAC verification if needed
    if (signature !== webhookSecret) {
      console.error('[Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 2. Parse webhook payload
    const payload = await request.json()

    console.log('[Webhook] Received event:', {
      type: payload.type,
      table: payload.table,
      record_id: payload.record?.id
    })

    // 3. Handle auth.users.created event
    if (payload.type === 'INSERT' && payload.table === 'users') {
      const newUser = payload.record
      const invitationToken = newUser.raw_user_meta_data?.invitation_token

      if (!invitationToken) {
        console.log('[Webhook] No invitation token in user metadata, skipping auto-activation')
        return NextResponse.json({
          success: true,
          message: 'No invitation token'
        })
      }

      console.log('[Webhook] Processing signup for user:', newUser.email)

      // 4. Find invitation by token
      const { data: invitation, error: invitationError } = await supabase
        .from('user_invitations')
        .select('id, email, org_id, status')
        .eq('token', invitationToken)
        .single()

      if (invitationError || !invitation) {
        console.error('[Webhook] Invitation not found for token:', invitationError)
        return NextResponse.json({
          success: false,
          error: 'Invitation not found'
        }, { status: 404 })
      }

      // 5. Validate invitation status
      if (invitation.status !== 'pending') {
        console.error('[Webhook] Invitation already used:', invitation.status)
        return NextResponse.json({
          success: false,
          error: `Invitation already ${invitation.status}`
        }, { status: 400 })
      }

      // 6. Update user status to 'active'
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('email', invitation.email)
        .eq('org_id', invitation.org_id)

      if (userUpdateError) {
        console.error('[Webhook] Failed to update user status:', userUpdateError)
        return NextResponse.json({
          success: false,
          error: 'Failed to update user status'
        }, { status: 500 })
      }

      // 7. Update invitation status to 'accepted'
      const { error: invitationUpdateError } = await supabase
        .from('user_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id)

      if (invitationUpdateError) {
        console.error('[Webhook] Failed to update invitation status:', invitationUpdateError)
        // Don't fail the request - user is already activated
      }

      console.log('[Webhook] ✅ User activated successfully:', invitation.email)

      return NextResponse.json({
        success: true,
        message: 'User activated',
        user_email: invitation.email
      })
    }

    // Other event types - ignore
    return NextResponse.json({
      success: true,
      message: 'Event ignored'
    })

  } catch (error) {
    console.error('[Webhook] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
