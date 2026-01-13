/**
 * Transfer Order Action Helpers
 * Story 03.9a: TO Partial Shipments (Basic)
 * Refactor: Extract common logic from shipTransferOrder and receiveTransferOrder
 *
 * This module eliminates 90% code duplication between ship and receive operations
 */

import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import type { ServiceResult } from './types'
import { ErrorCode, NON_SHIPPABLE_STATUSES, NON_RECEIVABLE_STATUSES } from './constants'
import { calculateToStatus, enrichWithWarehouses, getCurrentOrgId } from './helpers'
import type { TransferOrder } from '@/lib/validation/transfer-order-schemas'

// ============================================================================
// TYPES
// ============================================================================

interface LineQuantity {
  line_id: string
  quantity: number
}

interface TOLineData {
  id: string
  quantity: number
  shipped_qty: number
  received_qty: number
}

interface ActionContext {
  transferOrderId: string
  userId: string
  actionType: 'ship' | 'receive'
  date: string
  notes?: string
}

interface ValidationResult {
  success: boolean
  error?: string
  code?: typeof ErrorCode[keyof typeof ErrorCode]
  lines?: TOLineData[]
  existingTo?: {
    status: string
    action_date: string | null
    action_by: string | null
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate Transfer Order exists and is in actionable state
 * CRITICAL-SEC-02: Added org_id filter to prevent RLS policy bypass
 */
export async function validateTransferOrderState(
  transferOrderId: string,
  actionType: 'ship' | 'receive'
): Promise<ValidationResult> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // CRITICAL-SEC-02: Get org_id to enforce multi-tenant isolation
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    return {
      success: false,
      error: 'Organization ID not found',
      code: ErrorCode.NOT_FOUND,
    }
  }

  // Get TO status and action date
  const dateField = actionType === 'ship' ? 'actual_ship_date' : 'actual_receive_date'
  const byField = actionType === 'ship' ? 'shipped_by' : 'received_by'

  const { data: existingTo, error: toError } = await supabaseAdmin
    .from('transfer_orders')
    .select(`status, ${dateField}, ${byField}`)
    .eq('id', transferOrderId)
    .eq('org_id', orgId) // CRITICAL-SEC-02: Add org_id filter
    .single()

  if (toError || !existingTo) {
    return {
      success: false,
      error: 'Transfer Order not found',
      code: ErrorCode.NOT_FOUND,
    }
  }

  // Check if actionable
  const nonActionableStatuses = actionType === 'ship'
    ? NON_SHIPPABLE_STATUSES
    : NON_RECEIVABLE_STATUSES

  if (nonActionableStatuses.includes(existingTo.status as any)) {
    return {
      success: false,
      error: `Cannot ${actionType} Transfer Order with status: ${existingTo.status}`,
      code: ErrorCode.INVALID_STATUS,
    }
  }

  return {
    success: true,
    existingTo: {
      status: existingTo.status,
      action_date: (existingTo as Record<string, unknown>)[dateField] as string | null,
      action_by: (existingTo as Record<string, unknown>)[byField] as string | null,
    },
  }
}

/**
 * Fetch and validate TO lines
 * CRITICAL-SEC-02: Added org_id filter via transfer_order join to prevent RLS bypass
 */
export async function fetchAndValidateLines(
  transferOrderId: string,
  lineQuantities: LineQuantity[],
  actionType: 'ship' | 'receive'
): Promise<ValidationResult> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // CRITICAL-SEC-02: Get org_id to enforce multi-tenant isolation
  const orgId = await getCurrentOrgId()
  if (!orgId) {
    return {
      success: false,
      error: 'Organization ID not found',
      code: ErrorCode.DATABASE_ERROR,
    }
  }

  // First verify the TO belongs to current org
  const { data: to, error: toError } = await supabaseAdmin
    .from('transfer_orders')
    .select('id')
    .eq('id', transferOrderId)
    .eq('org_id', orgId) // CRITICAL-SEC-02: Add org_id filter
    .single()

  if (toError || !to) {
    return {
      success: false,
      error: 'Transfer Order not found',
      code: ErrorCode.NOT_FOUND,
    }
  }

  // Fetch all TO lines (now safe since TO ownership is verified)
  const { data: lines, error: linesError } = await supabaseAdmin
    .from('transfer_order_lines')
    .select('id, quantity, shipped_qty, received_qty')
    .eq('to_id', transferOrderId)

  if (linesError || !lines) {
    return {
      success: false,
      error: 'Failed to fetch TO lines',
      code: ErrorCode.DATABASE_ERROR,
    }
  }

  // Validate each line quantity
  for (const lineQty of lineQuantities) {
    const line = lines.find((l) => l.id === lineQty.line_id)
    if (!line) {
      return {
        success: false,
        error: `TO line ${lineQty.line_id} not found`,
        code: ErrorCode.NOT_FOUND,
      }
    }

    // Calculate new quantity based on action type
    let newQty: number
    let maxQty: number

    if (actionType === 'ship') {
      newQty = line.shipped_qty + lineQty.quantity
      maxQty = line.quantity
    } else {
      newQty = line.received_qty + lineQty.quantity
      maxQty = line.shipped_qty
    }

    // CRITICAL-SEC-01: Prevent receiving items that haven't been shipped
    if (actionType === 'receive' && maxQty === 0) {
      return {
        success: false,
        error: `Cannot receive line ${lineQty.line_id}: no items have been shipped yet`,
        code: ErrorCode.INVALID_QUANTITY,
      }
    }

    // Validate not exceeding max
    if (newQty > maxQty) {
      const actionVerb = actionType === 'ship' ? 'Ship' : 'Receive'
      const maxLabel = actionType === 'ship' ? 'remaining' : 'shipped'
      return {
        success: false,
        error: `${actionVerb} quantity exceeds ${maxLabel} quantity for line ${lineQty.line_id}`,
        code: ErrorCode.INVALID_QUANTITY,
      }
    }
  }

  return {
    success: true,
    lines: lines as TOLineData[],
  }
}

