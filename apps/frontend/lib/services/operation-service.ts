/**
 * Operation Service (Story 4.4, 4.5)
 * Handles operation start/complete with sequence enforcement
 */

import { createServerSupabase } from '@/lib/supabase/server'

export type OperationErrorCode =
  | 'NOT_FOUND'
  | 'INVALID_STATUS'
  | 'SEQUENCE_VIOLATION'
  | 'WO_NOT_IN_PROGRESS'
  | 'FORBIDDEN'
  | 'INTERNAL_ERROR'

export class OperationError extends Error {
  constructor(
    public code: OperationErrorCode,
    public statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'OperationError'
  }
}

const ALLOWED_ROLES = ['admin', 'manager', 'operator']

export interface OperationStartResult {
  id: string
  wo_id: string
  operation_name: string
  sequence: number
  status: string
  started_at: string
  started_by_user_id: string
  started_by_user?: {
    id: string
    first_name: string | null
    last_name: string | null
  }
}

/**
 * Check if sequence enforcement is enabled
 */
export async function isSequenceRequired(orgId: string): Promise<boolean> {
  const supabase = await createServerSupabase()

  const { data } = await supabase
    .from('production_settings')
    .select('require_operation_sequence')
    .eq('organization_id', orgId)
    .single()

  return data?.require_operation_sequence ?? false
}

/**
 * Start an operation
 */
export async function startOperation(
  woId: string,
  operationId: string,
  userId: string,
  userRole: string,
  orgId: string,
): Promise<OperationStartResult> {
  const supabase = await createServerSupabase()

  // Check role permission
  if (!ALLOWED_ROLES.includes(userRole)) {
    throw new OperationError('FORBIDDEN', 403, 'You do not have permission to start operations')
  }

  // Get WO and validate it's in_progress
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, org_id')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new OperationError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.org_id !== orgId) {
    throw new OperationError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.status !== 'in_progress' && wo.status !== 'paused') {
    throw new OperationError(
      'WO_NOT_IN_PROGRESS',
      400,
      `Cannot start operation. Work order status is '${wo.status}', must be 'in_progress' or 'paused'.`,
    )
  }

  // Get the operation (DB uses: wo_id, sequence, organization_id)
  const { data: operation, error: opError } = await supabase
    .from('wo_operations')
    .select('id, wo_id, sequence, operation_name, status, organization_id')
    .eq('id', operationId)
    .eq('wo_id', woId)
    .single()

  if (opError || !operation) {
    throw new OperationError('NOT_FOUND', 404, 'Operation not found')
  }

  if (operation.organization_id !== orgId) {
    throw new OperationError('NOT_FOUND', 404, 'Operation not found')
  }

  if (operation.status !== 'pending') {
    throw new OperationError(
      'INVALID_STATUS',
      400,
      `Cannot start operation with status '${operation.status}'. Only pending operations can be started.`,
    )
  }

  // Check sequence enforcement
  const sequenceRequired = await isSequenceRequired(orgId)

  if (sequenceRequired) {
    // Check if any previous operations are not completed
    const { data: previousOps, error: prevError } = await supabase
      .from('wo_operations')
      .select('id, sequence, status, operation_name')
      .eq('wo_id', woId)
      .lt('sequence', operation.sequence)
      .neq('status', 'completed')

    if (!prevError && previousOps && previousOps.length > 0) {
      const pendingOp = previousOps[0]
      throw new OperationError(
        'SEQUENCE_VIOLATION',
        400,
        `Cannot start operation. Previous operation '${pendingOp.operation_name}' (sequence ${pendingOp.sequence}) must be completed first.`,
      )
    }
  }

  const now = new Date().toISOString()

  // Update operation status
  const { error: updateError } = await supabase
    .from('wo_operations')
    .update({
      status: 'in_progress',
      started_at: now,
      started_by_user_id: userId,
      updated_at: now,
    })
    .eq('id', operationId)
    .eq('status', 'pending') // Optimistic lock

  if (updateError) {
    throw new OperationError('INTERNAL_ERROR', 500, 'Failed to start operation')
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    org_id: orgId,
    user_id: userId,
    activity_type: 'operation_started',
    entity_type: 'wo_operation',
    entity_id: operationId,
    entity_code: operation.operation_name,
    description: `Operation '${operation.operation_name}' started for WO ${wo.wo_number}`,
    metadata: { wo_id: woId, wo_number: wo.wo_number, sequence: operation.sequence },
  })

  // Get user info for response
  const { data: user } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .eq('id', userId)
    .single()

  return {
    id: operation.id,
    wo_id: woId,
    operation_name: operation.operation_name,
    sequence: operation.sequence,
    status: 'in_progress',
    started_at: now,
    started_by_user_id: userId,
    started_by_user: user || undefined,
  }
}

