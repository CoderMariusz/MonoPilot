import { z } from 'zod'

/**
 * Routing Validation Schemas - Story 02.7
 *
 * Routing system validation:
 * - Code: unique per org, uppercase alphanumeric + hyphens (FR-2.54)
 * - Name: descriptive name (required)
 * - Cost fields: setup_cost, working_cost_per_unit, overhead_percent, currency (ADR-009)
 * - is_reusable: can be shared across multiple BOMs (FR-2.55)
 */

// ============================================================================
// ROUTING SCHEMAS (Story 02.7)
// ============================================================================

/**
 * Code validation regex
 * - Uppercase letters, numbers, and hyphens only
 * - Examples: RTG-BREAD-01, MIXING-LINE, BAKE-001
 */
const CODE_REGEX = /^[A-Z0-9-]+$/

/**
 * Supported currencies
 */
const CURRENCIES = ['PLN', 'EUR', 'USD', 'GBP'] as const

/**
 * Create Routing Schema (v1 API)
 * AC-05 to AC-10, AC-15 to AC-18, AC-27
 */
export const createRoutingSchemaV1 = z.object({
  // Code: required, uppercase alphanumeric + hyphens, min 2 chars
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(CODE_REGEX, 'Code can only contain uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase()),

  // Name: required, 1-100 chars
  name: z
    .string()
    .min(1, 'Routing name is required')
    .max(100, 'Name must be at most 100 characters'),

  // Description: optional, max 500 chars
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),

  // Status: default true (active)
  is_active: z.boolean().optional().default(true),

  // Reusability: default true (can be shared across BOMs)
  is_reusable: z.boolean().optional().default(true),

  // Cost configuration (ADR-009)
  setup_cost: z
    .number()
    .min(0, 'Setup cost cannot be negative')
    .optional()
    .default(0),

  working_cost_per_unit: z
    .number()
    .min(0, 'Working cost cannot be negative')
    .optional()
    .default(0),

  overhead_percent: z
    .number()
    .min(0, 'Overhead percentage cannot be negative')
    .max(100, 'Overhead percentage cannot exceed 100%')
    .optional()
    .default(0),

  currency: z
    .enum(CURRENCIES)
    .optional()
    .default('PLN'),

  // Clone from existing routing (optional)
  cloneFrom: z
    .string()
    .uuid('Invalid source routing ID')
    .optional(),
})

export type CreateRoutingInputV1 = z.infer<typeof createRoutingSchemaV1>

/**
 * Update Routing Schema (v1 API)
 * AC-11 to AC-13, AC-25
 *
 * IMPORTANT: Code field is NOT allowed on update (FR-2.54)
 * Code is immutable after creation to maintain referential integrity
 */
export const updateRoutingSchemaV1 = z.object({
  // Code is explicitly NOT included - immutable after creation
  // API route also validates this and returns 400 if code is sent

  name: z
    .string()
    .min(1, 'Routing name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .nullable()
    .optional(),

  is_active: z.boolean().optional(),

  is_reusable: z.boolean().optional(),

  // Cost configuration (ADR-009)
  setup_cost: z
    .number()
    .min(0, 'Setup cost cannot be negative')
    .optional(),

  working_cost_per_unit: z
    .number()
    .min(0, 'Working cost cannot be negative')
    .optional(),

  overhead_percent: z
    .number()
    .min(0, 'Overhead percentage cannot be negative')
    .max(100, 'Overhead percentage cannot exceed 100%')
    .optional(),

  currency: z
    .enum(CURRENCIES)
    .optional(),
})

export type UpdateRoutingInputV1 = z.infer<typeof updateRoutingSchemaV1>

/**
 * Clone Routing Schema
 * AC-19 to AC-21
 */
export const cloneRoutingSchema = z.object({
  // New code for cloned routing
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(CODE_REGEX, 'Code can only contain uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase()),

  // New name for cloned routing
  name: z
    .string()
    .min(1, 'Routing name is required')
    .max(100, 'Name must be at most 100 characters'),

  // Optional: override description
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),

  // Copy operations (default true)
  copyOperations: z.boolean().optional().default(true),
})

export type CloneRoutingInput = z.infer<typeof cloneRoutingSchema>

// ============================================================================
// LEGACY SCHEMAS (for backward compatibility with old API)
// ============================================================================

/**
 * Create Routing Schema (legacy - uses name only)
 * AC-2.24.7: name required, 1-100 chars, unique per org
 */
export const createRoutingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),

  is_active: z.boolean().optional().default(true)
})

export type CreateRoutingInput = z.infer<typeof createRoutingSchema>

/**
 * Update Routing Schema (legacy)
 */
export const updateRoutingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .nullable()
    .optional(),

  is_active: z.boolean().optional()
})

export type UpdateRoutingInput = z.infer<typeof updateRoutingSchema>

// ============================================================================
// ROUTING OPERATION SCHEMAS (AC-2.24.10)
// ============================================================================

/**
 * Create Operation Schema
 * AC-2.24.7: sequence positive integer, name required, labor_cost_per_hour 0-9999.99
 */
export const createOperationSchema = z.object({
  sequence: z
    .number()
    .int('Sequence must be an integer')
    .positive('Sequence must be positive'),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),

  machine_id: z
    .string()
    .uuid('Invalid machine ID')
    .optional(),

  estimated_duration_minutes: z
    .number()
    .int('Duration must be an integer')
    .min(0, 'Duration cannot be negative')
    .max(10000, 'Duration cannot exceed 10000 minutes')
    .optional(),

  labor_cost_per_hour: z
    .number()
    .min(0, 'Labor cost cannot be negative')
    .max(9999.99, 'Labor cost cannot exceed 9999.99')
    .optional()
})

export type CreateOperationInput = z.infer<typeof createOperationSchema>

/**
 * Update Operation Schema
 */
export const updateOperationSchema = z.object({
  sequence: z
    .number()
    .int('Sequence must be an integer')
    .positive('Sequence must be positive')
    .optional(),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .nullable()
    .optional(),

  machine_id: z
    .string()
    .uuid('Invalid machine ID')
    .nullable()
    .optional(),

  estimated_duration_minutes: z
    .number()
    .int('Duration must be an integer')
    .min(0, 'Duration cannot be negative')
    .max(10000, 'Duration cannot exceed 10000 minutes')
    .nullable()
    .optional(),

  labor_cost_per_hour: z
    .number()
    .min(0, 'Labor cost cannot be negative')
    .max(9999.99, 'Labor cost cannot exceed 9999.99')
    .nullable()
    .optional()
})

export type UpdateOperationInput = z.infer<typeof updateOperationSchema>

// ============================================================================
// QUERY PARAMS SCHEMAS
// ============================================================================

export const routingFiltersSchema = z.object({
  is_active: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  search: z
    .string()
    .optional(),
  page: z
    .string()
    .transform(val => parseInt(val, 10))
    .optional(),
  limit: z
    .string()
    .transform(val => parseInt(val, 10))
    .optional(),
  sortBy: z
    .enum(['code', 'name', 'created_at', 'updated_at'])
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional(),
})

export type RoutingFilters = z.infer<typeof routingFiltersSchema>
