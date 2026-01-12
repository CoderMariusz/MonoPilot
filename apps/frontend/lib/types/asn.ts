/**
 * ASN (Advance Shipping Notice) Types
 * Story 05.8: ASN Management
 * Purpose: TypeScript types for ASN workflow
 */

// ASN Status
export type ASNStatus = 'pending' | 'partial' | 'received' | 'cancelled'

// Base ASN Interface
export interface ASN {
  id: string
  org_id: string
  asn_number: string
  po_id: string
  supplier_id: string
  expected_date: string
  actual_date?: string | null
  carrier?: string | null
  tracking_number?: string | null
  status: ASNStatus
  notes?: string | null
  created_at: string
  created_by: string
  updated_at: string
}

// ASN Item
export interface ASNItem {
  id: string
  asn_id: string
  product_id: string
  po_line_id?: string | null
  expected_qty: number
  received_qty: number
  uom: string
  supplier_lp_number?: string | null
  supplier_batch_number?: string | null
  gtin?: string | null
  expiry_date?: string | null
  notes?: string | null
}

// ASN with Details (includes related data)
export interface ASNWithDetails extends ASN {
  items: ASNItem[]
  supplier_name: string
  po_number: string
}

// ASN List Item (for table display)
export interface ASNListItem {
  id: string
  asn_number: string
  po_number: string
  supplier_name: string
  expected_date: string
  status: ASNStatus
  items_count: number
  created_at: string
}

// ASN Filters
export interface ASNFilters {
  search?: string
  status?: ASNStatus
  supplier_id?: string
  po_id?: string
  date_from?: string
  date_to?: string
  sort?: 'asn_number' | 'expected_date' | 'created_at'
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Create ASN Input
export interface CreateASNInput {
  po_id: string
  expected_date: string
  carrier?: string
  tracking_number?: string
  notes?: string
  items: CreateASNItemInput[]
}

// Update ASN Input
export interface UpdateASNInput {
  expected_date?: string
  carrier?: string
  tracking_number?: string
  notes?: string
}

// Create ASN Item Input
export interface CreateASNItemInput {
  product_id: string
  po_line_id?: string
  expected_qty: number
  uom: string
  supplier_lp_number?: string
  supplier_batch_number?: string
  gtin?: string
  expiry_date?: string
  notes?: string
}

// Update ASN Item Input
export interface UpdateASNItemInput {
  expected_qty?: number
  uom?: string
  supplier_lp_number?: string
  supplier_batch_number?: string
  gtin?: string
  expiry_date?: string
  notes?: string
}

// Create ASN from PO Input
export interface CreateASNFromPOInput {
  po_id: string
  expected_date: string
  carrier?: string
  tracking_number?: string
  notes?: string
  item_overrides?: Array<{
    po_line_id: string
    expected_qty?: number
    supplier_batch_number?: string
    gtin?: string
    expiry_date?: string
  }>
}

// Paginated Result
export interface PaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// ASN Status Badge Colors
export const ASN_STATUS_COLORS: Record<ASNStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  partial: { bg: 'bg-blue-100', text: 'text-blue-800' },
  received: { bg: 'bg-green-100', text: 'text-green-800' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
}

// ASN Status Labels
export const ASN_STATUS_LABELS: Record<ASNStatus, string> = {
  pending: 'Pending',
  partial: 'Partial',
  received: 'Received',
  cancelled: 'Cancelled',
}

// =============================================================================
// Story 05.9: ASN Receive Workflow Types
// NOTE: Primary types are in asn-receive.ts. Import from there.
// =============================================================================

// Re-export from asn-receive.ts for backward compatibility
export type {
  VarianceReason,
  VarianceIndicator,
  ASNReceiveItemPreview,
  ASNReceivePreview,
  ASNReceiveItem,
  ASNReceiveRequest,
  VarianceItem,
  ASNReceiveResult,
} from './asn-receive'

export { VARIANCE_REASON_LABELS } from './asn-receive'
