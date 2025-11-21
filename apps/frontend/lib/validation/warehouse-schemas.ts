/**
 * Warehouse Validation Schemas
 * Story: 1.5 Warehouse Configuration
 */

import { z } from 'zod'

// Create Warehouse Schema
export const createWarehouseSchema = z.object({
  code: z
    .string()
    .min(1, 'Warehouse code is required')
    .max(20, 'Code must be 20 characters or less')
    .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, underscores, and hyphens'),
  name: z
    .string()
    .min(1, 'Warehouse name is required')
    .max(100, 'Name must be 100 characters or less'),
  address: z
    .string()
    .max(255, 'Address must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
})

// Update Warehouse Schema (code is not editable)
export const updateWarehouseSchema = z.object({
  name: z
    .string()
    .min(1, 'Warehouse name is required')
    .max(100, 'Name must be 100 characters or less'),
  address: z
    .string()
    .max(255, 'Address must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean(),
})

// TypeScript types
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>

// Warehouse Filters Schema
export const warehouseFiltersSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
})

// Warehouse Filters (for list page)
export interface WarehouseFilters {
  search?: string
  is_active?: boolean
}

// Warehouse Type
export interface Warehouse {
  id: string
  code: string
  name: string
  address: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  org_id: string
}
