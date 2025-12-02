import { z } from 'zod'

/**
 * Routing Validation Schemas - Story 2.24
 *
 * Restructured routing system validation:
 * - Routings use name (unique per org) instead of code
 * - Operations have labor_cost_per_hour
 */

// ============================================================================
// ROUTING SCHEMAS (AC-2.24.10)
// ============================================================================

/**
 * Create Routing Schema
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
 * Update Routing Schema
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
    .optional()
})

export type RoutingFilters = z.infer<typeof routingFiltersSchema>
