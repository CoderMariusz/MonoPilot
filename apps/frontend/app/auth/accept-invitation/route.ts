/**
 * POST /api/auth/accept-invitation
 * Story: 01.16 - User Invitations (Email)
 * Description: Accept invitation and create user account (PUBLIC - no auth required)
 * Permission: Public (anyone with valid token)
 */

import { NextRequest, NextResponse } from 'next/server'
import { InvitationService } from '@/lib/services/invitation-service'
import { acceptInvitationSchema } from '@/lib/validation/invitation-schemas'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body (PUBLIC - no auth check)
    const body = await request.json()
    const validatedData = acceptInvitationSchema.parse(body)

    // 2. Accept invitation and create user account
    const result = await InvitationService.acceptInvitation(
      validatedData.token,
      validatedData.password
    )

    // 3. Return success with user data and access token for auto-login
    return NextResponse.json(
      {
        user_id: result.user_id,
        access_token: result.access_token,
        org_name: result.org_name,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('POST /api/auth/accept-invitation error:', error)

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    // Handle known errors
    if (error instanceof Error) {
      // Expired invitation
      if (error.message.includes('expired')) {
        return NextResponse.json({ error: error.message }, { status: 410 }) // 410 Gone
      }

      // Invalid/used invitation
      if (error.message.includes('Invalid') || error.message.includes('already')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
