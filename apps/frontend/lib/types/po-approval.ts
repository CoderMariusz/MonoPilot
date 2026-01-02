/**
 * PO Approval Types
 * Story: 03.5b - PO Approval Workflow
 * Type definitions for Purchase Order approval functionality
 */

// ============================================================================
// APPROVAL ENUMS
// ============================================================================

/**
 * Approval action type - represents what action was taken
 */
export type POApprovalAction = 'submitted' | 'approved' | 'rejected';

/**
 * Approval status - represents current state of approval
 */
export type POApprovalStatus = 'pending' | 'approved' | 'rejected' | null;

// ============================================================================
// APPROVAL HISTORY
// ============================================================================

/**
 * Approval history entry - record of an approval action
 */
export interface POApprovalHistoryEntry {
  id: string;
  po_id: string;
  action: POApprovalAction;
  user_id: string;
  user_name: string;
  user_role: string;
  notes: string | null;
  created_at: string;
}

// ============================================================================
// API RESPONSES
// ============================================================================

/**
 * Response when submitting PO for approval
 */
export interface POSubmitResponse {
  status: 'pending_approval' | 'submitted';
  approval_required: boolean;
  notification_sent: boolean;
  notification_count?: number;
}

/**
 * Response when approving a PO
 */
export interface POApproveResponse {
  id: string;
  po_number: string;
  status: 'approved';
  approval_status: 'approved';
  approved_by: {
    id: string;
    name: string;
  };
  approved_at: string;
  approval_notes: string | null;
  notification_sent: boolean;
}

/**
 * Response when rejecting a PO
 */
export interface PORejectResponse {
  id: string;
  po_number: string;
  status: 'rejected';
  approval_status: 'rejected';
  rejected_by: {
    id: string;
    name: string;
  };
  rejected_at: string;
  rejection_reason: string;
  notification_sent: boolean;
}

// ============================================================================
// APPROVAL SETTINGS
// ============================================================================

/**
 * Approval settings from planning_settings
 */
export interface POApprovalSettings {
  require_approval: boolean;
  threshold: number | null;
  exceeds_threshold: boolean;
  manually_submitted: boolean;
}

// ============================================================================
// MUTATION INPUTS
// ============================================================================

/**
 * Input for approving a PO
 */
export interface ApprovePoInput {
  poId: string;
  notes?: string;
}

/**
 * Input for rejecting a PO
 */
export interface RejectPoInput {
  poId: string;
  rejectionReason: string;
}

/**
 * Input for submitting a PO
 */
export interface SubmitPoInput {
  poId: string;
}
