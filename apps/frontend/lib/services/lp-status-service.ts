/**
 * LP Status Service (Story 05.4)
 * Purpose: Business logic for LP status management operations
 *
 * Handles:
 * - Status transition validation (CRITICAL for Epic 04)
 * - QA status updates with side effects
 * - Consumption validation (CRITICAL for Epic 04)
 * - Status audit trail management
 * - Block/unblock operations
 *
 * IMPORTANT: This service manages critical LP status logic needed by
 * Epic 04 Production for material consumption validation.
 */

import { createBrowserClient } from '@/lib/supabase/client'
import type { LPStatus, QAStatus } from '../validation/lp-status-schemas'

// ============================================================================
// Types
// ============================================================================

export type { LPStatus, QAStatus }

/**
 * Result of status transition validation
 */
export interface StatusValidationResult {
  valid: boolean
  error?: string
  currentStatus?: LPStatus
  currentQAStatus?: QAStatus
}

/**
 * LP Status Audit Entry
 */
export interface StatusAuditEntry {
  id: string
  lp_id: string
  field_name: 'status' | 'qa_status'
  old_value: string | null
  new_value: string
  reason: string | null
  changed_by: string
  changed_at: string
}

/**
 * License Plate with Status Fields
 */
interface LicensePlate {
  id: string
  org_id: string
  lp_number: string
  status: LPStatus
  qa_status: QAStatus
  product_id: string
  quantity: number
  uom: string
  location_id: string
  warehouse_id: string
  batch_number?: string | null
  expiry_date?: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// Status Transition Rules
// ============================================================================

/**
 * Valid LP status transitions
 * Maps: from_status → allowed_to_statuses
 *
 * Rules:
 * - available → reserved, consumed, blocked
 * - reserved → available, consumed
 * - blocked → available
 * - consumed → NONE (terminal status)
 */
const VALID_TRANSITIONS: Record<LPStatus, LPStatus[]> = {
  available: ['reserved', 'consumed', 'blocked'],
  reserved: ['available', 'consumed'],
  blocked: ['available'],
  consumed: [], // Terminal status - no transitions allowed
}

// ============================================================================
// LPStatusService Class
// ============================================================================

export class LPStatusService {
  // ==========================================================================
  // Status Transition Validation
  // ==========================================================================

  /**
   * Validate if a status transition is allowed
   *
   * @param currentStatus Current LP status
   * @param newStatus Desired new status
   * @returns Validation result with valid flag and optional error message
   *
   * Business Rules:
   * - consumed is terminal - cannot transition from consumed
   * - Self-transitions are not allowed
   * - Only specific transitions are allowed (see VALID_TRANSITIONS)
   */
  static async validateStatusTransition(
    currentStatus: LPStatus,
    newStatus: LPStatus
  ): Promise<StatusValidationResult> {
    // Check for self-transition
    if (currentStatus === newStatus) {
      return {
        valid: false,
        error: `LP is already ${currentStatus}`,
        currentStatus,
      }
    }

    // Check if consumed (terminal status)
    if (currentStatus === 'consumed') {
      return {
        valid: false,
        error: 'Cannot change status - consumed is a terminal status',
        currentStatus,
      }
    }

    // Check if transition is valid
    const allowedTransitions = VALID_TRANSITIONS[currentStatus]
    if (!allowedTransitions.includes(newStatus)) {
      return {
        valid: false,
        error: `Invalid transition from ${currentStatus} to ${newStatus}`,
        currentStatus,
      }
    }

    return {
      valid: true,
    }
  }

  // ==========================================================================
  // Consumption Validation
  // ==========================================================================