/**
 * Get operations for a work order
 */
export async function getWOOperations(
  woId: string,
  orgId: string,
): Promise<{
  id: string
  sequence: number
  operation_name: string
  status: string
  started_at: string | null
  completed_at: string | null
  expected_duration_minutes: number
  actual_duration_minutes: number | null
  actual_yield_percent: number | null
  started_by_user?: {
    first_name: string | null
    last_name: string | null
  } | null
}[]> {
  const supabase = await createServerSupabase()

  // DB schema uses: wo_id, organization_id, sequence, expected_duration_minutes
  const { data, error } = await supabase
    .from('wo_operations')
    .select(`
      id,
      sequence,
      operation_name,
      status,
      started_at,
      completed_at,
      expected_duration_minutes,
      actual_duration_minutes,
      expected_yield_percent
    `)
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .order('sequence', { ascending: true })

  if (error) {
    return []
  }

  const operations = data || []

  return operations.map((op) => ({
    id: op.id,
    sequence: op.sequence,
    operation_name: op.operation_name,
    status: op.status,
    started_at: op.started_at,
    completed_at: op.completed_at,
    expected_duration_minutes: Number(op.expected_duration_minutes || 0) || 30,
    actual_duration_minutes: op.actual_duration_minutes,
    actual_yield_percent: op.expected_yield_percent,
    started_by_user: null,
  }))
}

export interface OperationCompleteResult {
  id: string
  wo_id: string
  operation_name: string
  sequence: number
  status: string
  completed_at: string
  completed_by_user_id: string
  actual_duration_minutes: number
  actual_yield_percent: number | null
  notes: string | null
  next_operation?: {
    id: string
    sequence: number
    operation_name: string
    status: string
  }
}

export interface YieldBreakdown {
  material_code: string
  material_name: string
  required_qty: number
  actual_qty: number
  yield_percent: number
}

/**
 * Calculate yield from BOM consumption (Story 4.5)
 */
export async function calculateYield(
  woId: string,
  orgId: string,
): Promise<{ average_yield: number | null; breakdown: YieldBreakdown[] }> {
  const supabase = await createServerSupabase()

  // Get BOM materials for this WO (DB uses: wo_id, organization_id, required_qty)
  const { data: materials } = await supabase
    .from('wo_materials')
    .select('product_id, required_qty, products:product_id(code, name)')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)

  if (!materials || materials.length === 0) {
    return { average_yield: null, breakdown: [] }
  }

  // For now, return null yield since consumption tracking (Story 4.9) is not yet implemented
  // When consumption is implemented, query actual_consumed_qty from consumption records
  const breakdown: YieldBreakdown[] = materials.map((m) => {
    const product = m.products as unknown as { code: string; name: string } | null
    return {
      material_code: product?.code || 'N/A',
      material_name: product?.name || 'Unknown',
      required_qty: Number(m.required_qty) || 0,
      actual_qty: 0, // Will be populated from consumption records
      yield_percent: 0,
    }
  })

  return { average_yield: null, breakdown }
}

/**
 * Complete an operation (Story 4.5)
 */
