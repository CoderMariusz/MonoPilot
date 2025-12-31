/**
 * Work Order Validation Schemas (Story 03.10)
 * Zod schemas for work order CRUD validation
 *
 * Includes:
 * - Status enum validation
 * - Priority enum validation
 * - Source of demand enum validation
 * - Create WO schema with all validations
 * - Update WO schema (partial)
 * - BOM selection schemas
 * - Status transition schemas
 */

import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export const woStatusEnum = z.enum([
  'draft',
  'planned',
  'released',
  'in_progress',
  'on_hold',
  'completed',
  'closed',
  'cancelled',
])

export const woPriorityEnum = z.enum(['low', 'normal', 'high', 'critical'])

export const sourceOfDemandEnum = z.enum([
  'manual',
  'po',
  'customer_order',
  'forecast',
])

// ============================================================================
// TYPES
// ============================================================================

export type WOStatus = z.infer<typeof woStatusEnum>
export type WOPriority = z.infer<typeof woPriorityEnum>
export type SourceOfDemand = z.infer<typeof sourceOfDemandEnum>

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate date is not more than 1 day in past
 */
function isNotTooFarInPast(dateStr: string): boolean {
  const date = new Date(dateStr)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  yesterday.setHours(0, 0, 0, 0)
  return date >= yesterday
}

/**
 * Valid time format HH:mm or HH:mm:ss
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

// ============================================================================
// CREATE WO SCHEMA
// ============================================================================

const createWOBaseSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
  bom_id: z.string().uuid('Invalid BOM ID format').optional().nullable(),
  planned_quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(999999999, 'Quantity exceeds maximum allowed value'),
  uom: z
    .string()
    .min(1, 'UoM cannot be empty')
    .max(20, 'UoM cannot exceed 20 characters')
    .optional(),
  planned_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(isNotTooFarInPast, {
      message: 'Scheduled date cannot be more than 1 day in the past',
    }),
  planned_end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  scheduled_start_time: z
    .string()
    .regex(timeRegex, 'Time must be in HH:mm or HH:mm:ss format')
    .optional()
    .nullable(),
  scheduled_end_time: z
    .string()
    .regex(timeRegex, 'Time must be in HH:mm or HH:mm:ss format')
    .optional()
    .nullable(),
  production_line_id: z.string().uuid().optional().nullable(),
  machine_id: z.string().uuid().optional().nullable(),
  priority: woPriorityEnum.default('normal'),
  source_of_demand: sourceOfDemandEnum.optional().nullable(),
  source_reference: z
    .string()
    .max(50, 'Source reference cannot exceed 50 characters')
    .optional()
    .nullable(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
})

/**
 * Validate end date >= start date when both are provided
 */
function validateDateRange(data: {
  planned_start_date: string
  planned_end_date?: string | null
}): boolean {
  if (!data.planned_end_date) return true
  return data.planned_end_date >= data.planned_start_date
}

export const createWOSchema = createWOBaseSchema.refine(validateDateRange, {
  message: 'End date must be on or after start date',
  path: ['planned_end_date'],
})

// ============================================================================
// UPDATE WO SCHEMA (Partial - all fields optional)
// ============================================================================

const updateWOBaseSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format').optional(),
  bom_id: z.string().uuid('Invalid BOM ID format').optional().nullable(),
  planned_quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .max(999999999, 'Quantity exceeds maximum allowed value')
    .optional(),
  uom: z
    .string()
    .min(1, 'UoM cannot be empty')
    .max(20, 'UoM cannot exceed 20 characters')
    .optional(),
  planned_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  planned_end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  scheduled_start_time: z
    .string()
    .regex(timeRegex, 'Time must be in HH:mm or HH:mm:ss format')
    .optional()
    .nullable(),
  scheduled_end_time: z
    .string()
    .regex(timeRegex, 'Time must be in HH:mm or HH:mm:ss format')
    .optional()
    .nullable(),
  production_line_id: z.string().uuid().optional().nullable(),
  machine_id: z.string().uuid().optional().nullable(),
  priority: woPriorityEnum.optional(),
  source_of_demand: sourceOfDemandEnum.optional().nullable(),
  source_reference: z
    .string()
    .max(50, 'Source reference cannot exceed 50 characters')
    .optional()
    .nullable(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .nullable(),
})

export const updateWOSchema = updateWOBaseSchema

// ============================================================================
// BOM SELECTION SCHEMAS
// ============================================================================

export const bomForDateSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
})

export const availableBomsSchema = z.object({
  product_id: z.string().uuid('Invalid product ID format'),
})

// ============================================================================
// STATUS TRANSITION SCHEMA
// ============================================================================

export const statusTransitionSchema = z.object({
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),
})

export const cancelWOSchema = z.object({
  reason: z
    .string()
    .max(500, 'Reason cannot exceed 500 characters')
    .optional()
    .nullable(),
})

// ============================================================================
// LIST QUERY SCHEMA
// ============================================================================

export const woListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().min(2).optional(),
  product_id: z.string().uuid().optional(),
  status: z.string().optional(), // Can be comma-separated
  line_id: z.string().uuid().optional(),
  machine_id: z.string().uuid().optional(),
  priority: woPriorityEnum.optional(),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sort: z
    .enum([
      'created_at',
      'wo_number',
      'planned_start_date',
      'status',
      'priority',
    ])
    .default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type CreateWOInput = z.infer<typeof createWOSchema>
export type UpdateWOInput = z.infer<typeof updateWOSchema>
export type BomForDateInput = z.infer<typeof bomForDateSchema>
export type AvailableBomsInput = z.infer<typeof availableBomsSchema>
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>
export type CancelWOInput = z.infer<typeof cancelWOSchema>
export type WOListQuery = z.infer<typeof woListQuerySchema>

// ============================================================================
// STATUS TRANSITION VALIDATION
// (DEPRECATED - use work-order-service.ts for consistency)
// These are kept for backward compatibility but should use service layer
// ============================================================================

/**
 * Valid status transitions map
 * @deprecated Import from work-order-service.ts instead
 */
export const VALID_TRANSITIONS: Record<WOStatus, WOStatus[]> = {
  draft: ['planned', 'cancelled'],
  planned: ['released', 'draft', 'cancelled'],
  released: ['in_progress', 'cancelled'],
  in_progress: ['on_hold', 'completed'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['closed'],
  closed: [],
  cancelled: [],
}

/**
 * Fields that become locked after release
 * @deprecated Import from work-order-service.ts instead
 */
export const LOCKED_FIELDS_AFTER_RELEASE = [
  'product_id',
  'bom_id',
  'planned_quantity',
]

/**
 * Validate if a status transition is allowed
 * @deprecated Import from work-order-service.ts instead
 */
export function validateStatusTransition(
  currentStatus: WOStatus,
  newStatus: WOStatus
): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false
}

/**
 * Check if a field can be edited in the current status
 * @deprecated Import from work-order-service.ts instead
 */
export function canEditField(status: WOStatus, field: string): boolean {
  // After release, certain fields are locked
  if (
    ['released', 'in_progress', 'on_hold', 'completed', 'closed'].includes(
      status
    )
  ) {
    return !LOCKED_FIELDS_AFTER_RELEASE.includes(field)
  }
  // Cancelled WOs cannot be edited
  if (status === 'cancelled') {
    return false
  }
  return true
}
