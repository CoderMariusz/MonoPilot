/**
 * Over-Receipt Approval Validation Schemas (Story 05.15)
 * Purpose: Zod validation schemas for over-receipt approval workflow
 * Phase: GREEN - Minimal code to pass tests
 *
 * SECURITY (ADR-013 compliance):
 * - Input validation: All inputs validated before database operations
 * - Type safety: TypeScript types inferred from Zod schemas
 */

import { z } from 'zod'

// =============================================================================
// Enums
// =============================================================================

export const approvalStatusEnum = z.enum(['pending', 'approved', 'rejected'])
export type ApprovalStatus = z.infer<typeof approvalStatusEnum>

// =============================================================================
// Validate Over-Receipt Request Schema
// =============================================================================

export const validateOverReceiptRequestSchema = z.object({
  po_line_id: z.string({ required_error: 'PO line ID is required' }).uuid('Invalid PO line ID'),
  receiving_qty: z
    .number({ required_error: 'Receiving quantity is required' })
    .positive('Receiving quantity must be positive')
    .max(999999999, 'Quantity too large'),
})

export type ValidateOverReceiptRequest = z.infer<typeof validateOverReceiptRequestSchema>

// =============================================================================
// Create Approval Request Schema
// =============================================================================

export const createOverReceiptApprovalSchema = z.object({
  po_id: z.string({ required_error: 'PO ID is required' }).uuid('Invalid PO ID'),
  po_line_id: z.string({ required_error: 'PO line ID is required' }).uuid('Invalid PO line ID'),
  requesting_qty: z
    .number({ required_error: 'Requesting quantity is required' })
    .positive('Requesting quantity must be positive')
    .max(999999999, 'Quantity too large'),
  reason: z
    .string({ required_error: 'Reason is required for over-receipt approval' })
    .min(10, 'Reason must be at least 10 characters')
    .max(1000, 'Reason max 1000 characters'),
})

export type CreateOverReceiptApprovalInput = z.infer<typeof createOverReceiptApprovalSchema>

// =============================================================================
// Approve Request Schema
// =============================================================================

export const approveOverReceiptSchema = z.object({
  review_notes: z.string().max(1000, 'Review notes max 1000 characters').optional(),
})

export type ApproveOverReceiptInput = z.infer<typeof approveOverReceiptSchema>

// =============================================================================
// Reject Request Schema
// =============================================================================

export const rejectOverReceiptSchema = z.object({
  review_notes: z
    .string({ required_error: 'Review notes required for rejection' })
    .min(10, 'Review notes required for rejection (min 10 characters)')
    .max(1000, 'Review notes max 1000 characters'),
})

export type RejectOverReceiptInput = z.infer<typeof rejectOverReceiptSchema>

// =============================================================================
// Query Params Schema
// =============================================================================

export const approvalListQuerySchema = z.object({
  status: approvalStatusEnum.optional(),
  po_id: z.string().uuid().optional(),
  requested_by: z.string().uuid().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  sort: z.enum(['requested_at', 'over_receipt_pct']).default('requested_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type ApprovalListQueryParams = z.infer<typeof approvalListQuerySchema>

// =============================================================================
// Response Types
// =============================================================================

export interface OverReceiptValidationResult {
  allowed: boolean
  requires_approval: boolean
  over_receipt_pct: number
  max_allowed_qty?: number
  error?: string
  warning?: string
  approval?: {
    id: string
    status: ApprovalStatus
  }
}

export interface OverReceiptApproval {
  id: string
  org_id: string
  po_id: string
  po_line_id: string
  product_id: string
  ordered_qty: number
  already_received_qty: number
  requesting_qty: number
  total_after_receipt: number
  over_receipt_pct: number
  tolerance_pct: number
  reason: string
  status: ApprovalStatus
  requested_by: string
  requested_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  updated_at: string
  // Joined fields
  product_name?: string
  product_code?: string
  po_number?: string
  requester_name?: string
  reviewer_name?: string
}

export interface PaginatedApprovalResult {
  data: OverReceiptApproval[]
  total: number
  page: number
  limit: number
  totalPages: number
}
