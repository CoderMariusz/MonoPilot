/**
 * SSCC Validation Schemas (Story 07.13)
 * Purpose: Zod validation schemas for SSCC generation, BOL, labels, packing slip API endpoints
 *
 * Exports:
 * - generateSSCCSchema - Request body for POST /generate-sscc
 * - generateBOLSchema - Request body for POST /generate-bol
 * - printLabelsSchema - Request body for POST /print-labels
 * - printPackingSlipSchema - Request body for POST /print-packing-slip
 * - labelPreviewQuerySchema - Query params for GET /label-preview
 *
 * AC Coverage:
 * - AC: POST /api/shipping/shipments/:id/generate-sscc is idempotent
 * - AC: ZPL label format produces valid Zebra output (4x6 and 4x8 options)
 */

import { z } from 'zod'

// =============================================================================
// Enum Schemas
// =============================================================================

export const labelFormatEnum = z.enum(['4x6', '4x8'])
export const labelOutputEnum = z.enum(['zpl', 'pdf'])

// =============================================================================
// Generate SSCC Schema
// =============================================================================

/**
 * Request body for POST /api/shipping/shipments/:id/generate-sscc
 */
export const generateSSCCSchema = z.object({
  force_regenerate: z.boolean().default(false),
})

// =============================================================================
// Generate BOL Schema
// =============================================================================

/**
 * Request body for POST /api/shipping/shipments/:id/generate-bol
 */
export const generateBOLSchema = z.object({
  force_regenerate: z.boolean().default(false),
  include_product_list: z.boolean().default(true),
})

// =============================================================================
// Print Labels Schema
// =============================================================================

/**
 * Request body for POST /api/shipping/shipments/:id/print-labels
 */
export const printLabelsSchema = z.object({
  format: labelFormatEnum,
  output: labelOutputEnum,
  box_ids: z.array(z.string().uuid()).optional(),
})

// =============================================================================
// Print Packing Slip Schema
// =============================================================================

/**
 * Request body for POST /api/shipping/shipments/:id/print-packing-slip
 */
export const printPackingSlipSchema = z.object({
  force_regenerate: z.boolean().default(false),
})

// =============================================================================
// Label Preview Query Schema
// =============================================================================

/**
 * Query params for GET /api/shipping/shipments/:id/boxes/:boxId/label-preview
 */
export const labelPreviewQuerySchema = z.object({
  format: labelFormatEnum.default('4x6'),
})

// =============================================================================
// Response Schemas (for documentation/validation)
// =============================================================================

/**
 * Response schema for generate-sscc endpoint
 */
export const generateSSCCResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    generated_count: z.number().int(),
    skipped_count: z.number().int(),
    boxes: z.array(
      z.object({
        box_id: z.string().uuid(),
        box_number: z.number().int(),
        sscc: z.string().length(18).regex(/^\d{18}$/),
        sscc_formatted: z.string(),
      })
    ),
  }),
})

/**
 * Response schema for generate-bol endpoint
 */
export const generateBOLResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    bol_number: z.string().regex(/^BOL-\d{4}-\d{6}$/),
    pdf_url: z.string().url(),
    generated_at: z.string().datetime(),
    file_size_kb: z.number().positive(),
  }),
})

/**
 * Response schema for print-labels endpoint (ZPL output)
 */
export const printLabelsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    labels: z.array(
      z.object({
        box_id: z.string().uuid(),
        box_number: z.number().int(),
        sscc: z.string().length(18),
        zpl: z.string().optional(),
        pdf_url: z.string().url().optional(),
      })
    ),
  }),
})

/**
 * Response schema for print-packing-slip endpoint
 */
export const printPackingSlipResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    pdf_url: z.string().url(),
    generated_at: z.string().datetime(),
    file_size_kb: z.number().positive(),
  }),
})

/**
 * Response schema for label-preview endpoint
 */
export const labelPreviewResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    sscc: z.string().length(18).regex(/^\d{18}$/),
    sscc_formatted: z.string(),
    barcode_image_base64: z.string(),
    label_content: z.object({
      ship_to: z.object({
        customer_name: z.string(),
        address_line1: z.string(),
        city_state_zip: z.string(),
      }),
      order_number: z.string(),
      box_number: z.string(),
      weight: z.string(),
      handling_instructions: z.string().optional(),
    }),
  }),
})

// =============================================================================
// Error Response Schema
// =============================================================================

/**
 * Standard error response schema
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
})

// =============================================================================
// Type Exports
// =============================================================================

export type LabelFormat = z.infer<typeof labelFormatEnum>
export type LabelOutput = z.infer<typeof labelOutputEnum>

export type GenerateSSCCInput = z.infer<typeof generateSSCCSchema>
export type GenerateBOLInput = z.infer<typeof generateBOLSchema>
export type PrintLabelsInput = z.infer<typeof printLabelsSchema>
export type PrintPackingSlipInput = z.infer<typeof printPackingSlipSchema>
export type LabelPreviewQuery = z.infer<typeof labelPreviewQuerySchema>

export type GenerateSSCCResponse = z.infer<typeof generateSSCCResponseSchema>
export type GenerateBOLResponse = z.infer<typeof generateBOLResponseSchema>
export type PrintLabelsResponse = z.infer<typeof printLabelsResponseSchema>
export type PrintPackingSlipResponse = z.infer<typeof printPackingSlipResponseSchema>
export type LabelPreviewResponse = z.infer<typeof labelPreviewResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>
