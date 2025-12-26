/**
 * BOM (Bill of Materials) Types (Story 02.4)
 * Type definitions for BOM management
 */

export type BOMStatus = 'draft' | 'active' | 'phased_out' | 'inactive'

export interface BOM {
  id: string
  org_id: string
  product_id: string
  version: number
  bom_type: string
  routing_id: string | null
  effective_from: string
  effective_to: string | null
  status: BOMStatus
  output_qty: number
  output_uom: string
  units_per_box: number | null
  boxes_per_pallet: number | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface BOMWithProduct extends BOM {
  product: {
    id: string
    code: string
    name: string
    type: string
    uom: string
  }
}

export interface BOMsListResponse {
  boms: BOMWithProduct[]
  total: number
  page: number
  limit: number
}

export interface BOMFilters {
  page?: number
  limit?: number
  search?: string
  status?: BOMStatus
  product_type?: string
  effective_date?: 'current' | 'future' | 'expired'
  product_id?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateBOMRequest {
  product_id: string
  effective_from: string
  effective_to?: string | null
  status?: 'draft' | 'active'
  output_qty: number
  output_uom: string
  notes?: string | null
}

export interface UpdateBOMRequest {
  effective_from?: string
  effective_to?: string | null
  status?: BOMStatus
  output_qty?: number
  output_uom?: string
  notes?: string | null
}

export interface BOMTimelineResponse {
  product: {
    id: string
    code: string
    name: string
  }
  versions: BOMTimelineVersion[]
  current_date: string
}

export interface BOMTimelineVersion {
  id: string
  version: number
  status: BOMStatus
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  notes: string | null
  is_currently_active: boolean
  has_overlap: boolean
}

export interface BOMFormData {
  product_id: string
  effective_from: string
  effective_to: string | null
  status: 'draft' | 'active'
  output_qty: number
  output_uom: string
  notes: string | null
}

export interface DateOverlapResult {
  overlaps: boolean
  conflictingBom?: BOM
}

export interface WorkOrderReference {
  id: string
  wo_number: string
}
