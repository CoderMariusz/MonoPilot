// Validation schemas for Traceability (Stories 2.18, 2.19, 2.20)
import { z } from 'zod'

// Forward/Backward Trace Input
export const traceInputSchema = z.object({
  lp_id: z.string().uuid().optional(),
  batch_number: z.string().min(1).max(50).optional(),
  max_depth: z.number().int().min(1).max(50).optional().default(20)
}).refine(data => data.lp_id || data.batch_number, {
  message: 'Either lp_id or batch_number must be provided'
})

export type TraceInput = z.input<typeof traceInputSchema>

// Recall Simulation Input
export const recallInputSchema = z.object({
  lp_id: z.string().uuid().optional(),
  batch_number: z.string().min(1).max(50).optional(),
  include_shipped: z.boolean().optional().default(true),
  include_notifications: z.boolean().optional().default(true)
}).refine(data => data.lp_id || data.batch_number, {
  message: 'Either lp_id or batch_number must be provided'
})

export type RecallInput = z.input<typeof recallInputSchema>
