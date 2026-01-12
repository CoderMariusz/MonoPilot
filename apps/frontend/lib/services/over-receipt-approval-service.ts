/**
 * Over-Receipt Approval Service (Story 05.15)
 * Purpose: Handle over-receipt approval workflow for GRN from PO
 *
 * This service manages the approval workflow when receipts exceed tolerance:
 * 1. Validate if over-receipt requires approval
 * 2. Create approval requests
 * 3. Approve/reject requests (manager only)
 * 4. Check approval status during GRN creation
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase parameterized queries
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering
 * - Role-based access: Manager role required for approve/reject
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  OverReceiptApproval,
  OverReceiptValidationResult,
  PaginatedApprovalResult,
  ApprovalStatus,
  ApprovalListQueryParams,
  CreateOverReceiptApprovalInput,
} from '@/lib/validation/over-receipt-approval'

// =============================================================================
// Types
// =============================================================================

export interface WarehouseSettings {
  allow_over_receipt: boolean
  over_receipt_tolerance_pct: number
}

export interface POLineData {
  id: string
  product_id: string
  product_name: string
  ordered_qty: number
  received_qty: number
  uom: string
}

export interface ReviewApprovalInput {
  approvalId: string
  reviewNotes?: string
}

// Manager roles that can approve/reject
const MANAGER_ROLES = ['SUPER_ADMIN', 'ADMIN', 'WH_MANAGER']

// =============================================================================
// Over-Receipt Calculation
// =============================================================================

/**
 * Calculate over-receipt percentage and determine if approval required
 */
