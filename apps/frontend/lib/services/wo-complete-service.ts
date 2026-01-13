/**
 * WO Complete Service (Story 04.2c)
 * Handles work order completion with atomic status transition
 *
 * Phase 0 Scope:
 * - Manual WO completion with status transition
 * - Timestamp tracking (completed_at, completed_by_user_id)
 * - Yield calculation (produced_qty / planned_qty * 100)
 * - Auto-complete based on setting (no output validation in Phase 0)
 * - Operation sequence validation (if enabled)
 * - Release material reservations (placeholder for Phase 1)
 *
 * Deferred to Phase 1 (Story 04.7):
 * - Output registration requirement validation
 * - By-product registration validation
 * - Actual produced quantity from output LPs
 */

import { createServerSupabase } from '@/lib/supabase/server'

export type WOCompleteErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_COMPLETED'
  | 'INVALID_WO_STATUS'
  | 'OPERATIONS_INCOMPLETE'
  | 'NO_OUTPUT'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'

export class WOCompleteError extends Error {
  constructor(
    public code: WOCompleteErrorCode,
    public statusCode: number,
    message: string,
    public details?: object,
  ) {
    super(message)
    this.name = 'WOCompleteError'
  }
}

// Roles allowed to complete work orders
const ALLOWED_ROLES = ['admin', 'manager', 'operator', 'SUPER_ADMIN', 'ADMIN', 'PLANNER', 'PROD_MANAGER', 'OPERATOR']

export interface WOCompleteResult {
  id: string
  wo_number: string
  status: string
  completed_at: string
  completed_by_user_id: string
  completed_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
  planned_qty: number
  produced_qty: number
  actual_yield_percent: number
  operations_count: number
  auto_completed?: boolean
  message: string
}

export interface WOCompletionPreview {
  wo_id: string
  wo_number: string
  product_name: string
  status: string
  planned_qty: number
  produced_qty: number
  yield_percent: number
  yield_color: 'green' | 'yellow' | 'red'
  low_yield_warning: boolean
  operations: {
    id: string
    sequence: number
    operation_name: string
    status: string
  }[]
  all_operations_completed: boolean
  incomplete_operations: string[]
  require_operation_sequence: boolean
  can_complete: boolean
  warnings: string[]
}

/**
 * Calculate yield percentage
 * Formula: (produced_qty / planned_qty) * 100
 * Rounded to 2 decimal places
 */
export function calculateYieldPercent(producedQty: number, plannedQty: number): number {
  if (plannedQty <= 0) return 0
  const yield_percent = (producedQty / plannedQty) * 100
  return Math.round(yield_percent * 100) / 100 // Round to 2 decimals
}

/**
 * Get yield color indicator
 * green: >= 80%
 * yellow: 70-79%
 * red: < 70%
 */
export function getYieldColor(yieldPercent: number): 'green' | 'yellow' | 'red' {
  if (yieldPercent >= 80) return 'green'
  if (yieldPercent >= 70) return 'yellow'
  return 'red'
}

/**
 * Get completion preview for WO Complete modal
 * AC-12: Shows WO Number, Product Name, Planned vs Produced, Yield %, Warnings
 */
