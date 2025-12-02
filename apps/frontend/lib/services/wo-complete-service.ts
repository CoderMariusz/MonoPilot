/**
 * WO Complete Service (Story 4.6)
 * Handles work order completion with atomic status transition
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

const ALLOWED_ROLES = ['admin', 'manager', 'operator']

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
  operations_count: number
  genealogy_warnings: string[] | null
}

export interface WOCompletionPreview {
  wo_id: string
  wo_number: string
  status: string
  planned_qty: number
  operations: {
    id: string
    sequence: number
    operation_name: string
    status: string
  }[]
  all_operations_completed: boolean
  incomplete_operations: string[]
  has_output_lps: boolean
  output_lps_count: number
  can_complete: boolean
  warnings: string[]
}

/**
 * Get completion preview for WO Complete modal
 */
export async function getWOCompletionPreview(
  woId: string,
  orgId: string,
): Promise<WOCompletionPreview> {
  const supabase = await createServerSupabase()

  // Get WO details
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, org_id, planned_qty')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.org_id !== orgId) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  // Get operations
  const { data: operations } = await supabase
    .from('wo_operations')
    .select('id, sequence, operation_name, status')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .order('sequence', { ascending: true })

  const ops = operations || []
  const incompleteOps = ops.filter((op) => op.status !== 'completed')
  const allCompleted = incompleteOps.length === 0

  const warnings: string[] = []

  // Check genealogy (if table exists)
  const { data: genealogy } = await supabase
    .from('lp_genealogy')
    .select('id, child_lp_id')
    .eq('wo_id', woId)

  if (genealogy && genealogy.length > 0) {
    const incompleteGenealogy = genealogy.filter((g) => !g.child_lp_id)
    if (incompleteGenealogy.length > 0) {
      warnings.push(`${incompleteGenealogy.length} genealogy record(s) incomplete (material not fully linked to outputs)`)
    }
  }

  // Check output LPs
  const { data: outputLps } = await supabase
    .from('wo_output_lps')
    .select('id')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)

  const hasOutputLps = !!(outputLps && outputLps.length > 0)
  const outputLpsCount = outputLps?.length || 0

  if (!hasOutputLps) {
    warnings.push('No output LPs registered - required before completing')
  }

  const canComplete =
    (wo.status === 'in_progress' || wo.status === 'paused') &&
    (ops.length === 0 || allCompleted) &&
    hasOutputLps

  return {
    wo_id: wo.id,
    wo_number: wo.wo_number,
    status: wo.status,
    planned_qty: Number(wo.planned_qty) || 0,
    operations: ops,
    all_operations_completed: allCompleted,
    incomplete_operations: incompleteOps.map((op) => op.operation_name),
    has_output_lps: hasOutputLps,
    output_lps_count: outputLpsCount,
    can_complete: canComplete,
    warnings,
  }
}

/**
 * Complete a work order (Story 4.6)
 */
export async function completeWorkOrder(
  woId: string,
  userId: string,
  userRole: string,
  orgId: string,
): Promise<WOCompleteResult> {
  const supabase = await createServerSupabase()

  // Check role permission
  if (!ALLOWED_ROLES.includes(userRole)) {
    throw new WOCompleteError('FORBIDDEN', 403, 'You do not have permission to complete work orders')
  }

  // Get WO with lock (SELECT FOR UPDATE equivalent - we'll use optimistic locking)
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, org_id, planned_qty')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.org_id !== orgId) {
    throw new WOCompleteError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.status === 'completed') {
    throw new WOCompleteError('ALREADY_COMPLETED', 400, `Work order ${wo.wo_number} is already completed`)
  }

  if (wo.status !== 'in_progress' && wo.status !== 'paused') {
    throw new WOCompleteError(
      'INVALID_WO_STATUS',
      400,
      `Cannot complete work order with status '${wo.status}'. WO must be in_progress or paused.`,
    )
  }

  // Get operations and validate all completed
  const { data: operations } = await supabase
    .from('wo_operations')
    .select('id, sequence, operation_name, status')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .order('sequence', { ascending: true })

  const ops = operations || []
  const incompleteOps = ops.filter((op) => op.status !== 'completed')

  if (ops.length > 0 && incompleteOps.length > 0) {
    throw new WOCompleteError(
      'OPERATIONS_INCOMPLETE',
      400,
      `Cannot complete: ${incompleteOps.length} operation(s) not completed (${incompleteOps.map((o) => o.operation_name).join(', ')})`,
      { incomplete_operations: incompleteOps.map((o) => o.operation_name) },
    )
  }

  // AC-4.6.1c: Validate at least one output LP exists
  const { data: outputLps, error: outputError } = await supabase
    .from('wo_output_lps')
    .select('id')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)

  if (!outputError && (!outputLps || outputLps.length === 0)) {
    throw new WOCompleteError(
      'NO_OUTPUT',
      400,
      'Register at least one output LP before completing',
    )
  }

  const now = new Date().toISOString()

  // Check genealogy warnings
  const genealogyWarnings: string[] = []
  const { data: genealogy } = await supabase
    .from('lp_genealogy')
    .select('id, child_lp_id')
    .eq('wo_id', woId)

  if (genealogy && genealogy.length > 0) {
    const incompleteGenealogy = genealogy.filter((g) => !g.child_lp_id)
    if (incompleteGenealogy.length > 0) {
      genealogyWarnings.push(
        `${incompleteGenealogy.length} genealogy record(s) incomplete`,
      )
    }
  }

  // Update WO status (atomic with optimistic locking)
  const { error: updateError } = await supabase
    .from('work_orders')
    .update({
      status: 'completed',
      completed_at: now,
      completed_by_user_id: userId,
      updated_at: now,
    })
    .eq('id', woId)
    .in('status', ['in_progress', 'paused']) // Optimistic lock

  if (updateError) {
    throw new WOCompleteError('INTERNAL_ERROR', 500, 'Failed to complete work order')
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    org_id: orgId,
    user_id: userId,
    activity_type: 'wo_completed',
    entity_type: 'work_order',
    entity_id: woId,
    entity_code: wo.wo_number,
    description: `Work order ${wo.wo_number} completed`,
    metadata: {
      planned_qty: wo.planned_qty,
      operations_count: ops.length,
      genealogy_warnings: genealogyWarnings.length > 0 ? genealogyWarnings : null,
    },
  })

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
    planned_qty: Number(wo.planned_qty) || 0,
    operations_count: ops.length,
    genealogy_warnings: genealogyWarnings.length > 0 ? genealogyWarnings : null,
  }
}
