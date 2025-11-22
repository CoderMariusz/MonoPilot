/**
 * Production Line Validation Schemas
 * Story: 1.8 Production Line Configuration
 * AC-007.1, AC-007.6: Client-side and server-side validation
 */

import { z } from 'zod'

// Create Production Line Schema
// AC-007.1: Admin może stworzyć production line
export const createProductionLineSchema = z.object({
  code: z
    .string()
    .min(2, 'Line code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  name: z
    .string()
    .min(1, 'Line name is required')
    .max(100, 'Name must be 100 characters or less'),
  warehouse_id: z
    .string()
    .uuid('Invalid warehouse ID format'),
  default_output_location_id: z
    .string()
    .uuid('Invalid location ID format')
    .optional()
    .nullable(),
  machine_ids: z
    .array(z.string().uuid('Invalid machine ID format'))
    .optional()
    .default([]),
})

// Update Production Line Schema
// AC-007.6: Edit line
export const updateProductionLineSchema = z.object({
  code: z
    .string()
    .min(2, 'Line code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .optional(),
  name: z
    .string()
    .min(1, 'Line name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  warehouse_id: z
    .string()
    .uuid('Invalid warehouse ID format')
    .optional(),
  default_output_location_id: z
    .string()
    .uuid('Invalid location ID format')
    .optional()
    .nullable(),
  machine_ids: z
    .array(z.string().uuid('Invalid machine ID format'))
    .optional(),
})

// TypeScript types
export type CreateProductionLineInput = z.infer<typeof createProductionLineSchema>
export type UpdateProductionLineInput = z.infer<typeof updateProductionLineSchema>

// Production Line Filters Schema
// AC-007.4: Lines list view with filters
export const productionLineFiltersSchema = z.object({
  search: z.string().optional(),
  warehouse_id: z.string().uuid('Invalid warehouse ID').optional(),
  sort_by: z.enum(['code', 'name', 'warehouse', 'created_at']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
})

// Production Line Filters (for list page)
export interface ProductionLineFilters {
  search?: string
  warehouse_id?: string
  sort_by?: 'code' | 'name' | 'warehouse' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

// Production Line Type
export interface ProductionLine {
  id: string
  org_id: string
  warehouse_id: string
  code: string
  name: string
  default_output_location_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  // Joined objects (when queried with joins)
  warehouse?: {
    id: string
    code: string
    name: string
  }
  default_output_location?: {
    id: string
    code: string
    name: string
    type: string
  }
  assigned_machines?: Array<{
    id: string
    code: string
    name: string
    status: string
  }>
}
