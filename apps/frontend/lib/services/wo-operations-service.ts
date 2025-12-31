/**
 * WO Operations Service (Story 03.12)
 * Handles routing copy and operations retrieval for work orders.
 *
 * Architecture: Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// TYPES
// ============================================================================

export type WOOperationStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface WOOperation {
  id: string
  wo_id: string
  organization_id: string
  sequence: number
  operation_name: string
  description: string | null
  instructions: string | null
  machine_id: string | null
  line_id: string | null
  expected_duration_minutes: number | null
  expected_yield_percent: number | null
  actual_duration_minutes: number | null
  actual_yield_percent: number | null
  status: WOOperationStatus
  started_at: string | null
  completed_at: string | null
  started_by: string | null
  completed_by: string | null
  skip_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface WOOperationListItem extends WOOperation {
  machine_code: string | null
  machine_name: string | null
  line_code: string | null
  line_name: string | null
  started_by_user: { name: string } | null
  completed_by_user: { name: string } | null
}

export interface WOOperationDetail extends WOOperation {
  machine: {
    id: string
    code: string
    name: string
  } | null
  line: {
    id: string
    code: string
    name: string
  } | null
  duration_variance_minutes: number | null
  yield_variance_percent: number | null
  started_by_user: {
    id: string
    name: string
  } | null
  completed_by_user: {
    id: string
    name: string
  } | null
}

export interface WOOperationsListResponse {
  operations: WOOperationListItem[]
  total: number
}

export interface CopyRoutingResponse {
  success: boolean
  operations_created: number
  message: string
}

export interface RoutingOperation {
  id: string
  routing_id: string
  sequence: number
  operation_name: string
  description: string | null
  machine_id: string | null
  line_id: string | null
  duration: number | null
  setup_time: number | null
  cleanup_time: number | null
  instructions: string | null
  expected_yield_percent: number | null
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

export class WOOperationsError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number = 400) {
    super(message)
    this.name = 'WOOperationsError'
    this.code = code
    this.status = status
  }
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

/**
 * Copy routing operations to WO (calls database function)
 * @param supabase - Supabase client
 * @param woId - Work Order UUID
 * @param orgId - Organization UUID
 * @returns Number of operations created
 */
export async function copyRoutingToWO(
  supabase: SupabaseClient,
  woId: string,
  orgId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('copy_routing_to_wo', {
    p_wo_id: woId,
    p_org_id: orgId,
  })

  if (error) {
    console.error('copyRoutingToWO error:', error)
    throw new WOOperationsError(
      error.message || 'Failed to copy routing operations',
      'COPY_ERROR',
      400
    )
  }

  return data || 0
}

/**
 * Get all operations for a WO ordered by sequence
 * @param supabase - Supabase client
 * @param woId - Work Order UUID
 * @returns Array of operations
 */
export async function getOperationsForWO(
  supabase: SupabaseClient,
  woId: string
): Promise<WOOperationsListResponse> {
  // First verify WO exists (RLS handles org isolation)
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id')
    .eq('id', woId)
    .single()

  if (woError || !wo) {
    throw new WOOperationsError('Work order not found', 'WO_NOT_FOUND', 404)
  }

  // Get operations with related data
  const { data: operations, error } = await supabase
    .from('wo_operations')
    .select(`
      *,
      machine:machines(id, code, name),
      line:production_lines(id, code, name),
      started_by_user:users!wo_operations_started_by_fkey(name),
      completed_by_user:users!wo_operations_completed_by_fkey(name)
    `)
    .eq('wo_id', woId)
    .order('sequence', { ascending: true })

  if (error) {
    console.error('getOperationsForWO error:', error)
    throw new WOOperationsError(
      `Failed to fetch operations: ${error.message}`,
      'FETCH_ERROR',
      500
    )
  }

  // Map the response
  const mapped: WOOperationListItem[] = (operations || []).map((op: any) => ({
    id: op.id,
    wo_id: op.wo_id,
    organization_id: op.organization_id,
    sequence: op.sequence,
    operation_name: op.operation_name,
    description: op.description,
    instructions: op.instructions,
    machine_id: op.machine_id,
    line_id: op.line_id,
    expected_duration_minutes: op.expected_duration_minutes,
    expected_yield_percent: op.expected_yield_percent,
    actual_duration_minutes: op.actual_duration_minutes,
    actual_yield_percent: op.actual_yield_percent,
    status: op.status,
    started_at: op.started_at,
    completed_at: op.completed_at,
    started_by: op.started_by,
    completed_by: op.completed_by,
    skip_reason: op.skip_reason,
    notes: op.notes,
    created_at: op.created_at,
    updated_at: op.updated_at,
    machine_code: op.machine?.code ?? null,
    machine_name: op.machine?.name ?? null,
    line_code: op.line?.code ?? null,
    line_name: op.line?.name ?? null,
    started_by_user: op.started_by_user ?? null,
    completed_by_user: op.completed_by_user ?? null,
  }))

  return {
    operations: mapped,
    total: mapped.length,
  }
}

