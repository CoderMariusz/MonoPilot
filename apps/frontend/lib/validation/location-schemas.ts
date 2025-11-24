import { z } from 'zod'

/**
 * Location Management Validation Schemas
 * Story: 1.6 Location Management
 *
 * Zod schemas for location CRUD operations with zone/capacity toggle validation
 */

// ============================================================================
// ENUMS
// ============================================================================

export const LocationTypeEnum = z.enum([
  'receiving',
  'production',
  'storage',
  'shipping',
  'transit',
  'quarantine',
])

export type LocationType = z.infer<typeof LocationTypeEnum>

// ============================================================================
// CREATE LOCATION SCHEMA (AC-005.1, AC-005.2)
// ============================================================================

export const CreateLocationSchema = z
  .object({
    warehouse_id: z.string().uuid('Invalid warehouse ID'),

    code: z
      .string()
      .min(2, 'Code must be at least 2 characters')
      .max(50, 'Code must be less than 50 characters')
      .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
      .trim(),

    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be less than 100 characters')
      .trim(),

    type: LocationTypeEnum,

    // Optional fields with toggle flags (AC-005.2)
    zone: z
      .string()
      .max(100, 'Zone must be less than 100 characters')
      .trim()
      .optional()
      .nullable(),

    zone_enabled: z.boolean().optional().default(false),

    capacity: z
      .number()
      .positive('Capacity must be greater than 0')
      .optional()
      .nullable(),

    capacity_enabled: z.boolean().optional().default(false),

    // Barcode (auto-generated if not provided)
    barcode: z
      .string()
      .max(100, 'Barcode must be less than 100 characters')
      .optional(),

    is_active: z.boolean().optional().default(true),
  })
  .refine(
    (data) => {
      // AC-005.2: If zone_enabled = true, zone must not be null
      if (data.zone_enabled) {
        return data.zone !== null && data.zone !== undefined && data.zone.trim() !== ''
      }
      return true
    },
    {
      message: 'Zone is required when zone_enabled is true',
      path: ['zone'],
    }
  )
  .refine(
    (data) => {
      // AC-005.2: If capacity_enabled = true, capacity must be > 0
      if (data.capacity_enabled) {
        return (
          data.capacity !== null &&
          data.capacity !== undefined &&
          data.capacity > 0
        )
      }
      return true
    },
    {
      message: 'Capacity is required and must be greater than 0 when capacity_enabled is true',
      path: ['capacity'],
    }
  )

export type CreateLocationInput = z.input<typeof CreateLocationSchema>

// ============================================================================
// UPDATE LOCATION SCHEMA (AC-005.1, AC-005.2)
// ============================================================================

export const UpdateLocationSchema = z
  .object({
    code: z
      .string()
      .min(2, 'Code must be at least 2 characters')
      .max(50, 'Code must be less than 50 characters')
      .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens only')
      .trim()
      .optional(),

    name: z
      .string()
      .min(1, 'Name cannot be empty')
      .max(100, 'Name must be less than 100 characters')
      .trim()
      .optional(),

    type: LocationTypeEnum.optional(),

    zone: z
      .string()
      .max(100, 'Zone must be less than 100 characters')
      .trim()
      .optional()
      .nullable(),

    zone_enabled: z.boolean().optional(),

    capacity: z
      .number()
      .positive('Capacity must be greater than 0')
      .optional()
      .nullable(),

    capacity_enabled: z.boolean().optional(),

    barcode: z
      .string()
      .max(100, 'Barcode must be less than 100 characters')
      .optional(),

    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // AC-005.2: If zone_enabled = true, zone must not be null
      if (data.zone_enabled === true) {
        return data.zone !== null && data.zone !== undefined && data.zone.trim() !== ''
      }
      return true
    },
    {
      message: 'Zone is required when zone_enabled is true',
      path: ['zone'],
    }
  )
  .refine(
    (data) => {
      // AC-005.2: If capacity_enabled = true, capacity must be > 0
      if (data.capacity_enabled === true) {
        return (
          data.capacity !== null &&
          data.capacity !== undefined &&
          data.capacity > 0
        )
      }
      return true
    },
    {
      message: 'Capacity is required and must be greater than 0 when capacity_enabled is true',
      path: ['capacity'],
    }
  )

export type UpdateLocationInput = z.infer<typeof UpdateLocationSchema>

// ============================================================================
// LOCATION FILTERS SCHEMA (AC-005.4)
// ============================================================================

export const LocationFiltersSchema = z.object({
  warehouse_id: z.string().uuid().optional(),
  type: LocationTypeEnum.optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(), // Search by code or name
})

export type LocationFilters = z.infer<typeof LocationFiltersSchema>

// ============================================================================
// BULK LOCATION CREATE SCHEMA (AC-005.7)
// ============================================================================

export const BulkLocationCreateSchema = z.object({
  warehouse_id: z.string().uuid('Invalid warehouse ID'),
  locations: z
    .array(
      z.object({
        code: z
          .string()
          .min(2)
          .max(50)
          .regex(/^[A-Z0-9-]+$/),
        name: z.string().min(1).max(100),
        type: LocationTypeEnum,
        zone: z.string().max(100).optional().nullable(),
        zone_enabled: z.boolean().optional().default(false),
        capacity: z.number().positive().optional().nullable(),
        capacity_enabled: z.boolean().optional().default(false),
      })
    )
    .min(1, 'At least one location is required')
    .max(100, 'Cannot create more than 100 locations at once'),
})

export type BulkLocationCreateInput = z.input<typeof BulkLocationCreateSchema>
