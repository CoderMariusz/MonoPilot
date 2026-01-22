/**
 * API Route: Customer Order History
 * Story: 07.6 - SO Allergen Validation
 *
 * GET /api/shipping/customers/:id/orders
 *   - Get paginated order history for customer
 *   - Sorted by order_date DESC (newest first)
 *   - Default 20 per page, max 100
 *
 * Roles: Sales Clerk, Manager, Admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { getCustomerOrderHistory } from '@/lib/services/so-allergen-validation-service'
import {
  customerOrderHistorySchema,
  VALIDATION_ALLOWED_ROLES,
} from '@/lib/validation/allergen-validation-schemas'

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeRole(roleData: unknown): string | null {
  if (typeof roleData === 'string') {
    return roleData.toLowerCase()
  }
  if (Array.isArray(roleData) && roleData.length > 0) {
    const first = roleData[0]
    if (typeof first === 'string') return first.toLowerCase()
    if (first && typeof first === 'object' && 'code' in first) {
      return (first as { code: string }).code.toLowerCase()
    }
  }
  if (roleData && typeof roleData === 'object' && 'code' in roleData) {
    return ((roleData as { code: string }).code ?? '').toLowerCase()
  }
  return null
}

// ============================================================================
// GET Handler
// ============================================================================

/**
 * GET /api/shipping/customers/:id/orders
 * Get paginated order history for customer
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - status: string (optional, filter by status)
 *
 * Returns:
 * - 200: Orders list with pagination
 * - 400: Invalid page/limit
 * - 401: Not authenticated
 * - 403: Permission denied
 * - 404: Customer not found
 * - 500: Internal error
 */
export async function GET(
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
    const role = normalizeRole(userData.role)
    if (!role || !VALIDATION_ALLOWED_ROLES.includes(role as typeof VALIDATION_ALLOWED_ROLES[number])) {
      return NextResponse.json(
        {
          error: {
            code: 'PERMISSION_DENIED',
            message: "You don't have permission to view orders for this customer",
          },
        },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      status: searchParams.get('status') || undefined,
    }

    // Validate query params
    const validationResult = customerOrderHistorySchema.safeParse(queryParams)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      // Determine appropriate error code
      let code = 'VALIDATION_ERROR'
      if (firstError?.path.includes('page')) {
        code = 'INVALID_PAGE'
      } else if (firstError?.path.includes('limit')) {
        code = 'INVALID_LIMIT'
      }

      return NextResponse.json(
        {
          error: {
            code,
            message: firstError?.message || 'Invalid query parameters',
          },
        },
        { status: 400 }
      )
    }

    // Get order history
    const result = await getCustomerOrderHistory(id, validationResult.data)

    if (!result.success) {
      // Map error codes to HTTP status
      const statusMap: Record<string, number> = {
        CUSTOMER_NOT_FOUND: 404,
        PERMISSION_DENIED: 403,
        INVALID_PAGE: 400,
        INVALID_LIMIT: 400,
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
    console.error('Error in GET /api/shipping/customers/:id/orders:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
