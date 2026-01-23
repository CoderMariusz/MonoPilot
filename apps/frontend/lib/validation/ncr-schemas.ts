/**
 * NCR Validation Schemas (Story 06.9)
 * Purpose: Zod validation schemas for NCR (Non-Conformance Report) operations
 *
 * Provides schemas for:
 * - ncrSeverityEnum: minor, major, critical
 * - ncrStatusEnum: draft, open, closed (Phase 1)
 * - ncrDetectionPointEnum: incoming, in_process, final, customer, etc.
 * - ncrCategoryEnum: product_defect, process_deviation, etc.
 * - ncrSourceTypeEnum: inspection, hold, batch, work_order, etc.
 * - createNCRSchema: Create NCR request validation
 * - updateNCRSchema: Update draft NCR request validation
 * - closeNCRSchema: Close NCR with notes validation
 * - assignNCRSchema: Assign NCR to user validation
 * - ncrListQuerySchema: List NCRs query parameters
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.9.basic-ncr-creation.md}
 */

import { z } from 'zod'

// ============================================================================
// NCR Severity Enum
// ============================================================================

/**
 * Valid NCR severity levels
 * - minor: Process deviation, no product impact
 * - major: Quality impact, customer complaint
 * - critical: Food safety risk, regulatory violation
 */
export const NCR_SEVERITIES = ['minor', 'major', 'critical'] as const

export type NCRSeverity = (typeof NCR_SEVERITIES)[number]

export const ncrSeverityEnum = z.enum(NCR_SEVERITIES, {
  errorMap: () => ({
    message: `Severity must be one of: ${NCR_SEVERITIES.join(', ')}`,
  }),
})

// ============================================================================
// NCR Status Enum (Phase 1)
// ============================================================================

/**
 * Valid NCR statuses (Phase 1 - Basic)
 * - draft: Initial state, can be edited/deleted
 * - open: Submitted, cannot be edited
 * - closed: Resolved with closure notes
 *
 * Phase 2 (Story 06.13) will expand to full workflow states
 */
export const NCR_STATUSES = ['draft', 'open', 'closed'] as const

export type NCRStatus = (typeof NCR_STATUSES)[number]

