/**
 * Packing Scanner Validation Schemas (Story 07.12)
 * Purpose: Zod validation schemas for packing scanner operations
 */

import { z } from 'zod'

// =============================================================================
// Pack Item Schema - Main packing transaction
// =============================================================================

export const packItemSchema = z.object({
  shipment_id: z.string({ required_error: 'Shipment ID is required' }).uuid('Invalid shipment ID'),
  box_id: z.string({ required_error: 'Box ID is required' }).uuid('Invalid box ID'),
  license_plate_id: z.string({ required_error: 'LP ID is required' }).uuid('Invalid LP ID'),
  so_line_id: z.string({ required_error: 'SO line ID is required' }).uuid('Invalid SO line ID'),
  quantity: z.number({ required_error: 'Quantity is required' })
    .positive('Quantity must be positive')
    .max(999999999, 'Quantity too large'),
  notes: z.string().max(500, 'Notes max 500 characters').optional().nullable(),
})

export type PackItemInput = z.infer<typeof packItemSchema>

// =============================================================================
// Create Box Schema
// =============================================================================

export const createBoxSchema = z.object({
  shipment_id: z.string({ required_error: 'Shipment ID is required' }).uuid('Invalid shipment ID'),
})

export type CreateBoxInput = z.infer<typeof createBoxSchema>

// =============================================================================
// Close Box Schema
// =============================================================================

export const closeBoxSchema = z.object({
  box_id: z.string({ required_error: 'Box ID is required' }).uuid('Invalid box ID'),
  weight: z.number().positive('Weight must be positive').max(1000, 'Weight max 1000 kg').optional().nullable(),
  length: z.number().positive('Length must be positive').max(500, 'Length max 500 cm').optional().nullable(),
  width: z.number().positive('Width must be positive').max(500, 'Width max 500 cm').optional().nullable(),
  height: z.number().positive('Height must be positive').max(500, 'Height max 500 cm').optional().nullable(),
})

export type CloseBoxInput = z.infer<typeof closeBoxSchema>

// =============================================================================
// Pending Shipments Query Schema
// =============================================================================

export const pendingShipmentsQuerySchema = z.object({
  warehouse_id: z.string().uuid('Invalid warehouse ID').optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit max 100').default(50),
})

export type PendingShipmentsQuery = z.infer<typeof pendingShipmentsQuerySchema>

// =============================================================================
// Lookup Barcode Schema
// =============================================================================

export const lookupBarcodeSchema = z.object({
  barcode: z.string({ required_error: 'Barcode is required' })
    .min(1, 'Barcode required')
    .max(100, 'Barcode too long'),
})

export type LookupBarcodeInput = z.infer<typeof lookupBarcodeSchema>

// =============================================================================
// Response Types
// =============================================================================

export interface BoxContent {
  id: string
  quantity: number
  product_name: string
  lot_number: string | null
}

export interface BoxSummaryItem {
  product_name: string
  quantity: number
  uom: string
}

export interface BoxSummary {
  item_count: number
  total_weight_est: number
  items: BoxSummaryItem[]
}

export interface SOLineStatus {
  packed_qty: number
  remaining_qty: number
  status: 'partial' | 'complete'
}

export interface AllergenWarning {
  matches: string[]
  customer_name: string
  product_name: string
}

export interface PackItemResult {
  box_content: BoxContent
  box_summary: BoxSummary
  so_line_status: SOLineStatus
  allergen_warning: AllergenWarning | null
}

export interface ShipmentBox {
  id: string
  box_number: number
  status: 'open' | 'closed'
  weight: number | null
  dimensions?: {
    length: number | null
    width: number | null
    height: number | null
  }
  org_id?: string
}

export interface BoxContentDetail {
  id: string
  product_name: string
  lot_number: string | null
  lp_number: string
  quantity: number
}

export interface BoxDetails {
  box: ShipmentBox
  contents: BoxContentDetail[]
  summary: BoxSummary
}

export interface PendingShipmentSummary {
  id: string
  shipment_number: string
  so_number: string
  customer_name: string
  status: 'pending' | 'packing'
  promised_ship_date: string | null
  lines_total: number
  lines_packed: number
  boxes_count: number
  allergen_alert: boolean
  warehouse_id?: string
  org_id?: string
}

export interface LPAllocationResult {
  lp: {
    id: string
    lp_number: string
    product_id: string
    product_name: string
    quantity: number
    lot_number: string | null
  }
  allocated: boolean
  so_line_id: string | null
  available_qty: number
}

export interface ShipmentLookupResult {
  id: string
  shipment_number: string
  so_number: string
  customer_name: string
  lines_total: number
  allergen_restrictions: string[]
}

export interface LookupResponse {
  type: 'shipment' | 'license_plate'
  data: ShipmentLookupResult | LPAllocationResult
}