/**
 * Get single operation by ID with full details and variances
 * @param supabase - Supabase client
 * @param woId - Work Order UUID
 * @param opId - Operation UUID
 * @returns Operation detail or null
 */
export async function getOperationById(
  supabase: SupabaseClient,
  woId: string,
  opId: string
): Promise<WOOperationDetail | null> {
  const { data: operation, error } = await supabase
    .from('wo_operations')
    .select(`
      *,
      machine:machines(id, code, name),
      line:production_lines(id, code, name),
      started_by_user:users!wo_operations_started_by_fkey(id, name),
      completed_by_user:users!wo_operations_completed_by_fkey(id, name)
    `)
    .eq('id', opId)
    .eq('wo_id', woId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('getOperationById error:', error)
    throw new WOOperationsError(
      `Failed to fetch operation: ${error.message}`,
      'FETCH_ERROR',
      500
    )
  }

  if (!operation) {
    return null
  }

  // Calculate variances
  const duration_variance =
    operation.actual_duration_minutes !== null && operation.expected_duration_minutes !== null
      ? operation.actual_duration_minutes - operation.expected_duration_minutes
      : null

  const yield_variance =
    operation.actual_yield_percent !== null && operation.expected_yield_percent !== null
      ? Number(operation.actual_yield_percent) - Number(operation.expected_yield_percent)
      : null

  return {
    id: operation.id,
    wo_id: operation.wo_id,
    organization_id: operation.organization_id,
    sequence: operation.sequence,
    operation_name: operation.operation_name,
    description: operation.description,
    instructions: operation.instructions,
    machine_id: operation.machine_id,
    line_id: operation.line_id,
    expected_duration_minutes: operation.expected_duration_minutes,
    expected_yield_percent: operation.expected_yield_percent,
    actual_duration_minutes: operation.actual_duration_minutes,
    actual_yield_percent: operation.actual_yield_percent,
    status: operation.status,
    started_at: operation.started_at,
    completed_at: operation.completed_at,
    started_by: operation.started_by,
    completed_by: operation.completed_by,
    skip_reason: operation.skip_reason,
    notes: operation.notes,
    created_at: operation.created_at,
    updated_at: operation.updated_at,
    machine: operation.machine ?? null,
    line: operation.line ?? null,
    duration_variance_minutes: duration_variance,
    yield_variance_percent: yield_variance,
    started_by_user: operation.started_by_user ?? null,
    completed_by_user: operation.completed_by_user ?? null,
  }
}

/**
 * Calculate expected duration from routing operation fields
 * @param routingOp - Routing operation with duration fields
 * @returns Total expected duration in minutes
 */
export function calculateExpectedDuration(routingOp: {
  duration?: number | null
  setup_time?: number | null
  cleanup_time?: number | null
}): number {
  return (
    (routingOp.duration || 0) +
    (routingOp.setup_time || 0) +
    (routingOp.cleanup_time || 0)
  )
}

/**
 * Validate that operation sequences are unique
 * @param operations - Array of operations with sequence field
 * @returns true if sequences are unique, false otherwise
 */
export function validateOperationSequence(
  operations: { sequence: number }[]
): boolean {
  if (!operations || operations.length === 0) {
    return true
  }
  const sequences = operations.map((op) => op.sequence)
  const uniqueSequences = new Set(sequences)
  return sequences.length === uniqueSequences.size
}

// ============================================================================
// EXPORT SERVICE OBJECT
// ============================================================================

export const WOOperationsService = {
  copyRoutingToWO,
  getOperationsForWO,
  getOperationById,
  calculateExpectedDuration,
  validateOperationSequence,
}
