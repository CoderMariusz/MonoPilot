/**
 * Warehouse Validation Schemas
 * Story: 1.5 Warehouse Configuration
 */

import { z } from 'zod'

// Create Warehouse Schema
export const createWarehouseSchema = z.object({
  code: z
    .string()
    .min(2, 'Warehouse code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
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

// Update Warehouse Schema
export const updateWarehouseSchema = z.object({
  code: z
    .string()
    .min(2, 'Warehouse code must be at least 2 characters')
    .max(50, 'Code must be 50 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens')
    .optional(),
  name: z
    .string()
    .min(1, 'Warehouse name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  address: z
    .string()
    .max(255, 'Address must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional(),
  default_receiving_location_id: z.string().uuid().nullable().optional(),
  default_shipping_location_id: z.string().uuid().nullable().optional(),
  transit_location_id: z.string().uuid().nullable().optional(),
})

// TypeScript types
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>

// Warehouse Filters Schema (AC-004.3: Dynamic sorting)
export const warehouseFiltersSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  sort_by: z.enum(['code', 'name', 'created_at']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
})

// Warehouse Filters (for list page)
export interface WarehouseFilters {
  search?: string
  is_active?: boolean
  sort_by?: 'code' | 'name' | 'created_at'
  sort_direction?: 'asc' | 'desc'
}

// Warehouse Type
export interface Warehouse {
  id: string
  code: string
  name: string
  address: string | null
  is_active: boolean
  default_receiving_location_id: string | null
  default_shipping_location_id: string | null
  transit_location_id: string | null
  created_at: string
  updated_at: string
  org_id: string
  // Joined location objects (when queried with joins)
  default_receiving_location?: { code: string } | null
  default_shipping_location?: { code: string } | null
  transit_location?: { code: string } | null
}
