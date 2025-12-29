/**
 * Routing Operations Service - Story 02.8
 *
 * Service for managing routing operations (production steps):
 * - CRUD operations
 * - Parallel operations support (duplicate sequences)
 * - Duration calculation (MAX per sequence group for parallel)
 * - Cost calculation (SUM all ops including parallel)
 * - Reorder operations (swap sequences)
 * - Attachment management
 * - Machine dropdown helpers
 */

import { createServerSupabase } from '@/lib/supabase/server'
import {
  RoutingOperation,
  OperationsSummary,
  OperationsListResponse,
  CreateOperationRequest,
  UpdateOperationRequest,
  ReorderResponse,
  OperationAttachment,
  Machine,
} from '@/lib/types/routing-operation'
import {
  operationFormSchema,
  validateAttachmentFile,
  MIME_TO_EXT,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '@/lib/validation/operation-schemas'

// ============================================================================
// TYPES
// ============================================================================

export interface ServiceResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return userData?.org_id ?? null
}

// ============================================================================
// PARALLEL OPERATIONS DETECTION
// ============================================================================

/**
 * Detect operations with duplicate sequences (parallel operations)
 * Returns a Map of sequence number to array of operation IDs
 */
export function detectParallelOperations(
  operations: RoutingOperation[]
): Map<number, string[]> {
  const sequenceMap = new Map<number, string[]>()

  for (const op of operations) {
    const existing = sequenceMap.get(op.sequence) || []
    existing.push(op.id)
    sequenceMap.set(op.sequence, existing)
  }

  // Filter to only parallel sequences (more than 1 operation)
  const parallelMap = new Map<number, string[]>()
  for (const [seq, ids] of sequenceMap) {
    if (ids.length > 1) {
      parallelMap.set(seq, ids)
    }
  }

  return parallelMap
}

/**
 * Check if an operation is part of a parallel group
 */
export function isParallelOperation(
  operation: RoutingOperation,
  operations: RoutingOperation[]
): boolean {
  return operations.filter(op => op.sequence === operation.sequence).length > 1
}

// ============================================================================
// SUMMARY CALCULATIONS
// ============================================================================

/**
 * Calculate summary statistics for operations
 * - total_duration: MAX per sequence group for parallel, SUM for sequential
 * - total_labor_cost: SUM all ops including parallel
 */
export function calculateSummary(operations: RoutingOperation[]): OperationsSummary {
  if (!operations || operations.length === 0) {
    return {
      total_operations: 0,
      total_duration: 0,
      total_setup_time: 0,
      total_cleanup_time: 0,
      total_labor_cost: 0,
      average_yield: 0,
    }
  }

  // Group operations by sequence
  const grouped = operations.reduce((acc, op) => {
    if (!acc[op.sequence]) acc[op.sequence] = []
    acc[op.sequence].push(op)
    return acc
  }, {} as Record<number, RoutingOperation[]>)

  // Calculate totals
  let totalDuration = 0
  let totalSetupTime = 0
  let totalCleanupTime = 0
  let totalLaborCost = 0

  for (const group of Object.values(grouped)) {
    // For parallel ops: use MAX of (setup + duration + cleanup) per group
    const maxTime = Math.max(
      ...group.map(op => (op.setup_time || 0) + op.duration + (op.cleanup_time || 0))
    )
    totalDuration += maxTime

    // Individual setup/cleanup times summed (for display purposes)
    for (const op of group) {
      totalSetupTime += op.setup_time || 0
      totalCleanupTime += op.cleanup_time || 0

      // Labor cost: SUM all operations including parallel (both incur cost)
      if (op.labor_cost_per_hour && op.duration) {
        const hours = op.duration / 60
        totalLaborCost += op.labor_cost_per_hour * hours
      }
    }
  }

  return {
    total_operations: operations.length,
    total_duration: totalDuration,
    total_setup_time: totalSetupTime,
    total_cleanup_time: totalCleanupTime,
    total_labor_cost: Math.round(totalLaborCost * 100) / 100,
    average_yield: 100, // Placeholder - actual yield tracking would come from production
  }
}

/**
 * Calculate total operation time (setup + duration + cleanup)
 */
