/**
 * PO Status Validation Schemas
 * Story: 03.7 - PO Status Lifecycle (Configurable Statuses)
 *
 * Provides Zod validation schemas for:
 * - createPOStatusSchema: Create new PO status
 * - updatePOStatusSchema: Update existing PO status
 * - updateStatusTransitionsSchema: Configure transition rules
 * - transitionStatusSchema: Change PO status
 * - reorderStatusesSchema: Reorder statuses
 * - statusColorEnum: Valid color values
 */

import { z } from 'zod'

// ============================================================================
// Status Color Enum
// ============================================================================

/**
 * Valid status colors (11 colors)
 * Used for status badges and timeline display
 */
export const STATUS_COLORS = [
  'gray',
  'blue',
  'yellow',
  'green',
  'purple',
  'emerald',
  'red',
  'orange',
  'amber',
  'teal',
  'indigo',
] as const

export type StatusColor = (typeof STATUS_COLORS)[number]

export const statusColorEnum = z.enum(STATUS_COLORS, {
  errorMap: () => ({
    message: `Color must be one of: ${STATUS_COLORS.join(', ')}`,
  }),
})

// ============================================================================
// Create PO Status Schema
// ============================================================================

/**
 * Schema for creating a new PO status
 *
 * Fields:
 * - code: 2-50 chars, lowercase + underscores only, unique per org
 * - name: 2-100 chars, required
 * - color: One of 11 colors, defaults to 'gray'
 * - display_order: Positive integer, optional
 * - description: Max 500 chars, optional, nullable
 */
export const createPOStatusSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code cannot exceed 50 characters')
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Code must be lowercase letters, numbers, and underscores only (must start with letter)'
    ),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  color: statusColorEnum.default('gray'),
  display_order: z
    .number()
    .int('Display order must be an integer')
    .positive('Display order must be a positive integer')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
})

export type CreatePOStatusInput = z.infer<typeof createPOStatusSchema>

// ============================================================================
// Update PO Status Schema
// ============================================================================

/**
 * Schema for updating an existing PO status
 * All fields are optional for partial updates
 */
export const updatePOStatusSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  color: statusColorEnum.optional(),
  display_order: z
    .number()
    .int('Display order must be an integer')
    .positive('Display order must be a positive integer')
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .nullable(),
  is_active: z.boolean().optional(),
})

export type UpdatePOStatusInput = z.infer<typeof updatePOStatusSchema>

// ============================================================================
// Update Status Transitions Schema
// ============================================================================

/**
 * Schema for configuring status transition rules
 *
 * Fields:
 * - allowed_to_status_ids: Array of 0-20 valid UUIDs
 */
export const updateStatusTransitionsSchema = z.object({
  allowed_to_status_ids: z
    .array(z.string().uuid('Each status ID must be a valid UUID'))
    .max(20, 'Cannot have more than 20 transitions'),
})

export type UpdateStatusTransitionsInput = z.infer<typeof updateStatusTransitionsSchema>

// ============================================================================
// Transition Status Schema
// ============================================================================

/**
 * Schema for changing a PO's status
 *
 * Fields:
 * - to_status: 2-50 chars, status code to transition to
 * - notes: Max 500 chars, optional, nullable
 */
export const transitionStatusSchema = z.object({
  to_status: z
    .string()
    .min(2, 'Status code must be at least 2 characters')
    .max(50, 'Status code cannot exceed 50 characters'),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),
})

export type TransitionStatusInput = z.infer<typeof transitionStatusSchema>

// ============================================================================
// Reorder Statuses Schema
// ============================================================================

/**
 * Schema for reordering statuses
 *
 * Fields:
 * - status_ids: Array of 1+ valid UUIDs in new order
 */
export const reorderStatusesSchema = z.object({
  status_ids: z
    .array(z.string().uuid('Each status ID must be a valid UUID'))
    .min(1, 'At least one status ID is required'),
})

export type ReorderStatusesInput = z.infer<typeof reorderStatusesSchema>

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * PO Status entity type
 */
