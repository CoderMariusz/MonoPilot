/**
 * Customer Validation Schemas (Story 07.1)
 *
 * Zod schemas for validating customer create/update operations.
 * Used by API routes and form components for consistent validation.
 *
 * Field validation rules:
 * - customer_code: 3-20 chars, alphanumeric + dash/underscore
 * - name: 1-255 chars, required
 * - email: valid email format if provided
 * - phone: max 50 chars
 * - tax_id: max 50 chars (encrypted at storage)
 * - credit_limit: positive number or null
 * - payment_terms_days: 1-365 days
 * - category: retail | wholesale | distributor
 * - allergen_restrictions: array of UUIDs, max 20
 *
 * @module customer-schemas
 */

import { z } from 'zod'

/**
 * Regex pattern for valid customer code format.
 * - 3-20 characters
 * - Alphanumeric, dashes, and underscores only
 */
const CUSTOMER_CODE_PATTERN = /^[A-Za-z0-9_-]+$/

/**
 * Customer category enum
 */
export const CustomerCategory = z.enum(['retail', 'wholesale', 'distributor'])
export type CustomerCategoryType = z.infer<typeof CustomerCategory>

/**
 * Address type enum
 */
export const AddressType = z.enum(['billing', 'shipping'])
export type AddressTypeType = z.infer<typeof AddressType>

/**
 * Dock hours schema (optional JSONB field)
 */
export const dockHoursSchema = z
  .record(
    z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
    z.string().nullable()
  )
  .optional()
  .nullable()

/**
 * Create customer schema (POST /api/shipping/customers)
 */
export const createCustomerSchema = z.object({
  customer_code: z
    .string({
      required_error: 'Customer code is required',
      invalid_type_error: 'Customer code must be a string',
    })
    .min(3, 'Customer code must be at least 3 characters')
    .max(20, 'Customer code must be at most 20 characters')
    .regex(
      CUSTOMER_CODE_PATTERN,
      'Customer code must contain only letters, numbers, dashes, and underscores'
    ),

  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters'),

  category: CustomerCategory,

  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),

  phone: z
    .string()
    .max(50, 'Phone must be at most 50 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  tax_id: z
    .string()
    .max(50, 'Tax ID must be at most 50 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  credit_limit: z
    .number()
    .positive('Credit limit must be positive')
    .max(999999999.99, 'Credit limit exceeds maximum')
    .optional()
    .nullable(),

  payment_terms_days: z
    .number()
    .int('Payment terms must be a whole number')
    .min(1, 'Payment terms must be at least 1 day')
    .max(365, 'Payment terms must be at most 365 days')
    .default(30)
    .optional(),

  allergen_restrictions: z
    .array(z.string().uuid('Invalid allergen ID'))
    .max(20, 'Maximum 20 allergens per customer')
    .optional()
    .nullable()
    .transform((val) => (val && val.length === 0 ? null : val)),

  is_active: z.boolean().optional().default(true),

  notes: z
    .string()
    .max(2000, 'Notes must be at most 2000 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>

/**
 * Update customer schema (PUT /api/shipping/customers/:id)
 * All fields optional except customer_code which cannot be changed
 */
export const updateCustomerSchema = createCustomerSchema
  .omit({ customer_code: true })
  .partial()
  .extend({
    customer_code: z
      .string()
      .optional()
      .refine((val) => val === undefined, {
        message: 'Cannot modify customer_code',
      }),
  })

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>

/**
 * Create contact schema (POST /api/shipping/customers/:id/contacts)
 */
export const createContactSchema = z.object({
  name: z
    .string({
      required_error: 'Contact name is required',
    })
    .min(1, 'Contact name is required')
    .max(255, 'Contact name must be at most 255 characters'),

  title: z
    .string()
    .max(100, 'Title must be at most 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val)),

  phone: z
    .string()
    .max(50, 'Phone must be at most 50 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  is_primary: z.boolean().optional().default(false),
})

export type CreateContactInput = z.infer<typeof createContactSchema>

/**
 * Update contact schema (PUT /api/shipping/customers/:id/contacts/:contactId)
 */
export const updateContactSchema = createContactSchema.partial()

export type UpdateContactInput = z.infer<typeof updateContactSchema>

/**
 * Create address schema (POST /api/shipping/customers/:id/addresses)
 */
export const createAddressSchema = z.object({
  address_type: AddressType,

  address_line1: z
    .string({
      required_error: 'Address line 1 is required',
    })
    .min(1, 'Address line 1 is required')
    .max(255, 'Address line 1 must be at most 255 characters'),

  address_line2: z
    .string()
    .max(255, 'Address line 2 must be at most 255 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  city: z
    .string({
      required_error: 'City is required',
    })
    .min(1, 'City is required')
    .max(100, 'City must be at most 100 characters'),

  state: z
    .string()
    .max(100, 'State must be at most 100 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  postal_code: z
    .string({
      required_error: 'Postal code is required',
    })
    .min(1, 'Postal code required')
    .max(20, 'Postal code must be at most 20 characters'),

  country: z
    .string({
      required_error: 'Country is required',
    })
    .min(1, 'Country is required')
    .max(100, 'Country must be at most 100 characters'),

  dock_hours: dockHoursSchema,

  notes: z
    .string()
    .max(1000, 'Notes must be at most 1000 characters')
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),

  is_default: z.boolean().optional().default(false),
})

export type CreateAddressInput = z.infer<typeof createAddressSchema>

/**
 * Update address schema (PUT /api/shipping/customers/:id/addresses/:addressId)
 */
export const updateAddressSchema = createAddressSchema.partial()

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>

/**
 * List customers query schema
 */
export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(10).max(500).default(50).optional(),
  search: z.string().optional(),
  category: CustomerCategory.optional(),
  is_active: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),
  sort_by: z.enum(['name', 'created_at', 'customer_code']).default('created_at').optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc').optional(),
})

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>
