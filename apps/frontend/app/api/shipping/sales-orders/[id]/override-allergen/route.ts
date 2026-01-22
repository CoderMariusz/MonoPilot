/**
 * API Route: SO Allergen Override
 * Story: 07.6 - SO Allergen Validation
 *
 * POST /api/shipping/sales-orders/:id/override-allergen
 *   - Manager/Admin override allergen block with reason capture
 *   - Creates audit log entry
 *   - Updates SO allergen flags
 *
 * Roles: Manager, Admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { overrideAllergenBlock } from '@/lib/services/so-allergen-validation-service'
import { normalizeRoleFromQuery } from '@/lib/utils/role-normalizer'
import {
  overrideAllergenSchema,
  OVERRIDE_ALLOWED_ROLES,
} from '@/lib/validation/allergen-validation-schemas'

// ============================================================================
// POST Handler
// ============================================================================

/**
 * POST /api/shipping/sales-orders/:id/override-allergen
 * Manager/Admin override allergen block with reason capture
 *
 * Body:
 * - reason: string (20-500 chars)
 * - confirmed: boolean (must be true)
 *
 * Returns:
 * - 200: Override successful
 * - 400: Invalid reason or unconfirmed
 * - 401: Not authenticated
 * - 403: Permission denied (not Manager/Admin)
 * - 404: SO not found
 * - 409: No conflicts to override
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

    // Check role permission (Manager+ only)
    const role = normalizeRoleFromQuery(userData.role)
    if (!role || !OVERRIDE_ALLOWED_ROLES.includes(role as typeof OVERRIDE_ALLOWED_ROLES[number])) {
      return NextResponse.json(
        {
          error: {
            code: 'PERMISSION_DENIED',
            message: 'Only Manager or Admin roles can override allergen blocks',
          },
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = overrideAllergenSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      // Determine appropriate error code
      let code = 'VALIDATION_ERROR'
      if (firstError?.path.includes('reason')) {
        code = 'INVALID_REASON'
      } else if (firstError?.path.includes('confirmed')) {
        code = 'UNCONFIRMED'
      }

      return NextResponse.json(
        {
          error: {
            code,
            message: firstError?.message || 'Validation failed',
            details: errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        },
        { status: 400 }
      )
    }

    // Perform override
    const result = await overrideAllergenBlock(id, validationResult.data)

    if (!result.success) {
      // Map error codes to HTTP status
      const statusMap: Record<string, number> = {
        SALES_ORDER_NOT_FOUND: 404,
        PERMISSION_DENIED: 403,
        INVALID_REASON: 400,
        UNCONFIRMED: 400,
        NO_CONFLICTS: 409,
        DATABASE_ERROR: 500,
        UNAUTHORIZED: 401,
      }
      const status = statusMap[result.code || 'DATABASE_ERROR'] || 500

      return NextResponse.json(
        { error: { code: result.code, message: result.error } },
        { status }
      )
    }

    return NextResponse.json(result.data, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders/:id/override-allergen:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
