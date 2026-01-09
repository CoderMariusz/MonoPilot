/**
 * User Warehouse Access API Routes
 * Story: 01.5b - User Warehouse Access Restrictions (Phase 1B)
 *
 * GET /api/v1/settings/users/:id/warehouse-access - Get user's warehouse access
 * PUT /api/v1/settings/users/:id/warehouse-access - Update user's warehouse access
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabase } from '@/lib/supabase/server'
import { UserWarehouseService } from '@/lib/services/user-warehouse-service'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/** Roles allowed to manage user warehouse access */
const ALLOWED_ROLES = ['owner', 'admin'] as const

/** Extract role code from Supabase role relation response */
function extractRoleCode(roleData: unknown): string | null {
  if (!roleData) return null
  if (Array.isArray(roleData)) {
    return (roleData[0] as { code?: string })?.code ?? null
  }
  return (roleData as { code?: string })?.code ?? null
}

/** Check if role has permission to manage warehouse access */
function hasWarehouseAccessPermission(roleCode: string | null): boolean {
  return roleCode !== null && ALLOWED_ROLES.includes(roleCode as typeof ALLOWED_ROLES[number])
}

/** Auth context for warehouse access routes */
interface AuthContext {
  authUser: { id: string }
  userData: { org_id: string; role: unknown }
}

/**
 * Authenticate and authorize user for warehouse access management
 * Returns auth context or NextResponse error
 */
async function authenticateAndAuthorize(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>
): Promise<AuthContext | NextResponse> {
  // Get current user
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's org_id and role
  const { data: userData } = await supabase
    .from('users')
    .select('org_id, role:roles(code)')
    .eq('id', authUser.id)
    .single()

  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check permissions
  const roleCode = extractRoleCode(userData.role)
  if (!hasWarehouseAccessPermission(roleCode)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  return { authUser, userData }
}

/** Type guard to check if result is NextResponse error */
function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}

/**
 * Validation schema for warehouse access update
 * Implements validation from story 01.5b
 */
const UpdateWarehouseAccessSchema = z.object({
  all_warehouses: z.boolean(),
  warehouse_ids: z.array(z.string().uuid()).optional(),
}).refine(
  (data) => {
    // If not all warehouses, must have at least one warehouse (or explicitly empty)
    if (!data.all_warehouses && (!data.warehouse_ids || data.warehouse_ids.length === 0)) {
      // Allow empty array for explicit no access
      return data.warehouse_ids !== undefined
    }
    return true
  },
  {
    message: 'At least one warehouse must be selected when all_warehouses is false',
    path: ['warehouse_ids'],
  }
)

/**
 * GET /api/v1/settings/users/:id/warehouse-access
 * Get user's warehouse access
 *
 * Response:
 * - user_id: string
 * - all_warehouses: boolean
 * - warehouse_ids: string[]
 * - warehouses: { id, code, name }[]
 * - warning?: string (if non-admin with NULL access)
 */
export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await params

    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(supabase)
    if (isAuthError(authResult)) {
      return authResult
    }
    const { userData } = authResult

    // Get warehouse access using service
    const warehouseAccess = await UserWarehouseService.getWarehouseAccess(
      id,
      userData.org_id
    )

    if (!warehouseAccess) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(warehouseAccess, { status: 200 })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error in GET /api/v1/settings/users/:id/warehouse-access:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/settings/users/:id/warehouse-access
 * Update user's warehouse access
 *
 * Body:
 * - all_warehouses: boolean
 * - warehouse_ids?: string[] (required if all_warehouses is false)
 *
 * Response:
 * - success: boolean
 * - user_id: string
 * - audit_log: { action, old_value, new_value, changed_by, changed_at }
 */
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await params

    // Authenticate and authorize
    const authResult = await authenticateAndAuthorize(supabase)
    if (isAuthError(authResult)) {
      return authResult
    }
    const { authUser, userData } = authResult

    // Parse and validate request body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Validation error', details: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validationResult = UpdateWarehouseAccessSchema.safeParse(body)
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return NextResponse.json(
        {
          error: firstError?.message || 'Validation error',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Verify user exists in org (RLS enforcement)
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update warehouse access using service
    try {
      const result = await UserWarehouseService.updateWarehouseAccess(
        id,
        userData.org_id,
        validatedData,
        authUser.id
      )

      return NextResponse.json({
        ...result,
        user_id: id,
      }, { status: 200 })
    } catch (serviceError: unknown) {
      // Handle service-level errors
      const message = serviceError instanceof Error ? serviceError.message : ''
      if (message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (message === 'Invalid warehouse IDs') {
        return NextResponse.json({ error: 'Invalid warehouse IDs' }, { status: 400 })
      }
      throw serviceError
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('Error in PUT /api/v1/settings/users/:id/warehouse-access:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
