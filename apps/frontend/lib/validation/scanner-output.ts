/**
 * Scanner Output Zod Validation Schemas
 * Story 04.7b: Output Registration Scanner
 *
 * Schemas for scanner-specific input validation:
 * - WO barcode validation
 * - Scanner output registration
 * - By-product registration
 * - Print label request
 */

import { z } from 'zod'

// WO Barcode validation
export const validateWOSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
})

export type ValidateWOInput = z.infer<typeof validateWOSchema>

// Scanner output registration
export const scannerOutputSchema = z.object({
  wo_id: z.string().uuid('Invalid work order ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  qa_status: z.enum(['approved', 'pending', 'rejected'], {
    required_error: 'QA status is required',
  }),
  batch_number: z.string().min(1, 'Batch number is required'),
  expiry_date: z.string().datetime(),
  location_id: z.string().uuid('Invalid location ID'),
  operator_badge: z.string().optional(),
})

export type ScannerOutputInput = z.infer<typeof scannerOutputSchema>

// By-product registration
export const byProductSchema = z
  .object({
    wo_id: z.string().uuid(),
    main_output_lp_id: z.string().uuid(),
    by_product_id: z.string().uuid(),
    quantity: z.number().min(0, 'Quantity cannot be negative'),
    qa_status: z.enum(['approved', 'pending', 'rejected']),
    batch_number: z.string().min(1),
    expiry_date: z.string().datetime(),
    location_id: z.string().uuid(),
    zero_qty_confirmed: z.boolean().optional(),
  })
  .refine((data) => data.quantity > 0 || data.zero_qty_confirmed === true, {
    message: 'Quantity is 0 and not confirmed',
    path: ['quantity'],
  })

export type ByProductInput = z.infer<typeof byProductSchema>

// Print label request
export const printLabelSchema = z.object({
  zpl_content: z.string().min(1, 'ZPL content is required'),
  printer_id: z.string().uuid().optional(),
})

export type PrintLabelInput = z.infer<typeof printLabelSchema>

// Generate label request
export const generateLabelSchema = z.object({
  lp_id: z.string().uuid('Invalid LP ID'),
  template_id: z.string().uuid().optional(),
})

export type GenerateLabelInput = z.infer<typeof generateLabelSchema>