export async function completeOperation(
  woId: string,
  operationId: string,
  userId: string,
  userRole: string,
  orgId: string,
  actualDurationMinutes?: number,
  notes?: string,
): Promise<OperationCompleteResult> {
  const supabase = await createServerSupabase()

  // Check role permission
  if (!ALLOWED_ROLES.includes(userRole)) {
    throw new OperationError('FORBIDDEN', 403, 'You do not have permission to complete operations')
  }

  // Get WO and validate it's in_progress or paused
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, org_id')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new OperationError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.org_id !== orgId) {
    throw new OperationError('NOT_FOUND', 404, 'Work order not found')
  }

  if (wo.status !== 'in_progress' && wo.status !== 'paused') {
    throw new OperationError(
      'WO_NOT_IN_PROGRESS',
      400,
      `Cannot complete operation. Work order status is '${wo.status}'.`,
    )
  }

  // Get the operation (DB uses: wo_id, sequence, organization_id)
  const { data: operation, error: opError } = await supabase
    .from('wo_operations')
    .select('id, wo_id, sequence, operation_name, status, organization_id, started_at')
    .eq('id', operationId)
    .eq('wo_id', woId)
    .single()

  if (opError || !operation) {
    throw new OperationError('NOT_FOUND', 404, 'Operation not found')
  }

  if (operation.organization_id !== orgId) {
    throw new OperationError('NOT_FOUND', 404, 'Operation not found')
  }

  if (operation.status === 'completed') {
    throw new OperationError('INVALID_STATUS', 400, 'Operation is already completed')
  }

  if (operation.status !== 'in_progress') {
    throw new OperationError(
      'INVALID_STATUS',
      400,
      `Cannot complete operation with status '${operation.status}'. Operation must be in progress.`,
    )
  }

  const now = new Date()
  const nowIso = now.toISOString()

  // Calculate duration if not provided
  let duration = actualDurationMinutes
  if (duration === undefined && operation.started_at) {
    const startedAt = new Date(operation.started_at)
    duration = Math.round((now.getTime() - startedAt.getTime()) / 60000)
  }
  duration = duration || 0

  // Calculate yield from BOM
  const { average_yield } = await calculateYield(woId, orgId)

  // Update operation status
  const { error: updateError } = await supabase
    .from('wo_operations')
    .update({
      status: 'completed',
      completed_at: nowIso,
      completed_by_user_id: userId,
      actual_duration_minutes: duration,
      actual_yield_percent: average_yield,
      notes: notes || null,
      updated_at: nowIso,
    })
    .eq('id', operationId)
    .eq('status', 'in_progress') // Optimistic lock

  if (updateError) {
    throw new OperationError('INTERNAL_ERROR', 500, 'Failed to complete operation')
  }

  // Find next operation (DB uses: wo_id, organization_id, sequence)
  const { data: nextOp } = await supabase
    .from('wo_operations')
    .select('id, sequence, operation_name, status')
    .eq('wo_id', woId)
    .eq('organization_id', orgId)
    .gt('sequence', operation.sequence)
    .order('sequence', { ascending: true })
    .limit(1)
    .single()

  // Log activity
  await supabase.from('activity_logs').insert({
    org_id: orgId,
    user_id: userId,
    activity_type: 'operation_completed',
    entity_type: 'wo_operation',
    entity_id: operationId,
    entity_code: operation.operation_name,
    description: `Operation '${operation.operation_name}' completed for WO ${wo.wo_number}`,
    metadata: {
      wo_id: woId,
      wo_number: wo.wo_number,
      sequence: operation.sequence,
      duration_minutes: duration,
      yield_percent: average_yield,
    },
  })

  return {
    id: operation.id,
    wo_id: woId,
    operation_name: operation.operation_name,
    sequence: operation.sequence,
    status: 'completed',
    completed_at: nowIso,
    completed_by_user_id: userId,
    actual_duration_minutes: duration,
    actual_yield_percent: average_yield,
    notes: notes || null,
    next_operation: nextOp ? { ...nextOp, sequence: nextOp.sequence } : undefined,
  }
}

/**
 * Get yield breakdown for operation complete modal
 */
export async function getOperationYieldPreview(
  woId: string,
  orgId: string,
): Promise<{ breakdown: YieldBreakdown[] }> {
  const { breakdown } = await calculateYield(woId, orgId)
  return { breakdown }
}
