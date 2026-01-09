/**
 * WO Operations Service (Story 03.12)
 * Handles routing copy and operations retrieval for work orders.
 *
 * Architecture: Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013).
 *
 * Types: Re-exports WOOperationStatus from validation schemas (single source of truth).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { WOOperationStatus } from '@/lib/validation/wo-operations-schemas'

// Re-export for consumers who import from service
export type { WOOperationStatus }

// ============================================================================
// TYPES
// ============================================================================

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
// INTERNAL HELPERS
// ============================================================================

/**
 * Extract base WOOperation fields from database row
 * Reduces duplication between getOperationsForWO and getOperationById
 */
function mapBaseOperationFields(op: Record<string, unknown>): WOOperation {
  return {
    id: op.id as string,
    wo_id: op.wo_id as string,
    organization_id: op.organization_id as string,
    sequence: op.sequence as number,
    operation_name: op.operation_name as string,
    description: op.description as string | null,
    instructions: op.instructions as string | null,
    machine_id: op.machine_id as string | null,
    line_id: op.line_id as string | null,
    expected_duration_minutes: op.expected_duration_minutes as number | null,
    expected_yield_percent: op.expected_yield_percent as number | null,
    actual_duration_minutes: op.actual_duration_minutes as number | null,
    actual_yield_percent: op.actual_yield_percent as number | null,
    status: op.status as WOOperationStatus,
    started_at: op.started_at as string | null,
    completed_at: op.completed_at as string | null,
    started_by: op.started_by as string | null,
    completed_by: op.completed_by as string | null,
    skip_reason: op.skip_reason as string | null,
    notes: op.notes as string | null,
    created_at: op.created_at as string,
    updated_at: op.updated_at as string,
  }
}

/**
 * Calculate variance between actual and expected values
 * Returns null if either value is null/undefined
 */
function calculateVariance(actual: number | null, expected: number | null): number | null {
  if (actual === null || actual === undefined || expected === null || expected === undefined) {
    return null
  }
  return Number(actual) - Number(expected)
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

  // Map the response using helper + list-specific fields
  const mapped: WOOperationListItem[] = (operations || []).map((op: Record<string, unknown>) => ({
    ...mapBaseOperationFields(op),
    machine_code: (op.machine as { code?: string } | null)?.code ?? null,
    machine_name: (op.machine as { name?: string } | null)?.name ?? null,
    line_code: (op.line as { code?: string } | null)?.code ?? null,
    line_name: (op.line as { name?: string } | null)?.name ?? null,
    started_by_user: (op.started_by_user as { name: string } | null) ?? null,
    completed_by_user: (op.completed_by_user as { name: string } | null) ?? null,
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

  // Use helper for base fields + detail-specific fields
  return {
    ...mapBaseOperationFields(operation),
    machine: operation.machine ?? null,
    line: operation.line ?? null,
    duration_variance_minutes: calculateVariance(
      operation.actual_duration_minutes,
      operation.expected_duration_minutes
    ),
    yield_variance_percent: calculateVariance(
      operation.actual_yield_percent,
      operation.expected_yield_percent
    ),
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
