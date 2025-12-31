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
  ToLine,
  ToLineLp,
  ShipToInput,
  ReceiveTOInput,
  SelectLpsInput,
} from '@/lib/validation/transfer-order-schemas'
import type { ServiceResult, ListResult } from './types'
import { ErrorCode, EDITABLE_STATUSES, NON_SHIPPABLE_STATUSES, NON_RECEIVABLE_STATUSES } from './constants'
import { calculateToStatus, enrichWithWarehouses } from './helpers'

// ============================================================================
// SHIP TRANSFER ORDER
// ============================================================================

/**
 * Ship Transfer Order (partial or full)
 * Updates shipped_qty cumulatively
 * Sets actual_ship_date on FIRST shipment only (immutable)
 * Automatically updates TO status based on line quantities
 *
 * Refactored: Uses executeTransferOrderAction helper (eliminates 90% duplication)
 */
export async function shipTransferOrder(
  transferOrderId: string,
  input: ShipToInput,
  userId: string
): Promise<ServiceResult<TransferOrder>> {
  const { executeTransferOrderAction } = await import('./action-helpers')

  // Map input to generic line quantities
  const lineQuantities = input.line_items.map((item) => ({
    line_id: item.to_line_id,
    quantity: item.ship_qty,
  }))

  // Execute using common helper
  return executeTransferOrderAction(
    {
      transferOrderId,
      userId,
      actionType: 'ship',
      date: input.actual_ship_date || new Date().toISOString().split('T')[0],
      notes: input.notes,
    },
    lineQuantities
  )
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

// ============================================================================
// RECEIVE TRANSFER ORDER (Story 03.9a)
// ============================================================================

/**
 * Receive Transfer Order (partial or full)
 * Updates received_qty cumulatively
 * Sets actual_receive_date on FIRST receipt only (immutable)
 * Automatically updates TO status based on line quantities
 *
 * Refactored: Uses executeTransferOrderAction helper (eliminates 90% duplication)
 */
export async function receiveTransferOrder(
  transferOrderId: string,
  input: ReceiveTOInput,
  userId: string
): Promise<ServiceResult<TransferOrder>> {
  const { executeTransferOrderAction } = await import('./action-helpers')

  // Map input to generic line quantities
  const lineQuantities = input.lines.map((item) => ({
    line_id: item.line_id,
    quantity: item.receive_qty,
  }))

  // Execute using common helper
  return executeTransferOrderAction(
    {
      transferOrderId,
      userId,
      actionType: 'receive',
      date: input.receipt_date,
      notes: input.notes,
    },
    lineQuantities
  )
}

// ============================================================================
// PROGRESS CALCULATION HELPERS (Story 03.9a)
// ============================================================================

/**
 * Line progress result type
 */
export interface LineProgress {
  shipped: number
  received: number
  total: number
  percent: number
  remaining: number
}

/**
 * Calculate ship progress for a line
 * Returns { shipped, total, percent, remaining }
 */
export function calculateLineShipProgress(line: ToLine): LineProgress {
  const shipped = line.shipped_qty || 0
  const total = line.quantity || 0
  const percent = total > 0 ? Math.round((shipped / total) * 100) : 0
  const remaining = Math.max(0, total - shipped)

  return {
    shipped,
    received: line.received_qty || 0,
    total,
    percent,
    remaining,
  }
}

/**
 * Calculate receive progress for a line
 * Returns { received, total (shipped_qty), percent, remaining }
 * Note: receive progress is based on shipped_qty, not quantity
 */
export function calculateLineReceiveProgress(line: ToLine): LineProgress {
  const received = line.received_qty || 0
  const shipped = line.shipped_qty || 0
  const percent = shipped > 0 ? Math.round((received / shipped) * 100) : 0
  const remaining = Math.max(0, shipped - received)

  return {
    shipped,
    received,
    total: shipped, // For receive progress, total is shipped_qty
    percent,
    remaining,
  }
}

/**
 * Determine status after ship operation based on line quantities
 * Returns 'shipped' if all lines fully shipped, 'partially_shipped' otherwise
 */
export function determineStatusAfterShip(lines: ToLine[]): string {
  if (!lines || lines.length === 0) {
    return 'planned'
  }

  const allFullyShipped = lines.every((line) => (line.shipped_qty || 0) >= (line.quantity || 0))
  return allFullyShipped ? 'shipped' : 'partially_shipped'
}

/**
 * Determine status after receive operation based on line quantities
 * Returns 'received' if all lines fully received, 'partially_received' otherwise
 */
export function determineStatusAfterReceive(lines: ToLine[]): string {
  if (!lines || lines.length === 0) {
    return 'shipped'
  }

  const allFullyReceived = lines.every((line) => (line.received_qty || 0) >= (line.shipped_qty || 0))
  return allFullyReceived ? 'received' : 'partially_received'
}
