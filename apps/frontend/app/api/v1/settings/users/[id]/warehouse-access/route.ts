/**
 * API Route: User Warehouse Access
 * Story: 01.5b - User Warehouse Access Restrictions
 * Path: /api/v1/settings/users/:id/warehouse-access
 *
 * Endpoints:
 * - GET: Fetch warehouse access for a user
 * - PUT: Update warehouse access for a user
 *
 * Security:
 * - JWT auth required
 * - RLS enforces org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { UserWarehouseService } from '@/lib/services/user-warehouse-service'
import { updateWarehouseAccessSchema } from '@/lib/validation/warehouse-access-schemas'
import type { WarehouseAccessResponse } from '@/lib/validation/warehouse-access-schemas'

/**
 * GET /api/v1/settings/users/:id/warehouse-access
 * Fetch warehouse access for a user
 *
 * Response:
 * - 200: { user_id, all_warehouses, warehouse_ids, warehouses }
 * - 404: User not found
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<WarehouseAccessResponse | { error: string }>> {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get user's org_id for RLS validation
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', params.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 3. Fetch warehouse access using service
    const warehouseAccess = await UserWarehouseService.getWarehouseAccess(params.id)

    return NextResponse.json(warehouseAccess, { status: 200 })
  } catch (error) {
    console.error('GET /api/v1/settings/users/:id/warehouse-access error:', error)

    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch warehouse access' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/settings/users/:id/warehouse-access
 * Update warehouse access for a user
 *
 * Request Body:
 * - all_warehouses: boolean
 * - warehouse_ids?: string[] (required if all_warehouses is false)
 *
 * Response:
 * - 200: { success: true, user_id, audit_log? }
 * - 400: Validation error
 * - 404: User not found
 * - 401: Unauthorized
 * - 500: Server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean; user_id?: string; audit_log?: any; error?: string }>> {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // 1. Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = updateWarehouseAccessSchema.safeParse(body)

    if (!validationResult.success) {
      const errorMessage = validationResult.error.errors[0]?.message || 'Validation failed'
      return NextResponse.json({ error: errorMessage, success: false }, { status: 400 })
    }

    const data = validationResult.data

    // 3. Verify user exists and belongs to same org (RLS check)
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', params.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'User not found', success: false }, { status: 404 })
    }

    // 4. Update warehouse access using service
    await UserWarehouseService.updateWarehouseAccess(params.id, data)

    // 5. Return success response with audit log info
    return NextResponse.json(
      {
        success: true,
        user_id: params.id,
        audit_log: {
          action: 'warehouse_access_updated',
          old_value: null, // Would need to fetch from service
          new_value: data.all_warehouses ? null : (data.warehouse_ids || []),
          changed_by: user.id,
          changed_at: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('PUT /api/v1/settings/users/:id/warehouse-access error:', error)

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found', success: false }, { status: 404 })
      }
      if (error.message === 'Invalid warehouse IDs') {
        return NextResponse.json({ error: 'Invalid warehouse IDs', success: false }, { status: 400 })
      }
      if (error.message.includes('At least one warehouse')) {
        return NextResponse.json({ error: error.message, success: false }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to update warehouse access', success: false },
      { status: 500 }
    )
  }
}
