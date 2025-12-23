/**
 * API Route: GET /api/v1/settings/onboarding/status
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Returns onboarding status for the authenticated user's organization.
 * Used by frontend to determine whether to show wizard and current step.
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
 * GET /api/v1/settings/onboarding/status
 * Returns onboarding status for current organization
 *
 * Response:
 * {
 *   step: number,              // Current step (0=not started, 1-6=wizard steps)
 *   started_at: string | null, // ISO timestamp when wizard first shown
 *   completed_at: string | null, // ISO timestamp when wizard completed or skipped
 *   skipped: boolean,          // True if user chose to skip wizard
 *   is_complete: boolean       // True if onboarding is complete
 * }
 *
 * Errors:
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (inactive user/org)
 * - 404: Not Found (user not found)
 * - 500: Internal Server Error
 */
export async function GET(request: Request) {
  try {
    // 1. Get authenticated user from session
    const userId = await deriveUserIdFromSession()

    // 2. Get org context for tenant isolation
    const context = await getOrgContext(userId)

    // 3. Get server-side Supabase client
    const supabase = await createServerSupabase()

    // 4. Get onboarding status from service
    const status = await OnboardingService.getStatus(supabase, context.org_id)

    // 5. Return status
    return NextResponse.json(status, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
