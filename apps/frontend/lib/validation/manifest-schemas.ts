/**
 * Shipment Manifest & Ship Validation Schemas (Story 07.14)
 * Purpose: Zod validation schemas for manifest, ship, deliver, and tracking API endpoints
 *
 * Exports:
 * - manifestShipmentSchema - Request body for POST /manifest (empty object)
 * - shipShipmentSchema - Request body for POST /ship (requires confirm=true)
 * - markDeliveredSchema - Request body for POST /mark-delivered (empty object)
 * - trackingInfoSchema - Response schema for GET /tracking
 *
 * AC Coverage:
 * - AC-1 to AC-3: Manifest validates SSCC completeness
 * - AC-4 to AC-11: Ship requires confirmation, consumes LPs, updates SO
 * - AC-12 to AC-14: Mark Delivered (Manager+ only)
 * - AC-15 to AC-16: Tracking timeline and carrier URL
 */

import { z } from 'zod'

// =============================================================================
// Shipment Status Enum
// =============================================================================

export const SHIPMENT_STATUSES = [
  'pending',
  'packing',
  'packed',
  'manifested',
  'shipped',
  'delivered',
  'exception',
] as const

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number]

export const shipmentStatusEnum = z.enum(SHIPMENT_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${SHIPMENT_STATUSES.join(', ')}`,
  }),
})

// =============================================================================
// Carrier Enum
// =============================================================================

export const CARRIERS = ['DHL', 'UPS', 'DPD', 'FedEx'] as const
export type Carrier = (typeof CARRIERS)[number]

// =============================================================================
// Manifest Shipment Schema
// =============================================================================

/**
 * Request body for POST /api/shipping/shipments/:id/manifest
 * Empty object - no body required, shipment ID from URL params
 */
export const manifestShipmentSchema = z.object({})

export type ManifestShipmentInput = z.infer<typeof manifestShipmentSchema>

// =============================================================================
// Ship Shipment Schema
// =============================================================================

/**
 * Request body for POST /api/shipping/shipments/:id/ship
 * Requires explicit confirmation for irreversible action
 */
export const shipShipmentSchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({
      message: 'Ship action requires explicit confirmation (confirm=true)',
    }),
  }),
})

export type ShipShipmentInput = z.infer<typeof shipShipmentSchema>

// =============================================================================
// Mark Delivered Schema
// =============================================================================

/**
 * Request body for POST /api/shipping/shipments/:id/mark-delivered
 * Empty object - no body required
 */
export const markDeliveredSchema = z.object({})

export type MarkDeliveredInput = z.infer<typeof markDeliveredSchema>

// =============================================================================
// Tracking Info Response Schema
// =============================================================================

/**
 * Timeline object in tracking response
 */
export const trackingTimelineSchema = z.object({
  packed_at: z.string().datetime().nullable(),
  packed_by: z.string().nullable(),
  manifested_at: z.string().datetime().nullable(),
  manifested_by: z.string().nullable(),
  shipped_at: z.string().datetime().nullable(),
  shipped_by: z.string().nullable(),
  delivered_at: z.string().datetime().nullable(),
  delivered_by: z.string().nullable(),
})

export type TrackingTimeline = z.infer<typeof trackingTimelineSchema>

/**
 * Full tracking info response schema
 */
export const trackingInfoSchema = z.object({
  shipment_id: z.string().uuid(),
  shipment_number: z.string(),
  sales_order_number: z.string().nullable(),
  carrier: z.string().nullable(),
  tracking_number: z.string().nullable(),
  status: shipmentStatusEnum,
  timeline: trackingTimelineSchema,
  external_url: z.string().url().nullable(),
})

export type TrackingInfo = z.infer<typeof trackingInfoSchema>

// =============================================================================
// Response Schemas
// =============================================================================

/**
 * Manifest response schema
 */
export const manifestResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    shipment_number: z.string(),
    status: z.literal('manifested'),
    manifested_at: z.string().datetime(),
    packed_at: z.string().datetime().nullable(),
    box_count: z.number().int(),
    boxes: z.array(
      z.object({
        id: z.string().uuid(),
        box_number: z.number().int(),
        sscc: z.string(),
        validated: z.boolean(),
      })
    ),
  }),
})

export type ManifestResponse = z.infer<typeof manifestResponseSchema>

/**
 * Ship response schema
 */
export const shipResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    shipment_number: z.string(),
    status: z.literal('shipped'),
    shipped_at: z.string().datetime(),
    shipped_by: z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
    sales_order: z.object({
      id: z.string().uuid(),
      order_number: z.string(),
      status: z.string(),
      shipped_at: z.string().datetime(),
    }),
    license_plates_consumed: z.number().int(),
    sales_order_lines_updated: z.number().int(),
  }),
})

export type ShipResponse = z.infer<typeof shipResponseSchema>

/**
 * Mark delivered response schema
 */
export const markDeliveredResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    id: z.string().uuid(),
    shipment_number: z.string(),
    status: z.literal('delivered'),
    delivered_at: z.string().datetime(),
    delivered_by: z.object({
      id: z.string().uuid(),
      name: z.string(),
    }),
    sales_order: z.object({
      id: z.string().uuid(),
      order_number: z.string(),
      status: z.string(),
    }),
  }),
})

export type MarkDeliveredResponse = z.infer<typeof markDeliveredResponseSchema>

// =============================================================================
// Error Response Schema
// =============================================================================

/**
 * Standard error response schema for manifest/ship/deliver endpoints
 */
export const manifestShipErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.enum([
      'SSCC_VALIDATION_FAILED',
      'INVALID_STATUS',
      'NOT_FOUND',
      'FORBIDDEN',
      'NOT_MANIFESTED',
      'CONFIRMATION_REQUIRED',
      'TRANSACTION_FAILED',
      'INSUFFICIENT_PERMISSIONS',
      'INTERNAL_ERROR',
    ]),
    message: z.string(),
    current_status: z.string().optional(),
    allowed_statuses: z.array(z.string()).optional(),
    missing_boxes: z
      .array(
        z.object({
          box_number: z.number().int(),
          id: z.string().uuid(),
        })
      )
      .optional(),
    required_roles: z.array(z.string()).optional(),
    user_role: z.string().optional(),
  }),
})

export type ManifestShipError = z.infer<typeof manifestShipErrorSchema>
