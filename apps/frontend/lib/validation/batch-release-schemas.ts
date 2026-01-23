/**
 * Batch Release Validation Schemas (Story 06.11)
 * Purpose: Zod validation schemas for batch release operations
 *
 * Provides schemas for:
 * - releaseDecisionEnum: Release decision types
 * - releaseChecklistSchema: Release checklist validation
 * - batchReleaseRequestSchema: Batch release approval request
 * - batchReleaseListQuerySchema: List query parameters
 * - lpDecisionSchema: LP-specific release decisions
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.11.final-inspection-batch-release.md}
 */

import { z } from 'zod'

// ============================================================================
// Release Decision Enum
// ============================================================================

/**
 * Valid release decision values
 * - approved: Batch is released for shipping
 * - rejected: Batch is rejected, blocked from shipping
 * - conditional: Batch is conditionally released with restrictions
 */
export const RELEASE_DECISIONS = ['approved', 'rejected', 'conditional'] as const

export type ReleaseDecision = (typeof RELEASE_DECISIONS)[number]

export const releaseDecisionEnum = z.enum(RELEASE_DECISIONS, {
  errorMap: () => ({
    message: `Release decision must be one of: ${RELEASE_DECISIONS.join(', ')}`,
  }),
})

// ============================================================================
// Release Checklist Schema
// ============================================================================

/**
 * Schema for release checklist items
 * All items are boolean - at least 4 must be true for approval
 */
export const releaseChecklistSchema = z.object({
  test_results: z.boolean({
    required_error: 'Test results confirmation is required',
  }),
  ccp_records: z.boolean({
    required_error: 'CCP records confirmation is required',
  }),
  checkpoints: z.boolean({
    required_error: 'Checkpoints confirmation is required',
  }),
  label_verify: z.boolean({
    required_error: 'Label verification confirmation is required',
  }),
  spec_review: z.boolean({
    required_error: 'Specification review confirmation is required',
  }),
  ncr_review: z.boolean({
    required_error: 'NCR review confirmation is required',
  }),
})

export type ReleaseChecklist = z.infer<typeof releaseChecklistSchema>

// ============================================================================
// LP Decision Schema
// ============================================================================

/**
 * Schema for individual LP release decisions
 */
export const lpDecisionSchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
  status: z.enum(['released', 'hold', 'rejected'], {
    errorMap: () => ({
      message: 'LP status must be one of: released, hold, rejected',
    }),
  }),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
})

export type LPDecision = z.infer<typeof lpDecisionSchema>

// ============================================================================
// Batch Release Request Schema
// ============================================================================

/**
 * Schema for batch release approval request
 *
 * Validation Rules:
 * - For conditional release: conditional_reason and conditional_restrictions required
 * - For rejection: rejection_reason required
 * - For approval: at least 4 checklist items must be true
 */
export const batchReleaseRequestSchema = z
  .object({
    release_decision: releaseDecisionEnum,

    checklist: releaseChecklistSchema,

    // Conditional fields
    conditional_reason: z.string().max(500, 'Conditional reason must be at most 500 characters').optional(),
    conditional_restrictions: z.string().max(1000, 'Conditional restrictions must be at most 1000 characters').optional(),
    conditional_expires_at: z.string().datetime('Invalid datetime format').optional(),

    // Rejection field
    rejection_reason: z.string().max(1000, 'Rejection reason must be at most 1000 characters').optional(),

    approval_notes: z.string().max(2000, 'Approval notes must be at most 2000 characters').optional(),

    lp_ids: z.array(z.string().uuid('Invalid LP ID')).optional(),
    lp_decisions: z.array(lpDecisionSchema).optional(),
  })
  .refine(
    (data) => {
      if (data.release_decision === 'conditional') {
        return data.conditional_reason && data.conditional_restrictions
      }
      return true
    },
    {
      message: 'Conditional reason and restrictions required for conditional release',
      path: ['conditional_reason'],
    }
  )
  .refine(
    (data) => {
      if (data.release_decision === 'rejected') {
        return data.rejection_reason
      }
      return true
    },
    {
      message: 'Rejection reason required for rejected release',
      path: ['rejection_reason'],
    }
  )
  .refine(
    (data) => {
      // At least 4 of 6 checklist items must be true for approval
      if (data.release_decision === 'approved') {
        const checklistValues = Object.values(data.checklist)
        const trueCount = checklistValues.filter(Boolean).length
        return trueCount >= 4
      }
      return true
    },
    {
      message: 'At least 4 checklist items must be confirmed for approval',
      path: ['checklist'],
    }
  )

