/**
 * Variance Analysis Types (Story 02.15)
 * Type definitions for cost variance analysis
 */

/**
 * Product cost record (imported from cost-history for variance calculation)
 */
export interface ProductCost {
  id: string
  product_id: string
  org_id: string
  cost_type: 'standard' | 'actual' | 'planned'
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  cost_per_unit: number | null
  effective_from: string
  effective_to: string | null
  created_at: string
  created_by: string | null
  bom_version: number | null
}

/**
 * Work order cost record
 */
export interface WorkOrderCost {
  id: string
  work_order_id: string
  org_id: string
  product_id: string
  material_cost: number
  labor_cost: number
  overhead_cost: number
  total_cost: number
  created_at: string
  created_by: string | null
}

/**
 * Variance component (standard vs actual)
 */
export interface VarianceComponent {
  standard: number
  actual: number
  variance: number
  variance_percent: number
}

/**
 * All variance components
 */
export interface VarianceComponents {
  material: VarianceComponent
  labor: VarianceComponent
  overhead: VarianceComponent
  total: VarianceComponent
}

/**
 * Significant variance flagged for attention
 */
export interface SignificantVariance {
  component: string
  variance_percent: number
  threshold: number
  direction: 'over' | 'under'
}

/**
 * Variance report from calculateVariance
 */
export interface VarianceReport {
  components: VarianceComponents | null
  significant_variances: SignificantVariance[]
  work_orders_analyzed: number
}

/**
 * Work order detail for variance report
 */
export interface WorkOrderVarianceDetail {
  work_order_id: string
  work_order_code: string
  standard_cost: number
  actual_cost: number
  variance: number
  variance_percent: number
  completed_at: string
}

/**
 * Full variance report API response
 */
export interface VarianceReportResponse {
  product_id: string
  period_days: number
  work_orders_analyzed: number
  components: VarianceComponents | null
  significant_variances: SignificantVariance[]
  work_order_details: WorkOrderVarianceDetail[]
}
