/**
 * API Route: PUT /api/v1/settings/onboarding/progress
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Updates wizard progress (step number) for authenticated user's organization
 * Admin-only operation
 */

import { NextResponse } from 'next/server'
import {
  getOrgContext,
  deriveUserIdFromSession,
} from '@/lib/services/org-context-service'
import { handleApiError } from '@/lib/utils/api-error-handler'
import { hasAdminAccess } from '@/lib/services/permission-service'
import { ForbiddenError } from '@/lib/errors/forbidden-error'
import { OnboardingService } from '@/lib/services/onboarding-service'

/**
 * PUT /api/v1/settings/onboarding/progress
 * Updates wizard progress (current step)
 *
 * Request:
 * {
 *   step: number; // 1-6
 * }
 *
 * Response:
 * {
 *   success: true;
 *   step: number;
 * }
 *
 * Errors:
 * - 400: Bad Request (invalid step number)
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (not admin or inactive user/org)
 * - 404: Not Found (user not found)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/v1/settings/onboarding/progress', {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ step: 3 }),
 * });
 * const data = await response.json();
 * console.log(data.step); // 3
 * ```
 */
export async function PUT(request: Request) {
  try {
    // 1. Get authenticated user from session
    const userId = await deriveUserIdFromSession()

    // 2. Get org context
    const context = await getOrgContext(userId)

    // 3. Check admin permission
    if (!hasAdminAccess(context.role_code)) {
      throw new ForbiddenError('Only administrators can update onboarding progress')
    }

    // 4. Parse request body
    const body = await request.json()
    const { step } = body

    // 5. Validate step number (1-6)
    if (typeof step !== 'number' || step < 1 || step > 6) {
      return NextResponse.json(
        { error: 'Invalid step number. Must be between 1 and 6' },
        { status: 400 }
      )
    }

    // 6. Update progress via service
    await OnboardingService.updateProgress(context.org_id, step)

    // 7. Return success
    return NextResponse.json(
      {
        success: true,
        step,
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
