/**
 * Product Validation Schemas (Story 02.1)
 * Zod schemas for product CRUD validation
 *
 * Includes:
 * - Required field validation
 * - SKU format validation (alphanumeric, hyphens, underscores only)
 * - Barcode validation (W2: unique per organization)
 * - GTIN-14 check digit validation (GS1 algorithm)
 * - Shelf life validation (required when expiry_policy set)
 * - Min/max stock validation (min <= max)
 * - Standard price validation (FR-2.13: non-negative, max 4 decimals)
 * - Lead time and MOQ validation (ADR-010)
 */

import { z } from 'zod'
import { isValidGtin14, hasMaxDecimals, GTIN14_LENGTH } from '@/lib/utils/gs1-validation'

// Base product schema with all fields
const baseProductSchema = z.object({
  code: z
    .string()
    .min(2, 'SKU must be at least 2 characters')
    .max(50, 'SKU must not exceed 50 characters')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'SKU can only contain letters, numbers, hyphens, and underscores'
    ),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must not exceed 255 characters'),
  description: z.string().nullable().optional(),
  product_type_id: z.string().uuid('Invalid product type'),
  base_uom: z.string().min(1, 'Base UoM is required'),
  barcode: z
    .string()
    .max(100, 'Barcode must not exceed 100 characters')
    .nullable()
    .optional()
    .refine((val) => !val || val.trim().length > 0, {
      message: 'Barcode cannot be empty string (use null instead)',
    }),
  gtin: z
    .string()
    .length(GTIN14_LENGTH, `GTIN must be exactly ${GTIN14_LENGTH} digits`)
    .regex(/^\d{14}$/, 'GTIN must contain only digits')
    .refine((val) => isValidGtin14(val), {
      message: 'Invalid GTIN-14 check digit',
    })
    .nullable()
    .optional(),
  category_id: z.string().uuid().nullable().optional(),
  supplier_id: z.string().uuid().nullable().optional(),
  lead_time_days: z
    .number()
    .int('Lead time must be an integer')
    .min(0, 'Lead time cannot be negative')
    .nullable()
    .optional(),
  moq: z
    .number()
    .positive('MOQ must be greater than 0')
    .nullable()
    .optional(),
  std_price: z
    .number()
    .min(0, 'Standard price cannot be negative')
    .refine((val) => hasMaxDecimals(val, 4), {
      message: 'Standard price can have maximum 4 decimal places',
    })
    .nullable()
    .optional(),
  cost_per_unit: z
    .number()
    .min(0, 'Cost per unit cannot be negative')
    .nullable()
    .optional(),
  min_stock: z
    .number()
    .min(0, 'Minimum stock cannot be negative')
    .nullable()
    .optional(),
  max_stock: z
    .number()
    .min(0, 'Maximum stock cannot be negative')
    .nullable()
    .optional(),
  expiry_policy: z.enum(['fixed', 'rolling', 'none']).optional(),
  shelf_life_days: z
    .number()
    .int('Shelf life must be an integer')
    .positive('Shelf life must be positive')
    .nullable()
    .optional(),
  storage_conditions: z.string().max(500).nullable().optional(),
  is_perishable: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
})

/**
 * Validate shelf life requirement based on expiry policy
 * shelf_life_days is required when expiry_policy is 'fixed' or 'rolling'
 */
function validateShelfLifeRequired(data: { expiry_policy?: string; shelf_life_days?: number | null }): boolean {
  if (data.expiry_policy && data.expiry_policy !== 'none' && !data.shelf_life_days) {
    return false
  }
  return true
}

/**
 * Validate min/max stock relationship
 * min_stock must be <= max_stock when both are set
 */
function validateMinMaxStock(data: { min_stock?: number | null; max_stock?: number | null }): boolean {
  if (
    data.min_stock !== null &&
    data.min_stock !== undefined &&
    data.max_stock !== null &&
    data.max_stock !== undefined
  ) {
    return data.min_stock <= data.max_stock
  }
  return true
}

// Create product schema with additional validation
export const createProductSchema = baseProductSchema
  .refine(validateShelfLifeRequired, {
    message: 'shelf_life_days is required when expiry_policy is set to "fixed" or "rolling"',
    path: ['shelf_life_days'],
  })
  .refine(validateMinMaxStock, {
    message: 'min_stock cannot be greater than max_stock',
    path: ['min_stock'],
  })

// Update product schema (excludes immutable fields: code, product_type_id)
// Note: We build it from base schema without refinements first, then add refinements
const updateProductBaseSchema = baseProductSchema
  .omit({
    code: true,
    product_type_id: true,
  })
  .partial()

export const updateProductSchema = updateProductBaseSchema
  .refine(validateShelfLifeRequired, {
    message: 'shelf_life_days is required when expiry_policy is set to "fixed" or "rolling"',
    path: ['shelf_life_days'],
  })
  .refine(validateMinMaxStock, {
    message: 'min_stock cannot be greater than max_stock',
    path: ['min_stock'],
  })

// Product list query schema (for GET /api/products)
export const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.enum(['active', 'inactive', 'discontinued']).optional(),
  sort: z
    .enum(['code', 'name', 'created_at', 'updated_at'])
    .default('code'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

// Export types
export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type ProductListQuery = z.infer<typeof productListQuerySchema>
