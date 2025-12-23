/**
 * Warehouse Validation Schemas
 * Story: 01.8 - Warehouses CRUD
 * Purpose: Zod schemas for warehouse validation
 */

import { z } from 'zod'

// Warehouse Type Enum
export const warehouseTypeEnum = z.enum([
  'GENERAL',
  'RAW_MATERIALS',
  'WIP',
  'FINISHED_GOODS',
  'QUARANTINE',
])

// Create Warehouse Schema
export const createWarehouseSchema = z.object({
  code: z
    .string()
    .min(2, 'Warehouse code must be at least 2 characters')
    .max(20, 'Code must be 20 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must be 2-20 uppercase alphanumeric characters with hyphens only')
    .transform((val) => val.toUpperCase()),
  name: z
    .string()
    .min(2, 'Warehouse name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less'),
  type: warehouseTypeEnum.default('GENERAL'),
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  contact_email: z
    .preprocess(
      (val) => {
        // Handle null/undefined/empty string
        if (val === null || val === undefined || val === '') return null
        return val
      },
      z.union([
        z.null(),
        z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less')
      ])
    ),
  contact_phone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  is_active: z.boolean().default(true).optional(),
})

// Update Warehouse Schema
export const updateWarehouseSchema = z.object({
  code: z
    .string()
    .min(2, 'Warehouse code must be at least 2 characters')
    .max(20, 'Code must be 20 characters or less')
    .regex(/^[A-Z0-9-]+$/, 'Code must be 2-20 uppercase alphanumeric characters with hyphens only')
    .transform((val) => val.toUpperCase())
    .optional(),
  name: z
    .string()
    .min(2, 'Warehouse name must be at least 2 characters')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  type: warehouseTypeEnum.optional(),
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  contact_email: z
    .preprocess(
      (val) => {
        // Handle null/undefined/empty string
        if (val === null || val === undefined || val === '') return null
        return val
      },
      z.union([
        z.null(),
        z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less')
      ])
    ),
  contact_phone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  is_active: z.boolean().optional(),
  default_receiving_location_id: z
    .string()
    .uuid('Invalid UUID format for default_receiving_location_id')
    .nullable()
    .optional(),
  default_shipping_location_id: z
    .string()
    .uuid('Invalid UUID format for default_shipping_location_id')
    .nullable()
    .optional(),
  transit_location_id: z
    .string()
    .uuid('Invalid UUID format for transit_location_id')
    .nullable()
    .optional(),
})

// TypeScript types
export type CreateWarehouseInput = z.input<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.input<typeof updateWarehouseSchema>
export type WarehouseType = z.infer<typeof warehouseTypeEnum>

// Warehouse Filters Schema
export const warehouseFiltersSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  sort_by: z.enum(['code', 'name', 'type', 'location_count', 'created_at']).optional(),
  sort_direction: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
})

// Warehouse Filters (for list page)
export interface WarehouseFilters {
  search?: string
  is_active?: boolean
  sort_by?: 'code' | 'name' | 'type' | 'location_count' | 'created_at'
  sort_direction?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Warehouse Type
export interface Warehouse {
  id: string
  org_id: string
  code: string
  name: string
  type: WarehouseType
  address: string | null
  contact_email: string | null
  contact_phone: string | null
  is_default: boolean
  is_active: boolean
  location_count: number
  disabled_at: string | null
  disabled_by: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}
