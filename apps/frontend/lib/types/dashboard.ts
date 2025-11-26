// TypeScript types for Dashboard (Stories 2.23, 2.24)

// Product Category type
export type ProductCategory = 'RM' | 'WIP' | 'FG'

// Allergen Status - includes 'unknown' for not declared
export type AllergenStatus = 'contains' | 'may_contain' | 'none' | 'unknown'

export interface ProductGroup {
  category: ProductCategory
  label: string
  count: number
  percentage: number
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
  has_bom?: boolean
  bom_count?: number
}

export interface ProductChange {
  product_id: string
  product_code: string
  product_name: string
  change_type: 'created' | 'updated' | 'version_created' | 'deleted'
  changed_at: string
  changed_by: string
  changed_by_name?: string
}

export interface DashboardStats {
  total_products: number
  active_products: number
  recent_updates: number
  trend_this_month?: number
}

export interface CategoryStats {
  category: ProductCategory
  count: number
  percentage: number
}

export interface ProductDashboardResponse {
  groups: ProductGroup[]
  overall_stats: DashboardStats
  category_stats: CategoryStats[]
}

// Recent Activity Feed (AC-2.23.6)
export interface RecentActivityItem {
  id: string
  product_id: string
  product_code: string
  product_name: string
  change_type: 'created' | 'updated' | 'version_created' | 'deleted'
  changed_at: string
  changed_by: string
  changed_by_name?: string
  details?: string
}

export interface RecentActivityResponse {
  activities: RecentActivityItem[]
  total: number
}

// Allergen Matrix Types
export interface AllergenMatrixRow {
  product_id: string
  product_code: string
  product_name: string
  product_type: ProductCategory
  allergens: Record<string, AllergenStatus>
  allergen_count: number
}

export interface AllergenInfo {
  id: string
  code: string
  name: string
  is_eu_mandatory?: boolean
}

export interface AllergenMatrixResponse {
  matrix: AllergenMatrixRow[]
  allergens: AllergenInfo[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Allergen Insights (AC-2.24.9)
export interface AllergenInsights {
  high_risk_products: {
    count: number
    products: Array<{
      id: string
      code: string
      name: string
      allergen_count: number
    }>
  }
  missing_declarations: {
    count: number
    products: Array<{
      id: string
      code: string
      name: string
    }>
  }
  most_common_allergens: Array<{
    allergen_id: string
    allergen_name: string
    product_count: number
    percentage: number
  }>
  cross_contamination_alerts: {
    count: number
    products: Array<{
      id: string
      code: string
      name: string
    }>
  }
}

// Export Types
export type ExportFormat = 'excel' | 'csv' | 'pdf'

export interface ExportRequest {
  filters?: {
    product_types?: string[]
    allergen_ids?: string[]
    allergen_count_min?: number
    allergen_count_max?: number
    search?: string
  }
  format: ExportFormat
}

export interface ExportResponse {
  file_url: string
  filename: string
}