export async function getWOCompletionPreview(
  woId: string,
  orgId: string,
): Promise<WOCompletionPreview> {
  const supabase = await createServerSupabase()

  // Get WO details with product name
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select(`
      id, wo_number, status, org_id,
      planned_quantity, produced_quantity, yield_percent,
      products!inner(name)
    `)
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.org_id !== orgId) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  // Get production settings
  const { data: settings } = await supabase
    .from('production_settings')
    .select('require_operation_sequence')
    .eq('org_id', orgId)
    .single()

  const requireOperationSequence = settings?.require_operation_sequence ?? true

  // Get operations
  const { data: operations } = await supabase
    .from('wo_operations')
    .select('id, sequence, operation_name, status')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .order('sequence', { ascending: true })

  const ops = operations || []
  const incompleteOps = ops.filter((op) => op.status !== 'completed')
  const allCompleted = ops.length === 0 || incompleteOps.length === 0

  const warnings: string[] = []

  // Calculate yield
  const plannedQty = Number(wo.planned_quantity) || 0
  const producedQty = Number(wo.produced_quantity) || 0
  const yieldPercent = calculateYieldPercent(producedQty, plannedQty)
  const yieldColor = getYieldColor(yieldPercent)
  const lowYieldWarning = yieldPercent > 0 && yieldPercent < 80

  // AC-13: Low yield warning
  if (lowYieldWarning) {
    warnings.push(`Low yield detected (${yieldPercent.toFixed(1)}%). Please verify before completing.`)
  }

  // AC-4: Operation sequence validation warning (if enabled)
  if (requireOperationSequence && incompleteOps.length > 0) {
    warnings.push(`All operations must be completed before closing the WO`)
  }

  // Determine if completion is allowed
  // Phase 0: No output LP requirement, only status and operations (if setting enabled)
  const validStatus = wo.status === 'in_progress' || wo.status === 'paused'
  const operationsOk = !requireOperationSequence || allCompleted
  const canComplete = validStatus && operationsOk

  return {
    wo_id: wo.id,
    wo_number: wo.wo_number,
    product_name: (wo.products as unknown as { name: string } | null)?.name || 'Unknown Product',
    status: wo.status,
    planned_qty: plannedQty,
    produced_qty: producedQty,
    yield_percent: yieldPercent,
    yield_color: yieldColor,
    low_yield_warning: lowYieldWarning,
    operations: ops,
    all_operations_completed: allCompleted,
    incomplete_operations: incompleteOps.map((op) => op.operation_name),
    require_operation_sequence: requireOperationSequence,
    can_complete: canComplete,
    warnings,
  }
}

/**
 * Complete a work order (Story 04.2c)
 *
 * AC-1: Basic WO Completion - status -> completed, timestamps set
 * AC-2: Invalid Status Prevention - must be in_progress
 * AC-4/5: Operation Sequence Validation (based on settings)
 * AC-6: Yield Calculation - (produced/planned)*100
 * AC-9: Timestamp Accuracy - server time within +/- 1 second
 * AC-10: Permission Validation
 * AC-11: Material Reservations Release Placeholder
 */
export async function completeWorkOrder(
  woId: string,
  userId: string,
  userRole: string,
  orgId: string,
): Promise<WOCompleteResult> {
  const supabase = await createServerSupabase()

  // AC-10: Check role permission
  const normalizedRole = userRole?.toLowerCase()
  if (!ALLOWED_ROLES.some(r => r.toLowerCase() === normalizedRole)) {
    throw new WOCompleteError('FORBIDDEN', 403, 'You do not have permission to complete work orders')
  }

  // Get WO with current data
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, org_id, planned_quantity, produced_quantity')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  // RLS check
  if (wo.org_id !== orgId) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  // AC-3: Already completed check
  if (wo.status === 'completed') {
    throw new WOCompleteError('ALREADY_COMPLETED', 400, `Work order ${wo.wo_number} is already completed`)
  }

  // AC-2: Invalid status prevention - must be in_progress (or paused per business rules)
  if (wo.status !== 'in_progress' && wo.status !== 'paused') {
    throw new WOCompleteError(
      'INVALID_WO_STATUS',
      400,
      'WO must be In Progress to complete',
    )
  }

  // Get production settings for operation sequence validation
  const { data: settings } = await supabase
    .from('production_settings')
    .select('require_operation_sequence')
    .eq('org_id', orgId)
    .single()

  const requireOperationSequence = settings?.require_operation_sequence ?? true

  // Get operations
  const { data: operations } = await supabase
    .from('wo_operations')
    .select('id, sequence, operation_name, status')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .order('sequence', { ascending: true })

  const ops = operations || []
  const incompleteOps = ops.filter((op) => op.status !== 'completed')

  // AC-4: Operation Sequence Validation (if enabled)
  if (requireOperationSequence && ops.length > 0 && incompleteOps.length > 0) {
    throw new WOCompleteError(
      'OPERATIONS_INCOMPLETE',
      400,
      'All operations must be completed before closing the WO',
      { incomplete_operations: incompleteOps.map((o) => o.operation_name) },
    )
  }

  // AC-9: Timestamp accuracy - use server time
  const now = new Date().toISOString()

  // AC-6: Calculate yield
  const plannedQty = Number(wo.planned_quantity) || 0
  const producedQty = Number(wo.produced_quantity) || 0
  const actualYieldPercent = calculateYieldPercent(producedQty, plannedQty)

  // AC-11: Material reservation release placeholder
  // Phase 0: Just log, actual release in Phase 1 (Story 04.6a)
  console.log(`Material reservation release skipped - Epic 05 required (WO: ${wo.wo_number})`)

  // AC-1: Update WO status with optimistic locking
  const { error: updateError } = await supabase
    .from('work_orders')
    .update({
      status: 'completed',
      completed_at: now,
      completed_by_user_id: userId,
      actual_yield_percent: actualYieldPercent,
      updated_at: now,
    })
    .eq('id', woId)
    .in('status', ['in_progress', 'paused']) // Optimistic lock

  if (updateError) {
    console.error('Failed to complete WO:', updateError)
    throw new WOCompleteError('INTERNAL_ERROR', 500, 'Failed to complete work order')
  }

  // Log activity
  try {
    await supabase.from('activity_logs').insert({
      org_id: orgId,
      user_id: userId,
      activity_type: 'wo_completed',
      entity_type: 'work_order',
      entity_id: woId,
      entity_code: wo.wo_number,
      description: `Work order ${wo.wo_number} completed`,
      metadata: {
        planned_qty: plannedQty,
        produced_qty: producedQty,
        actual_yield_percent: actualYieldPercent,
        operations_count: ops.length,
      },
    })
  } catch (logError) {
    // Don't fail completion if logging fails
    console.error('Failed to log activity:', logError)
  }

  // Get user info for response
  const { data: user } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('id', userId)
    .single()

  return {
    id: wo.id,
    wo_number: wo.wo_number,
    status: 'completed',
    completed_at: now,
    completed_by_user_id: userId,
    completed_by_user: user || undefined,
    planned_qty: plannedQty,
    produced_qty: producedQty,
    actual_yield_percent: actualYieldPercent,
    operations_count: ops.length,
    message: `Work order ${wo.wo_number} completed successfully`,
  }
}

