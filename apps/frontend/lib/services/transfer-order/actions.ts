/**
 * Transfer Order Actions Service
 * Story 03.8 - Refactor
 *
 * Operations for shipping and LP selection (Stories 3.8, 3.9)
 * Extracted from transfer-order-service.ts to improve maintainability
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import type {
  TransferOrder,
  ToLineLp,
  ShipToInput,
  SelectLpsInput,
} from '@/lib/validation/transfer-order-schemas'
import type { ServiceResult, ListResult } from './types'
import { ErrorCode, EDITABLE_STATUSES, NON_SHIPPABLE_STATUSES } from './constants'
import { calculateToStatus, enrichWithWarehouses } from './helpers'

// ============================================================================
// SHIP TRANSFER ORDER
// ============================================================================

/**
 * Ship Transfer Order (partial or full)
 * Updates shipped_qty cumulatively
 * Sets actual_ship_date on FIRST shipment only (immutable)
 * Automatically updates TO status based on line quantities
 */
export async function shipTransferOrder(
  transferOrderId: string,
  input: ShipToInput,
  userId: string
): Promise<ServiceResult<TransferOrder>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if TO exists and is shippable
    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status, actual_ship_date')
      .eq('id', transferOrderId)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    if (NON_SHIPPABLE_STATUSES.includes(existingTo.status as any)) {
      return {
        success: false,
        error: `Cannot ship Transfer Order with status: ${existingTo.status}`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Get all TO lines to validate ship quantities
    const { data: lines, error: linesError } = await supabaseAdmin
      .from('to_lines')
      .select('id, quantity, shipped_qty')
      .eq('transfer_order_id', transferOrderId)

    if (linesError || !lines) {
      return {
        success: false,
        error: 'Failed to fetch TO lines',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Validate ship quantities
    for (const lineItem of input.line_items) {
      const line = lines.find((l) => l.id === lineItem.to_line_id)
      if (!line) {
        return {
          success: false,
          error: `TO line ${lineItem.to_line_id} not found`,
          code: ErrorCode.NOT_FOUND,
        }
      }

      const newShippedQty = line.shipped_qty + lineItem.ship_qty
      if (newShippedQty > line.quantity) {
        return {
          success: false,
          error: `Ship quantity exceeds remaining quantity for line ${lineItem.to_line_id}`,
          code: ErrorCode.INVALID_QUANTITY,
        }
      }
    }

    // Update shipped_qty for each line (cumulative)
    for (const lineItem of input.line_items) {
      const line = lines.find((l) => l.id === lineItem.to_line_id)!
      const newShippedQty = line.shipped_qty + lineItem.ship_qty

      const { error: updateError } = await supabaseAdmin
        .from('to_lines')
        .update({
          shipped_qty: newShippedQty,
        })
        .eq('id', lineItem.to_line_id)

      if (updateError) {
        console.error('Error updating TO line shipped_qty:', updateError)
        return {
          success: false,
          error: 'Failed to update TO line',
          code: ErrorCode.DATABASE_ERROR,
        }
      }
    }

    // Set actual_ship_date on FIRST shipment only (immutable)
    const updateData: any = {}
    if (!existingTo.actual_ship_date) {
      updateData.actual_ship_date = input.actual_ship_date || new Date().toISOString().split('T')[0]
    }

    // Calculate and update status
    const newStatus = await calculateToStatus(transferOrderId)
    updateData.status = newStatus

    // Update transfer order
    const { data, error } = await supabaseAdmin
      .from('transfer_orders')
      .update(updateData)
      .eq('id', transferOrderId)
      .select(
        `
        *,
        lines:to_lines(
          *,
          product:products(code, name)
        )
      `
      )
      .single()

    if (error) {
      console.error('Error updating transfer order after shipment:', error)
      return {
        success: false,
        error: 'Failed to update transfer order',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    // Enrich with warehouse info
    const enriched = await enrichWithWarehouses(data)

    return {
      success: true,
      data: enriched as TransferOrder,
    }
  } catch (error) {
    console.error('Error in shipTransferOrder:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// LP SELECTION OPERATIONS
// ============================================================================

/**
 * Get LP selections for a TO line
 */
export async function getToLineLps(toLineId: string): Promise<ListResult<ToLineLp>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('to_line_lps')
      .select(
        `
        *,
        license_plate:license_plates(lp_number)
      `
      )
      .eq('to_line_id', toLineId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error listing TO line LPs:', error)
      return {
        success: false,
        error: 'Failed to fetch LP selections',
      }
    }

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
    }
  } catch (error) {
    console.error('Error in getToLineLps:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

/**
 * Select LPs for a TO line
 * Validates total reserved_qty <= line quantity
 */
export async function selectLpsForToLine(
  toLineId: string,
  input: SelectLpsInput
): Promise<ServiceResult<ToLineLp[]>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get TO line to validate
    const { data: line, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('quantity, transfer_order_id')
      .eq('id', toLineId)
      .single()

    if (lineError || !line) {
      return {
        success: false,
        error: 'TO line not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Check TO status
    const { data: to, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', line.transfer_order_id)
      .single()

    if (toError || !to) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    if (!EDITABLE_STATUSES.includes(to.status as any)) {
      return {
        success: false,
        error: `Cannot select LPs for Transfer Order with status: ${to.status}`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Validate total reserved_qty <= line quantity
    const totalReserved = input.selections.reduce((sum, s) => sum + s.reserved_qty, 0)
    if (totalReserved > line.quantity) {
      return {
        success: false,
        error: 'Total reserved quantity exceeds line quantity',
        code: ErrorCode.INVALID_QUANTITY,
      }
    }

    // Insert LP selections
    const { data, error } = await supabaseAdmin
      .from('to_line_lps')
      .insert(
        input.selections.map((s) => ({
          to_line_id: toLineId,
          lp_id: s.lp_id,
          reserved_qty: s.reserved_qty,
        }))
      )
      .select(
        `
        *,
        license_plate:license_plates(lp_number)
      `
      )

    if (error) {
      console.error('Error creating LP selections:', error)

      // Check for duplicate LP
      if (error.code === '23505') {
        return {
          success: false,
          error: 'License Plate already selected for this line',
          code: ErrorCode.INVALID_INPUT,
        }
      }

      return {
        success: false,
        error: 'Failed to create LP selections',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error in selectLpsForToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

/**
 * Delete LP selection
 */
export async function deleteToLineLp(lpSelectionId: string): Promise<ServiceResult<void>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if selection exists and TO is editable
    const { data: selection, error: selectionError } = await supabaseAdmin
      .from('to_line_lps')
      .select('to_line_id')
      .eq('id', lpSelectionId)
      .single()

    if (selectionError || !selection) {
      return {
        success: false,
        error: 'LP selection not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    const { data: line, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('transfer_order_id')
      .eq('id', selection.to_line_id)
      .single()

    if (lineError || !line) {
      return {
        success: false,
        error: 'TO line not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    const { data: to, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', line.transfer_order_id)
      .single()

    if (toError || !to) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    if (!EDITABLE_STATUSES.includes(to.status as any)) {
      return {
        success: false,
        error: `Cannot delete LP selections for Transfer Order with status: ${to.status}`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Delete LP selection
    const { error } = await supabaseAdmin
      .from('to_line_lps')
      .delete()
      .eq('id', lpSelectionId)

    if (error) {
      console.error('Error deleting LP selection:', error)
      return {
        success: false,
        error: 'Failed to delete LP selection',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteToLineLp:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}
