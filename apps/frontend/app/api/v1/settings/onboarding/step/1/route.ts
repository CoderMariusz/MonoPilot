/**
 * Story 01.4: Organization Profile Step - API Route
 * Epic: 01-settings
 * Type: API Route - POST
 *
 * POST /api/v1/settings/onboarding/step/1
 * Saves organization profile (wizard step 1) and advances to step 2.
 *
 * Auth: admin/super_admin only
 * Updates: organizations table (name, timezone, language, currency, onboarding_step)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { organizationProfileStepSchema } from '@/lib/validation/organization-profile-step'
import { hasAdminAccess } from '@/lib/services/permission-service'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'
import { UnauthorizedError } from '@/lib/errors/unauthorized-error'

/**
 * POST /api/v1/settings/onboarding/step/1
 * Save organization profile (wizard step 1)
 *
 * @param request - Next.js request object
 * @returns NextResponse with success status and updated organization data
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createServerSupabase()

    // Derive user ID from session
    const userId = await deriveUserIdFromSession()

    // Get organization context (includes user authentication)
    const context = await getOrgContext(userId)

    // Check authentication
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check authorization - only admin/super_admin can update organization
    if (!hasAdminAccess(context.role_code)) {
      return NextResponse.json(
        { error: 'Only admin users can update organization' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const result = organizationProfileStepSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    const { name, timezone, language, currency } = result.data

    // Update organization in database
    const { data: org, error } = await supabase
      .from('organizations')
      .update({
        name,
        timezone,
        language,
        currency,
        onboarding_step: 2,
        onboarding_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', context.org_id)
      .select()
      .single()

    // Handle database errors
    if (error) {
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json({
      success: true,
      next_step: 2,
      organization: {
        id: org.id,
        name: org.name,
        timezone: org.timezone,
        language: org.language,
        currency: org.currency,
      },
    })
  } catch (error) {
    // Handle specific error types
    if (error instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Handle malformed JSON or other errors
    return NextResponse.json(
      { error: 'Bad request' },
      { status: 400 }
    )
  }
}
