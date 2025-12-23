/**
 * API Route: POST /api/v1/settings/onboarding/progress
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Updates onboarding wizard progress as user advances through steps.
 * Sets started_at on first progress update, completed_at when reaching final step.
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { OnboardingService } from '@/lib/services/onboarding-service'
import {
  getOrgContext,
  deriveUserIdFromSession,
} from '@/lib/services/org-context-service'
import { handleApiError } from '@/lib/utils/api-error-handler'

/**
 * POST /api/v1/settings/onboarding/progress
 * Updates wizard progress step
 *
 * Body:
 * {
 *   step: number // Step number (1-6)
 * }
 *
 * Response:
 * {
 *   success: true
 * }
 *
 * Errors:
 * - 400: Bad Request (invalid step number or missing body)
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (inactive user/org or insufficient permissions)
 * - 404: Not Found (user not found)
 * - 500: Internal Server Error (update failed)
 *
 * Security:
 * - Requires OWNER or ADMIN role
 * - Validates step number is integer between 1-6
 * - Automatically sets timestamps (started_at, completed_at)
 */
export async function POST(request: Request) {
  try {
    // 1. Get authenticated user from session
    const userId = await deriveUserIdFromSession()

    // 2. Get org context for tenant isolation and permission check
    const context = await getOrgContext(userId)

    // 3. Check permissions (only OWNER and ADMIN can update progress)
    const allowedRoles = ['owner', 'admin']
    if (!allowedRoles.includes(context.role_code)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // 5. Validate step number
    const step = body?.step
    if (typeof step !== 'number' || !Number.isInteger(step) || step < 1 || step > 6) {
      return NextResponse.json(
        { error: 'Invalid step number (must be integer 1-6)' },
        { status: 400 }
      )
    }

    // 6. Get server-side Supabase client
    const supabase = await createServerSupabase()

    // 7. Update progress
    await OnboardingService.updateProgress(supabase, context.org_id, step)

    // 8. Return success
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
