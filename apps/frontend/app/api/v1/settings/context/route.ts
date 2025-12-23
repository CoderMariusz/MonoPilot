/**
 * API Route: GET /api/v1/settings/context
 * Story: 01.1 - Org Context + Base RLS
 *
 * Returns org context for authenticated user
 * Used by frontend to resolve org_id, role, and permissions
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  getOrgContext,
  deriveUserIdFromSession,
} from '@/lib/services/org-context-service'
import { handleApiError } from '@/lib/utils/api-error-handler'

/**
 * GET /api/v1/settings/context
 * Returns org context for authenticated user
 *
 * Response:
 * {
 *   org_id: string
 *   user_id: string
 *   role_code: string
 *   role_name: string
 *   permissions: Record<string, string>
 *   organization: { ... }
 * }
 *
 * Errors:
 * - 401: Unauthorized (no session)
 * - 403: Forbidden (inactive user/org)
 * - 404: Not Found (user not found)
 */
export async function GET(request: Request) {
  try {
    // 1. Get authenticated user from session
    const userId = await deriveUserIdFromSession()

    // 2. Get org context
    const context = await getOrgContext(userId)

    // 3. Return context
    return NextResponse.json(context, { status: 200 })
  } catch (error) {
    return handleApiError(error)
  }
}
