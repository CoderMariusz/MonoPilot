/**
 * API Route: Release Allocation
 * Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
 *
 * POST /api/shipping/sales-orders/:id/release-allocation - Release allocations
 *
 * Roles: Manager, Admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { InventoryAllocationService } from '@/lib/services/inventory-allocation-service'
import { releaseAllocationSchema } from '@/lib/validation/allocation'

// ============================================================================
// Role Constants
// ============================================================================

const RELEASE_ALLOWED_ROLES = ['admin', 'owner', 'super_admin', 'superadmin', 'manager']

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
// POST Handler - Release Allocation
// ============================================================================

/**
 * POST /api/shipping/sales-orders/:id/release-allocation
 * Release allocations and restore inventory to available
 *
 * AC-8: Release allocation
 * AC-9, AC-10: Undo window tracking
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
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
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

    // Check role authorization
    const role = normalizeRole(userData.role)
    if (!role || !RELEASE_ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is allowed (defaults applied)
    }

    const validationResult = releaseAllocationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: validationResult.error.errors[0]?.message || 'Validation failed',
            details: validationResult.error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      )
    }

    const { allocation_ids, reason } = validationResult.data

    // Check if SO exists within the user's org
    const { data: so, error: soError } = await supabaseAdmin
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (soError || !so) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Sales order not found' } },
        { status: 404 }
      )
    }

    // Execute release
    let result

    if (allocation_ids && allocation_ids.length > 0) {
      // Release specific allocations
      result = await InventoryAllocationService.releaseAllocationsById(
        supabaseAdmin,
        allocation_ids,
        user.id,
        userData.org_id
      )
    } else {
      // Release all allocations for SO
      result = await InventoryAllocationService.releaseAllocation(
        supabaseAdmin,
        id,
        user.id,
        userData.org_id,
        reason
      )
    }

    return NextResponse.json({
      ...result,
      summary: `Released ${result.allocations_released.length} allocation(s), freed ${result.inventory_freed} units`,
    })
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders/:id/release-allocation:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    // Handle specific error types
    if (message.includes('no active allocations')) {
      return NextResponse.json(
        { error: { code: 'NO_ALLOCATIONS', message } },
        { status: 400 }
      )
    }

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
