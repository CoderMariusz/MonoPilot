/**
 * Ingredient Nutrition Validation Schemas
 * Story: 02.13 - Nutrition Calculation: Facts Panel & Label Generation
 *
 * Zod schemas for ingredient nutrition data validation.
 */

import { z } from 'zod'

// ============================================
// CONSTANTS
// ============================================

/** Valid units for nutrition basis */
export const NUTRITION_UNITS = ['g', 'ml'] as const

/** Valid ingredient nutrition sources */
export const INGREDIENT_SOURCES = ['usda', 'eurofir', 'supplier_coa', 'manual'] as const

/** Valid confidence levels */
export const CONFIDENCE_LEVELS = ['high', 'medium', 'low'] as const

/** Minimum per_unit value */
export const MIN_PER_UNIT = 1

/** Maximum per_unit value */
export const MAX_PER_UNIT = 1000

/** Default per_unit value */
export const DEFAULT_PER_UNIT = 100

/** Maximum source_id length */
export const MAX_SOURCE_ID_LENGTH = 50

/** Maximum notes length */
export const MAX_NOTES_LENGTH = 500

/** Maximum energy in kcal */
export const MAX_ENERGY_KCAL = 9999

/** Maximum macronutrient value in grams */
export const MAX_MACRO_G = 999.9

/** Maximum sodium in mg */
export const MAX_SODIUM_MG = 99999

// ============================================
// DATE VALIDATION HELPER
// ============================================

/**
 * Validates ISO date string format (YYYY-MM-DD or full ISO datetime)
 * Rejects formats like MM/DD/YYYY
 */
const isValidISODateString = (val: string): boolean => {
  // Check YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return !isNaN(Date.parse(val))
  }
  // Check full ISO datetime format (must start with YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
    return !isNaN(Date.parse(val))
  }
  // Reject all other formats
  return false
}

// ============================================
// INGREDIENT NUTRITION SCHEMA
// ============================================

/**
 * Schema for ingredient nutrition input
 *
 * Validates:
 * - Per unit basis (1-1000, default 100)
 * - Unit (g or ml)
 * - Source (required)
 * - Source ID (optional, max 50 chars)
 * - Source date (ISO format)
 * - Confidence level
 * - Notes
 * - All nutrient values (optional, non-negative)
 *
 * AC-13.27: Ingredient nutrition entry
 * AC-13.28: Source ID tracking
 */
export const ingredientNutritionSchema = z.object({
  // Per unit basis
  per_unit: z
    .number()
    .min(MIN_PER_UNIT, `Per unit must be at least ${MIN_PER_UNIT}`)
    .max(MAX_PER_UNIT, `Per unit must be at most ${MAX_PER_UNIT}`)
    .default(DEFAULT_PER_UNIT),

  // Unit
  unit: z.enum(NUTRITION_UNITS, {
    errorMap: () => ({ message: `Invalid unit. Must be one of: ${NUTRITION_UNITS.join(', ')}` }),
  }).default('g'),

  // Source (required)
  source: z.enum(INGREDIENT_SOURCES, {
    required_error: 'Source is required',
    errorMap: () => ({ message: `Invalid source. Must be one of: ${INGREDIENT_SOURCES.join(', ')}` }),
  }),

  // Source ID (optional)
  source_id: z
    .string()
    .max(MAX_SOURCE_ID_LENGTH, `Source ID must be at most ${MAX_SOURCE_ID_LENGTH} characters`)
    .optional(),

  // Source date (optional, ISO format)
  source_date: z
    .string()
    .refine((val) => isValidISODateString(val), 'Invalid date format. Use YYYY-MM-DD or ISO datetime')
    .optional(),

  // Confidence level
  confidence: z.enum(CONFIDENCE_LEVELS, {
    errorMap: () => ({ message: `Invalid confidence. Must be one of: ${CONFIDENCE_LEVELS.join(', ')}` }),
  }).default('medium'),

  // Notes (optional)
  notes: z
    .string()
    .max(MAX_NOTES_LENGTH, `Notes must be at most ${MAX_NOTES_LENGTH} characters`)
    .optional(),

  // Energy
  energy_kcal: z
    .number()
    .min(0, 'Energy (kcal) cannot be negative')
    .max(MAX_ENERGY_KCAL, `Energy must be at most ${MAX_ENERGY_KCAL} kcal`)
    .optional(),
  energy_kj: z
    .number()
    .min(0, 'Energy (kJ) cannot be negative')
    .optional(),

  // Macronutrients
  protein_g: z
    .number()
    .min(0, 'Protein cannot be negative')
    .max(MAX_MACRO_G, `Protein must be at most ${MAX_MACRO_G}g`)
    .optional(),
  fat_g: z
    .number()
    .min(0, 'Fat cannot be negative')
    .max(MAX_MACRO_G, `Fat must be at most ${MAX_MACRO_G}g`)
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
  carbohydrate_g: z
    .number()
    .min(0, 'Carbohydrate cannot be negative')
    .max(MAX_MACRO_G, `Carbohydrate must be at most ${MAX_MACRO_G}g`)
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
  fiber_g: z
    .number()
    .min(0, 'Fiber cannot be negative')
    .max(MAX_MACRO_G, `Fiber must be at most ${MAX_MACRO_G}g`)
    .optional(),
  sodium_mg: z
    .number()
    .min(0, 'Sodium cannot be negative')
    .max(MAX_SODIUM_MG, `Sodium must be at most ${MAX_SODIUM_MG}mg`)
    .optional(),
  salt_g: z
    .number()
    .min(0, 'Salt cannot be negative')
    .max(99.9, 'Salt must be at most 99.9g')
    .optional(),
  cholesterol_mg: z
    .number()
    .min(0, 'Cholesterol cannot be negative')
    .max(9999, 'Cholesterol must be at most 9999mg')
    .optional(),

  // Micronutrients
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
  vitamin_c_mg: z
    .number()
    .min(0, 'Vitamin C cannot be negative')
    .max(9999, 'Vitamin C must be at most 9999mg')
    .optional(),
  vitamin_a_mcg: z
    .number()
    .min(0, 'Vitamin A cannot be negative')
    .max(99999, 'Vitamin A must be at most 99999mcg')
    .optional(),

  // Moisture
  moisture_g: z
    .number()
    .min(0, 'Moisture cannot be negative')
    .max(100, 'Moisture must be at most 100g per 100g')
    .optional(),
})

// ============================================
// INGREDIENT NUTRITION RESPONSE SCHEMA
// ============================================

/**
 * Schema for ingredient nutrition response validation
 */
export const ingredientNutritionResponseSchema = ingredientNutritionSchema.extend({
  id: z.string().uuid(),
  org_id: z.string().uuid(),
  ingredient_id: z.string().uuid(),
  verified_by: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ============================================
// TYPES
// ============================================

export type IngredientNutritionInput = z.infer<typeof ingredientNutritionSchema>
export type IngredientNutritionResponse = z.infer<typeof ingredientNutritionResponseSchema>
