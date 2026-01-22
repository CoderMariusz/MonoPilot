/**
 * Quality Status Service (Story 06.1)
 * Purpose: Business logic for quality status management operations
 *
 * Handles:
 * - Get all quality status types (7 statuses)
 * - Get valid transitions from current status
 * - Validate status transitions with business rules
 * - Change status and record in history
 * - Get status history for entity
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { createClient } from '@/lib/supabase/client'
import type { QualityStatus, EntityType } from '../validation/quality-status-schemas'

// ============================================================================
// Types
// ============================================================================

export type { QualityStatus, EntityType }

/**
 * Quality Status Type configuration
 */
export interface QualityStatusType {
  code: QualityStatus
  name: string
  description: string
  color: string
  icon: string
  allows_shipment: boolean
  allows_consumption: boolean
}

/**
 * Status Transition from database
 */
export interface StatusTransition {
  id?: string
  from_status?: string
  to_status: string
  requires_inspection: boolean
  requires_approval: boolean
  requires_reason: boolean
  is_allowed?: boolean
  description: string
}

/**
 * Validate Transition Request
 */
export interface ValidateTransitionRequest {
  entity_type: EntityType
  entity_id: string
  from_status: string
  to_status: string
  reason?: string
}

/**
 * Validate Transition Response
 */
export interface ValidateTransitionResponse {
  is_valid: boolean
  errors?: string[]
  warnings?: string[]
  required_actions?: {
    inspection_required?: boolean
    approval_required?: boolean
    reason_required?: boolean
  }
}

/**
 * Change Status Request
 */
export interface ChangeStatusRequest {
  entity_type: EntityType
  entity_id: string
  to_status: string
  reason: string
  inspection_id?: string
}

/**
 * Change Status Response
 */
export interface ChangeStatusResponse {
  success: boolean
  new_status: string
  history_id: string
  warnings?: string[]
}

/**
 * Status History Entry
 */
export interface StatusHistoryEntry {
  id: string
  from_status: string | null
  to_status: string
  reason: string | null
  changed_by: string
  changed_by_name: string
  changed_at: string
}

// ============================================================================
// Constants
// ============================================================================

/** Roles that can approve quality status transitions */
const APPROVAL_ROLES = ['QA_MANAGER', 'QUALITY_DIRECTOR', 'ADMIN'] as const

// ============================================================================
// Status Type Configuration
// ============================================================================

const QUALITY_STATUS_CONFIG: Record<string, QualityStatusType> = {
  PENDING: {
    code: 'PENDING',
    name: 'Pending',
    description: 'Awaiting inspection',
    color: 'gray',
    icon: 'Clock',
    allows_shipment: false,
    allows_consumption: false,
  },
  PASSED: {
    code: 'PASSED',
    name: 'Passed',
    description: 'Meets specifications',
    color: 'green',
    icon: 'CheckCircle',
    allows_shipment: true,
    allows_consumption: true,
  },
  FAILED: {
    code: 'FAILED',
    name: 'Failed',
    description: 'Does not meet specs',
    color: 'red',
    icon: 'XCircle',
    allows_shipment: false,
    allows_consumption: false,
  },
  HOLD: {
    code: 'HOLD',
    name: 'Hold',
    description: 'Investigation required',
    color: 'orange',
    icon: 'Pause',
    allows_shipment: false,
    allows_consumption: false,
  },
  RELEASED: {
    code: 'RELEASED',
    name: 'Released',
    description: 'Approved for use after hold',
    color: 'blue',
    icon: 'Unlock',
    allows_shipment: true,
    allows_consumption: true,
  },
  QUARANTINED: {
    code: 'QUARANTINED',
    name: 'Quarantined',
    description: 'Isolated pending review',
    color: 'darkRed',
    icon: 'AlertTriangle',
    allows_shipment: false,
    allows_consumption: false,
  },
  COND_APPROVED: {
    code: 'COND_APPROVED',
    name: 'Conditionally Approved',
    description: 'Limited use allowed',
    color: 'yellow',
    icon: 'AlertCircle',
    allows_shipment: false,
    allows_consumption: true,
  },
}

// ============================================================================
// QualityStatusService Class
// ============================================================================

export class QualityStatusService {
  // ==========================================================================
  // Get Status Types
  // ==========================================================================

