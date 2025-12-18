/**
 * API Route: POST /api/v1/settings/onboarding/skip
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Skips onboarding wizard and creates demo data for quick start
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
 * POST /api/v1/settings/onboarding/skip
 * Skips wizard and creates demo data (warehouse + location + product)
 *
 * Request: {}
 *
 * Response:
 * {
 *   success: true;
 *   demo_data: {
 *     warehouse_id?: string;
 *     location_id?: string;
 *     product_id?: string;
 *   };
 *   redirect: "/dashboard";
 * }
 *
 * Business Logic:
 * 1. Verify user is admin
 * 2. Create demo warehouse: { code: 'DEMO-WH', name: 'Main Warehouse', type: 'general', is_default: true }
 * 3. Create default location: { code: 'DEFAULT', name: 'Default Location', type: 'zone' }
 * 4. Create sample product: { code: 'SAMPLE-001', name: 'Sample Product', uom: 'EA', status: 'active' }
 * 5. Set module toggles: { technical: true, others: false }
 * 6. Update org: { onboarding_completed_at: NOW(), onboarding_skipped: true }
 *
 * Errors:
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (not admin or inactive user/org)
 * - 404: Not Found (user not found)
 * - 500: Internal Server Error (demo data creation failed)
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/v1/settings/onboarding/skip', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({}),
 * });
 * const data = await response.json();
 * console.log(data.redirect); // "/dashboard"
 * ```
 */
export async function POST(request: Request) {
  try {
    // 1. Get authenticated user from session
    const userId = await deriveUserIdFromSession()

    // 2. Get org context
    const context = await getOrgContext(userId)

    // 3. Check admin permission
    if (!hasAdminAccess(context.role_code)) {
      throw new ForbiddenError('Only administrators can skip onboarding wizard')
    }

    // 4. Skip wizard via service (creates demo data and updates org)
    const result = await OnboardingService.skipWizard(context.org_id)

    // 5. Return success with demo data IDs and redirect
    return NextResponse.json(
      {
        success: result.success,
        demo_data: {
          warehouse_id: result.warehouse_id,
          location_id: result.location_id,
          product_id: result.product_id,
        },
        redirect: '/dashboard',
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