  /**
   * Validate if an LP can be consumed in production
   *
   * @param lpId License plate ID
   * @returns Validation result
   *
   * Business Rules (CRITICAL for Epic 04):
   * - LP status must be 'available' or 'reserved'
   * - QA status must be 'passed'
   * - LP must exist and belong to user's org (RLS enforced)
   */
  static async validateLPForConsumption(lpId: string): Promise<StatusValidationResult> {
    const supabase = createBrowserClient()

    // Get LP with status fields
    const { data: lp, error } = await supabase
      .from('license_plates')
      .select('id, status, qa_status')
      .eq('id', lpId)
      .single()

    if (error || !lp) {
      return {
        valid: false,
        error: 'License plate not found',
      }
    }

    // Check if consumption is allowed
    const allowed = this.isConsumptionAllowed(lp.status as LPStatus, lp.qa_status as QAStatus)

    if (!allowed) {
      // Determine specific error message
      if (lp.qa_status !== 'passed') {
        return {
          valid: false,
          error: `LP is not QA approved - current QA status: ${lp.qa_status}`,
          currentStatus: lp.status as LPStatus,
          currentQAStatus: lp.qa_status as QAStatus,
        }
      }

      if (lp.status === 'consumed' || lp.status === 'blocked') {
        return {
          valid: false,
          error: `LP is not available for consumption - current status: ${lp.status}`,
          currentStatus: lp.status as LPStatus,
          currentQAStatus: lp.qa_status as QAStatus,
        }
      }

      return {
        valid: false,
        error: `LP cannot be consumed - status: ${lp.status}, QA status: ${lp.qa_status}`,
        currentStatus: lp.status as LPStatus,
        currentQAStatus: lp.qa_status as QAStatus,
      }
    }

    return {
      valid: true,
    }
  }

  /**
   * Helper: Check if consumption is allowed based on status + QA status
   *
   * @param status LP status
   * @param qaStatus QA status
   * @returns True if consumption allowed
   *
   * Business Rules:
   * - status must be 'available' or 'reserved'
   * - qa_status must be 'passed'
   */
  static isConsumptionAllowed(status: LPStatus, qaStatus: QAStatus): boolean {
    return (status === 'available' || status === 'reserved') && qaStatus === 'passed'
  }

  // ==========================================================================
  // Update LP Status
  // ==========================================================================

  /**
   * Update LP status with validation and audit trail
   *
   * @param lpId License plate ID
   * @param newStatus New LP status
   * @param reason Optional reason for change
   * @returns Updated license plate
   *
   * Side Effects:
   * - Creates audit trail entry
   * - Validates transition rules
   */
  static async updateLPStatus(
    lpId: string,
    newStatus: LPStatus,
    reason?: string
  ): Promise<LicensePlate> {
    const supabase = createBrowserClient()

    // Get current LP
    const { data: currentLP, error: fetchError } = await supabase
      .from('license_plates')
      .select('*')
      .eq('id', lpId)
      .single()

    if (fetchError || !currentLP) {
      throw new Error('License plate not found')
    }

    // Validate transition
    const validation = await this.validateStatusTransition(
      currentLP.status as LPStatus,
      newStatus
    )

    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid status transition')
    }

    // Update status
    const { data: updatedLP, error: updateError } = await supabase
      .from('license_plates')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lpId)
      .select()
      .single()

    if (updateError || !updatedLP) {
      throw new Error('Failed to update LP status')
    }

    // Create audit trail entry
    await supabase.from('lp_status_audit').insert({
      lp_id: lpId,
      field_name: 'status',
      old_value: currentLP.status,
      new_value: newStatus,
      reason: reason || null,
    })