// ============================================================================
// UPDATE HELPERS
// ============================================================================

/**
 * Update line quantities (shipped_qty or received_qty)
 */
export async function updateLineQuantities(
  lineQuantities: LineQuantity[],
  existingLines: TOLineData[],
  actionType: 'ship' | 'receive'
): Promise<ServiceResult<void>> {
  const supabaseAdmin = createServerSupabaseAdmin()
  const qtyField = actionType === 'ship' ? 'shipped_qty' : 'received_qty'

  for (const lineQty of lineQuantities) {
    const line = existingLines.find((l) => l.id === lineQty.line_id)!
    const currentQty = line[qtyField]
    const newQty = currentQty + lineQty.quantity

    const { error: updateError } = await supabaseAdmin
      .from('transfer_order_lines')
      .update({ [qtyField]: newQty })
      .eq('id', lineQty.line_id)

    if (updateError) {
      console.error(`Error updating TO line ${qtyField}:`, updateError)
      return {
        success: false,
        error: 'Failed to update TO line',
        code: ErrorCode.DATABASE_ERROR,
      }
    }
  }

  return { success: true }
}

/**
 * Update Transfer Order metadata and status
 */
export async function updateTransferOrderMetadata(
  context: ActionContext,
  isFirstAction: boolean
): Promise<ServiceResult<TransferOrder>> {
  const supabaseAdmin = createServerSupabaseAdmin()

  // Build update data
  const updateData: Record<string, unknown> = {
    updated_by: context.userId,
  }

  // Set action date and by on FIRST action only (immutable)
  if (isFirstAction) {
    const dateField = context.actionType === 'ship' ? 'actual_ship_date' : 'actual_receive_date'
    const byField = context.actionType === 'ship' ? 'shipped_by' : 'received_by'
    updateData[dateField] = context.date
    updateData[byField] = context.userId
  }

  // Calculate and update status
  const newStatus = await calculateToStatus(context.transferOrderId)
  updateData.status = newStatus

  // Update transfer order
  const { data, error } = await supabaseAdmin
    .from('transfer_orders')
    .update(updateData)
    .eq('id', context.transferOrderId)
    .select(
      `
      *,
      lines:transfer_order_lines(
        *,
        product:products(code, name)
      )
    `
    )
    .single()

  if (error) {
    console.error(`Error updating transfer order after ${context.actionType}:`, error)
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
}

// ============================================================================
// MAIN ACTION EXECUTOR
// ============================================================================

/**
 * Execute transfer order action (ship or receive)
 * Consolidates common logic for both operations
 */
export async function executeTransferOrderAction(
  context: ActionContext,
  lineQuantities: LineQuantity[]
): Promise<ServiceResult<TransferOrder>> {
  try {
    // 1. Validate TO state
    const stateValidation = await validateTransferOrderState(
      context.transferOrderId,
      context.actionType
    )
    if (!stateValidation.success) {
      return {
        success: false,
        error: stateValidation.error!,
        code: stateValidation.code!,
      }
    }

    // 2. Fetch and validate lines
    const linesValidation = await fetchAndValidateLines(
      context.transferOrderId,
      lineQuantities,
      context.actionType
    )
    if (!linesValidation.success) {
      return {
        success: false,
        error: linesValidation.error!,
        code: linesValidation.code!,
      }
    }

    // 3. Update line quantities
    const updateResult = await updateLineQuantities(
      lineQuantities,
      linesValidation.lines!,
      context.actionType
    )
    if (!updateResult.success) {
      return updateResult as ServiceResult<TransferOrder>
    }

    // 4. Update TO metadata and status
    const isFirstAction = !stateValidation.existingTo!.action_date
    return await updateTransferOrderMetadata(context, isFirstAction)
  } catch (error) {
    console.error(`Error in executeTransferOrderAction (${context.actionType}):`, error)
    return {
      success: false,
      error: 'Internal server error',
      code: ErrorCode.DATABASE_ERROR,
    }
  }
}
