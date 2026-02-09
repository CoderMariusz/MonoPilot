/**
 * Transfer Order State Machine
 * Story 03.8 - Refactor
 *
 * Centralizes status transition logic for Transfer Orders.
 * Provides single source of truth for valid status workflows.
 *
 * Benefits:
 * - Easy to visualize and document status workflow
 * - Independently testable transition rules
 * - Reusable across service methods
 * - Supports future workflow extensions
 */

import { TransferOrderStatus } from './constants'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Transfer Order Status Type
 * Maps to database enum: transfer_order_status
 */
export type TOStatus =
  | 'draft'
  | 'planned'
  | 'partially_shipped'
  | 'shipped'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'cancelled'

/**
 * State transition result
 */
export interface TransitionResult {
  valid: boolean
  error?: string
  allowedTransitions?: TOStatus[]
}

// ============================================================================
// STATE MACHINE DEFINITION
// ============================================================================

/**
 * Valid status transitions map
 * Defines the allowed workflow for Transfer Order statuses
 *
 * Workflow:
 * 1. draft -> planned (manual) or cancelled
 * 2. planned -> partially_shipped/shipped (via ship action) or cancelled
 * 3. partially_shipped -> shipped (via ship action) or cancelled
 * 4. shipped -> partially_received/received (via receive action)
 * 5. partially_received -> received (via receive action)
 * 6. received -> closed (manual)
 * 7. cancelled -> (terminal state)
 * 8. closed -> (terminal state)
 */
const VALID_TRANSITIONS: Record<TOStatus, TOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['shipped', 'partially_shipped', 'cancelled'],
  partially_shipped: ['shipped', 'cancelled'],
  shipped: ['received', 'partially_received'],
  partially_received: ['received'],
  received: ['closed'],
  closed: [], // Terminal state
  cancelled: [], // Terminal state
}

/**
 * Statuses that allow editing of TO header fields
 * (from_warehouse, to_warehouse, dates, notes)
 */
const EDITABLE_STATUSES: TOStatus[] = ['draft', 'planned']

/**
 * Statuses that allow deletion of entire TO
 */
const DELETABLE_STATUSES: TOStatus[] = ['draft']

/**
 * Statuses that allow adding/removing lines
 * UPDATED: Include pending_approval and approved statuses
 */
const LINE_EDITABLE_STATUSES: TOStatus[] = ['draft', 'pending_approval', 'approved', 'planned']

/**
 * Statuses that allow shipping operations
 */
const SHIPPABLE_STATUSES: TOStatus[] = [
  'draft',
  'planned',
  'partially_shipped',
  'shipped', // Allow re-shipping for corrections
]

/**
 * Statuses that allow receiving operations
 */
const RECEIVABLE_STATUSES: TOStatus[] = [
  'shipped',
  'partially_shipped',
  'partially_received',
]

// ============================================================================
// TRANSITION VALIDATION
// ============================================================================

/**
 * Check if a status transition is allowed
 *
 * @param fromStatus - Current TO status
 * @param toStatus - Desired TO status
 * @returns True if transition is allowed
 *
 * @example
 * canTransition('draft', 'planned') // true
 * canTransition('draft', 'received') // false
 */
export function canTransition(fromStatus: TOStatus, toStatus: TOStatus): boolean {
  const allowed = VALID_TRANSITIONS[fromStatus] || []
  return allowed.includes(toStatus)
}

/**
 * Validate status transition and return detailed result
 *
 * @param fromStatus - Current TO status
 * @param toStatus - Desired TO status
 * @returns TransitionResult with validation details
 *
 * @example
 * validateTransition('draft', 'received')
 * // { valid: false, error: "Invalid transition...", allowedTransitions: ['planned', 'cancelled'] }
 */
export function validateTransition(
  fromStatus: TOStatus,
  toStatus: TOStatus
): TransitionResult {
  const allowed = VALID_TRANSITIONS[fromStatus] || []

  if (!allowed.includes(toStatus)) {
    return {
      valid: false,
      error: `Invalid status transition: ${fromStatus} -> ${toStatus}. Allowed transitions: ${
        allowed.length > 0 ? allowed.join(', ') : 'none'
      }`,
      allowedTransitions: allowed,
    }
  }

  return { valid: true }
}

/**
 * Get all available transitions from a given status
 *
 * @param status - Current TO status
 * @returns Array of allowed target statuses
 *
 * @example
 * getAvailableTransitions('draft') // ['planned', 'cancelled']
 */
export function getAvailableTransitions(status: TOStatus): TOStatus[] {
  return VALID_TRANSITIONS[status] || []
}

// ============================================================================
// PERMISSION CHECKS
// ============================================================================

/**
 * Check if TO can be edited in current status
 * Editing includes: from_warehouse, to_warehouse, dates, notes
 *
 * @param status - Current TO status
 * @returns True if TO can be edited
 */
export function canEdit(status: TOStatus): boolean {
  return EDITABLE_STATUSES.includes(status)
}

/**
 * Check if TO can be deleted in current status
 *
 * @param status - Current TO status
 * @returns True if TO can be deleted
 */
