// TypeScript types for Traceability (Epic 2 Batch 2D)

export interface LicensePlate {
  id: string
  lp_number: string
  batch_number: string | null
  product_id: string
  quantity: number
  uom: string
  status: 'available' | 'consumed' | 'shipped' | 'quarantine' | 'recalled'
  location_id: string | null
  manufacturing_date: string | null
  expiry_date: string | null
}

export interface TraceNode {
  lp: LicensePlate
  product_code: string
  product_name: string
  relationship_type: 'split' | 'combine' | 'transform' | null
  children: TraceNode[]
  depth: number
  quantity_from_parent?: number
}

export interface TraceSummary {
  total_descendants?: number
  total_ancestors?: number
  total_work_orders?: number
  max_depth: number
}

export interface TraceResult {
  root_lp: LicensePlate
  trace_tree: TraceNode[]
  summary: TraceSummary
}

// Recall Simulation Types (Story 2.20)

export interface RecallSummary {
  total_affected_lps: number
  total_quantity: number
  total_estimated_value: number
  status_breakdown: {
    available: number
    in_production: number
    shipped: number
    consumed: number
    quarantine: number
  }
  affected_warehouses: number
  affected_customers: number
}

export interface LocationAnalysis {
  warehouse_id: string
  warehouse_name: string
  affected_lps: number
  total_quantity: number
  zones: string[]
}

export interface CustomerImpact {
  customer_id: string
  customer_name: string
  contact_email: string | null
  shipped_quantity: number
  ship_date: string
  notification_status: 'draft' | 'pending' | 'sent'
}

export interface FinancialImpact {
  product_value: number
  retrieval_cost: number
  disposal_cost: number
  lost_revenue: number
  total_estimated_cost: number
  confidence_interval: string
}

export interface RegulatoryInfo {
  reportable_to_fda: boolean
  report_due_date: string | null
  report_status: 'draft' | 'not_filed' | 'filed'
  affected_product_types: string[]
}

export interface RecallSimulationResult {
  simulation_id: string
  root_lp: LicensePlate
  forward_trace: TraceNode[]
  backward_trace: TraceNode[]
  summary: RecallSummary
  locations: LocationAnalysis[]
  customers: CustomerImpact[]
  financial: FinancialImpact
  regulatory: RegulatoryInfo
  execution_time_ms: number
  created_at: string
}
