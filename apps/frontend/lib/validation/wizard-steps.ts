/**
 * Wizard Steps Validation Schemas
 * Story: 01.14 - Wizard Steps Complete
 * Purpose: Zod schemas for wizard steps 2-6 validation
 *
 * Schemas:
 * - wizardStep2Schema: Warehouse creation
 * - wizardStep3Schema: Location creation
 * - wizardStep4Schema: Product creation
 * - wizardStep5Schema: Work order creation
 */

import { z } from 'zod'

/**
 * Step 2: Warehouse Creation
 * AC-W2-01 to AC-W2-05
 */
export const wizardStep2Schema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens')
    .default('WH-MAIN'),
  name: z
    .string()
    .min(2, 'Warehouse name is required')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  type: z
    .enum(['GENERAL', 'RAW_MATERIALS', 'WIP', 'FINISHED_GOODS', 'QUARANTINE'])
    .default('GENERAL'),
  skip: z.boolean().optional(),
})

export type WizardStep2Input = z.infer<typeof wizardStep2Schema>

/**
 * Step 3: Location Creation
 * AC-W3-01 to AC-W3-05
 */
export const wizardStep3Schema = z
  .object({
    template: z.enum(['simple', 'basic', 'full', 'custom']).optional(),
    custom_locations: z
      .array(
        z.object({
          code: z
            .string()
            .min(1)
            .max(50)
            .regex(/^[A-Z0-9-]+$/),
          name: z.string().min(2).max(255),
          location_type: z.enum(['bulk', 'pallet', 'shelf', 'floor', 'staging']),
        })
      )
      .optional(),
    skip: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // If custom template selected, require custom_locations
      if (
        data.template === 'custom' &&
        (!data.custom_locations || data.custom_locations.length === 0)
      ) {
        return false
      }
      return true
    },
    {
      message: 'Custom template requires at least one location',
      path: ['custom_locations'],
    }
  )

export type WizardStep3Input = z.infer<typeof wizardStep3Schema>

/**
 * Step 4: Product Creation
 * AC-W4-01 to AC-W4-06
 */
export const wizardStep4Schema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with hyphens')
    .transform((val) => val.toUpperCase())
    .optional(),
  name: z
    .string()
    .min(2, 'Product name is required')
    .max(255, 'Name must be at most 255 characters')
    .optional(),
  product_type: z.enum(['finished_good', 'raw_material', 'wip']).default('finished_good'),
  uom: z.string().min(1).max(10).default('EA'),
  shelf_life_days: z.number().int().positive().nullable().optional(),
  storage_temp: z.enum(['ambient', 'chilled', 'frozen']).default('ambient'),
  skip: z.boolean().optional(),
})

export type WizardStep4Input = z.infer<typeof wizardStep4Schema>

/**
 * Step 5: Work Order Creation
 * AC-W5-01 to AC-W5-03
 */
export const wizardStep5Schema = z.object({
  product_id: z.string().uuid().optional(),
  quantity: z.number().int().positive().default(100),
  due_date: z.string().datetime().optional(),
  skip: z.boolean().optional(),
})

export type WizardStep5Input = z.infer<typeof wizardStep5Schema>
