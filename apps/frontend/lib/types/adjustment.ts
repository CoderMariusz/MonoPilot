/**
 * Stock Adjustment Types
 * Wireframe: WH-INV-001 - Adjustments Tab (Screen 6)
 * PRD: FR-024 (Stock Adjustment)
 */

// =============================================================================
// Enums and Constants
// =============================================================================

export type AdjustmentReasonCode =
  | 'damage'
  | 'theft'
  | 'counting_error'
  | 'quality_issue'
  | 'expired'
  | 'other'

export type AdjustmentStatus = 'pending' | 'approved' | 'rejected'

// =============================================================================
// Filter Types
// =============================================================================

export interface AdjustmentFilters {
  status: AdjustmentStatus | 'all'
  reason?: AdjustmentReasonCode
  adjusted_by?: string
  warehouse_id?: string
  date_from?: string
  date_to?: string
}

// =============================================================================
// Summary Types
// =============================================================================

export interface AdjustmentSummary {
  total_adjustments: number
  qty_increased: number
  qty_increased_value: number
  qty_decreased: number
  qty_decreased_value: number
  pending_approval: number
}

// =============================================================================
// Main Entity Types
// =============================================================================

export interface Adjustment {
  id: string
  adjustment_date: string
  lp_id: string
  lp_number: string
  batch_number?: string
  product_id: string
  product_code: string
  product_name: string
  location_id: string
  location_code: string
  warehouse_id: string
  warehouse_name: string
  original_qty: number
  new_qty: number
  variance_qty: number
  uom: string
  variance_value: number
  reason_code: AdjustmentReasonCode
  reason_notes?: string
  adjusted_by_id: string
  adjusted_by_name: string
  status: AdjustmentStatus
  approved_by_id?: string
  approved_by_name?: string
  approved_at?: string
  rejection_reason?: string
  org_id: string
  created_at: string
  updated_at: string
}

// =============================================================================
// Create/Update Types
// =============================================================================

export interface CreateAdjustmentInput {
  lp_id: string
  new_qty: number
  reason_code: AdjustmentReasonCode
  reason_notes?: string
}

export interface ApproveAdjustmentInput {
  notes?: string
}

export interface RejectAdjustmentInput {
  rejection_reason: string
}

// =============================================================================
// API Response Types
// =============================================================================

export interface AdjustmentPagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface AdjustmentsResponse {
  success: boolean
  data: Adjustment[]
  summary: AdjustmentSummary
  pagination: AdjustmentPagination
}

export interface AdjustmentResponse {
  success: boolean
  data: Adjustment
}

// =============================================================================
// Status Badge Config
// =============================================================================

export const ADJUSTMENT_STATUS_CONFIG: Record<
  AdjustmentStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800',
  },
}

export const ADJUSTMENT_REASON_CONFIG: Record<
  AdjustmentReasonCode,
  { label: string; className: string; icon: string }
> = {
  damage: {
    label: 'Damage',
    className: 'bg-red-100 text-red-800',
    icon: 'broken',
  },
  theft: {
    label: 'Theft',
    className: 'bg-red-100 text-red-800',
    icon: 'alert',
  },
  counting_error: {
    label: 'Counting Error',
    className: 'bg-yellow-100 text-yellow-800',
    icon: 'calculator',
  },
  quality_issue: {
    label: 'Quality Issue',
    className: 'bg-orange-100 text-orange-800',
    icon: 'shield',
  },
  expired: {
    label: 'Expired',
    className: 'bg-red-100 text-red-800',
    icon: 'clock',
  },
  other: {
    label: 'Other',
    className: 'bg-gray-100 text-gray-600',
    icon: 'info',
  },
}

// =============================================================================
// Approval Rules
// =============================================================================

/**
 * Determines if an adjustment requires approval based on business rules
 */
export function requiresApproval(
  originalQty: number,
  newQty: number,
  reasonCode: AdjustmentReasonCode
): boolean {
  const variance = newQty - originalQty
  const variancePct = originalQty > 0 ? Math.abs(variance) / originalQty * 100 : 100

  // Always require approval for increases
  if (variance > 0) return true

  // Always require approval for theft/quality
  if (['theft', 'quality_issue'].includes(reasonCode)) return true

  // Require approval for decreases > 10%
  if (variancePct > 10) return true

  return false
}