export function canDelete(status: TOStatus): boolean {
  return DELETABLE_STATUSES.includes(status)
}

/**
 * Check if TO lines can be added/removed in current status
 *
 * @param status - Current TO status
 * @returns True if lines can be modified
 */
export function canEditLines(status: TOStatus): boolean {
  return LINE_EDITABLE_STATUSES.includes(status)
}

/**
 * Check if TO can be shipped in current status
 *
 * @param status - Current TO status
 * @returns True if shipping operation is allowed
 */
export function canShip(status: TOStatus): boolean {
  return SHIPPABLE_STATUSES.includes(status)
}

/**
 * Check if TO can be received in current status
 *
 * @param status - Current TO status
 * @returns True if receiving operation is allowed
 */
export function canReceive(status: TOStatus): boolean {
  return RECEIVABLE_STATUSES.includes(status)
}

/**
 * Check if status is a terminal state (no transitions allowed)
 *
 * @param status - TO status to check
 * @returns True if status is terminal (cancelled or closed)
 */
export function isTerminalStatus(status: TOStatus): boolean {
  return status === 'cancelled' || status === 'closed'
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get human-readable description of a status
 *
 * @param status - TO status
 * @returns Description string
 */
export function getStatusDescription(status: TOStatus): string {
  const descriptions: Record<TOStatus, string> = {
    draft: 'Draft - being prepared',
    pending_approval: 'Pending Approval - awaiting manager approval',
    approved: 'Approved - ready to plan',
    rejected: 'Rejected - approval denied',
    planned: 'Planned - ready to ship',
    partially_shipped: 'Partially Shipped - some items shipped',
    shipped: 'Shipped - all items shipped',
    partially_received: 'Partially Received - some items received',
    received: 'Received - all items received',
    closed: 'Closed - transfer complete',
    cancelled: 'Cancelled - transfer aborted',
  }
  return descriptions[status] || 'Unknown status'
}

/**
 * Get recommended next action for a status
 *
 * @param status - Current TO status
 * @returns Recommended next action string
 */
export function getRecommendedAction(status: TOStatus): string {
  const actions: Record<TOStatus, string> = {
    draft: 'Add lines and request approval',
    pending_approval: 'Waiting for manager approval',
    approved: 'Change status to Planned',
    rejected: 'Review rejection reason and create new TO',
    planned: 'Create shipment to ship items',
    partially_shipped: 'Ship remaining items or receive shipped items',
    shipped: 'Create receipt to receive items',
    partially_received: 'Receive remaining items',
    received: 'Close transfer order',
    closed: 'No action needed - transfer complete',
    cancelled: 'No action available - transfer cancelled',
  }
  return actions[status] || 'Unknown action'
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate status is a valid TOStatus
 * Runtime type guard for status strings
 *
 * @param status - String to validate
 * @returns True if valid TOStatus
 */
export function isValidStatus(status: string): status is TOStatus {
  return (
    status === 'draft' ||
    status === 'pending_approval' ||
    status === 'approved' ||
    status === 'rejected' ||
    status === 'planned' ||
    status === 'partially_shipped' ||
    status === 'shipped' ||
    status === 'partially_received' ||
    status === 'received' ||
    status === 'closed' ||
    status === 'cancelled'
  )
}

/**
 * Assert status is valid, throw error if not
 *
 * @param status - Status string to validate
 * @throws Error if status is invalid
 */
export function assertValidStatus(status: string): asserts status is TOStatus {
  if (!isValidStatus(status)) {
    throw new Error(`Invalid TO status: ${status}`)
  }
}

// ============================================================================
// APPROVAL WORKFLOW HELPERS (Story 03.8 Extended)
// ============================================================================

/**
 * Check if TO requires approval (is in approval workflow)
 *
 * @param status - TO status
 * @returns True if status is approval-related
 */
export function isApprovalStatus(status: TOStatus): boolean {
  return status === 'pending_approval' || status === 'approved' || status === 'rejected'
}

/**
 * Check if TO is awaiting approval
 *
 * @param status - TO status
 * @returns True if status is pending_approval
 */
export function isAwaitingApproval(status: TOStatus): boolean {
  return status === 'pending_approval'
}

/**
 * Check if TO has been rejected
 *
 * @param status - TO status
 * @returns True if status is rejected
 */
export function isRejected(status: TOStatus): boolean {
  return status === 'rejected'
}

/**
 * Check if TO is approved
 *
 * @param status - TO status
 * @returns True if status is approved
 */
export function isApproved(status: TOStatus): boolean {
  return status === 'approved'
}

/**
 * Check if TO requires manager approval before shipping
 * (Applies when TO has crossed approval threshold)
 *
 * @param toValue - Transfer order total value (optional)
 * @param approvalThreshold - Approval threshold in currency (optional, default 10000)
 * @returns True if approval is required
 */
export function requiresApproval(toValue?: number, approvalThreshold: number = 10000): boolean {
  if (!toValue) return true // Default to requiring approval if no value provided
  return toValue >= approvalThreshold
}
