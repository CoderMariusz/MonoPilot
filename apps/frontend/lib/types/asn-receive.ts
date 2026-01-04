/**
 * ASN Receive Types (Story 05.9)
 * Purpose: TypeScript types for ASN receive workflow
 */

// Variance Reason
export type VarianceReason = 'damaged' | 'short-shipped' | 'over-shipped' | 'other'

// Variance Indicator
export type VarianceIndicator = 'under' | 'over' | 'exact'

// Variance Result
export interface VarianceResult {
  variance: number
  variance_percent: number
  indicator: VarianceIndicator
}

// ASN Receive Preview (GET response)
export interface ASNReceivePreview {
  asn: {
    id: string
    asn_number: string
    status: 'pending' | 'partial' | 'received' | 'cancelled'
    po_number: string
    supplier_name: string
    expected_date: string
  }
  items: ASNReceiveItemPreview[]
}

// ASN Receive Item Preview
export interface ASNReceiveItemPreview {
  id: string
  product_id: string
  product_name: string
  product_sku: string
  expected_qty: number
  received_qty: number
  remaining_qty: number
  uom: string
  supplier_batch_number: string | null
  gtin: string | null
  expiry_date: string | null
}

// ASN Receive Item Input
export interface ASNReceiveItem {
  asn_item_id: string
  received_qty: number
  batch_number?: string
  supplier_batch_number?: string
  expiry_date?: string
  manufacture_date?: string
  variance_reason?: VarianceReason
  variance_notes?: string
}

// ASN Receive Request (POST body)
export interface ASNReceiveRequest {
  warehouse_id: string
  location_id: string
  items: ASNReceiveItem[]
  notes?: string
}

// Variance Item (in result)
export interface VarianceItem {
  product_name: string
  expected_qty: number
  received_qty: number
  variance: number
  variance_percent: number
  variance_indicator: VarianceIndicator
}

// ASN Receive Result (POST response)
export interface ASNReceiveResult {
  grn_id: string
  grn_number: string
  status: 'completed'
  lps_created: number
  asn_status: 'partial' | 'received'
  variances: VarianceItem[]
}

// Over-receipt validation result
export interface OverReceiptValidation {
  allowed: boolean
  max_allowed: number
  exceeds_tolerance: boolean
}

// ASN Status Update Result
export interface ASNStatusUpdate {
  status: 'pending' | 'partial' | 'received'
  actual_date: string | null
}