export type BatchReleaseRequest = z.infer<typeof batchReleaseRequestSchema>

// ============================================================================
// Batch Release List Query Schema
// ============================================================================

/**
 * Schema for listing batch release records
 */
export const batchReleaseListQuerySchema = z.object({
  release_decision: z.enum(['pending', 'approved', 'rejected', 'conditional']).optional(),
  product_id: z.string().uuid('Invalid product ID').optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type BatchReleaseListQuery = z.infer<typeof batchReleaseListQuerySchema>

// ============================================================================
// Release Check Response Type
// ============================================================================

/**
 * Type for release check response
 */
export interface ReleaseCheckChecklist {
  final_inspection_exists: boolean
  final_inspection_passed: boolean
  all_tests_passed: boolean
  ccp_records_complete: boolean
  ccp_records_within_limits: boolean
  checkpoints_passed: boolean
  no_open_ncrs: boolean
}

export interface FinalInspectionInfo {
  id: string
  inspection_number: string
  status: string
  result: string | null
}

export interface ReleaseCheckResult {
  batch_number: string
  wo_id: string
  product_id: string
  product_name: string
  total_quantity: number
  output_lps: number
  can_release: boolean
  checklist: ReleaseCheckChecklist
  final_inspection: FinalInspectionInfo | null
  blockers: string[]
  warnings: string[]
  suggested_action?: string
}

// ============================================================================
// Evidence Summary Types
// ============================================================================

export interface InProcessInspectionSummary {
  id: string
  inspection_number: string
  result: string
}

export interface CCPMonitoringSummary {
  id: string
  point_name: string
  status: string
}

export interface CheckpointSummary {
  id: string
  checkpoint_name: string
  status: string
}

export interface NCRSummary {
  id: string
  ncr_number: string
  status: string
}

export interface EvidenceSummary {
  inspection_id: string
  wo_id: string
  batch_number: string

  in_process_inspections: {
    total: number
    passed: number
    failed: number
    conditional: number
    in_progress: number
    items: InProcessInspectionSummary[]
  }

  ccp_monitoring: {
    total_records: number
    within_limits: number
    deviations: number
    deviations_resolved: number
    items: CCPMonitoringSummary[]
  }

  operation_checkpoints: {
    total: number
    passed: number
    failed: number
    items: CheckpointSummary[]
  }

  ncrs: {
    open: number
    closed: number
    items: NCRSummary[]
  }

  overall_status: 'ready' | 'review_required' | 'blocked'
  blockers: string[]
  warnings: string[]
}

// ============================================================================
// Batch Release Record Type
// ============================================================================

export interface BatchReleaseRecord {
  id: string
  org_id: string
  release_number: string
  batch_number: string
  wo_id: string | null
  product_id: string
  final_inspection_id: string | null
  checklist_test_results: boolean
  checklist_ccp_records: boolean
  checklist_checkpoints: boolean
  checklist_label_verify: boolean
  checklist_spec_review: boolean
  checklist_ncr_review: boolean
  release_decision: string
  release_reason: string | null
  conditional_reason: string | null
  conditional_restrictions: string | null
  conditional_expires_at: string | null
  total_quantity: number | null
  released_quantity: number | null
  rejected_quantity: number | null
  submitted_by: string | null
  submitted_at: string | null
  approved_by: string | null
  approved_at: string | null
  approval_notes: string | null
  created_at: string
  created_by: string | null
  updated_at: string
  updated_by: string | null
}

// ============================================================================
// Batch Release Response Types
// ============================================================================

export interface BatchReleaseResponse {
  release: Partial<BatchReleaseRecord>
  lps_updated: number
  lps_released: number
  lps_rejected: number
  message: string
}

export interface BatchReleaseListResponse {
  data: Partial<BatchReleaseRecord>[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
