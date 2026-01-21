/**
 * By-Product Validation Schemas
 * Story: 04.7c - By-Product Registration
 *
 * Zod schemas for by-product registration, status tracking, and validation
 */

import { z } from 'zod'

/**
 * Register By-Product Request Schema
 * Validates request body for POST /api/production/outputs/by-products
 */
export const registerByProductSchema = z.object({
  wo_id: z.string().uuid('Invalid WO ID'),
  main_output_lp_id: z.string().uuid('Invalid main output LP ID'),
  by_product_id: z.string().uuid('Invalid by-product ID'),
  by_product_material_id: z.string().uuid('Invalid material ID'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  uom: z.string().min(1, 'UoM is required'),
  batch_number: z.string().max(50, 'Batch number too long').optional(),
  qa_status: z.enum(['approved', 'pending', 'rejected']).optional(),
  location_id: z.string().uuid('Invalid location ID'),
  expiry_date: z.string().optional(),
  notes: z.string().max(500, 'Notes too long').optional(),
})

export type RegisterByProductInput = z.infer<typeof registerByProductSchema>

/**
 * By-Product Status Schema
 * Represents the status of a by-product for a work order
 */
export const byProductStatusSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  product_code: z.string(),
  material_id: z.string().uuid(),
  yield_percent: z.number(),
  expected_qty: z.number(),
  actual_qty: z.number(),
  uom: z.string(),
  lp_count: z.number(),
  status: z.enum(['registered', 'not_registered']),
  last_registered_at: z.string().nullable(),
})

export type ByProductStatus = z.infer<typeof byProductStatusSchema>

/**
 * By-Products List Schema
 * Array of by-product statuses
 */
export const byProductsListSchema = z.array(byProductStatusSchema)

export type ByProductsList = z.infer<typeof byProductsListSchema>
