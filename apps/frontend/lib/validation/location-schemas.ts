import { z } from 'zod'

/**
 * Location Management Validation Schemas
 * Story: 01.9 - Warehouse Locations Management
 * Purpose: Hierarchical location validation with level and type enums
 */

// ============================================================================
// ENUMS
// ============================================================================

export const LocationLevelEnum = z.enum(['zone', 'aisle', 'rack', 'bin'])
export type LocationLevel = z.infer<typeof LocationLevelEnum>

export const LocationTypeEnum = z.enum([
  'bulk',
  'pallet',
  'shelf',
  'floor',
  'staging',
])
export type LocationType = z.infer<typeof LocationTypeEnum>

// ============================================================================
// CREATE LOCATION SCHEMA (Story 01.9)
// ============================================================================

export const createLocationSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code must be less than 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
    .trim(),

  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim(),

  description: z.string().max(1000).optional().nullable(),

  parent_id: z.string().uuid().optional().nullable(),

  level: LocationLevelEnum,

  location_type: LocationTypeEnum.default('shelf'),

  max_pallets: z
    .number()
    .int()
    .positive('Max pallets must be greater than 0')
    .optional()
    .nullable(),

  max_weight_kg: z
    .number()
    .positive('Max weight must be greater than 0')
    .optional()
    .nullable(),

  is_active: z.boolean().optional().default(true),
})

export type CreateLocationInput = z.infer<typeof createLocationSchema>

// ============================================================================
// UPDATE LOCATION SCHEMA (Story 01.9)
// ============================================================================

export const updateLocationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .trim()
    .optional(),

  description: z.string().max(1000).optional().nullable(),

  location_type: LocationTypeEnum.optional(),

  max_pallets: z
    .number()
    .int()
    .positive('Max pallets must be greater than 0')
    .optional()
    .nullable(),

  max_weight_kg: z
    .number()
    .positive('Max weight must be greater than 0')
    .optional()
    .nullable(),

  is_active: z.boolean().optional(),
})

export type UpdateLocationInput = z.infer<typeof updateLocationSchema>

// ============================================================================
// LOCATION LIST PARAMS SCHEMA (Story 01.9)
// ============================================================================

export const locationListParamsSchema = z.object({
  view: z.enum(['tree', 'flat']).optional().default('tree'),
  level: LocationLevelEnum.optional(),
  type: LocationTypeEnum.optional(),
  parent_id: z.string().uuid().optional().nullable(),
  search: z.string().optional(),
  include_capacity: z.boolean().optional().default(false),
})

export type LocationListParams = z.infer<typeof locationListParamsSchema>

// Aliases for API routes (PascalCase)
export const CreateLocationSchema = createLocationSchema
export const UpdateLocationSchema = updateLocationSchema
export const LocationFiltersSchema = locationListParamsSchema
