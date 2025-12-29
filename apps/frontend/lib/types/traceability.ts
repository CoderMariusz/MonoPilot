// TypeScript types for Traceability (Epic 2 Batch 2D)

// ============================================================================
// Traceability Configuration Types (Story 02.10a)
// ============================================================================

/**
 * Traceability configuration stored in product_traceability_config table
 */
export interface TraceabilityConfig {
  id: string
  org_id: string
  product_id: string
  lot_number_format: string
  lot_number_prefix: string
  lot_number_sequence_length: number
  traceability_level: TraceabilityLevel
  standard_batch_size: number | null
  min_batch_size: number | null
  max_batch_size: number | null
  expiry_calculation_method: ExpiryCalculationMethod
  processing_buffer_days: number
  gs1_lot_encoding_enabled: boolean
  gs1_expiry_encoding_enabled: boolean
  gs1_sscc_enabled: boolean
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  _isDefault?: boolean // Flag indicating default values (not saved in DB)
}

/**
 * Input type for creating/updating traceability configuration
 */
export interface TraceabilityConfigInput {
  lot_number_format?: string
  lot_number_prefix?: string
  lot_number_sequence_length?: number
  traceability_level?: TraceabilityLevel
  standard_batch_size?: number | null
  min_batch_size?: number | null
  max_batch_size?: number | null
  expiry_calculation_method?: ExpiryCalculationMethod
  processing_buffer_days?: number
  gs1_lot_encoding_enabled?: boolean
  gs1_expiry_encoding_enabled?: boolean
  gs1_sscc_enabled?: boolean
}

/**
 * Parsed lot format components
 */
export interface LotFormatParts {
  prefix: string
  placeholders: LotFormatPlaceholder[]
  separators: string[]
}

/**
 * Individual placeholder in lot format
 */
export interface LotFormatPlaceholder {
  type: 'YYYY' | 'YY' | 'MM' | 'DD' | 'SEQ' | 'JULIAN' | 'PROD' | 'LINE' | 'YYMMDD'
  length?: number // For SEQ:N
  position: number
}

/**
 * GS1 data structure for barcode generation
 */
export interface GS1Data {
  gtin?: string
  lotNumber?: string
  expiryDate?: Date
  sscc?: string
  serialNumber?: string
  quantity?: number
}

/**
 * Traceability tracking granularity levels
 */
export type TraceabilityLevel = 'lot' | 'batch' | 'serial'

/**
 * Methods for calculating expiry dates
 */
export type ExpiryCalculationMethod = 'fixed_days' | 'rolling' | 'manual'

// ============================================================================
// License Plate Types (Epic 05)
// ============================================================================

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
