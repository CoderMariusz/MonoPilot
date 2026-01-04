/**
 * License Plate Types
 * Story 05.1: LP Table + CRUD
 */

export type LPStatus = 'available' | 'reserved' | 'consumed' | 'blocked'
export type QAStatus = 'pending' | 'passed' | 'failed' | 'quarantine'
export type LPSource = 'manual' | 'receipt' | 'production' | 'return' | 'adjustment' | 'split'

export interface LicensePlate {
  id: string
  org_id: string
  lp_number: string
  product_id: string
  quantity: number
  uom: string
  location_id: string
  warehouse_id: string
  status: LPStatus
  qa_status: QAStatus
  batch_number: string | null
  supplier_batch_number: string | null
  expiry_date: string | null
  manufacture_date: string | null
  source: LPSource
  po_number: string | null
  grn_id: string | null
  asn_id: string | null
  wo_id: string | null
  consumed_by_wo_id: string | null
  parent_lp_id: string | null
  pallet_id: string | null
  gtin: string | null
  sscc: string | null
  catch_weight_kg: number | null
  block_reason: string | null
  created_at: string
  created_by: string
  updated_at: string

  // Joined fields
  product?: {
    id: string
    name: string
    code: string
  }
  location?: {
    id: string
    full_path: string
    bin_code: string | null
  }
  warehouse?: {
    id: string
    name: string
    code: string
  }
  created_by_user?: {
    id: string
    name: string
  }
}

export interface LPListItem extends LicensePlate {
  days_to_expiry: number | null
}

export interface LPSummary {
  total_count: number
  total_quantity: number
  available_count: number
  available_percentage: number
  reserved_count: number
  reserved_percentage: number
  consumed_count: number
  blocked_count: number
  expiring_soon_count: number
  expiring_critical_count: number
  expired_count: number
}

export interface LPFilterParams {
  status?: LPStatus[]
  qa_status?: QAStatus[]
  warehouse_id?: string | null
  location_id?: string | null
  product_id?: string | null
  search?: string
  expiry_before?: string | null
  expiry_after?: string | null
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedLPResult {
  data: LPListItem[]
  meta: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface CreateLPInput {
  lp_number?: string
  product_id: string
  quantity: number
  uom: string
  location_id: string
  warehouse_id: string
  batch_number?: string
  supplier_batch_number?: string
  expiry_date?: string
  manufacture_date?: string
  source: LPSource
  po_number?: string
  grn_id?: string
  catch_weight_kg?: number
}

export interface UpdateLPInput {
  quantity?: number
  location_id?: string
  status?: LPStatus
  qa_status?: QAStatus
  expiry_date?: string
}

export interface BlockLPInput {
  reason: string
}

export interface UpdateQAStatusInput {
  qa_status: QAStatus
}

// LP Detail View (Story 05.6)
export interface LPDetailView extends LicensePlate {
  days_until_expiry?: number
}
