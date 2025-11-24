/**
 * Tax Code Validation Schemas
 * Story: 1.10 Tax Code Configuration
 * AC-009.2, AC-009.5: Client-side and server-side validation
 */

import { z } from 'zod'

// Create Tax Code Schema
// AC-009.2: Admin can add custom tax codes
export const createTaxCodeSchema = z.object({
  code: z
    .string()
    .min(2, 'Tax code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be 200 characters or less'),
  rate: z
    .number()
    .min(0, 'Rate must be 0 or greater')
    .max(100, 'Rate must be 100 or less'),
})

// Update Tax Code Schema
// AC-009.5: Edit tax code
export const updateTaxCodeSchema = z.object({
  code: z
    .string()
    .min(2, 'Tax code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .optional(),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(200, 'Description must be 200 characters or less')
    .optional(),
  rate: z
    .number()
    .min(0, 'Rate must be 0 or greater')
    .max(100, 'Rate must be 100 or less')
    .optional(),
})

// TypeScript types
export type CreateTaxCodeInput = z.input<typeof createTaxCodeSchema>
export type UpdateTaxCodeInput = z.input<typeof updateTaxCodeSchema>

// Tax Code Filters Schema
// AC-009.3: Tax codes list view with filters
export const taxCodeFiltersSchema = z.object({
  search: z.string().optional(),
  sort_by: z.enum(['code', 'description', 'rate']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
})

// Tax Code Filters (for list page)
export interface TaxCodeFilters {
  search?: string
  sort_by?: 'code' | 'description' | 'rate'
  sort_direction?: 'asc' | 'desc'
}

// Tax Code Type
export interface TaxCode {
  id: string
  org_id: string
  code: string
  description: string
  rate: number // 23.00 for 23%
  created_at: string
  updated_at: string
  // Joined data (Epic 3)
  po_line_count?: number // Number of PO lines using this tax code
}
