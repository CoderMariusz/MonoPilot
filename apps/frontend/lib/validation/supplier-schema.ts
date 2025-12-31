/**
 * Supplier Validation Schemas
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Zod schemas for validating supplier create/update operations.
 * Used by API routes and form components for consistent validation.
 *
 * Field validation rules:
 * - code: 2-20 chars, uppercase alphanumeric + hyphen, unique per org
 * - name: 2-100 chars
 * - contact_email: valid email format if provided
 * - contact_phone: max 50 chars
 * - address: max 200 chars
 * - city: max 100 chars
 * - postal_code: max 20 chars
 * - country: exactly 2 chars (ISO alpha-2)
 * - currency: PLN, EUR, USD, GBP
 * - tax_code_id: valid UUID
 * - payment_terms: 1-100 chars, REQUIRED
 * - notes: max 1000 chars
 *
 * @module supplier-schema
 */

import { z } from 'zod'

/**
 * Regex pattern for valid supplier code format.
 * - 2-20 characters
 * - Uppercase letters, numbers, and hyphens only
 *
 * @example Valid: "SUP-001", "ACME", "SUPPLIER-123"
 * @example Invalid: "sup-001" (lowercase), "SUP 001" (space), "S" (too short)
 */
const SUPPLIER_CODE_PATTERN = /^[A-Z0-9-]+$/

/**
 * Base supplier schema for create operations.
 * All required fields must be provided.
 */
export const supplierSchema = z.object({
  code: z
    .string({
      required_error: 'Code is required',
      invalid_type_error: 'Code must be a string',
    })
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(
      SUPPLIER_CODE_PATTERN,
      'Code must contain only uppercase letters, numbers, and hyphens'
    ),
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  contact_name: z
    .string()
    .max(100, 'Contact name must be at most 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  contact_email: z
    .string()
    .email('Invalid email format')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  contact_phone: z
    .string()
    .max(50, 'Phone must be at most 50 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  address: z
    .string()
    .max(200, 'Address must be at most 200 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  city: z
    .string()
    .max(100, 'City must be at most 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  postal_code: z
    .string()
    .max(20, 'Postal code must be at most 20 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  country: z
    .string()
    .length(2, 'Country must be ISO 3166-1 alpha-2 code (2 characters)')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP'], {
    required_error: 'Currency is required',
    invalid_type_error: 'Currency must be PLN, EUR, USD, or GBP',
  }),
  tax_code_id: z
    .string({
      required_error: 'Tax code is required',
    })
    .uuid('Invalid tax code'),
  payment_terms: z
    .string({
      required_error: 'Payment terms are required',
    })
    .min(1, 'Payment terms are required')
    .max(100, 'Payment terms must be at most 100 characters'),
  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  is_active: z.boolean().optional().default(true),
})

/**
 * TypeScript type inferred from supplier schema.
 * Use for type-safe form handling.
 */
export type SupplierFormData = z.infer<typeof supplierSchema>

/**
 * Input type for creating a supplier (before transformation).
 */
export type CreateSupplierInput = z.input<typeof supplierSchema>

/**
 * Schema for creating a new supplier.
 * Alias for supplierSchema with all required fields.
 */
export const createSupplierSchema = supplierSchema

/**
 * Schema for updating an existing supplier.
 * All fields are optional except for business rules:
 * - code may be locked if supplier has POs (checked in service layer)
 */
export const updateSupplierSchema = supplierSchema.partial()

/**
 * TypeScript type for update operations.
 */
export type UpdateSupplierInput = z.input<typeof updateSupplierSchema>

/**
 * Schema for bulk deactivate request.
 * Limited to 100 suppliers per batch to prevent DoS.
 */
export const bulkDeactivateSchema = z.object({
  supplier_ids: z
    .array(z.string().uuid('Invalid supplier ID'))
    .min(1, 'At least one supplier ID is required')
    .max(100, 'Cannot process more than 100 suppliers at once'),
  reason: z
    .string()
    .max(500, 'Reason must be at most 500 characters')
    .optional(),
})

/**
 * TypeScript type for bulk deactivate request.
 */
export type BulkDeactivateInput = z.infer<typeof bulkDeactivateSchema>

/**
 * Schema for bulk activate request.
 * Limited to 100 suppliers per batch to prevent DoS.
 */
export const bulkActivateSchema = z.object({
  supplier_ids: z
    .array(z.string().uuid('Invalid supplier ID'))
    .min(1, 'At least one supplier ID is required')
    .max(100, 'Cannot process more than 100 suppliers at once'),
})

/**
 * TypeScript type for bulk activate request.
 */
export type BulkActivateInput = z.infer<typeof bulkActivateSchema>

/**
 * Schema for export request.
 * Limited to 100 suppliers per batch to prevent DoS (empty = all suppliers).
 */
export const exportSuppliersSchema = z.object({
  supplier_ids: z
    .array(z.string().uuid('Invalid supplier ID'))
    .max(100, 'Cannot export more than 100 selected suppliers at once')
    .optional()
    .default([]),
  format: z.enum(['xlsx']).default('xlsx'),
  include_products: z.boolean().optional().default(false),
  include_purchase_history: z.boolean().optional().default(false),
})

/**
 * TypeScript type for export request.
 */
export type ExportSuppliersInput = z.infer<typeof exportSuppliersSchema>

/**
 * Schema for list query parameters.
 */
export const supplierListQuerySchema = z.object({
  status: z.enum(['all', 'active', 'inactive']).optional().default('all'),
  currency: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => (Array.isArray(val) ? val : val ? [val] : undefined)),
  payment_terms: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.string().optional().default('code'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
})

/**
 * TypeScript type for list query parameters.
 */
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>