export const ncrStatusEnum = z.enum(NCR_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${NCR_STATUSES.join(', ')}`,
  }),
})

// ============================================================================
// NCR Detection Point Enum
// ============================================================================

/**
 * Valid detection points (where non-conformance was detected)
 * - incoming: During goods receipt inspection
 * - in_process: During production (WIP)
 * - final: During final inspection
 * - customer: Customer complaint/return
 * - internal_audit: Internal quality audit
 * - supplier_audit: Supplier audit finding
 * - other: Other detection source
 */
export const NCR_DETECTION_POINTS = [
  'incoming',
  'in_process',
  'final',
  'customer',
  'internal_audit',
  'supplier_audit',
  'other',
] as const

export type NCRDetectionPoint = (typeof NCR_DETECTION_POINTS)[number]

export const ncrDetectionPointEnum = z.enum(NCR_DETECTION_POINTS, {
  errorMap: () => ({
    message: `Detection point must be one of: ${NCR_DETECTION_POINTS.join(', ')}`,
  }),
})

// ============================================================================
// NCR Category Enum (Optional)
// ============================================================================

/**
 * Valid NCR categories (optional)
 * - product_defect: Product quality issue
 * - process_deviation: Process not followed
 * - documentation_error: Record/document issue
 * - equipment_failure: Equipment malfunction
 * - supplier_issue: Supplier-related problem
 * - customer_complaint: Customer feedback issue
 * - other: Other category
 */
export const NCR_CATEGORIES = [
  'product_defect',
  'process_deviation',
  'documentation_error',
  'equipment_failure',
  'supplier_issue',
  'customer_complaint',
  'other',
] as const

export type NCRCategory = (typeof NCR_CATEGORIES)[number]

export const ncrCategoryEnum = z.enum(NCR_CATEGORIES, {
  errorMap: () => ({
    message: `Category must be one of: ${NCR_CATEGORIES.join(', ')}`,
  }),
})

// ============================================================================
// NCR Source Type Enum
// ============================================================================

/**
 * Valid source types for NCR reference (optional)
 * - inspection: Quality inspection finding
 * - hold: Quality hold reference
 * - batch: Production batch issue
 * - work_order: Work order issue
 * - supplier: Supplier-related
 * - customer_complaint: Customer complaint
 * - audit: Audit finding
 * - other: Other source
 */
export const NCR_SOURCE_TYPES = [
  'inspection',
  'hold',
  'batch',
  'work_order',
  'supplier',
  'customer_complaint',
  'audit',
  'other',
] as const

export type NCRSourceType = (typeof NCR_SOURCE_TYPES)[number]

export const ncrSourceTypeEnum = z.enum(NCR_SOURCE_TYPES, {
  errorMap: () => ({
    message: `Source type must be one of: ${NCR_SOURCE_TYPES.join(', ')}`,
  }),
})

// ============================================================================
// Create NCR Schema
// ============================================================================

/**
 * Schema for creating an NCR
 *
 * Required fields:
 * - title: 5-200 characters
 * - description: 20-2000 characters
 * - severity: minor, major, critical
 * - detection_point: incoming, in_process, final, customer, etc.
 *
 * Optional fields:
 * - category: Type of non-conformance
 * - source_type: Reference source type
 * - source_id: UUID of source entity
 * - source_description: Human-readable source reference (max 500)
 * - submit_immediately: If true, status='open' instead of 'draft'
 */
export const createNCRSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .transform(val => val.trim())
    .pipe(z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must not exceed 200 characters')),
  description: z
    .string({ required_error: 'Description is required' })
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  severity: ncrSeverityEnum,
  detection_point: ncrDetectionPointEnum,
  category: ncrCategoryEnum.optional(),
  source_type: ncrSourceTypeEnum.optional(),
  source_id: z.string().uuid('Invalid source ID').optional(),
  source_description: z.string().max(500, 'Source description must not exceed 500 characters').optional(),
  submit_immediately: z.boolean().default(false),
})

export type CreateNCRInput = z.infer<typeof createNCRSchema>

// ============================================================================
// Update NCR Schema
// ============================================================================

/**
 * Schema for updating a draft NCR
 *
 * All fields optional (partial update):
 * - title: 5-200 characters
 * - description: 20-2000 characters
 * - severity: minor, major, critical
 * - detection_point: Detection location
 * - category: NCR category
 *
 * Note: ncr_number, detected_date, detected_by are immutable
 */
export const updateNCRSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must not exceed 200 characters').optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must not exceed 2000 characters').optional(),
  severity: ncrSeverityEnum.optional(),
  detection_point: ncrDetectionPointEnum.optional(),
  category: ncrCategoryEnum.optional(),
})

export type UpdateNCRInput = z.infer<typeof updateNCRSchema>

// ============================================================================
// Close NCR Schema
// ============================================================================

/**
 * Schema for closing an NCR
 *
 * Required fields:
 * - closure_notes: 50-2000 characters (required for compliance)
 */
export const closeNCRSchema = z.object({
  closure_notes: z
    .string({ required_error: 'Closure notes are required' })
    .min(50, 'Closure notes must be at least 50 characters')
    .max(2000, 'Closure notes must not exceed 2000 characters'),
})

export type CloseNCRInput = z.infer<typeof closeNCRSchema>

// ============================================================================
// Assign NCR Schema
// ============================================================================

/**
 * Schema for assigning NCR to a user
 *
 * Required fields:
 * - assigned_to: Valid UUID of the assignee
 */
export const assignNCRSchema = z.object({
  assigned_to: z.string().uuid('Invalid user ID'),
})

export type AssignNCRInput = z.infer<typeof assignNCRSchema>

// ============================================================================
// NCR List Query Schema
// ============================================================================

/**
 * Schema for NCR list query parameters
 *
 * All fields optional:
 * - status: Filter by status (draft, open, closed)
 * - severity: Filter by severity (minor, major, critical)
 * - detection_point: Filter by detection point
 * - category: Filter by category
 * - detected_by: Filter by user who detected
 * - assigned_to: Filter by assignee
 * - date_from: Filter by detected_date >= date_from
 * - date_to: Filter by detected_date <= date_to
 * - search: Search in ncr_number, title (min 1 char)
 * - sort_by: Sort field (default: detected_date)
 * - sort_order: Sort direction (default: desc)
 * - page: Page number (default: 1)
 * - limit: Page size (default: 20, max: 100)
 */
export const ncrListQuerySchema = z.object({
  status: ncrStatusEnum.optional(),
  severity: ncrSeverityEnum.optional(),
  detection_point: ncrDetectionPointEnum.optional(),
  category: ncrCategoryEnum.optional(),
  detected_by: z.string().uuid('Invalid user ID for detected_by').optional(),
  assigned_to: z.string().uuid('Invalid user ID for assigned_to').optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().min(1, 'Search must be at least 1 character').optional(),
  sort_by: z.enum(['ncr_number', 'detected_date', 'severity', 'status']).default('detected_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive('Page must be positive').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit must not exceed 100').default(20),
})

export type NCRListQueryInput = z.infer<typeof ncrListQuerySchema>
