// TypeScript types for Dashboard (Stories 2.23, 2.24)

export interface ProductGroup {
  category: 'RM' | 'WIP' | 'FG'
  label: string
  count: number
  products: ProductSummary[]
  recent_changes: ProductChange[]
}

export interface ProductSummary {
  id: string
  code: string
  name: string
  version: number
  status: string
  updated_at: string
  allergen_count?: number
}

export interface ProductChange {
  product_id: string
  product_code: string
  change_type: 'created' | 'updated' | 'version_created'
  changed_at: string
  changed_by: string
}

export interface DashboardStats {
  total_products: number
  active_products: number
  recent_updates: number
}

export interface ProductDashboardResponse {
  groups: ProductGroup[]
  overall_stats: DashboardStats
}

export interface AllergenMatrixRow {
  product_id: string
  product_code: string
  product_name: string
  product_type: string
  allergens: Record<string, 'contains' | 'may_contain' | 'none'>
  allergen_count: number
}

export interface AllergenMatrixResponse {
  matrix: AllergenMatrixRow[]
  allergens: { id: string; name: string; code: string }[]
  total: number
}
