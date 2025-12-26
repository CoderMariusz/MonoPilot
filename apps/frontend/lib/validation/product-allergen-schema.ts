/**
 * Product Allergen Validation Schemas (Story 02.3 - MVP)
 * Purpose: Zod schemas for product allergen CRUD operations
 *
 * Validates:
 * - addProductAllergenSchema: allergen_id, relation_type, reason (AC-08)
 * - productAllergenResponseSchema: API response validation
 *
 * MVP Scope: Basic allergen declaration
 * Phase 1+: Thresholds, risk assessment (excluded)
 */

import { z } from 'zod'

/**
 * Add Product Allergen Schema
 * Validates manual allergen declaration request
 *
 * Rules:
 * - allergen_id: Valid UUID (required)
 * - relation_type: 'contains' | 'may_contain' (required)
 * - reason: Required for may_contain, min 10 chars, max 500 chars (AC-08)
 */
export const addProductAllergenSchema = z
  .object({
    allergen_id: z.string().uuid('Invalid allergen ID'),
    relation_type: z.enum(['contains', 'may_contain'], {
      required_error: 'Relation type is required',
      invalid_type_error: 'Relation type must be contains or may_contain',
    }),
    reason: z
      .string()
      .min(10, 'Reason must be at least 10 characters')
      .max(500, 'Reason must not exceed 500 characters')
      .trim()
      .optional(),
  })
  .refine(
    (data) => {
      // If relation_type is 'may_contain', reason is required and must be at least 10 chars (after trim)
      if (data.relation_type === 'may_contain') {
        return data.reason && data.reason.length >= 10
      }
      return true
    },
    {
      message:
        'Reason is required for May Contain declarations (min 10 characters)',
      path: ['reason'],
    }
  )

/**
 * Product Allergen Response Schema
 * Validates API response for product allergen data
 */
export const productAllergenResponseSchema = z.object({
  id: z.string().uuid(),
  allergen_id: z.string().uuid(),
  allergen_code: z.string(),
  allergen_name: z.string(),
  allergen_icon: z.string().nullable(),
  relation_type: z.enum(['contains', 'may_contain']),
  source: z.enum(['auto', 'manual']),
  source_products: z
    .array(
      z.object({
        id: z.string().uuid(),
        code: z.string(),
        name: z.string(),
      })
    )
    .optional(),
  reason: z.string().nullable().optional(),
  created_at: z.string(),
  created_by: z.string().uuid(),
  updated_at: z.string().optional(),
})

/**
 * Allergen Response Schema (from Story 01.12)
 * Validates allergen master data
 */
export const allergenResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name_en: z.string(),
  name_pl: z.string(),
  name_de: z.string().nullable(),
  name_fr: z.string().nullable(),
  icon_url: z.string().nullable(),
  is_eu_mandatory: z.boolean(),
  is_active: z.boolean(),
  display_order: z.number(),
})

/**
 * Allergens List Response Schema
 * Validates GET /api/v1/allergens response
 */
export const allergensListResponseSchema = z.object({
  allergens: z.array(allergenResponseSchema),
})

/**
 * Product Allergens Response Schema
 * Validates GET /api/v1/technical/products/:id/allergens response
 */
export const productAllergensResponseSchema = z.object({
  allergens: z.array(productAllergenResponseSchema),
  inheritance_status: z.object({
    last_calculated: z.string().nullable(),
    bom_version: z.string().nullable(),
    ingredients_count: z.number(),
    needs_recalculation: z.boolean(),
  }),
})

/**
 * Recalculate Allergens Response Schema
 * Validates POST /api/v1/technical/boms/:id/allergens response
 */
export const recalculateAllergensResponseSchema = z.object({
  inherited_allergens: z.array(productAllergenResponseSchema),
  manual_allergens: z.array(productAllergenResponseSchema),
  removed_count: z.number(),
  bom_version: z.string(),
})

/**
 * Type exports (inferred from schemas)
 */
export type AddProductAllergenInput = z.infer<typeof addProductAllergenSchema>
export type ProductAllergenOutput = z.infer<
  typeof productAllergenResponseSchema
>
export type AllergenOutput = z.infer<typeof allergenResponseSchema>
export type AllergensListOutput = z.infer<typeof allergensListResponseSchema>
export type ProductAllergensOutput = z.infer<
  typeof productAllergensResponseSchema
>
export type RecalculateAllergensOutput = z.infer<
  typeof recalculateAllergensResponseSchema
>
