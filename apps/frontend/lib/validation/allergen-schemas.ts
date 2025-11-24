/**
 * Allergen Validation Schemas
 * Story: 1.9 Allergen Management
 * AC-008.3, AC-008.4: Client-side and server-side validation
 */

import { z } from 'zod'

// Create Allergen Schema
// AC-008.3: Admin może dodać custom allergens
export const createAllergenSchema = z.object({
  code: z
    .string()
    .min(2, 'Allergen code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase()), // Auto-convert to uppercase
  name: z
    .string()
    .min(1, 'Allergen name is required')
    .max(100, 'Name must be 100 characters or less'),
  is_major: z
    .boolean()
    .optional()
    .default(false), // Custom allergens default to non-major
})

// Update Allergen Schema
// AC-008.4: Custom allergens editable and deletable
export const updateAllergenSchema = z.object({
  code: z
    .string()
    .min(2, 'Allergen code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .transform(val => val.toUpperCase())
    .optional(),
  name: z
    .string()
    .min(1, 'Allergen name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  is_major: z
    .boolean()
    .optional(),
})

// TypeScript types
export type CreateAllergenInput = z.input<typeof createAllergenSchema>
export type UpdateAllergenInput = z.input<typeof updateAllergenSchema>

// Allergen Filters Schema
// AC-008.5: Allergens list view with filters
export const allergenFiltersSchema = z.object({
  search: z.string().optional(),
  is_major: z.union([z.boolean(), z.literal('all')]).optional(),
  is_custom: z.union([z.boolean(), z.literal('all')]).optional(),
  sort_by: z.enum(['code', 'name', 'is_major']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
})

// Allergen Filters (for list page)
export interface AllergenFilters {
  search?: string
  is_major?: boolean | 'all'
  is_custom?: boolean | 'all'
  sort_by?: 'code' | 'name' | 'is_major'
  sort_direction?: 'asc' | 'desc'
}

// Allergen Type
export interface Allergen {
  id: string
  org_id: string
  code: string
  name: string
  is_major: boolean
  is_custom: boolean
  created_at: string
  updated_at: string
  // Product count (joined from product_allergens - Epic 2)
  product_count?: number
}

/**
 * EU Major Allergens Constants
 * Based on EU Regulation 1169/2011
 *
 * 14 major allergens that must be declared on food labels in the EU:
 * 1. Milk (including lactose)
 * 2. Eggs
 * 3. Fish
 * 4. Crustaceans (shellfish)
 * 5. Tree nuts (almonds, hazelnuts, walnuts, etc.)
 * 6. Peanuts (groundnuts)
 * 7. Cereals containing gluten (wheat, rye, barley, oats, etc.)
 * 8. Soybeans
 * 9. Sesame seeds
 * 10. Mustard
 * 11. Celery
 * 12. Lupin
 * 13. Sulphur dioxide and sulphites (>10mg/kg or 10mg/L)
 * 14. Molluscs
 */
export const EU_MAJOR_ALLERGENS = [
  { code: 'MILK', name: 'Milk' },
  { code: 'EGGS', name: 'Eggs' },
  { code: 'FISH', name: 'Fish' },
  { code: 'SHELLFISH', name: 'Crustaceans' },
  { code: 'TREENUTS', name: 'Tree Nuts' },
  { code: 'PEANUTS', name: 'Peanuts' },
  { code: 'WHEAT', name: 'Gluten (Wheat)' },
  { code: 'SOYBEANS', name: 'Soybeans' },
  { code: 'SESAME', name: 'Sesame Seeds' },
  { code: 'MUSTARD', name: 'Mustard' },
  { code: 'CELERY', name: 'Celery' },
  { code: 'LUPIN', name: 'Lupin' },
  { code: 'SULPHITES', name: 'Sulphur Dioxide/Sulphites' },
  { code: 'MOLLUSCS', name: 'Molluscs' },
] as const

/**
 * Validation helper: Check if allergen code is a preloaded EU allergen
 */
export function isEuMajorAllergen(code: string): boolean {
  return EU_MAJOR_ALLERGENS.some(allergen => allergen.code === code.toUpperCase())
}
