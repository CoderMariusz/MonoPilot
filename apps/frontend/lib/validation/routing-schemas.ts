import { z } from 'zod'

/**
 * Routing Validation Schemas
 * Stories: 2.15, 2.16, 2.17
 *
 * Zod validation schemas for:
 * - Routing CRUD (Story 2.15)
 * - Routing Operations (Story 2.16)
 * - Product-Routing Assignments (Story 2.17)
 */

// ============================================================================
// ROUTING SCHEMAS (Story 2.15)
// ============================================================================

/**
 * Create Routing Schema
 * AC-015.1: Code, name, status, is_reusable validation
 */
export const createRoutingSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50, 'Code must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase()),

  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),

  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),

  status: z.enum(['active', 'inactive']).optional().default('active'),

  is_reusable: z.boolean().optional().default(true),
})

export type CreateRoutingInput = z.input<typeof createRoutingSchema>

/**
 * Update Routing Schema
 * AC-015.5: Edit routing (code cannot be updated)
 */
export const updateRoutingSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),

  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable(),

  status: z.enum(['active', 'inactive']).optional(),

  is_reusable: z.boolean().optional(),
})

export type UpdateRoutingInput = z.infer<typeof updateRoutingSchema>

/**
 * Routing Filters Schema
 * AC-015.3: Search and filter routings
 */
export const routingFiltersSchema = z.object({
  status: z.enum(['active', 'inactive', 'all']).optional(),
  search: z.string().optional(),
  sort_by: z.enum(['code', 'name', 'status', 'created_at']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
})

export type RoutingFilters = z.infer<typeof routingFiltersSchema>

// ============================================================================
// ROUTING OPERATION SCHEMAS (Story 2.16)
// ============================================================================

/**
 * Create Operation Schema
 * AC-016.1: Add operation with all required/optional fields
 */
export const createOperationSchema = z.object({
  sequence: z
    .number()
    .int('Sequence must be an integer')
    .positive('Sequence must be positive'),

  operation_name: z
    .string()
    .min(1, 'Operation name is required')
    .max(100, 'Operation name must be at most 100 characters'),

  machine_id: z.string().uuid('Invalid machine ID').optional().nullable(),

  line_id: z.string().uuid('Invalid line ID').optional().nullable(),

  expected_duration_minutes: z
    .number()
    .int('Duration must be an integer')
    .positive('Duration must be positive'),

  expected_yield_percent: z
    .number()
    .min(0.01, 'Yield must be at least 0.01%')
    .max(100, 'Yield cannot exceed 100%')
    .optional()
    .default(100.00),

  setup_time_minutes: z
    .number()
    .int('Setup time must be an integer')
    .nonnegative('Setup time cannot be negative')
    .optional()
    .default(0),

  labor_cost: z
    .number()
    .nonnegative('Labor cost cannot be negative')
    .optional()
    .nullable(),
})

export type CreateOperationInput = z.input<typeof createOperationSchema>

/**
 * Update Operation Schema
 * AC-016.4: Edit operation
 */
export const updateOperationSchema = z.object({
  sequence: z
    .number()
    .int('Sequence must be an integer')
    .positive('Sequence must be positive')
    .optional(),

  operation_name: z
    .string()
    .min(1, 'Operation name is required')
    .max(100, 'Operation name must be at most 100 characters')
    .optional(),

  machine_id: z.string().uuid('Invalid machine ID').optional().nullable(),

  line_id: z.string().uuid('Invalid line ID').optional().nullable(),

  expected_duration_minutes: z
    .number()
    .int('Duration must be an integer')
    .positive('Duration must be positive')
    .optional(),

  expected_yield_percent: z
    .number()
    .min(0.01, 'Yield must be at least 0.01%')
    .max(100, 'Yield cannot exceed 100%')
    .optional(),

  setup_time_minutes: z
    .number()
    .int('Setup time must be an integer')
    .nonnegative('Setup time cannot be negative')
    .optional(),

  labor_cost: z
    .number()
    .nonnegative('Labor cost cannot be negative')
    .optional()
    .nullable(),
})

export type UpdateOperationInput = z.infer<typeof updateOperationSchema>

/**
 * Reorder Operations Schema
 * AC-016.3: Drag-drop reordering
 */
export const reorderOperationsSchema = z.object({
  operations: z.array(
    z.object({
      id: z.string().uuid('Invalid operation ID'),
      sequence: z.number().int('Sequence must be an integer').positive('Sequence must be positive'),
    })
  ),
})

export type ReorderOperationsInput = z.infer<typeof reorderOperationsSchema>

// ============================================================================
// PRODUCT-ROUTING ASSIGNMENT SCHEMAS (Story 2.17)
// ============================================================================

/**
 * Assign Products to Routing Schema
 * AC-017: Product-routing assignment
 */
export const assignProductsSchema = z.object({
  product_ids: z.array(z.string().uuid('Invalid product ID')),
  default_product_id: z.string().uuid('Invalid product ID').optional(),
})

export type AssignProductsInput = z.infer<typeof assignProductsSchema>

/**
 * Assign Routings to Product Schema
 * AC-017.5: Product edit shows assigned routings
 */
export const assignRoutingsSchema = z.object({
  routing_ids: z.array(z.string().uuid('Invalid routing ID')),
  default_routing_id: z.string().uuid('Invalid routing ID').optional(),
})

export type AssignRoutingsInput = z.infer<typeof assignRoutingsSchema>
