/**
 * API Route: Sales Order Status Change
 * Story: 07.3 - SO Status Workflow (Hold/Cancel/Confirm)
 *
 * PATCH /api/shipping/sales-orders/:id/status - Change SO status
 *
 * Actions:
 * - hold: Put order on hold (Sales, Manager, Admin)
 * - cancel: Cancel order (Manager, Admin only)
 * - confirm: Confirm order / release from hold (Sales, Manager, Admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { SOStatusService } from '@/lib/services/so-status-service'
import { statusChangeSchema } from '@/lib/validation/so-status-schemas'
import { z } from 'zod'

// ============================================================================
// Role Constants
// ============================================================================

const HOLD_ALLOWED_ROLES = ['admin', 'owner', 'super_admin', 'superadmin', 'manager', 'sales']
const CANCEL_ALLOWED_ROLES = ['admin', 'owner', 'super_admin', 'superadmin', 'manager']
const CONFIRM_ALLOWED_ROLES = ['admin', 'owner', 'super_admin', 'superadmin', 'manager', 'sales']

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
// PATCH Handler
// ============================================================================

/**
 * PATCH /api/shipping/sales-orders/:id/status
 * Change the status of a sales order
 *
 * Body: { action: 'hold' | 'cancel' | 'confirm', reason?: string }
 *
 * Auth:
 * - hold: Sales, Manager, Admin
 * - cancel: Manager, Admin only
 * - confirm: Sales, Manager, Admin
 */
export async function PATCH(
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

    const role = normalizeRole(userData.role)

    // Parse and validate request body
    const body = await request.json()
    const validationResult = statusChangeSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      // Determine appropriate error message
      let message = 'Validation failed'
      if (firstError) {
        if (firstError.path.includes('reason')) {
          message = firstError.message
        } else if (firstError.path.includes('action')) {
          message = firstError.message
        } else {
          message = firstError.message
        }
      }

      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message,
            details: errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
          },
        },
        { status: 400 }
      )
    }

    const { action, reason } = validationResult.data

    // Check role-based authorization
    if (action === 'hold') {
      if (!role || !HOLD_ALLOWED_ROLES.includes(role)) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient permissions to hold orders' } },
          { status: 403 }
        )
      }
    } else if (action === 'cancel') {
      if (!role || !CANCEL_ALLOWED_ROLES.includes(role)) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient permissions to cancel orders' } },
          { status: 403 }
        )
      }
    } else if (action === 'confirm') {
      if (!role || !CONFIRM_ALLOWED_ROLES.includes(role)) {
        return NextResponse.json(
          { error: { code: 'FORBIDDEN', message: 'Insufficient permissions to confirm orders' } },
          { status: 403 }
        )
      }
    }

    // Check if SO exists within the user's org (RLS)
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

    // Execute the appropriate action
    let result

    if (action === 'hold') {
      result = await SOStatusService.holdOrder(id, reason, userData.org_id)
    } else if (action === 'cancel') {
      result = await SOStatusService.cancelOrder(id, reason || '', userData.org_id)
    } else if (action === 'confirm') {
      result = await SOStatusService.confirmOrder(id, userData.org_id)
    } else {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid action' } },
        { status: 400 }
      )
    }

    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 400
      return NextResponse.json(
        { error: { code: result.code || 'INVALID_STATUS', message: result.error } },
        { status: statusCode }
      )
    }

    // Build success response
    const responseMessage =
      action === 'hold'
        ? 'Sales order placed on hold'
        : action === 'cancel'
          ? 'Sales order cancelled'
          : action === 'confirm' && so.status === 'on_hold'
            ? 'Sales order released from hold'
            : 'Sales order confirmed'

    return NextResponse.json({
      success: true,
      sales_order: {
        id: result.data!.id,
        so_number: result.data!.order_number || result.data!.so_number,
        status: result.data!.status,
        notes: result.data!.notes,
        updated_at: result.data!.updated_at,
        confirmed_at: result.data!.confirmed_at,
      },
      message: responseMessage,
    })
  } catch (error) {
    console.error('Error in PATCH /api/shipping/sales-orders/:id/status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST Handlers for specific actions (alternative endpoints)
// ============================================================================

/**
 * POST /api/shipping/sales-orders/:id/status
 * Alternative endpoint - delegates to PATCH with action in body
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context)
}