export function calculateOverReceiptStatus(
  orderedQty: number,
  alreadyReceivedQty: number,
  requestingQty: number,
  settings: WarehouseSettings
): {
  isOverReceipt: boolean
  overReceiptPct: number
  exceedsTolerance: boolean
  maxAllowedQty: number
  totalAfterReceipt: number
} {
  const totalAfterReceipt = alreadyReceivedQty + requestingQty
  const overReceiptQty = Math.max(0, totalAfterReceipt - orderedQty)
  const overReceiptPct = orderedQty > 0 ? (overReceiptQty / orderedQty) * 100 : 0
  const isOverReceipt = overReceiptQty > 0

  const maxAllowedQty = settings.allow_over_receipt
    ? orderedQty * (1 + settings.over_receipt_tolerance_pct / 100)
    : orderedQty

  const exceedsTolerance = isOverReceipt && overReceiptPct > settings.over_receipt_tolerance_pct

  return {
    isOverReceipt,
    overReceiptPct: Math.round(overReceiptPct * 100) / 100,
    exceedsTolerance,
    maxAllowedQty,
    totalAfterReceipt,
  }
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate over-receipt for a PO line
 * Returns validation result with approval status if exists
 */
export async function validateOverReceipt(
  poLineId: string,
  receivingQty: number,
  orgId: string,
  supabase: SupabaseClient
): Promise<OverReceiptValidationResult> {
  // Get PO line data
  const { data: poLine, error: lineError } = await supabase
    .from('purchase_order_lines')
    .select(
      `
      id,
      product_id,
      quantity,
      received_qty,
      products:product_id(name)
    `
    )
    .eq('id', poLineId)
    .single()

  if (lineError || !poLine) {
    return {
      allowed: false,
      requires_approval: false,
      over_receipt_pct: 0,
      error: 'PO line not found',
    }
  }

  // Get warehouse settings
  const { data: settings } = await supabase
    .from('warehouse_settings')
    .select('allow_over_receipt, over_receipt_tolerance_pct')
    .eq('org_id', orgId)
    .single()

  const warehouseSettings: WarehouseSettings = settings || {
    allow_over_receipt: false,
    over_receipt_tolerance_pct: 0,
  }

  const orderedQty = poLine.quantity
  const alreadyReceivedQty = poLine.received_qty || 0

  const status = calculateOverReceiptStatus(
    orderedQty,
    alreadyReceivedQty,
    receivingQty,
    warehouseSettings
  )

  // Not over-receipt - always allowed
  if (!status.isOverReceipt) {
    return {
      allowed: true,
      requires_approval: false,
      over_receipt_pct: 0,
    }
  }

  // Over-receipt not allowed at all
  if (!warehouseSettings.allow_over_receipt) {
    return {
      allowed: false,
      requires_approval: false,
      over_receipt_pct: status.overReceiptPct,
      error: `Over-receipt not allowed. Ordered: ${orderedQty}, Total after receipt: ${status.totalAfterReceipt}`,
    }
  }

  // Within tolerance - allowed with warning
  if (!status.exceedsTolerance) {
    return {
      allowed: true,
      requires_approval: false,
      over_receipt_pct: status.overReceiptPct,
      warning: `Over-receipt: ${status.overReceiptPct}% (within tolerance)`,
    }
  }

  // Exceeds tolerance - check for existing approval
  const { data: existingApproval } = await supabase
    .from('over_receipt_approvals')
    .select('id, status')
    .eq('po_line_id', poLineId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .single()

  if (existingApproval) {
    if (existingApproval.status === 'approved') {
      return {
        allowed: true,
        requires_approval: false,
        over_receipt_pct: status.overReceiptPct,
        approval: {
          id: existingApproval.id,
          status: existingApproval.status as ApprovalStatus,
        },
      }
    }

    if (existingApproval.status === 'rejected') {
      return {
        allowed: false,
        requires_approval: true,
        over_receipt_pct: status.overReceiptPct,
        max_allowed_qty: status.maxAllowedQty,
        error:
          'Over-receipt approval was rejected. Reduce quantity or create new approval.',
        approval: {
          id: existingApproval.id,
          status: existingApproval.status as ApprovalStatus,
        },
      }
    }

    // Pending approval exists
    return {
      allowed: false,
      requires_approval: true,
      over_receipt_pct: status.overReceiptPct,
      max_allowed_qty: status.maxAllowedQty,
      error: `Approval pending. Awaiting manager review.`,
      approval: {
        id: existingApproval.id,
        status: existingApproval.status as ApprovalStatus,
      },
    }
  }

  // No approval exists - require one
  return {
    allowed: false,
    requires_approval: true,
    over_receipt_pct: status.overReceiptPct,
    max_allowed_qty: status.maxAllowedQty,
    error: `Over-receipt exceeds tolerance. Max: ${Math.round(status.maxAllowedQty)} (${warehouseSettings.over_receipt_tolerance_pct}%), Attempting: ${status.totalAfterReceipt} (${status.overReceiptPct}%)`,
    approval_required: true,
  } as OverReceiptValidationResult
}

// =============================================================================
// Approval CRUD
// =============================================================================

/**
 * Create approval request for over-tolerance receipt
 */
export async function requestApproval(
  input: CreateOverReceiptApprovalInput,
  orgId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<OverReceiptApproval> {
  // Check for existing pending approval
  const { data: existingPending } = await supabase
    .from('over_receipt_approvals')
    .select('id')
    .eq('po_line_id', input.po_line_id)
    .eq('status', 'pending')
    .single()

  if (existingPending) {
    throw new Error('Pending approval already exists for this PO line')
  }

  // Get PO line data
  const { data: poLine, error: lineError } = await supabase
    .from('purchase_order_lines')
    .select('product_id, quantity, received_qty')
    .eq('id', input.po_line_id)
    .single()

  if (lineError || !poLine) {
    throw new Error('PO line not found')
  }

  // Get warehouse settings for tolerance snapshot
  const { data: settings } = await supabase
    .from('warehouse_settings')
    .select('over_receipt_tolerance_pct')
    .eq('org_id', orgId)
    .single()

  const tolerancePct = settings?.over_receipt_tolerance_pct || 0
  const orderedQty = poLine.quantity
  const alreadyReceivedQty = poLine.received_qty || 0
  const totalAfterReceipt = alreadyReceivedQty + input.requesting_qty
  const overReceiptPct = orderedQty > 0 ? ((totalAfterReceipt - orderedQty) / orderedQty) * 100 : 0

  // Create approval record
  const { data: approval, error } = await supabase
    .from('over_receipt_approvals')
    .insert({
      org_id: orgId,
      po_id: input.po_id,
      po_line_id: input.po_line_id,
      product_id: poLine.product_id,
      ordered_qty: orderedQty,
      already_received_qty: alreadyReceivedQty,
      requesting_qty: input.requesting_qty,
      total_after_receipt: totalAfterReceipt,
      over_receipt_pct: Math.round(overReceiptPct * 100) / 100,
      tolerance_pct: tolerancePct,
      reason: input.reason,
      status: 'pending',
      requested_by: userId,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create approval request: ${error.message}`)
  }

  return approval as OverReceiptApproval
}

/**
 * Approve over-receipt request (manager only)
 */
export async function approveRequest(
  input: ReviewApprovalInput,
  orgId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<OverReceiptApproval> {
  // Verify manager role
  const canApprove = await checkCanApprove(userId, supabase)
  if (!canApprove) {
    throw new Error('Only warehouse managers can approve over-receipts')
  }

  // Get and verify approval
  const { data: approval, error: fetchError } = await supabase
    .from('over_receipt_approvals')
    .select('*')
    .eq('id', input.approvalId)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !approval) {
    throw new Error('Approval request not found')
  }

  if (approval.status !== 'pending') {
    throw new Error('Approval request already reviewed')
  }

  // Update approval
  const { data: updated, error: updateError } = await supabase
    .from('over_receipt_approvals')
    .update({
      status: 'approved',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: input.reviewNotes || null,
    })
    .eq('id', input.approvalId)
    .select()
    .single()

  if (updateError) {
    throw new Error(`Failed to approve request: ${updateError.message}`)
  }

  return updated as OverReceiptApproval
}

/**
 * Reject over-receipt request (manager only)
 */
export async function rejectRequest(
  input: ReviewApprovalInput,
  orgId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<OverReceiptApproval> {
  // Verify manager role
  const canApprove = await checkCanApprove(userId, supabase)
  if (!canApprove) {
    throw new Error('Only warehouse managers can reject over-receipts')
  }

  // Rejection requires review notes
  if (!input.reviewNotes || input.reviewNotes.trim().length < 10) {
    throw new Error('Review notes required for rejection')
  }

  // Get and verify approval
  const { data: approval, error: fetchError } = await supabase
    .from('over_receipt_approvals')
    .select('*')
    .eq('id', input.approvalId)
    .eq('org_id', orgId)
    .single()

  if (fetchError || !approval) {
    throw new Error('Approval request not found')
  }

  if (approval.status !== 'pending') {
    throw new Error('Approval request already reviewed')
  }

  // Update approval
  const { data: updated, error: updateError } = await supabase
    .from('over_receipt_approvals')
    .update({
      status: 'rejected',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: input.reviewNotes,
    })
    .eq('id', input.approvalId)
    .select()
    .single()

  if (updateError) {
    throw new Error(`Failed to reject request: ${updateError.message}`)
  }

  return updated as OverReceiptApproval
}

/**
 * List approvals with filtering and pagination
 */
export async function list(
  params: ApprovalListQueryParams,
  orgId: string,
  supabase: SupabaseClient
): Promise<PaginatedApprovalResult> {
  let query = supabase
    .from('over_receipt_approvals')
    .select(
      `
      *,
      products:product_id(name, code),
      purchase_orders:po_id(po_number),
      requester:requested_by(full_name),
      reviewer:reviewed_by(full_name)
    `,
      { count: 'exact' }
    )
    .eq('org_id', orgId)

  // Apply filters
  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.po_id) {
    query = query.eq('po_id', params.po_id)
  }

  if (params.requested_by) {
    query = query.eq('requested_by', params.requested_by)
  }

  if (params.date_from) {
    query = query.gte('requested_at', params.date_from)
  }

  if (params.date_to) {
    query = query.lte('requested_at', params.date_to + 'T23:59:59.999Z')
  }

  // Apply sorting
  query = query.order(params.sort, { ascending: params.order === 'asc' })

  // Apply pagination
  const offset = (params.page - 1) * params.limit
  query = query.range(offset, offset + params.limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to list approvals: ${error.message}`)
  }

  // Transform data to include joined fields
  const approvals = (data || []).map((row: any) => ({
    ...row,
    product_name: row.products?.name,
    product_code: row.products?.code,
    po_number: row.purchase_orders?.po_number,
    requester_name: row.requester?.full_name,
    reviewer_name: row.reviewer?.full_name,
    products: undefined,
    purchase_orders: undefined,
    requester: undefined,
    reviewer: undefined,
  }))

  return {
    data: approvals as OverReceiptApproval[],
    total: count || 0,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil((count || 0) / params.limit),
  }
}

/**
 * Get approval by ID
 */
export async function getById(
  id: string,
  orgId: string,
  supabase: SupabaseClient
): Promise<OverReceiptApproval | null> {
  const { data, error } = await supabase
    .from('over_receipt_approvals')
    .select(
      `
      *,
      products:product_id(name, code),
      purchase_orders:po_id(po_number),
      requester:requested_by(full_name),
      reviewer:reviewed_by(full_name)
    `
    )
    .eq('id', id)
    .eq('org_id', orgId)
    .single()

  if (error || !data) {
    return null
  }

  return {
    ...data,
    product_name: (data as any).products?.name,
    product_code: (data as any).products?.code,
    po_number: (data as any).purchase_orders?.po_number,
    requester_name: (data as any).requester?.full_name,
    reviewer_name: (data as any).reviewer?.full_name,
  } as OverReceiptApproval
}

/**
 * Get pending approval for a specific PO line
 */
export async function getPendingApprovalForLine(
  poLineId: string,
  orgId: string,
  supabase: SupabaseClient
): Promise<OverReceiptApproval | null> {
  const { data, error } = await supabase
    .from('over_receipt_approvals')
    .select('*')
    .eq('po_line_id', poLineId)
    .eq('status', 'pending')
    .single()

  if (error || !data) {
    return null
  }

  return data as OverReceiptApproval
}

/**
 * Get approved approval for a specific PO line
 */
export async function getApprovedApprovalForLine(
  poLineId: string,
  orgId: string,
  supabase: SupabaseClient
): Promise<OverReceiptApproval | null> {
  const { data, error } = await supabase
    .from('over_receipt_approvals')
    .select('*')
    .eq('po_line_id', poLineId)
    .eq('status', 'approved')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    return null
  }

  return data as OverReceiptApproval
}

/**
 * Check if user can approve (has manager role)
 */
export async function checkCanApprove(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  const { data: user, error } = await supabase
    .from('users')
    .select('roles:role_id(code)')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return false
  }

  const roleCode = (user.roles as any)?.code
  return MANAGER_ROLES.includes(roleCode)
}

// =============================================================================
// Export Service Object
// =============================================================================

export const OverReceiptApprovalService = {
  // Calculation
  calculateOverReceiptStatus,

  // Validation
  validateOverReceipt,

  // CRUD
  requestApproval,
  approveRequest,
  rejectRequest,
  list,
  getById,

  // Helpers
  getPendingApprovalForLine,
  getApprovedApprovalForLine,
  checkCanApprove,
}
