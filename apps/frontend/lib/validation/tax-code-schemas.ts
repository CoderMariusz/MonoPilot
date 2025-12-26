/**
 * Tax Code Validation Schemas
 * Story: 01.13 - Tax Codes CRUD
 *
 * Zod schemas for validating tax code create/update operations.
 * Used by API routes and form components for consistent validation.
 *
 * @module tax-code-schemas
 */

import { z } from 'zod'

/**
 * Validates that a number has at most 2 decimal places.
 * Used for tax rate precision validation.
 */
function hasMaxTwoDecimals(val: number): boolean {
  const decimalPlaces = val.toString().split('.')[1]?.length || 0
  return decimalPlaces <= 2
}

/**
 * Regex pattern for valid tax code format.
 * - 2-20 characters
 * - Uppercase letters, numbers, and hyphens only
 *
 * @example Valid: "VAT23", "GST-5", "REDUCED-8"
 * @example Invalid: "vat23" (lowercase), "VAT 23" (space), "V" (too short)
 */
const TAX_CODE_PATTERN = /^[A-Z0-9-]{2,20}$/

/**
 * Regex pattern for ISO 3166-1 alpha-2 country codes.
 * - Exactly 2 uppercase letters
 *
 * @example Valid: "PL", "DE", "GB"
 * @example Invalid: "Poland", "pl", "P"
 */
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/

/**
 * Regex pattern for ISO 8601 date format (date only).
 *
 * @example Valid: "2025-01-01", "2024-12-31"
 * @example Invalid: "01-01-2025", "2025/01/01"
 */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// Base schema without refinements for reuse
const taxCodeBaseSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(TAX_CODE_PATTERN, 'Code must be uppercase alphanumeric with hyphens only'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  rate: z
    .number()
    .min(0, 'Rate must be between 0 and 100')
    .max(100, 'Rate must be between 0 and 100')
    .refine(hasMaxTwoDecimals, 'Rate must have at most 2 decimal places'),
  country_code: z
    .string()
    .length(2, 'Country code must be exactly 2 characters')
    .regex(COUNTRY_CODE_PATTERN, 'Country code must be uppercase ISO 3166-1 alpha-2 format'),
  valid_from: z
    .string()
    .regex(DATE_PATTERN, 'Valid from must be in YYYY-MM-DD format'),
  valid_to: z
    .string()
    .regex(DATE_PATTERN, 'Valid to must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  is_default: z.boolean().optional(),
})

// Date validation refinement function
function validateDateRange(data: { valid_from?: string; valid_to?: string | null }): boolean {
  if (data.valid_to && data.valid_from) {
    return new Date(data.valid_to) > new Date(data.valid_from)
  }
  return true
}

/**
 * Schema for creating a new tax code.
 *
 * Validations:
 * - code: 2-20 uppercase alphanumeric + hyphens
 * - name: 2-100 characters
 * - rate: 0-100 with max 2 decimal places
 * - country_code: ISO 3166-1 alpha-2
 * - valid_from: YYYY-MM-DD format
 * - valid_to: YYYY-MM-DD format, must be after valid_from if provided
 * - is_default: optional boolean
 *
 * @example
 * \`\`\`ts
 * const result = taxCodeCreateSchema.safeParse({
 *   code: 'VAT23',
 *   name: 'VAT 23%',
 *   rate: 23,
 *   country_code: 'PL',
 *   valid_from: '2025-01-01'
 * })
 * \`\`\`
 */
export const taxCodeCreateSchema = taxCodeBaseSchema.refine(validateDateRange, {
  message: 'Valid to date must be after valid from date',
  path: ['valid_to'],
})

/**
 * Schema for updating an existing tax code.
 * All fields are optional - only provided fields will be validated.
 *
 * Note: The date range refinement still applies if both dates are provided.
 */
export const taxCodeUpdateSchema = taxCodeBaseSchema.partial().refine(validateDateRange, {
  message: 'Valid to date must be after valid from date',
  path: ['valid_to'],
})

/**
 * TypeScript type inferred from create schema.
 * Use for type-safe form handling.
 */
export type TaxCodeCreateInput = z.infer<typeof taxCodeCreateSchema>

/**
 * TypeScript type inferred from update schema.
 * Use for type-safe partial updates.
 */
export type TaxCodeUpdateInput = z.infer<typeof taxCodeUpdateSchema>
