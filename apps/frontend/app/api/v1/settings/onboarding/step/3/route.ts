/**
 * Story 01.14: Wizard Step 3 - Location Creation API Route
 * Epic: 01-settings
 * Type: API Route - POST
 *
 * POST /api/v1/settings/onboarding/step/3
 * Creates locations from template (or custom) and advances to step 4.
 *
 * Auth: admin/super_admin only
 * Updates: locations table, organizations.wizard_progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { WizardService } from '@/lib/services/wizard-service'
import { wizardStep3Schema } from '@/lib/validation/wizard-steps'
import { hasAdminAccess } from '@/lib/services/permission-service'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'

/**
 * POST /api/v1/settings/onboarding/step/3
 * Save locations (wizard step 3)
 *
 * @param request - Next.js request object
 * @returns NextResponse with success status and locations data
 */
export async function POST(request: NextRequest) {
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

    // Check authorization - only admin/super_admin can update wizard
    if (!hasAdminAccess(context.role_code)) {
      return NextResponse.json(
        { error: 'Only admin users can complete wizard steps' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const result = wizardStep3Schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    // Save locations via wizard service
    const response = await WizardService.saveStep3Locations(result.data)

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
      if (error.message.includes('template')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message === 'Warehouse not found in wizard progress') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
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
