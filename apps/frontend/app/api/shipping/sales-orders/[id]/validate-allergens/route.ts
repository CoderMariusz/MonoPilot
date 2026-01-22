/**
 * API Route: SO Allergen Validation
 * Story: 07.6 - SO Allergen Validation
 *
 * POST /api/shipping/sales-orders/:id/validate-allergens
 *   - Validate SO lines against customer allergen restrictions
 *   - Returns conflicts or success
 *   - Updates SO allergen_validated flag
 *   - Creates audit log entry
 *
 * Roles: Sales Clerk, Manager, Admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { validateSalesOrderAllergens } from '@/lib/services/so-allergen-validation-service'
import { normalizeRoleFromQuery } from '@/lib/utils/role-normalizer'
import { VALIDATION_ALLOWED_ROLES } from '@/lib/validation/allergen-validation-schemas'

// ============================================================================
// POST Handler
// ============================================================================

/**
 * POST /api/shipping/sales-orders/:id/validate-allergens
 * Validate SO lines against customer allergen restrictions
 *
 * Returns:
 * - 200: Validation result (valid or conflicts)
 * - 400: Invalid SO status
 * - 401: Not authenticated
 * - 403: Permission denied
 * - 404: SO not found
 * - 500: Internal error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Not logged in' } },
        { status: 401 }
      )
    }

    // Get user's org and role
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'User not found' } },
        { status: 403 }
      )
    }

    // Check role permission
    const role = normalizeRoleFromQuery(userData.role)
    if (!role || !VALIDATION_ALLOWED_ROLES.includes(role as typeof VALIDATION_ALLOWED_ROLES[number])) {
      return NextResponse.json(
        {
          error: {
            code: 'PERMISSION_DENIED',
            message: "You don't have permission to validate this sales order",
          },
        },
        { status: 403 }
      )
    }

    // Perform validation
    const result = await validateSalesOrderAllergens(id)

    if (!result.success) {
      // Map error codes to HTTP status
      const statusMap: Record<string, number> = {
        SALES_ORDER_NOT_FOUND: 404,
        PERMISSION_DENIED: 403,
        INVALID_SO_STATUS: 400,
        VALIDATION_ERROR: 500,
        DATABASE_ERROR: 500,
        UNAUTHORIZED: 401,
      }
      const status = statusMap[result.code || 'VALIDATION_ERROR'] || 500

      return NextResponse.json(
        { error: { code: result.code, message: result.error } },
        { status }
      )
    }

    return NextResponse.json(result.data, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders/:id/validate-allergens:', error)
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
