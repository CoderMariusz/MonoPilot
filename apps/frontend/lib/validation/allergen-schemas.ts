/**
 * Allergen Validation Schemas
 * Story: 01.12 - Allergens Management
 *
 * Read-only validation schemas for EU allergens.
 * NO create/update schemas - allergens are read-only in MVP.
 */

import { z } from 'zod'

/**
 * Allergen Response Schema
 * Matches database schema from migration 076_create_allergens_table.sql
 */
export const allergenSchema = z.object({
  id: z.string().uuid(),
  code: z.string().regex(/^A[0-9]{2}$/, 'Code must be format A01-A14'),
  name_en: z.string().min(1).max(100),
  name_pl: z.string().min(1).max(100),
  name_de: z.string().max(100).nullable(),
  name_fr: z.string().max(100).nullable(),
  icon_url: z.string().nullable(),
  icon_svg: z.string().nullable(),
  is_eu_mandatory: z.boolean(),
  is_custom: z.boolean(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0),
  created_at: z.string(),
  updated_at: z.string(),
})

/**
 * Allergen Type (inferred from schema)
 * Matches lib/types/allergen.ts
 */
export type Allergen = z.infer<typeof allergenSchema>

/**
 * Allergen List Response Schema
 * For GET /api/v1/settings/allergens
 */
export const allergenListResponseSchema = z.array(allergenSchema)

/**
 * Allergen Single Response Schema
 * For GET /api/v1/settings/allergens/:id
 */
export const allergenSingleResponseSchema = allergenSchema

/**
 * Allergen Filters Schema
 * For query parameters in list endpoint
 */
export const allergenFiltersSchema = z.object({
  search: z.string().optional(),
  is_eu_mandatory: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export type AllergenFilters = z.infer<typeof allergenFiltersSchema>

/**
 * EU Major Allergens Constants
 * Based on EU Regulation 1169/2011
 *
 * 14 major allergens that must be declared on food labels in the EU.
 * Codes: A01-A14 (matches database seed data)
 */
export const EU_ALLERGEN_CODES = [
  'A01', // Gluten
  'A02', // Crustaceans
  'A03', // Eggs
  'A04', // Fish
  'A05', // Peanuts
  'A06', // Soybeans
  'A07', // Milk
  'A08', // Nuts
  'A09', // Celery
  'A10', // Mustard
  'A11', // Sesame
  'A12', // Sulphites
  'A13', // Lupin
  'A14', // Molluscs
] as const

/**
 * Validation helper: Check if allergen code is valid EU code
 */
export function isValidEuAllergenCode(code: string): boolean {
  return EU_ALLERGEN_CODES.includes(code as any)
}

/**
 * Validation helper: Check if allergen code format is valid (A01-A99)
 */
export function isValidAllergenCodeFormat(code: string): boolean {
  return /^A[0-9]{2}$/.test(code)
}
