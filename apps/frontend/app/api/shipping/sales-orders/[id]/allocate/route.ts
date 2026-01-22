/**
 * API Route: Inventory Allocation
 * Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
 *
 * POST /api/shipping/sales-orders/:id/allocate - Confirm allocation
 *
 * Roles: Manager, Admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { InventoryAllocationService } from '@/lib/services/inventory-allocation-service'
import { allocateRequestSchema } from '@/lib/validation/allocation'

// ============================================================================
// Role Constants
// ============================================================================

const ALLOCATE_ALLOWED_ROLES = ['admin', 'owner', 'super_admin', 'superadmin', 'manager']

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
// POST Handler - Confirm Allocation
// ============================================================================

/**
 * POST /api/shipping/sales-orders/:id/allocate
 * Confirm allocation and reserve LPs for SO lines
 *
 * AC-6: Manual allocation endpoint
 * AC-7: Permission validation (Manager+)
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

    // Check role authorization (AC-7)
    const role = normalizeRole(userData.role)
    if (!role || !ALLOCATE_ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions (requires Manager+)' } },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = allocateRequestSchema.safeParse(body)

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

    // Validate SO status (must be confirmed)
    if (so.status !== 'confirmed') {
      return NextResponse.json(
        { error: { code: 'INVALID_SO_STATUS', message: 'SO must be in confirmed status' } },
        { status: 400 }
      )
    }

    // Execute allocation
    const result = await InventoryAllocationService.allocateSalesOrder(
      supabaseAdmin,
      id,
      validationResult.data,
      user.id,
      userData.org_id
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders/:id/allocate:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    // Handle specific error types
    if (message.includes('LP already allocated')) {
      return NextResponse.json(
        { error: { code: 'LP_ALREADY_ALLOCATED', message } },
        { status: 409 }
      )
    }

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message } },
        { status: 404 }
      )
    }

    if (message.includes('exceeds available') || message.includes('does not match')) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message } },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
