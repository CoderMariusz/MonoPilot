/**
 * Nutrition Validation Schemas
 * Story: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
 *
 * Zod schemas for nutrition override and response validation.
 */

import { z } from 'zod'

// ============================================
// CONSTANTS
// ============================================

/** Valid serving units */
export const SERVING_UNITS = ['g', 'ml', 'oz', 'cup', 'tbsp', 'piece'] as const

/** Valid override sources */
export const OVERRIDE_SOURCES = ['lab_test', 'supplier_coa', 'database', 'manual'] as const

/** Sources that require a reference */
export const SOURCES_REQUIRING_REFERENCE = ['lab_test', 'supplier_coa'] as const

/** Maximum serving size in grams */
export const MAX_SERVING_SIZE = 10000

/** Minimum serving size in grams */
export const MIN_SERVING_SIZE = 0.1

/** Maximum servings per container */
export const MAX_SERVINGS_PER_CONTAINER = 1000

/** Maximum energy in kcal */
export const MAX_ENERGY_KCAL = 9999

/** Maximum macronutrient value in grams */
export const MAX_MACRO_G = 999.9

/** Maximum salt value in grams */
export const MAX_SALT_G = 99.9

/** Maximum sodium in mg */
export const MAX_SODIUM_MG = 99999

/** Maximum reference length */
export const MAX_REFERENCE_LENGTH = 100

/** Maximum notes length */
export const MAX_NOTES_LENGTH = 500

// ============================================
// NUTRITION OVERRIDE SCHEMA
// ============================================

/**
 * Schema for manual nutrition override input
 *
 * Validates:
 * - Serving information (size, unit, count)
 * - Required macronutrients (energy, protein, fat, carbs, salt)
 * - Optional micronutrients
 * - Source and reference (conditional)
 * - Notes field
 *
 * AC-13.10: Manual override saves successfully
 * AC-13.11: Audit trail with source, reference
 * AC-13.28: Reference required for lab_test/supplier_coa
 */
export const nutritionOverrideSchema = z
  .object({
    // Serving information
    serving_size: z
      .number({ required_error: 'Serving size is required' })
      .min(MIN_SERVING_SIZE, `Serving size must be at least ${MIN_SERVING_SIZE}g`)
      .max(MAX_SERVING_SIZE, `Serving size must be at most ${MAX_SERVING_SIZE}g`),
    serving_unit: z.enum(SERVING_UNITS, {
      errorMap: () => ({ message: `Invalid serving unit. Must be one of: ${SERVING_UNITS.join(', ')}` }),
    }),
    servings_per_container: z
      .number({ required_error: 'Servings per container is required' })
      .int('Servings per container must be a whole number')
      .min(1, 'Servings per container must be at least 1')
      .max(MAX_SERVINGS_PER_CONTAINER, `Servings per container must be at most ${MAX_SERVINGS_PER_CONTAINER}`),

    // Required macronutrients
    energy_kcal: z
      .number({ required_error: 'Energy (kcal) is required' })
      .min(0, 'Energy cannot be negative')
      .max(MAX_ENERGY_KCAL, `Energy must be at most ${MAX_ENERGY_KCAL} kcal`),
    protein_g: z
      .number({ required_error: 'Protein is required' })
      .min(0, 'Protein cannot be negative')
      .max(MAX_MACRO_G, `Protein must be at most ${MAX_MACRO_G}g`),
    fat_g: z
      .number({ required_error: 'Fat is required' })
      .min(0, 'Fat cannot be negative')
      .max(MAX_MACRO_G, `Fat must be at most ${MAX_MACRO_G}g`),
    carbohydrate_g: z
      .number({ required_error: 'Carbohydrate is required' })
      .min(0, 'Carbohydrate cannot be negative')
      .max(MAX_MACRO_G, `Carbohydrate must be at most ${MAX_MACRO_G}g`),
    salt_g: z
      .number({ required_error: 'Salt is required' })
      .min(0, 'Salt cannot be negative')
      .max(MAX_SALT_G, `Salt must be at most ${MAX_SALT_G}g`),

    // Optional macronutrients
    fiber_g: z
      .number()
      .min(0, 'Fiber cannot be negative')
      .max(MAX_MACRO_G, `Fiber must be at most ${MAX_MACRO_G}g`)
      .optional(),
    sugar_g: z
      .number()
      .min(0, 'Sugar cannot be negative')
      .max(MAX_MACRO_G, `Sugar must be at most ${MAX_MACRO_G}g`)
      .optional(),
    added_sugar_g: z
      .number()
      .min(0, 'Added sugar cannot be negative')
      .max(MAX_MACRO_G, `Added sugar must be at most ${MAX_MACRO_G}g`)
      .optional(),
    saturated_fat_g: z
      .number()
      .min(0, 'Saturated fat cannot be negative')
      .max(MAX_MACRO_G, `Saturated fat must be at most ${MAX_MACRO_G}g`)
      .optional(),
    trans_fat_g: z
      .number()
      .min(0, 'Trans fat cannot be negative')
      .max(MAX_MACRO_G, `Trans fat must be at most ${MAX_MACRO_G}g`)
      .optional(),
    sodium_mg: z
      .number()
      .min(0, 'Sodium cannot be negative')
      .max(MAX_SODIUM_MG, `Sodium must be at most ${MAX_SODIUM_MG}mg`)
      .optional(),
    cholesterol_mg: z
      .number()
      .min(0, 'Cholesterol cannot be negative')
      .max(9999, 'Cholesterol must be at most 9999mg')
      .optional(),

    // Optional micronutrients (FDA 2016 required)
    vitamin_d_mcg: z
      .number()
      .min(0, 'Vitamin D cannot be negative')
      .max(9999, 'Vitamin D must be at most 9999mcg')
      .optional(),
    calcium_mg: z
      .number()
      .min(0, 'Calcium cannot be negative')
      .max(MAX_SODIUM_MG, `Calcium must be at most ${MAX_SODIUM_MG}mg`)
      .optional(),
    iron_mg: z
      .number()
      .min(0, 'Iron cannot be negative')
      .max(9999, 'Iron must be at most 9999mg')
      .optional(),
    potassium_mg: z
      .number()
      .min(0, 'Potassium cannot be negative')
      .max(MAX_SODIUM_MG, `Potassium must be at most ${MAX_SODIUM_MG}mg`)
      .optional(),

    // Energy in kJ (optional, can be calculated)
    energy_kj: z
      .number()
      .min(0, 'Energy (kJ) cannot be negative')
      .optional(),

    // Source and reference
    source: z.enum(OVERRIDE_SOURCES, {
      errorMap: () => ({ message: `Invalid source. Must be one of: ${OVERRIDE_SOURCES.join(', ')}` }),
    }),
    reference: z
      .string()
      .max(MAX_REFERENCE_LENGTH, `Reference must be at most ${MAX_REFERENCE_LENGTH} characters`)
      .optional(),
    notes: z
      .string()
      .max(MAX_NOTES_LENGTH, `Notes must be at most ${MAX_NOTES_LENGTH} characters`)
      .optional(),
  })
  .refine(
    (data) => {
      // Reference is required for lab_test and supplier_coa sources
      if (SOURCES_REQUIRING_REFERENCE.includes(data.source as any)) {
        return !!data.reference && data.reference.trim().length > 0
      }
      return true
    },
    {
      message: 'Reference is required for lab test or supplier CoA source',
      path: ['reference'],
    }
  )