export function calculateOperationTime(operation: {
  setup_time?: number | null
  duration: number
  cleanup_time?: number | null
}): number {
  return (operation.setup_time || 0) + operation.duration + (operation.cleanup_time || 0)
}

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all operations for a routing with summary stats
 */
export async function getOperations(
  routingId: string
): Promise<ServiceResult<OperationsListResponse>> {
  try {
    const supabase = await createServerSupabase()

    // Verify routing exists and user has access
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .select('id')
      .eq('id', routingId)
      .single()

    if (routingError || !routing) {
      return {
        success: false,
        error: 'Routing not found',
        code: 'ROUTING_NOT_FOUND',
      }
    }

    // Get operations with machine details
    const { data: operations, error } = await supabase
      .from('routing_operations')
      .select(`
        id,
        routing_id,
        sequence,
        operation_name,
        machine_id,
        line_id,
        expected_duration_minutes,
        expected_yield_percent,
        setup_time_minutes,
        labor_cost,
        created_at,
        updated_at,
        machines:machine_id(id, code, name)
      `)
      .eq('routing_id', routingId)
      .order('sequence', { ascending: true })

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Transform to match expected interface
    const transformedOperations: RoutingOperation[] = (operations || []).map(op => ({
      id: op.id,
      routing_id: op.routing_id,
      sequence: op.sequence,
      name: op.operation_name,
      description: null,
      machine_id: op.machine_id,
      machine_name: op.machines?.name || null,
      machine_code: op.machines?.code || null,
      setup_time: op.setup_time_minutes || 0,
      duration: op.expected_duration_minutes || 0,
      cleanup_time: 0, // Not in current schema
      labor_cost_per_hour: op.labor_cost || 0,
      instructions: null, // Not in current schema
      attachment_count: 0, // Will be implemented with attachments table
      created_at: op.created_at,
      updated_at: op.updated_at,
    }))

    const summary = calculateSummary(transformedOperations)

    return {
      success: true,
      data: {
        operations: transformedOperations,
        summary,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// CREATE OPERATION
// ============================================================================

/**
 * Create a new operation for a routing
 * Allows duplicate sequences for parallel operations (FR-2.48)
 */
export async function createOperation(
  routingId: string,
  data: CreateOperationRequest
): Promise<ServiceResult<RoutingOperation>> {
  try {
    // Validate input
    const validation = operationFormSchema.safeParse(data)
    if (!validation.success) {
      return {
        success: false,
        error: validation.error.errors[0].message,
        code: 'VALIDATION_ERROR',
      }
    }

    // Use authenticated client to enforce RLS (not admin client)
    // This ensures org isolation is enforced at the database level
    const supabase = await createServerSupabase()

    // Verify routing exists (RLS will filter to user's org)
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .select('id')
      .eq('id', routingId)
      .single()

    if (routingError || !routing) {
      return {
        success: false,
        error: 'Routing not found',
        code: 'ROUTING_NOT_FOUND',
      }
    }

    // Validate machine if provided (RLS will filter to user's org)
    if (data.machine_id) {
      const { data: machine, error: machineError } = await supabase
        .from('machines')
        .select('id')
        .eq('id', data.machine_id)
        .single()

      if (machineError || !machine) {
        return {
          success: false,
          error: 'Machine not found',
          code: 'INVALID_MACHINE_ID',
        }
      }
    }

    // Create operation (duplicate sequences allowed for parallel ops)
    // RLS INSERT policy will verify routing belongs to user's org
    const { data: operation, error } = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routingId,
        sequence: data.sequence,
        operation_name: data.name,
        machine_id: data.machine_id || null,
        expected_duration_minutes: data.duration,
        setup_time_minutes: data.setup_time || 0,
        labor_cost: data.labor_cost_per_hour || 0,
      })
      .select(`
        id,
        routing_id,
        sequence,
        operation_name,
        machine_id,
        expected_duration_minutes,
        setup_time_minutes,
        labor_cost,
        created_at,
        updated_at,
        machines:machine_id(id, code, name)
      `)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: {
        id: operation.id,
        routing_id: operation.routing_id,
        sequence: operation.sequence,
        name: operation.operation_name,
        description: null,
        machine_id: operation.machine_id,
        machine_name: operation.machines?.name || null,
        machine_code: operation.machines?.code || null,
        setup_time: operation.setup_time_minutes || 0,
        duration: operation.expected_duration_minutes || 0,
        cleanup_time: 0,
        labor_cost_per_hour: operation.labor_cost || 0,
        instructions: null,
        attachment_count: 0,
        created_at: operation.created_at,
        updated_at: operation.updated_at,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// UPDATE OPERATION
// ============================================================================

/**
 * Update an existing operation
 */
export async function updateOperation(
  routingId: string,
  opId: string,
  data: Partial<CreateOperationRequest>
): Promise<ServiceResult<RoutingOperation>> {
  try {
    const supabase = await createServerSupabase()

    // Verify operation exists and belongs to routing
    const { data: existing, error: findError } = await supabase
      .from('routing_operations')
      .select('id')
      .eq('id', opId)
      .eq('routing_id', routingId)
      .single()

    if (findError || !existing) {
      return {
        success: false,
        error: 'Operation not found',
        code: 'OPERATION_NOT_FOUND',
      }
    }

    // Validate machine if provided
    if (data.machine_id) {
      const { data: machine, error: machineError } = await supabase
        .from('machines')
        .select('id')
        .eq('id', data.machine_id)
        .single()

      if (machineError || !machine) {
        return {
          success: false,
          error: 'Machine not found',
          code: 'INVALID_MACHINE_ID',
        }
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (data.sequence !== undefined) updateData.sequence = data.sequence
    if (data.name !== undefined) updateData.operation_name = data.name
    if (data.machine_id !== undefined) updateData.machine_id = data.machine_id
    if (data.duration !== undefined) updateData.expected_duration_minutes = data.duration
    if (data.setup_time !== undefined) updateData.setup_time_minutes = data.setup_time
    if (data.labor_cost_per_hour !== undefined) updateData.labor_cost = data.labor_cost_per_hour

    const { data: operation, error } = await supabase
      .from('routing_operations')
      .update(updateData)
      .eq('id', opId)
      .eq('routing_id', routingId)
      .select(`
        id,
        routing_id,
        sequence,
        operation_name,
        machine_id,
        expected_duration_minutes,
        setup_time_minutes,
        labor_cost,
        created_at,
        updated_at,
        machines:machine_id(id, code, name)
      `)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: {
        id: operation.id,
        routing_id: operation.routing_id,
        sequence: operation.sequence,
        name: operation.operation_name,
        description: null,
        machine_id: operation.machine_id,
        machine_name: operation.machines?.name || null,
        machine_code: operation.machines?.code || null,
        setup_time: operation.setup_time_minutes || 0,
        duration: operation.expected_duration_minutes || 0,
        cleanup_time: 0,
        labor_cost_per_hour: operation.labor_cost || 0,
        instructions: null,
        attachment_count: 0,
        created_at: operation.created_at,
        updated_at: operation.updated_at,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// DELETE OPERATION
// ============================================================================

/**
 * Delete an operation (also deletes attachments from storage)
 */
export async function deleteOperation(
  routingId: string,
  opId: string
): Promise<ServiceResult<{ attachments_deleted: number }>> {
  try {
    const supabase = await createServerSupabase()

    // Verify operation exists and belongs to routing
    const { data: existing, error: findError } = await supabase
      .from('routing_operations')
      .select('id')
      .eq('id', opId)
      .eq('routing_id', routingId)
      .single()

    if (findError || !existing) {
      return {
        success: false,
        error: 'Operation not found',
        code: 'OPERATION_NOT_FOUND',
      }
    }

    // Get attachments to delete from storage
    // Note: operation_attachments table may not exist yet
    let attachmentsDeleted = 0
    try {
      const { data: attachments } = await supabase
        .from('operation_attachments')
        .select('storage_path')
        .eq('operation_id', opId)

      if (attachments && attachments.length > 0) {
        // Delete from storage
        const paths = attachments.map(a => a.storage_path)
        await supabase.storage.from('operation-attachments').remove(paths)
        attachmentsDeleted = attachments.length
      }
    } catch {
      // Table might not exist yet - continue with operation deletion
    }

    // Delete operation (CASCADE will delete attachments rows)
    const { error } = await supabase
      .from('routing_operations')
      .delete()
      .eq('id', opId)
      .eq('routing_id', routingId)

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: { attachments_deleted: attachmentsDeleted },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// REORDER OPERATION
// ============================================================================

/**
 * Move operation up or down (swap sequences)
 */
export async function reorderOperation(
  routingId: string,
  opId: string,
  direction: 'up' | 'down'
): Promise<ServiceResult<ReorderResponse>> {
  try {
    const supabase = await createServerSupabase()

    // Get all operations for this routing
    const { data: operations, error: listError } = await supabase
      .from('routing_operations')
      .select('id, sequence')
      .eq('routing_id', routingId)
      .order('sequence', { ascending: true })

    if (listError || !operations) {
      return {
        success: false,
        error: 'Failed to fetch operations',
        code: 'DATABASE_ERROR',
      }
    }

    // Find the operation to move
    const opIndex = operations.findIndex(op => op.id === opId)
    if (opIndex === -1) {
      return {
        success: false,
        error: 'Operation not found',
        code: 'OPERATION_NOT_FOUND',
      }
    }

    const currentOp = operations[opIndex]

    // Get unique sequences and find current position
    const uniqueSequences = [...new Set(operations.map(op => op.sequence))].sort((a, b) => a - b)
    const currentSeqIndex = uniqueSequences.indexOf(currentOp.sequence)

    // Check boundaries
    if (direction === 'up' && currentSeqIndex === 0) {
      return {
        success: false,
        error: 'Cannot move operation (already at top)',
        code: 'CANNOT_MOVE',
      }
    }

    if (direction === 'down' && currentSeqIndex === uniqueSequences.length - 1) {
      return {
        success: false,
        error: 'Cannot move operation (already at bottom)',
        code: 'CANNOT_MOVE',
      }
    }

    // Calculate target sequence
    const targetSeqIndex = direction === 'up' ? currentSeqIndex - 1 : currentSeqIndex + 1
    const targetSeq = uniqueSequences[targetSeqIndex]
    const currentSeq = currentOp.sequence

    // Find operations at target sequence (for swap)
    const opsAtTarget = operations.filter(op => op.sequence === targetSeq)
    const opsAtCurrent = operations.filter(op => op.sequence === currentSeq && op.id !== opId)

    // Swap sequences:
    // 1. Move current operation to target sequence
    // 2. Move one operation from target to current sequence
    const updates: Array<{ id: string; sequence: number }> = []

    // Move current operation to target
    updates.push({ id: opId, sequence: targetSeq })

    // Move first operation at target to current sequence
    if (opsAtTarget.length > 0) {
      updates.push({ id: opsAtTarget[0].id, sequence: currentSeq })
    }

    // Execute updates
    for (const update of updates) {
      const { error } = await supabase
        .from('routing_operations')
        .update({ sequence: update.sequence })
        .eq('id', update.id)

      if (error) {
        return {
          success: false,
          error: error.message,
          code: 'DATABASE_ERROR',
        }
      }
    }

    return {
      success: true,
      data: {
        success: true,
        updated_operations: updates,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

// ============================================================================
// SEQUENCE HELPERS
// ============================================================================

/**
 * Get the next available sequence number for a routing
 */
export async function getNextSequence(routingId: string): Promise<number> {
  try {
    const supabase = await createServerSupabase()

    const { data: operations } = await supabase
      .from('routing_operations')
      .select('sequence')
      .eq('routing_id', routingId)
      .order('sequence', { ascending: false })
      .limit(1)

    if (!operations || operations.length === 0) {
      return 1
    }

    return operations[0].sequence + 1
  } catch {
    return 1
  }
}

// ============================================================================
// MACHINE HELPERS
// ============================================================================

/**
 * Get machines for dropdown
 */
export async function getMachinesForDropdown(): Promise<Machine[]> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) return []

    const { data: machines, error } = await supabase
      .from('machines')
      .select('id, code, name')
      .eq('org_id', orgId)
      .order('name', { ascending: true })

    if (error || !machines) return []

    return machines
  } catch {
    return []
  }
}

/**
 * Check if machines are configured for the organization
 */
export async function hasMachinesConfigured(): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()

    if (!orgId) return false

    const { count, error } = await supabase
      .from('machines')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)

    if (error) return false

    return (count ?? 0) > 0
  } catch {
    return false
  }
}

// ============================================================================
// ATTACHMENT MANAGEMENT (Placeholder - needs operation_attachments table)
// ============================================================================

/**
 * Upload attachment for operation
 * Requires operation_attachments table and storage bucket
 */
export async function uploadAttachment(
  routingId: string,
  opId: string,
  file: File
): Promise<ServiceResult<OperationAttachment>> {
  try {
    const validationError = validateAttachmentFile(file, 0) // Count check done separately
    if (validationError) {
      return {
        success: false,
        error: validationError,
        code: validationError.includes('Maximum') ? 'MAX_ATTACHMENTS_REACHED' :
              validationError.includes('size') ? 'FILE_TOO_LARGE' : 'INVALID_FILE_TYPE',
      }
    }

    const supabase = await createServerSupabase()
    const orgId = await getCurrentOrgId()
    const { data: { user } } = await supabase.auth.getUser()

    if (!orgId || !user) {
      return {
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }
    }

    // Check current attachment count
    const { count } = await supabase
      .from('operation_attachments')
      .select('id', { count: 'exact', head: true })
      .eq('operation_id', opId)

    if ((count ?? 0) >= 5) {
      return {
        success: false,
        error: 'Maximum 5 attachments per operation',
        code: 'MAX_ATTACHMENTS_REACHED',
      }
    }

    // Generate storage path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `${orgId}/${routingId}/${opId}/${timestamp}_${sanitizedName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('operation-attachments')
      .upload(storagePath, file)

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
        code: 'STORAGE_ERROR',
      }
    }

    // Create attachment record
    const fileExt = MIME_TO_EXT[file.type] || 'unknown'
    const { data: attachment, error: dbError } = await supabase
      .from('operation_attachments')
      .insert({
        org_id: orgId,
        operation_id: opId,
        file_name: file.name,
        file_type: fileExt,
        file_size: file.size,
        storage_path: storagePath,
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (dbError) {
      // Cleanup uploaded file
      await supabase.storage.from('operation-attachments').remove([storagePath])
      return {
        success: false,
        error: dbError.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: attachment,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Delete attachment from operation
 */
export async function deleteAttachment(
  routingId: string,
  opId: string,
  attachId: string
): Promise<ServiceResult<void>> {
  try {
    const supabase = await createServerSupabase()

    // Get attachment
    const { data: attachment, error: findError } = await supabase
      .from('operation_attachments')
      .select('storage_path')
      .eq('id', attachId)
      .eq('operation_id', opId)
      .single()

    if (findError || !attachment) {
      return {
        success: false,
        error: 'Attachment not found',
        code: 'NOT_FOUND',
      }
    }

    // Delete from storage
    await supabase.storage.from('operation-attachments').remove([attachment.storage_path])

    // Delete record
    const { error } = await supabase
      .from('operation_attachments')
      .delete()
      .eq('id', attachId)

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get signed URL for attachment download
 */
export async function getAttachmentDownloadUrl(
  routingId: string,
  opId: string,
  attachId: string
): Promise<ServiceResult<{ url: string; expires_in: number }>> {
  try {
    const supabase = await createServerSupabase()

    // Get attachment
    const { data: attachment, error: findError } = await supabase
      .from('operation_attachments')
      .select('storage_path')
      .eq('id', attachId)
      .eq('operation_id', opId)
      .single()

    if (findError || !attachment) {
      return {
        success: false,
        error: 'Attachment not found',
        code: 'NOT_FOUND',
      }
    }

    // Get signed URL (1 hour expiry)
    const { data: signedUrl, error: urlError } = await supabase.storage
      .from('operation-attachments')
      .createSignedUrl(attachment.storage_path, 3600)

    if (urlError || !signedUrl) {
      return {
        success: false,
        error: 'Failed to generate download URL',
        code: 'STORAGE_ERROR',
      }
    }

    return {
      success: true,
      data: {
        url: signedUrl.signedUrl,
        expires_in: 3600,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}
