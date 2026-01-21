/**
 * Zod Validation Schemas for Output Registration
 * Story 04.7a - Output Registration Desktop
 *
 * Validates:
 * - registerOutputSchema - Main output registration
 * - registerByProductSchema - By-product registration
 * - createOutputSchemaWithSettings - Dynamic QA requirement
 */

import { z } from 'zod'

// QA Status enum
export const qaStatusSchema = z.enum(['approved', 'pending', 'rejected'])

// Base output registration schema (QA optional)
export const registerOutputSchema = z.object({
  wo_id: z.string().uuid('Invalid work order ID'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'Unit of measure is required'),
  batch_number: z.string().min(1, 'Batch number is required').max(50),
  qa_status: qaStatusSchema.optional(),
  location_id: z.string().uuid('Invalid location'),
  expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid expiry date',
  }),
  notes: z.string().max(500).optional(),
})

// By-product registration schema (qty can be 0 with warning)
export const registerByProductSchema = z.object({
  wo_id: z.string().uuid(),
  main_output_lp_id: z.string().uuid(),
  by_product_id: z.string().uuid(),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  uom: z.string().min(1),
  batch_number: z.string().min(1).max(50),
  qa_status: qaStatusSchema.optional(),
  location_id: z.string().uuid(),
  expiry_date: z.string(),
  notes: z.string().max(500).optional(),
})

// QA status required schema - for use when QA is required
const qaStatusRequiredSchema = z.enum(['approved', 'pending', 'rejected'], {
  required_error: 'QA status is required',
  invalid_type_error: 'QA status is required',
})

/**
 * Create output schema with settings-based QA requirement
 *
 * @param requireQA - Whether QA status is required (from production settings)
 * @returns Zod schema with appropriate QA validation
 */
export const createOutputSchemaWithSettings = (requireQA: boolean) => {
  if (requireQA) {
    return z.object({
      wo_id: z.string().uuid('Invalid work order ID'),
      quantity: z.number().positive('Quantity must be greater than 0'),
      uom: z.string().min(1, 'Unit of measure is required'),
      batch_number: z.string().min(1, 'Batch number is required').max(50),
      qa_status: qaStatusRequiredSchema,
      location_id: z.string().uuid('Invalid location'),
      expiry_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid expiry date',
      }),
      notes: z.string().max(500).optional(),
    })
  }
  return registerOutputSchema
}

// Type exports
export type RegisterOutputInput = z.infer<typeof registerOutputSchema>
export type RegisterByProductInput = z.infer<typeof registerByProductSchema>
export type QAStatus = z.infer<typeof qaStatusSchema>
