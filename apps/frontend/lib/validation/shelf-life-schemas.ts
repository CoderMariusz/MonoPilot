/**
 * Shelf Life Validation Schemas - Story 02.11
 * Purpose: Zod schemas for shelf life configuration CRUD operations
 *
 * Validation rules:
 * - Override reason required when use_override is true
 * - Temperature min <= max
 * - Humidity min <= max
 * - Critical days <= warning days
 * - Quarantine duration required when quarantine is enabled
 *
 * Coverage Target: 90%+
 */

import { z } from 'zod'

// ============================================================================
// Storage Condition Enum
// ============================================================================

export const storageConditionEnum = z.enum([
  'original_packaging',
  'protect_sunlight',
  'refrigeration_required',
  'freezing_allowed',
  'controlled_atmosphere',
])

export type StorageConditionEnum = z.infer<typeof storageConditionEnum>

// ============================================================================
// Shelf Life Config Schema
// ============================================================================

/**
 * Base shelf life configuration schema without refinements
 */
const shelfLifeConfigBase = z.object({
  use_override: z.boolean().default(false),

  override_days: z
    .number()
    .int('Override days must be a whole number')
    .positive('Override days must be positive')
    .max(3650, 'Override days cannot exceed 10 years (3650 days)')
    .nullable()
    .optional(),

  override_reason: z
    .string()
    .min(10, 'Override reason must be at least 10 characters')
    .max(500, 'Override reason cannot exceed 500 characters')
    .nullable()
    .optional(),

  processing_impact_days: z
    .number()
    .int('Processing impact must be a whole number')
    .min(-30, 'Processing impact cannot be less than -30 days')
    .max(30, 'Processing impact cannot exceed 30 days')
    .default(0),

  safety_buffer_percent: z
    .number()
    .min(0, 'Safety buffer cannot be negative')
    .max(50, 'Safety buffer cannot exceed 50%')
    .default(20),

  storage_temp_min: z
    .number()
    .min(-40, 'Temperature cannot be below -40C')
    .max(100, 'Temperature cannot exceed 100C')
    .nullable()
    .optional(),

  storage_temp_max: z
    .number()
    .min(-40, 'Temperature cannot be below -40C')
    .max(100, 'Temperature cannot exceed 100C')
    .nullable()
    .optional(),

  storage_humidity_min: z
    .number()
    .min(0, 'Humidity cannot be below 0%')
    .max(100, 'Humidity cannot exceed 100%')
    .nullable()
    .optional(),

  storage_humidity_max: z
    .number()
    .min(0, 'Humidity cannot be below 0%')
    .max(100, 'Humidity cannot exceed 100%')
    .nullable()
    .optional(),

  storage_conditions: z.array(storageConditionEnum).default([]),

  storage_instructions: z
    .string()
    .max(500, 'Storage instructions cannot exceed 500 characters')
    .nullable()
    .optional(),

  shelf_life_mode: z.enum(['fixed', 'rolling']).default('fixed'),

  label_format: z
    .enum(['best_before_day', 'best_before_month', 'use_by'])
    .default('best_before_day'),

  picking_strategy: z.enum(['FIFO', 'FEFO']).default('FEFO'),

  min_remaining_for_shipment: z
    .number()
    .int('Minimum remaining days must be a whole number')
    .positive('Minimum remaining days must be positive')
    .max(365, 'Minimum remaining days cannot exceed 365')
    .nullable()
    .optional(),

  enforcement_level: z.enum(['suggest', 'warn', 'block']).default('warn'),

  expiry_warning_days: z
    .number()
    .int('Warning days must be a whole number')
    .positive('Warning days must be positive')
    .max(90, 'Warning days cannot exceed 90')
    .default(7),

  expiry_critical_days: z
    .number()
    .int('Critical days must be a whole number')
    .positive('Critical days must be positive')
    .max(30, 'Critical days cannot exceed 30')
    .default(3),
})

/**
 * Full shelf life configuration schema with cross-field validations
 */
export const shelfLifeConfigSchema = shelfLifeConfigBase
  .refine(
    (data) => {
      // Override reason required when use_override is true and override_days is set
      if (data.use_override && data.override_days != null && !data.override_reason) {
        return false
      }
      return true
    },
    {
      message: 'Override reason is required when using manual override',
      path: ['override_reason'],
    }
  )
  .refine(
    (data) => {
      // Temperature min <= max
      if (
        data.storage_temp_min != null &&
        data.storage_temp_max != null &&
        data.storage_temp_min > data.storage_temp_max
      ) {
        return false
      }
      return true
    },
    {
      message: 'Minimum temperature cannot exceed maximum',
      path: ['storage_temp_min'],
    }
  )
  .refine(
    (data) => {
      // Humidity min <= max
      if (
        data.storage_humidity_min != null &&
        data.storage_humidity_max != null &&
        data.storage_humidity_min > data.storage_humidity_max
      ) {
        return false
      }
      return true
    },
    {
      message: 'Minimum humidity cannot exceed maximum',
      path: ['storage_humidity_min'],
    }
  )
  .refine(
    (data) => {
      // Critical days <= warning days
      if (data.expiry_critical_days > data.expiry_warning_days) {
        return false
      }
      return true
    },
    {
      message: 'Critical threshold must be less than or equal to warning threshold',
      path: ['expiry_critical_days'],
    }
  )

export type ShelfLifeConfigInput = z.infer<typeof shelfLifeConfigSchema>

/**
 * Update shelf life request schema - allows partial updates
 */
