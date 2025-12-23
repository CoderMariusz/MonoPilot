/**
 * Production Line Validation Schemas
 * Story: 01.11 - Production Lines CRUD
 * Purpose: Zod schemas for production line create/update with machine orders and product IDs
 */

import { z } from 'zod'

// Create Production Line Schema
export const productionLineCreateSchema = z.object({
  code: z
    .string()
    .min(2, 'Line code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(1, 'Line name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
  warehouse_id: z
    .string()
    .uuid('Invalid warehouse ID format'),
  default_output_location_id: z
    .string()
    .uuid('Invalid location ID format')
    .optional()
    .nullable(),
  status: z
    .enum(['active', 'maintenance', 'inactive', 'setup'])
    .default('active'),
  machine_ids: z
    .array(z.string().uuid('Invalid machine ID format'))
    .max(20, 'Maximum 20 machines per line')
    .optional()
    .default([]),
  product_ids: z
    .array(z.string().uuid('Invalid product ID format'))
    .optional()
    .default([]),
})

// Update Production Line Schema (partial)
export const productionLineUpdateSchema = productionLineCreateSchema.partial()

// Machine Reorder Schema
export const machineReorderSchema = z.object({
  machine_orders: z.array(
    z.object({
      machine_id: z.string().uuid('Invalid machine ID format'),
      sequence_order: z.number().int().min(1, 'Sequence order must start from 1'),
    })
  ),
})

// TypeScript types
export type CreateProductionLineInput = z.infer<typeof productionLineCreateSchema>
export type UpdateProductionLineInput = z.infer<typeof productionLineUpdateSchema>
export type MachineReorderInput = z.infer<typeof machineReorderSchema>

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
