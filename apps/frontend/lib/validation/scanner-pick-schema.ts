/**
 * Scanner Pick Validation Schemas (Story 07.10)
 * Phase: TDD RED - Placeholder schema for tests
 *
 * STUB FILE - Implementation will be done in GREEN phase
 */

import { z } from 'zod'

/**
 * Schema for scanner pick confirmation
 */
export const scannerPickSchema = z.object({
  pick_line_id: z.string().uuid('Invalid pick line ID'),
  scanned_lp_barcode: z.string().min(1, 'LP barcode required'),
  quantity_picked: z.number().positive('Quantity must be > 0'),
  short_pick: z.boolean(),
  short_pick_reason: z
    .enum(['insufficient_inventory', 'product_not_found', 'product_damaged', 'location_empty', 'other'])
    .optional(),
  short_pick_notes: z.string().max(500).optional(),
}).refine(
  (data) => !data.short_pick || data.short_pick_reason,
  { message: 'Short pick reason required when short_pick is true', path: ['short_pick_reason'] }
)

/**
 * Schema for LP lookup
 */
export const lpLookupSchema = z.object({
  barcode: z.string().min(1, 'Barcode required'),
})

/**
 * Schema for pick suggestion request
 */
export const pickSuggestionSchema = z.object({
  lineId: z.string().uuid('Invalid line ID'),
})

export type ScannerPickInput = z.infer<typeof scannerPickSchema>
export type LPLookupInput = z.infer<typeof lpLookupSchema>
export type PickSuggestionInput = z.infer<typeof pickSuggestionSchema>
