/**
 * Story 01.14: Wizard Step 6 - Completion API Route
 * Epic: 01-settings
 * Type: API Route - POST
 *
 * POST /api/v1/settings/onboarding/step/6
 * Completes wizard, awards badges, returns summary.
 *
 * Auth: admin/super_admin only
 * Updates: organizations (onboarding_completed_at, wizard_progress, badges)
 */

import { NextRequest, NextResponse } from 'next/server'
import { WizardService } from '@/lib/services/wizard-service'
import { hasAdminAccess } from '@/lib/services/permission-service'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'

/**
 * POST /api/v1/settings/onboarding/step/6
 * Complete wizard (step 6)
 *
 * @param _request - Next.js request object (unused, no body expected)
 * @returns NextResponse with success status and completion summary
 */
export async function POST(_request: NextRequest) {
  try {
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

    // Check authorization - only admin/super_admin can complete wizard
    if (!hasAdminAccess(context.role_code)) {
      return NextResponse.json(
        { error: 'Only admin users can complete wizard steps' },
        { status: 403 }
      )
    }

    // Complete wizard via wizard service
    const response = await WizardService.completeWizard()

    // Return success response
    return NextResponse.json(response)
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
      if (error.message === 'Organization not found') {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
