/**
 * PO Status Service
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * Handles PO status operations:
 * - Status CRUD (list, get, create, update, delete)
 * - Status transition rules configuration
 * - Status change validation and execution
 * - Status history tracking
 * - Default status creation for new organizations
 */

import { createServerSupabaseAdmin } from '../supabase/server'
import {
  type POStatus,
  type POStatusTransition,
  type POStatusHistory,
  type CreatePOStatusInput,
  type UpdatePOStatusInput,
  type TransitionValidationResult,
  type CanDeleteStatusResult,
  type StatusColor,
  DEFAULT_PO_STATUSES,
  DEFAULT_PO_TRANSITIONS,
} from '../validation/po-status-schemas'

// ============================================================================
// Types
// ============================================================================

export interface ServiceResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?:
    | 'NOT_FOUND'
    | 'DUPLICATE_CODE'
    | 'INVALID_INPUT'
    | 'DATABASE_ERROR'
    | 'UNAUTHORIZED'
    | 'SYSTEM_STATUS'
    | 'STATUS_IN_USE'
    | 'INVALID_TRANSITION'
    | 'SELF_LOOP'
    | 'SYSTEM_TRANSITION'
    | 'NO_LINES'
}

export interface POStatusWithUsage extends POStatus {
  po_count?: number
  transition_count?: number
}

export interface TransitionWithTarget extends POStatusTransition {
  to_status: POStatus
}

// ============================================================================
// POStatusService Class
// ============================================================================

export class POStatusService {
  // ==========================================================================
  // Status CRUD Operations
  // ==========================================================================