  /**
   * Get all available quality status types
   * Performance: Returns cached config, <200ms
   */
  static async getStatusTypes(): Promise<QualityStatusType[]> {
    // Return in consistent order
    return [
      QUALITY_STATUS_CONFIG.PENDING,
      QUALITY_STATUS_CONFIG.PASSED,
      QUALITY_STATUS_CONFIG.FAILED,
      QUALITY_STATUS_CONFIG.HOLD,
      QUALITY_STATUS_CONFIG.RELEASED,
      QUALITY_STATUS_CONFIG.QUARANTINED,
      QUALITY_STATUS_CONFIG.COND_APPROVED,
    ]
  }

  // ==========================================================================
  // Get Valid Transitions
  // ==========================================================================

  /**
   * Get valid transitions from current status
   *
   * @param currentStatus Current quality status
   * @returns Array of valid transitions with business rules
   */
  static async getValidTransitions(currentStatus: string): Promise<StatusTransition[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('quality_status_transitions')
      .select('*')
      .eq('from_status', currentStatus)
      .eq('is_allowed', true)
      .order('to_status')

    if (error) {
      console.error('Error fetching transitions:', error)
      return []
    }

    return (data || []).map((t) => ({
      id: t.id,
      from_status: t.from_status,
      to_status: t.to_status,
      requires_inspection: t.requires_inspection,
      requires_approval: t.requires_approval,
      requires_reason: t.requires_reason,
      is_allowed: t.is_allowed,
      description: t.description || '',
    }))
  }

  // ==========================================================================
  // Validate Transition
  // ==========================================================================

  /**
   * Validate if status transition is allowed
   *
   * @param request Transition request with entity info and statuses
   * @returns Validation result with errors and required actions
   */
  static async validateTransition(
    request: ValidateTransitionRequest
  ): Promise<ValidateTransitionResponse> {
    const { from_status, to_status, reason } = request

    // Check for self-transition
    if (from_status === to_status) {
      return {
        is_valid: false,
        errors: ['From and to status cannot be the same'],
      }
    }

    const supabase = createClient()

    // Get transition rule
    const { data: transition, error: transitionError } = await supabase
      .from('quality_status_transitions')
      .select('*')
      .eq('from_status', from_status)
      .eq('to_status', to_status)
      .single()

    if (transitionError || !transition?.is_allowed) {
      return {
        is_valid: false,
        errors: [`Invalid status transition: ${from_status} -> ${to_status}`],
      }
    }

    const errors: string[] = []
    const required_actions: ValidateTransitionResponse['required_actions'] = {}

    // Check if reason is provided when required
    if (transition.requires_reason && !reason) {
      errors.push('Reason is required for this status transition')
      required_actions.reason_required = true
    }

    // Check if inspection exists when required
    if (transition.requires_inspection) {
      const hasInspection = await this.checkInspectionExists(request.entity_id)
      if (!hasInspection) {
        errors.push('Inspection required before this status transition')
        required_actions.inspection_required = true
      }
    }

    // Check if approval is required
    if (transition.requires_approval) {
      const hasApproval = await this.checkUserHasApprovalRole()
      if (!hasApproval) {
        errors.push('QA Manager approval required for this transition')
        required_actions.approval_required = true
      }
    }

    return {
      is_valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      required_actions: Object.keys(required_actions).length > 0 ? required_actions : undefined,
    }
  }

  // ==========================================================================
  // Change Status
  // ==========================================================================

  /**
   * Create a history record for status change
   * @private Helper to reduce duplication in changeStatus
   */
  private static async createHistoryRecord(
    userId: string,
    entityType: EntityType,
    entityId: string,
    fromStatus: string | null,
    toStatus: string,
    reason: string
  ): Promise<string> {
    const supabase = createClient()

    // Get org_id for history record
    const { data: user } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userId)
      .single()

    const { data: history, error: historyError } = await supabase
      .from('quality_status_history')
      .insert({
        org_id: user?.org_id,
        entity_type: entityType,
        entity_id: entityId,
        from_status: fromStatus,
        to_status: toStatus,
        reason,
        changed_by: userId,
      })
      .select()
      .single()

    if (historyError) {
      throw new Error('Failed to create history record')
    }

