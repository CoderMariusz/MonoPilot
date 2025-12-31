/**
 * Supplier Types
 * Story: 03.1 - Suppliers CRUD + Master Data
 */

import type { TaxCode } from './tax-code'

export interface Supplier {
  id: string
  org_id: string
  code: string
  name: string
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  currency: 'PLN' | 'EUR' | 'USD' | 'GBP'
  tax_code_id: string
  tax_code?: TaxCode
  payment_terms: string
  notes: string | null
  is_active: boolean
  // Phase 3 fields
  approved_supplier: boolean
  supplier_rating: number | null
  last_audit_date: string | null
  next_audit_due: string | null
  // Computed
  products_count?: number
  has_open_pos?: boolean
  purchase_orders_count?: number
  // Audit
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface SupplierSummary {
  total_count: number
  active_count: number
  inactive_count: number
  active_rate: number
  this_month_count: number
}

export type SupplierStatusFilter = 'all' | 'active' | 'inactive'

export interface SupplierFilters {
  status: SupplierStatusFilter
  currency: string[]
  payment_terms: string | null
  search: string
}

export interface SupplierListParams extends Partial<SupplierFilters> {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface CreateSupplierDto {
  code: string
  name: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  currency: 'PLN' | 'EUR' | 'USD' | 'GBP'
  tax_code_id: string
  payment_terms: string
  notes?: string
  is_active?: boolean
}

export interface UpdateSupplierDto extends Partial<Omit<CreateSupplierDto, 'code'>> {
  code?: string // Optional because it may be locked
}

export interface BulkActionResult {
  success_count: number
  failed_count: number
  results: Array<{
    id: string
    code?: string
    status: 'success' | 'failed'
    error?: string
  }>
}

export interface ValidationResult {
  allowed: boolean
  reason?: string
  message?: string
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  pages: number
}

export interface SupplierListResponse {
  data: Supplier[]
  meta: PaginationMeta
}

export interface SupplierProduct {
  id: string
  supplier_id: string
  product_id: string
  supplier_product_code: string | null
  is_default: boolean
  unit_price: number | null
  currency: string | null
  lead_time_days: number | null
  moq: number | null
  order_multiple: number | null
  last_purchase_date: string | null
  last_purchase_price: number | null
  notes: string | null
  product?: {
    id: string
    code: string
    name: string
    uom: string
  }
}

export interface SupplierPurchaseOrder {
  id: string
  po_number: string
  status: string
  created_at: string
  expected_delivery_date: string | null
  total: number
  currency: string
  receive_percent: number
}

export interface SupplierPOSummary {
  total_orders: number
  total_value: number
  currency: string
  avg_lead_time_days: number
  on_time_delivery_percent: number
  quality_rating: number | null
  open_pos: number
}
