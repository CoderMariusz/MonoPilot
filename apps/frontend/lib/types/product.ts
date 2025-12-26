/**
 * Product Types (Story 02.1)
 * TypeScript interfaces for products and product types
 */

export interface ProductType {
  id: string
  org_id: string
  code: 'RM' | 'WIP' | 'FG' | 'PKG' | 'BP'
  name: string
  description?: string | null
  color?: string | null
  is_default: boolean
  is_active: boolean
  display_order?: number | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  org_id: string
  code: string
  name: string
  description?: string | null
  product_type_id: string
  base_uom: string
  status: 'active' | 'inactive' | 'discontinued'
  version: number
  barcode?: string | null
  gtin?: string | null
  category_id?: string | null
  supplier_id?: string | null
  lead_time_days?: number | null
  moq?: number | null
  std_price?: number | null
  cost_per_unit?: number | null
  min_stock?: number | null
  max_stock?: number | null
  expiry_policy?: 'fixed' | 'rolling' | 'none'
  shelf_life_days?: number | null
  storage_conditions?: string | null
  is_perishable?: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
  updated_by?: string | null
  deleted_at?: string | null
}

export interface CreateProductInput {
  code: string
  name: string
  description?: string | null
  product_type_id: string
  base_uom: string
  barcode?: string | null
  gtin?: string | null
  category_id?: string | null
  supplier_id?: string | null
  lead_time_days?: number | null
  moq?: number | null
  std_price?: number | null
  cost_per_unit?: number | null
  min_stock?: number | null
  max_stock?: number | null
  expiry_policy?: 'fixed' | 'rolling' | 'none'
  shelf_life_days?: number | null
  storage_conditions?: string | null
  is_perishable?: boolean
  status?: 'active' | 'inactive'
}

export interface UpdateProductInput {
  name?: string
  description?: string | null
  base_uom?: string
  barcode?: string | null
  gtin?: string | null
  category_id?: string | null
  supplier_id?: string | null
  lead_time_days?: number | null
  moq?: number | null
  std_price?: number | null
  cost_per_unit?: number | null
  min_stock?: number | null
  max_stock?: number | null
  expiry_policy?: 'fixed' | 'rolling' | 'none'
  shelf_life_days?: number | null
  storage_conditions?: string | null
  is_perishable?: boolean
  status?: 'active' | 'inactive' | 'discontinued'
}

export interface ProductListParams {
  page?: number
  limit?: number
  search?: string
  type?: string
  status?: string
  sort?: 'code' | 'name' | 'created_at' | 'updated_at'
  order?: 'asc' | 'desc'
}

export interface PaginatedProductsResult {
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ProductTypeSelectOption {
  value: string
  label: string
  code: string
  color?: string | null
}