export const updateShelfLifeConfigSchema = shelfLifeConfigBase.partial()
  .refine(
    (data) => {
      if (data.use_override && data.override_days != null && !data.override_reason) {
        return false
      }
      return true
    },
    {
      message: 'Override reason is required when using manual override',
      path: ['override_reason'],
    }
  )
  .refine(
    (data) => {
      if (
        data.storage_temp_min != null &&
        data.storage_temp_max != null &&
        data.storage_temp_min > data.storage_temp_max
      ) {
        return false
      }
      return true
    },
    {
      message: 'Minimum temperature cannot exceed maximum',
      path: ['storage_temp_min'],
    }
  )
  .refine(
    (data) => {
      if (
        data.storage_humidity_min != null &&
        data.storage_humidity_max != null &&
        data.storage_humidity_min > data.storage_humidity_max
      ) {
        return false
      }
      return true
    },
    {
      message: 'Minimum humidity cannot exceed maximum',
      path: ['storage_humidity_min'],
    }
  )
  .refine(
    (data) => {
      if (
        data.expiry_critical_days != null &&
        data.expiry_warning_days != null &&
        data.expiry_critical_days > data.expiry_warning_days
      ) {
        return false
      }
      return true
    },
    {
      message: 'Critical threshold must be less than or equal to warning threshold',
      path: ['expiry_critical_days'],
    }
  )

export type UpdateShelfLifeConfigInput = z.infer<typeof updateShelfLifeConfigSchema>

// ============================================================================
// Ingredient Shelf Life Schema
// ============================================================================

/**
 * Shelf life source enum
 */
export const shelfLifeSourceEnum = z.enum([
  'supplier',
  'internal_testing',
  'regulatory',
  'industry_standard',
])

/**
 * Base ingredient shelf life schema without refinements
 */
const ingredientShelfLifeBase = z.object({
  shelf_life_days: z
    .number()
    .int('Shelf life days must be a whole number')
    .positive('Shelf life days must be positive')
    .max(3650, 'Shelf life days cannot exceed 10 years (3650 days)'),

  shelf_life_source: shelfLifeSourceEnum,

  supplier_name: z
    .string()
    .max(100, 'Supplier name cannot exceed 100 characters')
    .nullable()
    .optional(),

  specification_reference: z
    .string()
    .max(100, 'Specification reference cannot exceed 100 characters')
    .nullable()
    .optional(),

  storage_temp_min: z
    .number()
    .min(-40, 'Temperature cannot be below -40C')
    .max(100, 'Temperature cannot exceed 100C'),

  storage_temp_max: z
    .number()
    .min(-40, 'Temperature cannot be below -40C')
    .max(100, 'Temperature cannot exceed 100C'),

  storage_humidity_min: z
    .number()
    .min(0, 'Humidity cannot be below 0%')
    .max(100, 'Humidity cannot exceed 100%')
    .nullable()
    .optional(),

  storage_humidity_max: z
    .number()
    .min(0, 'Humidity cannot be below 0%')
    .max(100, 'Humidity cannot exceed 100%')
    .nullable()
    .optional(),

  storage_conditions: z.array(z.string()).default([]),

  min_acceptable_on_receipt: z
    .number()
    .int('Minimum acceptable days must be a whole number')
    .positive('Minimum acceptable days must be positive')
    .nullable()
    .optional(),

  quarantine_required: z.boolean().default(false),

  quarantine_duration_days: z
    .number()
    .int('Quarantine duration must be a whole number')
    .positive('Quarantine duration must be positive')
    .max(30, 'Quarantine duration cannot exceed 30 days')
    .nullable()
    .optional(),
})

/**
 * Full ingredient shelf life schema with cross-field validations
 */
export const ingredientShelfLifeSchema = ingredientShelfLifeBase
  .refine(
    (data) => {
      // Temperature min <= max
      if (data.storage_temp_min > data.storage_temp_max) {
        return false
      }
      return true
    },
    {
      message: 'Minimum temperature cannot exceed maximum',
      path: ['storage_temp_min'],
    }
  )
  .refine(
    (data) => {
      // Humidity min <= max if both provided
      if (
        data.storage_humidity_min != null &&
        data.storage_humidity_max != null &&
        data.storage_humidity_min > data.storage_humidity_max
      ) {
        return false
      }
      return true
    },
    {
      message: 'Minimum humidity cannot exceed maximum',
      path: ['storage_humidity_min'],
    }
  )
  .refine(
    (data) => {
      // Quarantine duration required when quarantine enabled
      if (data.quarantine_required && !data.quarantine_duration_days) {
        return false
      }
      return true
    },
    {
      message: 'Quarantine duration required when quarantine is enabled',
      path: ['quarantine_duration_days'],
    }
  )

export type IngredientShelfLifeInput = z.infer<typeof ingredientShelfLifeSchema>

/**
 * Update ingredient shelf life request schema - allows partial updates
 */
export const updateIngredientShelfLifeSchema = ingredientShelfLifeBase.partial()
  .refine(
    (data) => {
      if (
        data.storage_temp_min != null &&
        data.storage_temp_max != null &&
        data.storage_temp_min > data.storage_temp_max
      ) {
        return false
      }
      return true
    },
    {
      message: 'Minimum temperature cannot exceed maximum',
      path: ['storage_temp_min'],
    }
  )
  .refine(
    (data) => {
      if (
        data.storage_humidity_min != null &&
        data.storage_humidity_max != null &&
        data.storage_humidity_min > data.storage_humidity_max
      ) {
        return false
      }
      return true
    },
    {
      message: 'Minimum humidity cannot exceed maximum',
      path: ['storage_humidity_min'],
    }
  )
  .refine(
    (data) => {
      if (data.quarantine_required && !data.quarantine_duration_days) {
        return false
      }
      return true
    },
    {
      message: 'Quarantine duration required when quarantine is enabled',
      path: ['quarantine_duration_days'],
    }
  )

export type UpdateIngredientShelfLifeInput = z.infer<typeof updateIngredientShelfLifeSchema>