/**
 * Check if WO should auto-complete (AC-7, AC-8)
 * Called after produced_qty update (Story 04.4)
 *
 * AC-7: If auto_complete_wo = true AND produced_qty >= planned_qty, auto-complete
 * AC-8: If auto_complete_wo = false, no auto-complete
 *
 * @param woId Work order ID
 * @param userId User who triggered the update
 * @param orgId Organization ID
 * @returns true if auto-completed, false otherwise
 */
export async function checkAutoComplete(
  woId: string,
  userId: string,
  orgId: string,
): Promise<{ autoCompleted: boolean; result?: WOCompleteResult }> {
  const supabase = await createServerSupabase()

  // Get production settings
  const { data: settings } = await supabase
    .from('production_settings')
    .select('auto_complete_wo')
    .eq('org_id', orgId)
    .single()

  // AC-8: If auto_complete_wo is false or not set, don't auto-complete
  if (!settings?.auto_complete_wo) {
    return { autoCompleted: false }
  }

  // Get WO details
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, status, planned_quantity, produced_quantity')
    .eq('id', woId)
    .eq('org_id', orgId)
    .single()

  if (woError || !wo) {
    return { autoCompleted: false }
  }

  // Only auto-complete if in_progress
  if (wo.status !== 'in_progress') {
    return { autoCompleted: false }
  }

  const plannedQty = Number(wo.planned_quantity) || 0
  const producedQty = Number(wo.produced_quantity) || 0

  // AC-7: Check if produced_qty >= planned_qty
  if (producedQty < plannedQty) {
    return { autoCompleted: false }
  }

  // Get user role for permission check
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  const userRole = user?.role || 'operator'

  try {
    // Auto-complete the WO
    const result = await completeWorkOrder(woId, userId, userRole, orgId)
    return {
      autoCompleted: true,
      result: { ...result, auto_completed: true }
    }
  } catch (error) {
    // If auto-complete fails (e.g., operations incomplete), don't error
    console.log('Auto-complete skipped:', error instanceof Error ? error.message : 'Unknown error')
    return { autoCompleted: false }
  }
}

/**
 * Release material reservations (placeholder for Phase 1)
 * Will be implemented in Story 04.6a when LP system is available
 *
 * @param woId Work order ID
 * @param orgId Organization ID
 */
export async function releaseMaterialReservations(
  woId: string,
  orgId: string,
): Promise<void> {
  // Phase 0: Just log, no actual implementation
  console.log(`Material reservation release skipped - Epic 05 required (WO: ${woId}, Org: ${orgId})`)
}