// ============================================
// PRODUCT NUTRITION RESPONSE SCHEMA
// ============================================

/**
 * Schema for product nutrition response validation
 */
export const productNutritionResponseSchema = z.object({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  product_id: z.string().uuid(),
  serving_size: z.number().nullable(),
  serving_unit: z.enum(SERVING_UNITS),
  servings_per_container: z.number().nullable(),
  is_manual_override: z.boolean(),
  override_source: z.enum([...OVERRIDE_SOURCES, 'calculated']).nullable().optional(),
  override_reference: z.string().nullable().optional(),
  override_notes: z.string().nullable().optional(),
  override_by: z.string().nullable().optional(),
  override_at: z.string().nullable().optional(),
  calculated_at: z.string().nullable().optional(),
  bom_version_used: z.number().nullable().optional(),
  bom_id_used: z.string().nullable().optional(),
  energy_kcal: z.number(),
  energy_kj: z.number().optional(),
  protein_g: z.number(),
  fat_g: z.number(),
  saturated_fat_g: z.number().optional(),
  trans_fat_g: z.number().optional(),
  carbohydrate_g: z.number(),
  sugar_g: z.number().optional(),
  added_sugar_g: z.number().optional(),
  fiber_g: z.number().optional(),
  sodium_mg: z.number().optional(),
  salt_g: z.number().optional(),
  cholesterol_mg: z.number().optional(),
  vitamin_d_mcg: z.number().optional(),
  calcium_mg: z.number().optional(),
  iron_mg: z.number().optional(),
  potassium_mg: z.number().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ============================================
// CALCULATE REQUEST SCHEMA
// ============================================

/**
 * Schema for nutrition calculation request
 */
export const calculateNutritionRequestSchema = z.object({
  bom_id: z.string().uuid().optional(),
  actual_yield_kg: z.number().positive('Actual yield must be positive').optional(),
  allow_partial: z.boolean().default(false),
})

// ============================================
// TYPES
// ============================================

export type NutritionOverrideInput = z.infer<typeof nutritionOverrideSchema>
export type ProductNutritionResponse = z.infer<typeof productNutritionResponseSchema>
export type CalculateNutritionRequest = z.infer<typeof calculateNutritionRequestSchema>
