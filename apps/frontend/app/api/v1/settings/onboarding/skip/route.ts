/**
 * API Route: POST /api/v1/settings/onboarding/skip
 * Story: 01.3 - Onboarding Wizard Launcher
 *
 * Skips onboarding wizard and creates demo data for the organization.
 * Transactionally creates demo warehouse, location, and product.
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
 * POST /api/v1/settings/onboarding/skip
 * Skips wizard and creates demo data
 *
 * Body: {} (empty)
 *
 * Response:
 * {
 *   success: true,
 *   warehouse_id: string, // UUID of created demo warehouse
 *   location_id: string,  // UUID of created demo location
 *   product_id: string    // UUID of created demo product
 * }
 *
 * Errors:
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (inactive user/org or insufficient permissions)
 * - 404: Not Found (user not found)
 * - 500: Internal Server Error (demo data creation failed)
 *
 * Security:
 * - Requires OWNER or ADMIN role
 * - Demo data created with proper org_id for RLS isolation
 * - Uses transactional RPC function for atomic operation
 */
export async function POST(request: Request) {
  try {
    // 1. Get authenticated user from session
    const userId = await deriveUserIdFromSession()

    // 2. Get org context for tenant isolation and permission check
    const context = await getOrgContext(userId)

    // 3. Check permissions (only OWNER and ADMIN can skip wizard)
    const allowedRoles = ['owner', 'admin']
    if (!allowedRoles.includes(context.role_code)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 4. Get server-side Supabase client
    const supabase = await createServerSupabase()

    // 5. Skip wizard and create demo data
    const result = await OnboardingService.skipWizard(supabase, context.org_id)

    // 6. Return demo data IDs
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
