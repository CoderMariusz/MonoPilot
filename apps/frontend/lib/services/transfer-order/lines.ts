/**
 * Transfer Order Lines Service
 * Story 03.8 - Refactor
 *
 * Operations for TO lines (Story 3.7)
 * Extracted from transfer-order-service.ts to improve maintainability
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import type {
  ToLine,
  CreateToLineInput,
  UpdateToLineInput,
} from '@/lib/validation/transfer-order-schemas'
import type { ServiceResult, ListResult } from './types'
import { ErrorCode, EDITABLE_STATUSES } from './constants'

// ============================================================================
// GET TO LINES
// ============================================================================

/**
 * Get all lines for a Transfer Order
 */
export async function getToLines(transferOrderId: string): Promise<ListResult<ToLine>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('to_lines')
      .select(
        `
        *,
        product:products(code, name)
      `
      )
      .eq('transfer_order_id', transferOrderId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error listing TO lines:', error)
      return {
        success: false,
        error: 'Failed to fetch TO lines',
      }
    }

    return {
      success: true,
      data: data || [],
      total: data?.length || 0,
    }
  } catch (error) {
    console.error('Error in getToLines:', error)
    return {
      success: false,
      error: 'Internal server error',
    }
  }
}

// ============================================================================
// CREATE TO LINE
// ============================================================================

/**
 * Create TO Line
 * UoM inherited from product
 */
export async function createToLine(
  transferOrderId: string,
  input: CreateToLineInput,
  userId: string
): Promise<ServiceResult<ToLine>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if TO exists and is editable
    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', transferOrderId)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    if (!EDITABLE_STATUSES.includes(existingTo.status as any)) {
      return {
        success: false,
        error: `Cannot add lines to Transfer Order with status: ${existingTo.status}`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Get product UoM
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('uom')
      .eq('id', input.product_id)
      .single()

    if (productError || !product) {
      return {
        success: false,
        error: 'Product not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Create TO line
    const { data, error } = await supabaseAdmin
      .from('to_lines')
      .insert({
        transfer_order_id: transferOrderId,
        product_id: input.product_id,
        quantity: input.quantity,
        uom: product.uom,
        shipped_qty: 0,
        received_qty: 0,
        notes: input.notes || null,
        created_by: userId,
        updated_by: userId,
      })
      .select(
        `
        *,
        product:products(code, name)
      `
      )
      .single()

    if (error) {
      console.error('Error creating TO line:', error)
      return {
        success: false,
        error: 'Failed to create TO line',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in createToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// UPDATE TO LINE
// ============================================================================

/**
 * Update TO Line
 * Only draft/planned TOs allow line updates
 */
export async function updateToLine(
  lineId: string,
  input: UpdateToLineInput,
  userId: string
): Promise<ServiceResult<ToLine>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if line exists and TO is editable
    const { data: existingLine, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('transfer_order_id')
      .eq('id', lineId)
      .single()

    if (lineError || !existingLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', existingLine.transfer_order_id)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    if (!EDITABLE_STATUSES.includes(existingTo.status as any)) {
      return {
        success: false,
        error: `Cannot update lines for Transfer Order with status: ${existingTo.status}`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Update TO line (add audit trail)
    const { data, error } = await supabaseAdmin
      .from('to_lines')
      .update({
        ...input,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lineId)
      .select(
        `
        *,
        product:products(code, name)
      `
      )
      .single()

    if (error) {
      console.error('Error updating TO line:', error)
      return {
        success: false,
        error: 'Failed to update TO line',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error in updateToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}

// ============================================================================
// DELETE TO LINE
// ============================================================================

/**
 * Delete TO Line
 * Only draft/planned TOs allow line deletion
 */
export async function deleteToLine(lineId: string): Promise<ServiceResult<void>> {
  try {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if line exists and TO is editable
    const { data: existingLine, error: lineError } = await supabaseAdmin
      .from('to_lines')
      .select('transfer_order_id')
      .eq('id', lineId)
      .single()

    if (lineError || !existingLine) {
      return {
        success: false,
        error: 'TO line not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    const { data: existingTo, error: toError } = await supabaseAdmin
      .from('transfer_orders')
      .select('status')
      .eq('id', existingLine.transfer_order_id)
      .single()

    if (toError || !existingTo) {
      return {
        success: false,
        error: 'Transfer Order not found',
        code: ErrorCode.NOT_FOUND,
      }
    }

    if (!EDITABLE_STATUSES.includes(existingTo.status as any)) {
      return {
        success: false,
        error: `Cannot delete lines from Transfer Order with status: ${existingTo.status}`,
        code: ErrorCode.INVALID_STATUS,
      }
    }

    // Delete TO line (cascade deletes LP selections)
    const { error } = await supabaseAdmin
      .from('to_lines')
      .delete()
      .eq('id', lineId)

    if (error) {
      console.error('Error deleting TO line:', error)
      return {
        success: false,
        error: 'Failed to delete TO line',
        code: ErrorCode.DATABASE_ERROR,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error in deleteToLine:', error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}