    return updatedLP as LicensePlate
  }

  // ==========================================================================
  // Update QA Status (with side effects)
  // ==========================================================================

  /**
   * Update QA status with automatic side effects
   *
   * @param lpId License plate ID
   * @param newQAStatus New QA status
   * @param reason Reason for change (required for failed/quarantine)
   * @returns Updated license plate
   *
   * Side Effects (CRITICAL for AC-3, AC-5):
   * - QA fail → auto-block LP (AC-3)
   * - QA pass from quarantine → auto-unblock LP (AC-5)
   * - Creates 2 audit entries when status changes
   */
  static async updateQAStatus(
    lpId: string,
    newQAStatus: QAStatus,
    reason?: string
  ): Promise<LicensePlate> {
    const supabase = createBrowserClient()

    // Get current LP
    const { data: currentLP, error: fetchError } = await supabase
      .from('license_plates')
      .select('*')
      .eq('id', lpId)
      .single()

    if (fetchError || !currentLP) {
      throw new Error('License plate not found')
    }

    // Determine if we need to change LP status as side effect
    let newLPStatus: LPStatus | null = null

    // AC-3: QA fail → auto-block
    if (newQAStatus === 'failed' && currentLP.status !== 'blocked') {
      newLPStatus = 'blocked'
    }

    // AC-5: QA pass from quarantine → auto-unblock
    if (
      newQAStatus === 'passed' &&
      currentLP.qa_status === 'quarantine' &&
      currentLP.status === 'blocked'
    ) {
      newLPStatus = 'available'
    }

    // Update QA status (and potentially LP status)
    const updateData: any = {
      qa_status: newQAStatus,
      updated_at: new Date().toISOString(),
    }

    if (newLPStatus) {
      updateData.status = newLPStatus
    }

    const { data: updatedLP, error: updateError } = await supabase
      .from('license_plates')
      .update(updateData)
      .eq('id', lpId)
      .select()
      .single()

    if (updateError || !updatedLP) {
      throw new Error('Failed to update QA status')
    }

    // Create audit trail entry for QA status change
    await supabase.from('lp_status_audit').insert({
      lp_id: lpId,
      field_name: 'qa_status',
      old_value: currentLP.qa_status,
      new_value: newQAStatus,
      reason: reason || null,
    })

    // Create second audit entry if LP status also changed
    if (newLPStatus) {
      await supabase.from('lp_status_audit').insert({
        lp_id: lpId,
        field_name: 'status',
        old_value: currentLP.status,
        new_value: newLPStatus,
        reason: `Auto-updated due to QA status change to ${newQAStatus}`,
      })
    }

    return updatedLP as LicensePlate
  }

  // ==========================================================================
  // Block/Unblock LP
  // ==========================================================================

  /**
   * Block an LP with mandatory reason
   *
   * @param lpId License plate ID
   * @param reason Block reason (required, min 10 chars)
   * @returns Updated license plate
   */
  static async blockLP(lpId: string, reason: string): Promise<LicensePlate> {
    const supabase = createBrowserClient()

    // Get current LP
    const { data: currentLP, error: fetchError } = await supabase
      .from('license_plates')
      .select('*')
      .eq('id', lpId)
      .single()

    if (fetchError || !currentLP) {
      throw new Error('License plate not found')
    }

    // Check if already blocked
    if (currentLP.status === 'blocked') {
      throw new Error('LP is already blocked')
    }

    // Update to blocked
    const { data: updatedLP, error: updateError } = await supabase
      .from('license_plates')
      .update({
        status: 'blocked',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lpId)
      .select()
      .single()

    if (updateError || !updatedLP) {
      throw new Error('Failed to block LP')
    }

    // Create audit trail
    await supabase.from('lp_status_audit').insert({
      lp_id: lpId,
      field_name: 'status',
      old_value: currentLP.status,
      new_value: 'blocked',
      reason,
    })

    return updatedLP as LicensePlate
  }

  /**
   * Unblock an LP
   *
   * @param lpId License plate ID
   * @param reason Optional unblock reason
   * @returns Updated license plate
   */
  static async unblockLP(lpId: string, reason?: string): Promise<LicensePlate> {
    const supabase = createBrowserClient()

    // Get current LP
    const { data: currentLP, error: fetchError } = await supabase
      .from('license_plates')
      .select('*')
      .eq('id', lpId)
      .single()

    if (fetchError || !currentLP) {
      throw new Error('License plate not found')
    }

    // Check if blocked
    if (currentLP.status !== 'blocked') {
      throw new Error('LP is not blocked')
    }

    // Update to available
    const { data: updatedLP, error: updateError } = await supabase
      .from('license_plates')
      .update({
        status: 'available',
        updated_at: new Date().toISOString(),
      })
      .eq('id', lpId)
      .select()
      .single()

    if (updateError || !updatedLP) {
      throw new Error('Failed to unblock LP')
    }

    // Create audit trail
    await supabase.from('lp_status_audit').insert({
      lp_id: lpId,
      field_name: 'status',
      old_value: 'blocked',
      new_value: 'available',
      reason: reason || null,
    })

    return updatedLP as LicensePlate
  }

  // ==========================================================================
  // Status Audit Trail
  // ==========================================================================

  /**
   * Get status audit trail for an LP
   *
   * @param lpId License plate ID
   * @returns Array of audit entries sorted by changed_at DESC
   *
   * Performance: Must complete in <200ms (AC-17)
   */
  static async getStatusAuditTrail(lpId: string): Promise<StatusAuditEntry[]> {
    const supabase = createBrowserClient()

    const { data: auditEntries, error } = await supabase
      .from('lp_status_audit')
      .select('*')
      .eq('lp_id', lpId)
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching audit trail:', error)
      return []
    }

    return (auditEntries || []) as StatusAuditEntry[]
  }
}