    return history.id
  }

  /**
   * Change status and record in history
   *
   * @param request Change request with entity info and new status
   * @param userId User ID making the change
   * @returns Change result with history ID
   */
  static async changeStatus(
    request: ChangeStatusRequest,
    userId: string
  ): Promise<ChangeStatusResponse> {
    const { entity_type, entity_id, to_status, reason } = request

    // Get current status
    const currentStatus = await this.getCurrentStatus(entity_type, entity_id)

    // Special handling for initial status
    if (currentStatus === null && to_status === 'PENDING') {
      // Update entity status
      if (entity_type === 'lp') {
        await this.updateLPStatus(entity_id, to_status)
      }

      const historyId = await this.createHistoryRecord(
        userId,
        entity_type,
        entity_id,
        null,
        to_status,
        reason
      )

      return {
        success: true,
        new_status: to_status,
        history_id: historyId,
      }
    }

    // Validate transition
    const validation = await this.validateTransition({
      entity_type,
      entity_id,
      from_status: currentStatus || 'PENDING',
      to_status,
      reason,
    })

    if (!validation.is_valid) {
      throw new Error(validation.errors?.join(', ') || 'Invalid transition')
    }

    // Update entity status based on type
    if (entity_type === 'lp') {
      await this.updateLPStatus(entity_id, to_status)
    }
    // Add batch, inspection cases when implemented

    const historyId = await this.createHistoryRecord(
      userId,
      entity_type,
      entity_id,
      currentStatus,
      to_status,
      reason
    )

    return {
      success: true,
      new_status: to_status,
      history_id: historyId,
      warnings: validation.warnings,
    }
  }

  // ==========================================================================
  // Get Status History
  // ==========================================================================

  /**
   * Get status change history for entity
   *
   * @param entityType Entity type (lp, batch, inspection)
   * @param entityId Entity UUID
   * @returns Array of history entries sorted by changed_at DESC
   */
  static async getStatusHistory(
    entityType: string,
    entityId: string
  ): Promise<StatusHistoryEntry[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('quality_status_history')
      .select(
        `
        *,
        users:changed_by (
          id,
          full_name
        )
      `
      )
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching status history:', error)
      return []
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      from_status: entry.from_status,
      to_status: entry.to_status,
      reason: entry.reason,
      changed_by: entry.changed_by,
      changed_by_name: entry.users?.full_name || 'Unknown',
      changed_at: entry.changed_at,
    }))
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get current status for entity
   */
  static async getCurrentStatus(entityType: string, entityId: string): Promise<string | null> {
    const supabase = createClient()

    if (entityType === 'lp') {
      const { data, error } = await supabase
        .from('license_plates')
        .select('qa_status')
        .eq('id', entityId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('License plate not found')
        }
        throw error
      }

      return data?.qa_status || 'PENDING'
    }

    // Add other entity types when implemented
    throw new Error(`Unknown entity type: ${entityType}`)
  }

  /**
   * Update LP status
   */
  private static async updateLPStatus(lpId: string, status: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
      .from('license_plates')
      .update({ qa_status: status, updated_at: new Date().toISOString() })
      .eq('id', lpId)

    if (error) {
      throw new Error('Failed to update LP status')
    }
  }

  /**
   * Check if inspection exists for entity
   * Placeholder - returns true until quality_inspections table exists
   */
  static async checkInspectionExists(_entityId: string): Promise<boolean> {
    // TODO: Implement when quality_inspections table exists (Story 06.2)
    // For now, return true to allow transitions
    return true
  }

  /**
   * Check if current user has approval role (QA Manager, Quality Director, Admin)
   */
  static async checkUserHasApprovalRole(): Promise<boolean> {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const { data: userData } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .single()

    if (!userData?.role_id) return false

    // Get role code
    const { data: role } = await supabase
      .from('roles')
      .select('code')
      .eq('id', userData.role_id)
      .single()

    return APPROVAL_ROLES.includes((role?.code || '').toUpperCase() as typeof APPROVAL_ROLES[number])
  }

  // ==========================================================================
  // Status Permission Helpers
  // ==========================================================================

  /**
   * Check if status allows shipment
   */
  static isStatusAllowedForShipment(status: string): boolean {
    const config = QUALITY_STATUS_CONFIG[status]
    return config?.allows_shipment ?? false
  }

  /**
   * Check if status allows consumption
   */
  static isStatusAllowedForConsumption(status: string): boolean {
    const config = QUALITY_STATUS_CONFIG[status]
    return config?.allows_consumption ?? false
  }
}
