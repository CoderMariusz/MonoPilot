/**
 * API Route: Clone Sales Order
 * Story: 07.5 - SO Clone/Import
 *
 * POST /api/shipping/sales-orders/:id/clone - Clone existing SO to new draft
 *
 * Auth: Required
 * Roles: sales, manager, admin, super_admin
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { SalesOrderService } from '@/lib/services/sales-order-service'

// ============================================================================
// Role Constants
// ============================================================================

const CLONE_ALLOWED_ROLES = ['admin', 'owner', 'super_admin', 'superadmin', 'manager', 'sales']

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
// POST Handler
// ============================================================================

/**
 * POST /api/shipping/sales-orders/:id/clone
 * Clone an existing sales order to a new draft order
 *
 * Response:
 * - 201: Success with cloned SO data
 * - 401: Not authenticated
 * - 403: Insufficient permissions
 * - 404: SO not found
 * - 500: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const supabase = await createServerSupabase()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

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

    const role = normalizeRole(userData.role)

    // Check role-based authorization
    if (!role || !CLONE_ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to clone orders',
          },
        },
        { status: 403 }
      )
    }

    // Check if SO exists within the user's org (RLS)
    const { data: sourceOrder, error: soError } = await supabaseAdmin
      .from('sales_orders')
      .select('id, order_number, status, org_id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (soError || !sourceOrder) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Sales order not found' } },
        { status: 404 }
      )
    }

    // Clone the order using the service
    const clonedOrder = await SalesOrderService.cloneSalesOrder(id)

    // Fetch customer name for response
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('name')
      .eq('id', clonedOrder.customer_id)
      .single()

    // Build success response
    return NextResponse.json(
      {
        success: true,
        message: 'Sales order cloned successfully',
        clonedFrom: sourceOrder.order_number,
        salesOrder: {
          id: clonedOrder.id,
          order_number: clonedOrder.order_number,
          status: clonedOrder.status,
          customer_id: clonedOrder.customer_id,
          customer_name: customer?.name || null,
          shipping_address_id: clonedOrder.shipping_address_id,
          order_date: clonedOrder.order_date,
          promised_ship_date: clonedOrder.promised_ship_date,
          required_delivery_date: clonedOrder.required_delivery_date,
          customer_po: clonedOrder.customer_po,
          notes: clonedOrder.notes,
          total_amount: clonedOrder.total_amount,
          line_count: clonedOrder.line_count,
          allergen_validated: clonedOrder.allergen_validated,
          lines: clonedOrder.lines.map((line) => ({
            id: line.id,
            line_number: line.line_number,
            product_id: line.product_id,
            quantity_ordered: line.quantity_ordered,
            quantity_allocated: line.quantity_allocated,
            quantity_picked: line.quantity_picked,
            quantity_packed: line.quantity_packed,
            quantity_shipped: line.quantity_shipped,
            unit_price: line.unit_price,
            notes: line.notes,
          })),
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/shipping/sales-orders/:id/clone:', error)

    const message =
      error instanceof Error ? error.message : 'Internal server error'

    // Handle specific error messages
    if (message === 'Sales order not found') {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'CLONE_FAILED', message } },
      { status: 500 }
    )
  }
}
