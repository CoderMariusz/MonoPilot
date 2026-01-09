/**
 * Story 01.14: Wizard Location Templates API Route
 * Epic: 01-settings
 * Type: API Route - GET
 *
 * GET /api/v1/settings/onboarding/templates/locations
 * Returns available location templates for wizard step 3.
 *
 * Auth: authenticated users
 * Returns: Array of LocationTemplate objects
 */

import { NextResponse } from 'next/server'
import { LOCATION_TEMPLATES } from '@/lib/constants/wizard-templates'
import { getOrgContext, deriveUserIdFromSession } from '@/lib/services/org-context-service'

/**
 * GET /api/v1/settings/onboarding/templates/locations
 * Get available location templates
 *
 * @returns NextResponse with location templates
 */
export async function GET() {
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

    // Return location templates
    return NextResponse.json({
      success: true,
      templates: LOCATION_TEMPLATES,
    })
  } catch (error) {
    // Handle specific error messages
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
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