  /**
   * List all statuses for an organization
   * Returns statuses ordered by display_order ascending
   *
   * @param orgId Organization UUID
   * @param options Optional: include usage count
   */
  static async listStatuses(
    orgId: string,
    options?: { includeUsageCount?: boolean }
  ): Promise<POStatus[]> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: statuses, error } = await supabaseAdmin
      .from('po_statuses')
      .select('*')
      .eq('org_id', orgId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error listing PO statuses:', error)
      return []
    }

    if (options?.includeUsageCount && statuses) {
      // Get usage counts for all statuses
      const statusCodes = statuses.map((s) => s.code)
      const { data: counts } = await supabaseAdmin
        .from('purchase_orders')
        .select('status')
        .eq('org_id', orgId)
        .in('status', statusCodes)

      const countMap: Record<string, number> = {}
      ;(counts || []).forEach((po) => {
        countMap[po.status] = (countMap[po.status] || 0) + 1
      })

      return statuses.map((s) => ({
        ...s,
        po_count: countMap[s.code] || 0,
      })) as POStatus[]
    }

    return statuses || []
  }

  /**
   * Get a single status by ID
   *
   * @param id Status UUID
   * @param orgId Organization UUID for isolation
   */
  static async getStatus(id: string, orgId: string): Promise<POStatus | null> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: status, error } = await supabaseAdmin
      .from('po_statuses')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !status) {
      return null
    }

    return status
  }

  /**
   * Get a status by code
   *
   * @param code Status code
   * @param orgId Organization UUID
   */
  static async getStatusByCode(
    code: string,
    orgId: string
  ): Promise<POStatus | null> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: status, error } = await supabaseAdmin
      .from('po_statuses')
      .select('*')
      .eq('code', code)
      .eq('org_id', orgId)
      .single()

    if (error || !status) {
      return null
    }

    return status
  }

  /**
   * Create a new custom status
   *
   * @param orgId Organization UUID
   * @param data Status data
   */
  static async createStatus(
    orgId: string,
    data: CreatePOStatusInput
  ): Promise<ServiceResult<POStatus>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check for duplicate code
    const { data: existing } = await supabaseAdmin
      .from('po_statuses')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', data.code)
      .single()

    if (existing) {
      return {
        success: false,
        error: 'Status code must be unique within organization',
        code: 'DUPLICATE_CODE',
      }
    }

    // Auto-assign display_order if not provided
    let displayOrder = data.display_order
    if (!displayOrder) {
      const { data: maxOrder } = await supabaseAdmin
        .from('po_statuses')
        .select('display_order')
        .eq('org_id', orgId)
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      displayOrder = (maxOrder?.display_order || 0) + 1
    }

    const statusData = {
      org_id: orgId,
      code: data.code,
      name: data.name,
      color: data.color || 'gray',
      display_order: displayOrder,
      is_system: false,
      is_active: true,
      description: data.description || null,
    }

    const { data: newStatus, error } = await supabaseAdmin
      .from('po_statuses')
      .insert(statusData)
      .select()
      .single()

    if (error) {
      console.error('Error creating PO status:', error)
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: newStatus,
    }
  }

  /**
   * Update an existing status
   *
   * @param id Status UUID
   * @param orgId Organization UUID
   * @param data Update data
   */
  static async updateStatus(
    id: string,
    orgId: string,
    data: UpdatePOStatusInput
  ): Promise<ServiceResult<POStatus>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get existing status
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('po_statuses')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (checkError || !existing) {
      return {
        success: false,
        error: 'Status not found',
        code: 'NOT_FOUND',
      }
    }

    // System status restrictions: can only change color and display_order
    if (existing.is_system && data.name !== undefined) {
      return {
        success: false,
        error: 'Cannot change name of system status',
        code: 'SYSTEM_STATUS',
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.color !== undefined) updateData.color = data.color
    if (data.display_order !== undefined)
      updateData.display_order = data.display_order
    if (data.description !== undefined) updateData.description = data.description
    if (data.is_active !== undefined) updateData.is_active = data.is_active

    const { data: updated, error } = await supabaseAdmin
      .from('po_statuses')
      .update(updateData)
      .eq('id', id)
      .select()
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
      data: updated,
    }
  }

  /**
   * Delete a status (if not system and not in use)
   *
   * @param id Status UUID
   * @param orgId Organization UUID
   */
  static async deleteStatus(
    id: string,
    orgId: string
  ): Promise<ServiceResult<null>> {
    const canDelete = await POStatusService.canDeleteStatus(id, orgId)

    if (!canDelete.allowed) {
      return {
        success: false,
        error: canDelete.reason || 'Cannot delete status',
        code: canDelete.reason?.includes('system')
          ? 'SYSTEM_STATUS'
          : 'STATUS_IN_USE',
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Delete transitions first (cascade)
    await supabaseAdmin
      .from('po_status_transitions')
      .delete()
      .or(`from_status_id.eq.${id},to_status_id.eq.${id}`)

    // Delete status
    const { error } = await supabaseAdmin
      .from('po_statuses')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: null,
    }
  }

  /**
   * Reorder statuses by updating display_order
   *
   * @param orgId Organization UUID
   * @param statusIds Array of status UUIDs in new order
   */
  static async reorderStatuses(
    orgId: string,
    statusIds: string[]
  ): Promise<ServiceResult<POStatus[]>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify all statuses belong to the org
    const { data: existing } = await supabaseAdmin
      .from('po_statuses')
      .select('id')
      .eq('org_id', orgId)
      .in('id', statusIds)

    if (!existing || existing.length !== statusIds.length) {
      return {
        success: false,
        error: 'One or more status IDs not found',
        code: 'NOT_FOUND',
      }
    }

    // Update display_order for each status
    for (let i = 0; i < statusIds.length; i++) {
      await supabaseAdmin
        .from('po_statuses')
        .update({ display_order: i + 1, updated_at: new Date().toISOString() })
        .eq('id', statusIds[i])
    }

    // Return updated statuses
    const statuses = await POStatusService.listStatuses(orgId)

    return {
      success: true,
      data: statuses,
    }
  }

  // ==========================================================================
  // Transition Rules
  // ==========================================================================

  /**
   * Get transitions from a status
   *
   * @param statusId Status UUID
   * @param orgId Organization UUID
   */
  static async getStatusTransitions(
    statusId: string,
    orgId: string
  ): Promise<TransitionWithTarget[]> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: transitions, error } = await supabaseAdmin
      .from('po_status_transitions')
      .select(
        `
        *,
        to_status:po_statuses!to_status_id(*)
      `
      )
      .eq('from_status_id', statusId)
      .eq('org_id', orgId)

    if (error) {
      console.error('Error fetching transitions:', error)
      return []
    }

    return (transitions || []) as TransitionWithTarget[]
  }

  /**
   * Update transitions for a status
   *
   * @param statusId From status UUID
   * @param orgId Organization UUID
   * @param allowedToStatusIds Array of allowed target status UUIDs
   */
  static async updateStatusTransitions(
    statusId: string,
    orgId: string,
    allowedToStatusIds: string[]
  ): Promise<ServiceResult<TransitionWithTarget[]>> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check for self-loop
    if (allowedToStatusIds.includes(statusId)) {
      return {
        success: false,
        error: 'Cannot create self-loop transition',
        code: 'SELF_LOOP',
      }
    }

    // Get current transitions
    const { data: currentTransitions } = await supabaseAdmin
      .from('po_status_transitions')
      .select('*')
      .eq('from_status_id', statusId)
      .eq('org_id', orgId)

    // Check if any system transitions are being removed
    const systemTransitions = (currentTransitions || []).filter(
      (t) => t.is_system
    )
    const removingSystemTransition = systemTransitions.some(
      (t) => !allowedToStatusIds.includes(t.to_status_id)
    )

    if (removingSystemTransition) {
      return {
        success: false,
        error: 'Cannot remove system-required transition',
        code: 'SYSTEM_TRANSITION',
      }
    }

    // Delete non-system transitions that are not in the new list
    const currentIds = (currentTransitions || [])
      .filter((t) => !t.is_system)
      .map((t) => t.to_status_id)
    const toDelete = currentIds.filter((id) => !allowedToStatusIds.includes(id))

    if (toDelete.length > 0) {
      await supabaseAdmin
        .from('po_status_transitions')
        .delete()
        .eq('from_status_id', statusId)
        .eq('org_id', orgId)
        .eq('is_system', false)
        .in('to_status_id', toDelete)
    }

    // Add new transitions
    const existingIds = (currentTransitions || []).map((t) => t.to_status_id)
    const toAdd = allowedToStatusIds.filter((id) => !existingIds.includes(id))

    if (toAdd.length > 0) {
      const newTransitions = toAdd.map((toId) => ({
        org_id: orgId,
        from_status_id: statusId,
        to_status_id: toId,
        is_system: false,
        requires_approval: false,
        requires_reason: false,
      }))

      await supabaseAdmin.from('po_status_transitions').insert(newTransitions)
    }

    // Return updated transitions
    const transitions = await POStatusService.getStatusTransitions(
      statusId,
      orgId
    )

    return {
      success: true,
      data: transitions,
    }
  }

  // ==========================================================================
  // Status Operations
  // ==========================================================================

  /**
   * Get available transitions for a PO
   *
   * @param poId Purchase Order UUID
   * @param orgId Organization UUID
   */
  static async getAvailableTransitions(
    poId: string,
    orgId: string
  ): Promise<POStatus[]> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get PO's current status
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('status')
      .eq('id', poId)
      .eq('org_id', orgId)
      .single()

    if (!po) {
      return []
    }

    // Get status ID from code
    const currentStatus = await POStatusService.getStatusByCode(po.status, orgId)
    if (!currentStatus) {
      return []
    }

    // Get transitions
    const transitions = await POStatusService.getStatusTransitions(
      currentStatus.id,
      orgId
    )

    return transitions.map((t) => t.to_status)
  }

  /**
   * Validate a status transition for a PO
   *
   * @param poId Purchase Order UUID
   * @param toStatusCode Target status code
   * @param orgId Organization UUID
   */
  static async validateTransition(
    poId: string,
    toStatusCode: string,
    orgId: string
  ): Promise<TransitionValidationResult> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get PO details
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, status, org_id, total')
      .eq('id', poId)
      .eq('org_id', orgId)
      .single()

    if (!po) {
      return {
        valid: false,
        reason: 'Purchase order not found',
      }
    }

    // Get current status details
    const currentStatus = await POStatusService.getStatusByCode(po.status, orgId)
    const targetStatus = await POStatusService.getStatusByCode(toStatusCode, orgId)

    if (!currentStatus || !targetStatus) {
      return {
        valid: false,
        reason: 'Invalid status',
      }
    }

    // Check if transition is allowed
    const transitions = await POStatusService.getStatusTransitions(
      currentStatus.id,
      orgId
    )
    const isAllowed = transitions.some(
      (t) => t.to_status_id === targetStatus.id
    )

    if (!isAllowed) {
      return {
        valid: false,
        reason: `Invalid transition: ${currentStatus.code} -> ${toStatusCode}`,
      }
    }

    // Business rule: Cannot submit without lines
    if (toStatusCode === 'submitted' || toStatusCode === 'pending_approval') {
      // Query lines separately to avoid relationship detection issues
      const { data: lines, error: linesError } = await supabaseAdmin
        .from('purchase_order_lines')
        .select('id')
        .eq('po_id', poId)

      if (linesError) {
        console.error('Error fetching PO lines:', linesError)
        return {
          valid: false,
          reason: 'Error checking purchase order lines',
        }
      }

      if (!lines || lines.length === 0) {
        return {
          valid: false,
          reason: 'Cannot submit PO without line items',
        }
      }
    }

    // Check for warnings (e.g., high discount)
    const warnings: string[] = []
    if (po.total && po.total > 10000) {
      // Example warning threshold
      warnings.push('PO total exceeds 10,000')
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * Execute a status transition for a PO
   *
   * @param poId Purchase Order UUID
   * @param toStatusCode Target status code
   * @param userId User performing the transition (null for system)
   * @param orgId Organization UUID
   * @param notes Optional notes
   */
  static async transitionStatus(
    poId: string,
    toStatusCode: string,
    userId: string | null,
    orgId: string,
    notes?: string
  ): Promise<ServiceResult<{ id: string; status: string }>> {
    // Validate transition
    const validation = await POStatusService.validateTransition(
      poId,
      toStatusCode,
      orgId
    )

    if (!validation.valid) {
      return {
        success: false,
        error: validation.reason || 'Invalid transition',
        code: validation.reason?.includes('line items')
          ? 'NO_LINES'
          : 'INVALID_TRANSITION',
      }
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Get current status
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('status')
      .eq('id', poId)
      .eq('org_id', orgId)
      .single()

    if (!po) {
      return {
        success: false,
        error: 'Purchase order not found',
        code: 'NOT_FOUND',
      }
    }

    const fromStatus = po.status

    // Update PO status
    const { error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update({
        status: toStatusCode,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', poId)

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
        code: 'DATABASE_ERROR',
      }
    }

    // Record history
    await POStatusService.recordStatusHistory(
      poId,
      fromStatus,
      toStatusCode,
      userId,
      notes
    )

    return {
      success: true,
      data: { id: poId, status: toStatusCode },
    }
  }

  // ==========================================================================
  // Status History
  // ==========================================================================

  /**
   * Get status history for a PO
   *
   * @param poId Purchase Order UUID
   * @param orgId Organization UUID
   */
  static async getStatusHistory(
    poId: string,
    orgId: string
  ): Promise<POStatusHistory[]> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify PO belongs to org
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id')
      .eq('id', poId)
      .eq('org_id', orgId)
      .single()

    if (!po) {
      return []
    }

    const { data: history, error } = await supabaseAdmin
      .from('po_status_history')
      .select(
        `
        *,
        user:users(id, first_name, last_name, email)
      `
      )
      .eq('po_id', poId)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching status history:', error)
      return []
    }

    return (history || []) as POStatusHistory[]
  }

  /**
   * Record a status change in history
   *
   * @param poId Purchase Order UUID
   * @param fromStatus Previous status (null for creation)
   * @param toStatus New status
   * @param userId User who made the change (null for system)
   * @param notes Optional notes
   */
  static async recordStatusHistory(
    poId: string,
    fromStatus: string | null,
    toStatus: string,
    userId: string | null,
    notes?: string
  ): Promise<POStatusHistory | null> {
    const supabaseAdmin = createServerSupabaseAdmin()

    const { data: historyEntry, error } = await supabaseAdmin
      .from('po_status_history')
      .insert({
        po_id: poId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: userId,
        changed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error recording status history:', error)
      return null
    }

    return historyEntry
  }

  // ==========================================================================
  // Business Rules
  // ==========================================================================

  /**
   * Check if a status can be deleted
   *
   * @param statusId Status UUID
   * @param orgId Organization UUID
   */
  static async canDeleteStatus(
    statusId: string,
    orgId: string
  ): Promise<CanDeleteStatusResult> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get status
    const { data: status } = await supabaseAdmin
      .from('po_statuses')
      .select('*')
      .eq('id', statusId)
      .eq('org_id', orgId)
      .single()

    if (!status) {
      return {
        allowed: false,
        reason: 'Status not found',
      }
    }

    // Cannot delete system status
    if (status.is_system) {
      return {
        allowed: false,
        reason: 'Cannot delete system status',
      }
    }

    // Check if in use
    const poCount = await POStatusService.getStatusUsageCount(statusId, orgId)

    if (poCount > 0) {
      return {
        allowed: false,
        reason: `Cannot delete. ${poCount} POs use this status. Change their status first.`,
        poCount,
      }
    }

    return {
      allowed: true,
      poCount: 0,
    }
  }

  /**
   * Get count of POs using a status
   *
   * @param statusId Status UUID
   * @param orgId Organization UUID
   */
  static async getStatusUsageCount(
    statusId: string,
    orgId: string
  ): Promise<number> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Get status code
    const { data: status } = await supabaseAdmin
      .from('po_statuses')
      .select('code')
      .eq('id', statusId)
      .eq('org_id', orgId)
      .single()

    if (!status) {
      return 0
    }

    // Count POs with this status
    const { count } = await supabaseAdmin
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', status.code)

    return count || 0
  }

  /**
   * Create default statuses for a new organization
   *
   * @param orgId Organization UUID
   */
  static async createDefaultStatuses(orgId: string): Promise<void> {
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if already has statuses
    const { data: existing } = await supabaseAdmin
      .from('po_statuses')
      .select('id')
      .eq('org_id', orgId)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('Default statuses already exist for org:', orgId)
      return
    }

    // Insert default statuses
    const statusData = DEFAULT_PO_STATUSES.map((s) => ({
      org_id: orgId,
      code: s.code,
      name: s.name,
      color: s.color,
      display_order: s.display_order,
      is_system: s.is_system,
      is_active: true,
      description: s.description,
    }))

    const { data: createdStatuses, error: statusError } = await supabaseAdmin
      .from('po_statuses')
      .insert(statusData)
      .select()

    if (statusError) {
      console.error('Error creating default statuses:', statusError)
      return
    }

    if (!createdStatuses) {
      return
    }

    // Create status code to ID mapping
    const statusMap: Record<string, string> = {}
    createdStatuses.forEach((s) => {
      statusMap[s.code] = s.id
    })

    // Insert default transitions
    const transitionData = DEFAULT_PO_TRANSITIONS.map((t) => ({
      org_id: orgId,
      from_status_id: statusMap[t.from_code],
      to_status_id: statusMap[t.to_code],
      is_system: t.is_system,
      requires_approval: false,
      requires_reason: false,
    })).filter((t) => t.from_status_id && t.to_status_id)

    if (transitionData.length > 0) {
      const { error: transitionError } = await supabaseAdmin
        .from('po_status_transitions')
        .insert(transitionData)

      if (transitionError) {
        console.error('Error creating default transitions:', transitionError)
      }
    }

    console.log('Default PO statuses created for org:', orgId)
  }
}
