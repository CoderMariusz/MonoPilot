/**
 * API Route: GET /api/v1/settings/onboarding/status
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Returns onboarding status for authenticated user's organization
 * Used by frontend to determine whether to show wizard modal
 */

import { NextResponse } from 'next/server'
import {
  getOrgContext,
  deriveUserIdFromSession,
} from '@/lib/services/org-context-service'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { hasAdminAccess } from '@/lib/services/permission-service'
import { OnboardingService } from '@/lib/services/onboarding-service'
import { OnboardingStatusResponseSchema } from '@/lib/validation/onboarding-schemas'

/**
 * GET /api/v1/settings/onboarding/status
 * Returns current onboarding status for logged-in organization
 *
 * Response:
 * {
 *   step: number;              // 0-6 (0=not started, 6=complete)
 *   started_at: string | null; // ISO timestamp
 *   completed_at: string | null;
 *   skipped: boolean;
 *   can_skip: boolean;         // True if admin role
 * }
 *
 * Errors:
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (inactive user/org)
 * - 404: Not Found (user not found)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/v1/settings/onboarding/status');
 * const data = await response.json();
 * console.log(data.step); // 0
 * console.log(data.can_skip); // true (if admin)
 * ```
 */
export async function GET(request: Request) {
  try {
    // 1. Get authenticated user from session
    const userId = await deriveUserIdFromSession()

    // 2. Get org context
    const context = await getOrgContext(userId)

    // 3. Fetch onboarding status via service
    const status = await OnboardingService.getStatus(context.org_id)

    // 4. Build response
    const response = {
      step: status.step,
      started_at: status.started_at,
      completed_at: status.completed_at,
      skipped: status.skipped,
      can_skip: hasAdminAccess(context.role_code),
    }

    // 5. Validate response against schema
    const validated = OnboardingStatusResponseSchema.parse(response)

    // 6. Return status
    return NextResponse.json(validated, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