export interface POStatus {
  id: string
  org_id: string
  code: string
  name: string
  color: StatusColor
  display_order: number
  is_system: boolean
  is_active: boolean
  description: string | null
  created_at: string
  updated_at: string
}

/**
 * PO Status Transition entity type
 */
export interface POStatusTransition {
  id: string
  org_id: string
  from_status_id: string
  to_status_id: string
  is_system: boolean
  requires_approval: boolean
  requires_reason: boolean
  condition_function: string | null
  created_at: string
  // Populated fields from joins
  to_status?: POStatus
}

/**
 * PO Status History entity type
 */
export interface POStatusHistory {
  id: string
  po_id: string
  from_status: string | null
  to_status: string
  changed_by: string | null
  changed_at: string
  notes: string | null
  transition_metadata?: Record<string, unknown> | null
  // Populated fields from joins
  user?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    avatar_url: string | null
  }
  from_status_details?: POStatus | null
  to_status_details?: POStatus
}

/**
 * Validation result for status transitions
 */
export interface TransitionValidationResult {
  valid: boolean
  reason?: string
  warnings?: string[]
}

/**
 * Result for checking if a status can be deleted
 */
export interface CanDeleteStatusResult {
  allowed: boolean
  reason?: string
  poCount?: number
}

// ============================================================================
// Default Statuses Configuration
// ============================================================================

/**
 * Default PO statuses to create for new organizations
 */
export const DEFAULT_PO_STATUSES: Array<{
  code: string
  name: string
  color: StatusColor
  display_order: number
  is_system: boolean
  description: string
}> = [
  {
    code: 'draft',
    name: 'Draft',
    color: 'gray',
    display_order: 1,
    is_system: true,
    description: 'PO is being prepared, not yet submitted',
  },
  {
    code: 'submitted',
    name: 'Submitted',
    color: 'blue',
    display_order: 2,
    is_system: true,
    description: 'PO has been submitted for processing',
  },
  {
    code: 'pending_approval',
    name: 'Pending Approval',
    color: 'yellow',
    display_order: 3,
    is_system: false,
    description: 'PO is awaiting approval',
  },
  {
    code: 'confirmed',
    name: 'Confirmed',
    color: 'green',
    display_order: 4,
    is_system: true,
    description: 'PO has been confirmed by supplier',
  },
  {
    code: 'receiving',
    name: 'Receiving',
    color: 'purple',
    display_order: 5,
    is_system: true,
    description: 'Goods are being received',
  },
  {
    code: 'closed',
    name: 'Closed',
    color: 'emerald',
    display_order: 6,
    is_system: true,
    description: 'PO is complete',
  },
  {
    code: 'cancelled',
    name: 'Cancelled',
    color: 'red',
    display_order: 7,
    is_system: true,
    description: 'PO has been cancelled',
  },
]

/**
 * Default transitions between statuses
 */
export const DEFAULT_PO_TRANSITIONS: Array<{
  from_code: string
  to_code: string
  is_system: boolean
}> = [
  // From draft
  { from_code: 'draft', to_code: 'submitted', is_system: false },
  { from_code: 'draft', to_code: 'cancelled', is_system: false },
  // From submitted
  { from_code: 'submitted', to_code: 'pending_approval', is_system: false },
  { from_code: 'submitted', to_code: 'confirmed', is_system: false },
  { from_code: 'submitted', to_code: 'cancelled', is_system: false },
  // From pending_approval
  { from_code: 'pending_approval', to_code: 'confirmed', is_system: false },
  { from_code: 'pending_approval', to_code: 'cancelled', is_system: false },
  // From confirmed (system transitions)
  { from_code: 'confirmed', to_code: 'receiving', is_system: true },
  { from_code: 'confirmed', to_code: 'cancelled', is_system: false },
  // From receiving (system transitions)
  { from_code: 'receiving', to_code: 'closed', is_system: true },
  { from_code: 'receiving', to_code: 'cancelled', is_system: false },
]
