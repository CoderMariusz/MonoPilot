// Validation schemas for Traceability (Stories 2.18, 2.19, 2.20)
import { z } from 'zod'

// LP ID can be either:
// - UUID format (e.g., "123e4567-e89b-12d3-a456-426614174000")
// - Alphanumeric LP number (e.g., "LP08528390", "LP-2024-001")
const lpIdSchema = z.string().min(1).max(50).refine(
  (val) => {
    // Accept UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(val)) return true
    
    // Accept alphanumeric LP numbers (LP followed by digits or LP-YYYY-XXX format)
    const lpNumberRegex = /^LP[\d-]+$/i
    if (lpNumberRegex.test(val)) return true
    
    return false
  },
  {
    message: 'Invalid LP ID format. Must be a UUID or LP number (e.g., LP08528390, LP-2024-001)'
  }
)

// Forward/Backward Trace Input
export const traceInputSchema = z.object({
  lp_id: lpIdSchema.optional(),
  batch_number: z.string().min(1).max(50).optional(),
  max_depth: z.number().int().min(1).max(50).optional().default(20)
}).refine(data => data.lp_id || data.batch_number, {
  message: 'Either lp_id or batch_number must be provided'
})

export type TraceInput = z.input<typeof traceInputSchema>

// Recall Simulation Input
export const recallInputSchema = z.object({
  lp_id: lpIdSchema.optional(),
  batch_number: z.string().min(1).max(50).optional(),
  include_shipped: z.boolean().optional().default(true),
  include_notifications: z.boolean().optional().default(true)
}).refine(data => data.lp_id || data.batch_number, {
  message: 'Either lp_id or batch_number must be provided'
})

export type RecallInput = z.input<typeof recallInputSchema>
