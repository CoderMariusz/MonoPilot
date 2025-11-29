// Validation schemas for Planning module (Epic 3)
// Batch 3A: Suppliers & Purchase Orders
// Date: 2025-01-23

import { z } from 'zod'

// ===== Supplier Schemas (Story 3.17) =====

export const supplierSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers, and hyphens only'),
  name: z.string().min(1, 'Name is required').max(255),
  contact_person: z.string().max(255).optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(20).optional().nullable(),
  country: z.string().length(2, 'Country must be 2-letter ISO code').optional().nullable(),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP'], {
    errorMap: () => ({ message: 'Currency must be PLN, EUR, USD, or GBP' })
  }),
  tax_code_id: z.string().uuid('Invalid tax code'),
  payment_terms: z.string().min(1, 'Payment terms required').max(100),
  lead_time_days: z.number().int().min(0, 'Lead time must be >= 0').optional().default(7),
  moq: z.number().positive('MOQ must be positive').nullable().optional(),
  is_active: z.boolean().optional().default(true),
})

export type SupplierInput = z.input<typeof supplierSchema>

export const updateSupplierSchema = supplierSchema.omit({ code: true })

export type UpdateSupplierInput = z.input<typeof updateSupplierSchema>

// ===== Supplier-Product Assignment Schemas (Story 3.17) =====

export const supplierProductSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  is_default: z.boolean().optional().default(false),
  supplier_product_code: z.string().max(100).optional(),
  unit_price: z.number().nonnegative('Unit price must be >= 0').optional(),
  lead_time_days: z.number().int().min(0, 'Lead time must be >= 0').optional(),
  moq: z.number().positive('MOQ must be positive').nullable().optional(),
})

export type SupplierProductInput = z.input<typeof supplierProductSchema>

// ===== Purchase Order Schemas (Story 3.1) =====

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().uuid('Invalid supplier ID'),
  warehouse_id: z.string().uuid('Invalid warehouse ID'),
  expected_delivery_date: z.coerce.date().refine(
    (date) => date >= new Date(new Date().setHours(0, 0, 0, 0)),
    'Expected delivery date cannot be in the past'
  ),
  payment_terms: z.string().max(100).optional().nullable(),
  shipping_method: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional().nullable(),
})

export type PurchaseOrderInput = z.input<typeof purchaseOrderSchema>

export const updatePurchaseOrderSchema = purchaseOrderSchema.omit({
  supplier_id: true,
  warehouse_id: true
})

export type UpdatePurchaseOrderInput = z.input<typeof updatePurchaseOrderSchema>

// ===== PO Line Schemas (Story 3.2) =====

export const poLineSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  quantity: z.number().positive('Quantity must be > 0'),
  unit_price: z.number().nonnegative('Unit price must be >= 0'),
  discount_percent: z.number().min(0).max(100, 'Discount must be 0-100%').optional().default(0),
  expected_delivery_date: z.coerce.date().optional(),
})

export type POLineInput = z.input<typeof poLineSchema>

export const updatePOLineSchema = poLineSchema.omit({ product_id: true })

export type UpdatePOLineInput = z.input<typeof updatePOLineSchema>

// ===== Bulk PO Schemas (Story 3.3) =====

export const bulkPOItemSchema = z.object({
  product_code: z.string().min(1, 'Product code is required'),
  quantity: z.number().positive('Quantity must be > 0'),
  warehouse_id: z.string().uuid('Invalid warehouse ID').optional(),
  expected_delivery_date: z.coerce.date().optional(),
})

export type BulkPOItemInput = z.input<typeof bulkPOItemSchema>

// ===== PO Approval Schemas (Story 3.4) =====

export const poApprovalSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejection_reason: z.string().min(1).max(500).optional(),
  comments: z.string().max(1000).optional(),
}).refine(data => {
  if (data.action === 'reject') {
    return !!data.rejection_reason
  }
  return true
}, {
  message: 'Rejection reason required when rejecting',
  path: ['rejection_reason'],
})

export type POApprovalInput = z.input<typeof poApprovalSchema>

// ===== Planning Settings Schemas (Story 3.5) =====

export const poStatusSchema = z.object({
  code: z.string().min(1).regex(/^[a-z0-9_-]+$/, 'Status code must be lowercase letters, numbers, underscores, and hyphens'),
  label: z.string().min(1).max(50),
  color: z.enum(['gray', 'blue', 'green', 'yellow', 'red', 'purple', 'orange']),
  is_default: z.boolean(),
  sequence: z.number().int().min(1),
})

export type POStatusInput = z.input<typeof poStatusSchema>

export const planningSettingsSchema = z.object({
  po_statuses: z.array(poStatusSchema).min(1).refine(statuses => {
    const defaults = statuses.filter(s => s.is_default)
    return defaults.length === 1
  }, 'Exactly one default status required'),
  po_default_status: z.string(),
  po_require_approval: z.boolean(),
  po_approval_threshold: z.number().positive().optional(),
  po_payment_terms_visible: z.boolean().optional().default(true),
  po_shipping_method_visible: z.boolean().optional().default(true),
  po_notes_visible: z.boolean().optional().default(true),
})

export type PlanningSettingsInput = z.input<typeof planningSettingsSchema>

// ===== WO Status Schemas (Story 3.15) =====

export const woStatusSchema = z.object({
  code: z.string().min(1).regex(/^[a-z0-9_-]+$/, 'Status code must be lowercase letters, numbers, underscores, and hyphens'),
  label: z.string().min(1).max(50),
  color: z.enum(['gray', 'blue', 'green', 'yellow', 'red', 'purple', 'orange', 'indigo']),
  is_default: z.boolean(),
  sequence: z.number().int().min(1),
})

export type WOStatusInput = z.input<typeof woStatusSchema>

export const woSettingsSchema = z.object({
  wo_statuses: z.array(woStatusSchema).min(1).refine(statuses => {
    const defaults = statuses.filter(s => s.is_default)
    return defaults.length === 1
  }, 'Exactly one default status required'),
  wo_default_status: z.string(),
  wo_status_expiry_days: z.number().int().positive().nullable().optional(),
})

export type WOSettingsInput = z.input<typeof woSettingsSchema>

// Extended planning settings with WO configuration
export const planningSettingsWithWOSchema = planningSettingsSchema.merge(woSettingsSchema.partial())

export type PlanningSettingsWithWOInput = z.input<typeof planningSettingsWithWOSchema>
