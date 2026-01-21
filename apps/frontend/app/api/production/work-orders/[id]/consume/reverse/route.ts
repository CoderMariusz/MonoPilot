/**
 * API Route: Reverse Consumption
 * Story 04.6d: Consumption Correction (Reversal)
 *
 * POST /api/production/work-orders/:id/consume/reverse
 * Reverses a consumption record (Manager/Admin only)
 *
 * Related PRD: docs/1-BASELINE/product/modules/PRODUCTION.md (FR-PROD-009)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

// Reversal reason values per 04.6d spec
const REVERSAL_REASONS = [
  'scanned_wrong_lp',
  'wrong_quantity',
  'operator_error',
  'quality_issue',
  'other',
] as const

const reverseSchema = z.object({
  consumption_id: z.string().uuid('Invalid consumption ID'),
  reason: z.enum(REVERSAL_REASONS, {
    required_error: 'Reason for reversal is required',
  }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
}).refine(
  (data) => data.reason !== 'other' || (data.notes && data.notes.trim().length > 0),
  {
    message: 'Notes are required when reason is "other"',
    path: ['notes'],
  }
)

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  CONSUMPTION_NOT_FOUND: 'CONSUMPTION_NOT_FOUND',
  ALREADY_REVERSED: 'ALREADY_REVERSED',
  REASON_REQUIRED: 'REASON_REQUIRED',
  NOTES_REQUIRED_FOR_OTHER: 'NOTES_REQUIRED_FOR_OTHER',
  REVERSAL_FAILED: 'REVERSAL_FAILED',
} as const

// Allowed roles per 04.6d spec: Manager, Admin, Owner, production_manager
const ALLOWED_ROLES = ['admin', 'manager', 'owner', 'production_manager']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // AC-1, AC-2: Role-based access - Manager, Admin, Owner, production_manager only
    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!ALLOWED_ROLES.includes(roleCode)) {
      return NextResponse.json(
        {
          error: 'Only Managers and Admins can reverse consumptions',
          code: ERROR_CODES.FORBIDDEN,
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = reverseSchema.safeParse(body)

    if (!validation.success) {
      // Check for specific validation errors per 04.6d spec
      const errors = validation.error.errors
      const consumptionIdError = errors.find(e => e.path.includes('consumption_id'))
      const reasonError = errors.find(e => e.path.includes('reason'))
      const notesError = errors.find(e => e.path.includes('notes'))

      if (notesError && body.reason === 'other') {
        return NextResponse.json(
          {
            error: 'Notes are required when reason is "other"',
            code: ERROR_CODES.NOTES_REQUIRED_FOR_OTHER
          },
          { status: 400 }
        )
      }

      if (consumptionIdError) {
        return NextResponse.json(
          { error: 'consumption_id is required', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }

      if (reasonError) {
        return NextResponse.json(
          { error: 'Reason for reversal is required', code: ERROR_CODES.REASON_REQUIRED },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { consumption_id, reason, notes } = validation.data
    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify WO exists and belongs to user's org
    const { data: workOrder, error: woError } = await supabaseAdmin
      .from('work_orders')
      .select('id, wo_number, org_id')
      .eq('id', woId)
      .single()

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    // Multi-tenancy: Return 404 for cross-org access (not 403)
    if (workOrder.org_id !== currentUser.org_id) {
      return NextResponse.json(
        { error: 'Consumption not found', code: ERROR_CODES.CONSUMPTION_NOT_FOUND },
        { status: 404 }
      )
    }

    // Get consumption record
    const { data: consumption, error: consumeError } = await supabaseAdmin
      .from('wo_consumption')
      .select(`
        id, wo_id, material_id, reservation_id, lp_id, consumed_qty, uom, status,
        wo_materials(product_name),
        license_plates(id, lp_number, current_qty, status)
      `)
      .eq('id', consumption_id)
      .eq('wo_id', woId)
      .single()

    if (consumeError || !consumption) {
      return NextResponse.json(
        { error: 'Consumption not found', code: ERROR_CODES.CONSUMPTION_NOT_FOUND },
        { status: 404 }
      )
    }

    // AC-4: Check if already reversed
    if (consumption.status === 'reversed') {
      return NextResponse.json(
        { error: 'This consumption has already been reversed', code: ERROR_CODES.ALREADY_REVERSED },
        { status: 400 }
      )
    }

    // Handle Supabase join results
    type MaterialType = { product_name: string }
    type LpType = { id: string; lp_number: string; current_qty: number; status: string }
    const material = Array.isArray(consumption.wo_materials)
      ? (consumption.wo_materials as MaterialType[])[0]
      : consumption.wo_materials as MaterialType
    const lp = Array.isArray(consumption.license_plates)
      ? (consumption.license_plates as LpType[])[0]
      : consumption.license_plates as LpType

    const reversedAt = new Date().toISOString()
    const lpCurrentQty = Number(lp?.current_qty || 0)
    const restoredQty = lpCurrentQty + Number(consumption.consumed_qty)

    // AC-4: Mark consumption as reversed with all fields per 04.6d spec
    await supabaseAdmin
      .from('wo_consumption')
      .update({
        status: 'reversed',
        reversed: true,
        reversed_at: reversedAt,
        reversed_by: session.user.id,
        reversed_by_user_id: session.user.id,
        reversal_reason: reason,
        reverse_reason: reason,
        reversal_notes: notes || null,
      })
      .eq('id', consumption_id)

    // Update reservation status back to reserved
    if (consumption.reservation_id) {
      await supabaseAdmin
        .from('wo_material_reservations')
        .update({ status: 'reserved' })
        .eq('id', consumption.reservation_id)
    }

    // AC-3, AC-8: Restore LP qty and status
    const lpStatus = lp?.status === 'consumed' ? 'available' : (lp?.status || 'available')
    await supabaseAdmin
      .from('license_plates')
      .update({
        current_qty: restoredQty,
        status: lpStatus,
        consumed_by_wo_id: null,
        consumed_at: null,
        updated_at: reversedAt,
      })
      .eq('id', consumption.lp_id)

    // Update wo_materials consumed_qty
    const { data: currentMaterial } = await supabaseAdmin
      .from('wo_materials')
      .select('consumed_qty')
      .eq('id', consumption.material_id)
      .single()

    if (currentMaterial) {
      const newConsumed = Math.max(0, Number(currentMaterial.consumed_qty || 0) - Number(consumption.consumed_qty))
      await supabaseAdmin
        .from('wo_materials')
        .update({
          consumed_qty: newConsumed,
          updated_at: reversedAt,
        })
        .eq('id', consumption.material_id)
    }

    // Create reversal movement record (lp_movements)
    await supabaseAdmin
      .from('lp_movements')
      .insert({
        org_id: currentUser.org_id,
        lp_id: consumption.lp_id,
        movement_type: 'consumption_reversal',
        qty_change: Number(consumption.consumed_qty),
        qty_before: lpCurrentQty,
        qty_after: restoredQty,
        uom: consumption.uom,
        wo_id: woId,
        consumption_id: consumption_id,
        created_by_user_id: session.user.id,
        notes: `Consumption reversal for WO ${workOrder.wo_number}. Reason: ${reason}`,
      })

    // AC-5: Mark genealogy records as reversed
    await supabaseAdmin
      .from('lp_genealogy')
      .update({
        is_reversed: true,
        status: 'reversed',
        reversed_at: reversedAt,
        reversed_by: session.user.id,
        reverse_reason: reason,
      })
      .eq('parent_lp_id', consumption.lp_id)
      .eq('work_order_id', woId)
      .eq('wo_material_reservation_id', consumption.reservation_id)

    // AC-7: Create audit log entry
    try {
      // Get reason label for description
      const reasonLabels: Record<string, string> = {
        scanned_wrong_lp: 'Scanned Wrong LP',
        wrong_quantity: 'Wrong Quantity Entered',
        operator_error: 'Operator Error',
        quality_issue: 'Quality Issue',
        other: 'Other',
      }
      const reasonLabel = reasonLabels[reason] || reason

      await supabaseAdmin.from('activity_logs').insert({
        org_id: currentUser.org_id,
        user_id: session.user.id,
        action: 'consumption_reversal',
        entity_type: 'wo_consumption',
        entity_id: consumption_id,
        entity_code: workOrder.wo_number,
        description: `Reversed consumption of ${consumption.consumed_qty} ${consumption.uom} of ${material?.product_name || 'material'}. Reason: ${reasonLabel}${notes ? ` - ${notes}` : ''}`,
      })
    } catch (logError) {
      console.error('Error creating audit log:', logError)
    }

    return NextResponse.json({
      success: true,
      message: 'Consumption reversed successfully',
      consumption_id,
      wo_id: woId,
      wo_number: workOrder.wo_number,
      lp_id: consumption.lp_id,
      lp_number: lp?.lp_number,
      reversed_qty: consumption.consumed_qty,
      lp_new_qty: restoredQty,
      lp_new_status: lpStatus,
      reversed_at: reversedAt,
      reversed_by: session.user.id,
      reason,
      uom: consumption.uom,
      product_name: material?.product_name,
    })
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:id/consume/reverse:', error)
    return NextResponse.json(
      { error: 'Failed to reverse consumption', code: ERROR_CODES.REVERSAL_FAILED },
      { status: 500 }
    )
  }
}
