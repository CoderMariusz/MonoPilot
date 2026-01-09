/**
 * Story 01.14: Wizard Step 4 - Product Creation API Route
 * Epic: 01-settings
 * Type: API Route - POST
 *
 * POST /api/v1/settings/onboarding/step/4
 * Creates first product (or skips) and advances to step 5.
 *
 * Auth: admin/super_admin only
 * Updates: products table, organizations.wizard_progress
 */

import { NextRequest, NextResponse } from 'next/server'
import { WizardService } from '@/lib/services/wizard-service'
import { wizardStep4Schema } from '@/lib/validation/wizard-steps'
import { hasAdminAccess } from '@/lib/services/permission-service'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'

/**
 * POST /api/v1/settings/onboarding/step/4
 * Save product (wizard step 4)
 *
 * @param request - Next.js request object
 * @returns NextResponse with success status and product data
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
    const result = wizardStep4Schema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    // Save product via wizard service
    const response = await WizardService.saveStep4Product(result.data)

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
      if (error.message === 'SKU already exists') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message === 'SKU and product name are required') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
      if (error.message.includes('SKU must be')) {
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
