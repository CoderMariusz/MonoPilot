/**
 * Quality Module Types
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Type definitions for quality specifications and related entities
 */

/**
 * Quality Specification Status
 * - draft: Initial state, editable
 * - active: Approved and in use
 * - expired: Past expiry_date
 * - superseded: Replaced by newer version
 */
export type SpecificationStatus = 'draft' | 'active' | 'expired' | 'superseded';

/**
 * Review Status for display
 * - ok: More than 30 days until review
 * - due_soon: Within 30 days of review
 * - overdue: Past review date
 */
export type ReviewStatus = 'ok' | 'due_soon' | 'overdue';

/**
 * Quality Specification Entity
 * Represents a versioned product quality specification
 */
export interface QualitySpecification {
  id: string;
  org_id: string;
  product_id: string;
  product_code?: string;
  product_name?: string;
  spec_number: string;
  version: number;
  name: string;
  description?: string | null;
  effective_date: string; // ISO date (YYYY-MM-DD)
  expiry_date?: string | null;
  status: SpecificationStatus;
  approved_by?: string | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  superseded_by?: string | null;
  superseded_at?: string | null;
  review_frequency_days: number;
  next_review_date?: string | null;
  last_review_date?: string | null;
  notes?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
  // Computed fields
  review_status: ReviewStatus;
  days_until_review?: number;
  version_count: number;
}

/**
 * Version History Entry
 * Summary of a specification version for history display
 */
export interface VersionHistoryEntry {
  id: string;
  version: number;
  status: SpecificationStatus;
  effective_date: string;
  approved_by_name?: string | null;
}

/**
 * Specification List Response
 * Paginated list of specifications
 */
export interface SpecificationsListResponse {
  specifications: QualitySpecification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Specification Detail Response
 * Single specification with version history
 */
export interface SpecificationDetailResponse {
  specification: QualitySpecification;
  version_history: VersionHistoryEntry[];
  parameters_count: number;
}

/**
 * Create Specification Input
 * Required fields for creating a new specification
 */
export interface CreateSpecificationInput {
  product_id: string;
  name: string;
  description?: string | null;
  effective_date: string;
  expiry_date?: string | null;
  review_frequency_days?: number;
  notes?: string | null;
}

/**
 * Update Specification Input
 * Fields that can be updated on a draft specification
 */
export interface UpdateSpecificationInput {
  name?: string;
  description?: string | null;
  effective_date?: string;
  expiry_date?: string | null;
  review_frequency_days?: number;
  notes?: string | null;
}

/**
 * Approve Specification Request
 */
export interface ApproveSpecificationRequest {
  approval_notes?: string;
}

/**
 * Approve Specification Response (internal service)
 * Note: API converts to specification/superseded_specs in response
 */
export interface ApproveSpecificationResponse {
  spec: QualitySpecification;
  superseded: Array<{ id: string; spec_number: string; version: number }>;
}

/**
 * Approve Specification API Response (from API)
 */
export interface ApproveSpecificationAPIResponse {
  specification: QualitySpecification;
  superseded_specs: Array<{ id: string; spec_number: string; version: number }>;
}

/**
 * Clone Specification Response
 */
export interface CloneSpecificationResponse {
  specification: QualitySpecification;
}

/**
 * Product Specifications Response
 * All specifications for a product
 */
export interface ProductSpecificationsResponse {
  specifications: QualitySpecification[];
  active_spec_id?: string | null;
}

/**
 * Active Specification Response
 * Single active specification for a product
 */
export interface ActiveSpecificationResponse {
  specification: QualitySpecification;
}

/**
 * Complete Review Request
 */
export interface CompleteReviewRequest {
  review_notes?: string;
}

/**
 * Complete Review Response
 */
export interface CompleteReviewResponse {
  specification: QualitySpecification;
  previous_review_date?: string | null;
  next_review_date: string;
}

/**
 * Specification List Query Params
 */
export interface SpecificationListParams {
  page?: number;
  limit?: number;
  status?: SpecificationStatus;
  product_id?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ============================================
// Quality Spec Parameters (Story 06.4)
// ============================================

/**
 * Parameter Type Enum
 * - numeric: Has min/max values (at least one required)
 * - text: Free text, manually evaluated
 * - boolean: Yes/No evaluation
 * - range: Both min and max required
 */
export type ParameterType = 'numeric' | 'text' | 'boolean' | 'range';

/**
 * Quality Spec Parameter Entity
 * Represents a test parameter within a specification
 */
export interface QualitySpecParameter {
  id: string;
  spec_id: string;
  sequence: number;
  parameter_name: string;
  parameter_type: ParameterType;
  target_value?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
  test_method?: string | null;
  instrument_required: boolean;
  instrument_id?: string | null;
  instrument_name?: string | null; // Resolved from machines table
  is_critical: boolean;
  acceptance_criteria?: string | null;
  sampling_instructions?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
}

/**
 * Create Parameter Request
 * Required fields for creating a new parameter
 */
export interface CreateParameterRequest {
  parameter_name: string;
  parameter_type: ParameterType;
  target_value?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
  test_method?: string | null;
  instrument_required?: boolean;
  instrument_id?: string | null;
  is_critical?: boolean;
  acceptance_criteria?: string | null;
  sampling_instructions?: string | null;
}

/**
 * Update Parameter Request
 * Partial fields for updating a parameter
 */
export interface UpdateParameterRequest {
  parameter_name?: string;
  parameter_type?: ParameterType;
  target_value?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
  test_method?: string | null;
  instrument_required?: boolean;
  instrument_id?: string | null;
  is_critical?: boolean;
  acceptance_criteria?: string | null;
  sampling_instructions?: string | null;
}

/**
 * Reorder Parameters Request
 */
export interface ReorderParametersRequest {
  parameter_ids: string[];
}

/**
 * Parameters List Response
 */
export interface ParametersListResponse {
  parameters: QualitySpecParameter[];
  spec: {
    id: string;
    spec_number: string;
    name: string;
    status: SpecificationStatus;
  };
}

/**
 * Reorder Parameters Response
 */
export interface ReorderParametersResponse {
  updated_count: number;
  parameters: QualitySpecParameter[];
}

/**
 * Value Validation Result
 */
export interface ValueValidationResult {
  valid: boolean;
  reason?: string;
}

// ============================================
// Quality Inspections (Story 06.5)
// ============================================

/**
 * Inspection Type Enum
 * - incoming: Goods received via GRN
 * - in_process: Work-in-progress inspection
 * - final: Finished goods inspection
 */
export type InspectionType = 'incoming' | 'in_process' | 'final';

/**
 * Inspection Status Enum
 * - scheduled: Pending to be started
 * - in_progress: Currently being inspected
 * - completed: Inspection finished with result
 * - cancelled: Inspection cancelled
 */
export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Inspection Priority Enum
 */
export type InspectionPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * Inspection Result Enum
 * - pass: Approved for use
 * - fail: Rejected
 * - conditional: Approved with restrictions
 */
export type InspectionResult = 'pass' | 'fail' | 'conditional';

/**
 * Reference Type for Inspection Source
 */
export type InspectionReferenceType = 'po' | 'grn' | 'wo' | 'lp' | 'batch';

/**
 * Quality Inspection Entity
 * Represents an inspection record
 */
export interface QualityInspection {
  id: string;
  org_id: string;
  inspection_number: string;
  inspection_type: InspectionType;
  reference_type: InspectionReferenceType;
  reference_id: string;

  // Product info
  product_id: string;
  product_code?: string;
  product_name?: string;

  // Specification
  spec_id?: string | null;
  spec_number?: string | null;
  spec_name?: string | null;

  // LP info
  lp_id?: string | null;
  lp_number?: string | null;

  // GRN/PO info
  grn_id?: string | null;
  grn_number?: string | null;
  po_id?: string | null;
  po_number?: string | null;
  supplier_name?: string | null;

  // Batch
  batch_number?: string | null;
  lot_size?: number | null;
  sample_size?: number | null;
  sampling_plan_id?: string | null;

  // Assignment
  inspector_id?: string | null;
  inspector_name?: string | null;
  assigned_by?: string | null;
  assigned_by_name?: string | null;
  assigned_at?: string | null;

  // Status
  status: InspectionStatus;
  priority: InspectionPriority;

  // Timing
  scheduled_date?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  completed_by?: string | null;
  completed_by_name?: string | null;

  // Result
  result?: InspectionResult | null;
  result_notes?: string | null;
  defects_found: number;
  major_defects: number;
  minor_defects: number;
  critical_defects: number;

  // Conditional
  conditional_reason?: string | null;
  conditional_restrictions?: string | null;
  conditional_approved_by?: string | null;
  conditional_expires_at?: string | null;

  // NCR
  ncr_id?: string | null;

  // Audit
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
}

/**
 * Inspection List Response
 */
export interface InspectionsListResponse {
  inspections: QualityInspection[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Test Result Summary for Inspection Detail
 */
export interface TestResultSummary {
  total_parameters: number;
  tested_count: number;
  passed_count: number;
  failed_count: number;
  marginal_count: number;
  untested_count: number;
}

/**
 * Inspection Detail Response
 */
export interface InspectionDetailResponse {
  inspection: QualityInspection;
  test_results: any[]; // From story 06.6
  test_result_summary: TestResultSummary;
  can_complete: boolean;
  suggested_result: InspectionResult | null;
}

/**
 * Pending Inspections Response
 */
export interface PendingInspectionsResponse {
  inspections: QualityInspection[];
  counts: {
    scheduled: number;
    in_progress: number;
    total: number;
  };
}

/**
 * Complete Inspection Response
 */
export interface CompleteInspectionResponse {
  inspection: QualityInspection;
  lp_status_updated: boolean;
  ncr_id?: string;
}

/**
 * Inspection List Query Params
 */
export interface InspectionListParams {
  inspection_type?: InspectionType;
  status?: InspectionStatus;
  priority?: InspectionPriority;
  inspector_id?: string;
  product_id?: string;
  lp_id?: string;
  grn_id?: string;
  po_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Has Active Inspection Response
 */
export interface HasActiveInspectionResponse {
  has: boolean;
  inspectionId?: string;
  inspectionNumber?: string;
}

/**
 * Suggested Result Response
 */
export interface SuggestedResultResponse {
  suggested: InspectionResult;
  reason: string;
  testSummary: TestResultSummary;
}

/**
 * Can Complete Response
 */
export interface CanCompleteResponse {
  canComplete: boolean;
  missingTests: string[];
  untestedCritical: string[];
}

// ============================================
// Sampling Plans (Story 06.7)
// ============================================

/**
 * Sampling Plan Entity
 * AQL-based sampling plan based on ISO 2859 / ANSI Z1.4
 */
export interface SamplingPlan {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  inspection_type: InspectionType;
  product_id: string | null;
  aql_level: 'I' | 'II' | 'III' | null;
  special_level: 'S-1' | 'S-2' | 'S-3' | 'S-4' | null;
  lot_size_min: number;
  lot_size_max: number;
  sample_size: number;
  acceptance_number: number;
  rejection_number: number;
  is_active: boolean;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
}

/**
 * Sampling Plan Summary for List Views
 */
export interface SamplingPlanSummary {
  id: string;
  name: string;
  description: string | null;
  inspection_type: InspectionType;
  product_id: string | null;
  product_name: string | null;
  aql_level: 'I' | 'II' | 'III' | null;
  lot_size_min: number;
  lot_size_max: number;
  sample_size: number;
  acceptance_number: number;
  rejection_number: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Sampling Record Entity
 * Individual sample taken during inspection
 */
export interface SamplingRecord {
  id: string;
  org_id: string;
  plan_id: string;
  inspection_id: string;
  sample_identifier: string;
  location_description: string | null;
  sampled_by: string;
  sampled_by_name: string;
  sampled_at: string;
  notes: string | null;
  created_at: string;
}

/**
 * Sampling Plans List Response
 */
export interface SamplingPlansListResponse {
  sampling_plans: SamplingPlanSummary[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Sampling Plan Detail Response
 */
export interface SamplingPlanDetailResponse {
  sampling_plan: SamplingPlan;
}

/**
 * Sampling Record Detail Response
 */
export interface SamplingRecordDetailResponse {
  sampling_record: SamplingRecord;
}

/**
 * Sampling Records List Response
 */
export interface SamplingRecordsListResponse {
  sampling_records: SamplingRecord[];
  total_samples: number;
  required_samples: number;
}

/**
 * ISO 2859 Reference Entry
 */
export interface ISO2859Entry {
  lot_size_min: number;
  lot_size_max: number;
  sample_size_code: string;
  inspection_level: 'I' | 'II' | 'III';
  sample_size: number;
  aql_065: { Ac: number; Re: number };
  aql_10: { Ac: number; Re: number };
  aql_15: { Ac: number; Re: number };
  aql_25: { Ac: number; Re: number };
  aql_40: { Ac: number; Re: number };
  aql_65: { Ac: number; Re: number };
  aql_100: { Ac: number; Re: number };
  aql_150: { Ac: number; Re: number };
  aql_250: { Ac: number; Re: number };
  aql_400: { Ac: number; Re: number };
  aql_650: { Ac: number; Re: number };
  aql_1000: { Ac: number; Re: number };
}

/**
 * ISO 2859 Reference Response
 */
export interface ISO2859ReferenceResponse {
  reference_table: ISO2859Entry[];
}

/**
 * Sampling Plans List Query Params
 */
export interface SamplingPlansListParams {
  page?: number;
  page_size?: number;
  inspection_type?: InspectionType;
  is_active?: boolean;
  include_inactive?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

/**
 * Create Sampling Plan Input
 */
export interface CreateSamplingPlanInput {
  name: string;
  description?: string | null;
  inspection_type: InspectionType;
  product_id?: string | null;
  aql_level?: 'I' | 'II' | 'III' | null;
  lot_size_min: number;
  lot_size_max: number;
  sample_size: number;
  acceptance_number: number;
  rejection_number: number;
}

/**
 * Update Sampling Plan Input
 */
export interface UpdateSamplingPlanInput extends CreateSamplingPlanInput {
  is_active?: boolean;
}

/**
 * Create Sampling Record Input
 */
export interface CreateSamplingRecordInput {
  plan_id: string;
  inspection_id: string;
  sample_identifier: string;
  location_description?: string | null;
  notes?: string | null;
}

/**
 * Delete Sampling Plan Response
 */
export interface DeleteSamplingPlanResponse {
  success: boolean;
  message: string;
  warning?: string;
}

// ============================================
// In-Process Inspection Types (Story 06.10)
// ============================================

/**
 * WO Operation QA Status
 * - pending: Awaiting inspection
 * - passed: QA inspection passed
 * - failed: QA inspection failed
 * - conditional: Approved with restrictions
 * - not_required: No QA check needed for this operation
 */
export type WOOperationQAStatus = 'pending' | 'passed' | 'failed' | 'conditional' | 'not_required';

/**
 * WO Operation Info for In-Process Inspection
 */
export interface WOOperationInfo {
  id: string;
  sequence: number;
  name: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  operator_name?: string | null;
  qa_status: WOOperationQAStatus;
  qa_inspection_id?: string | null;
}

/**
 * Create In-Process Inspection Input
 */
export interface CreateInProcessInspectionInput {
  wo_id: string;
  wo_operation_id: string;
  product_id?: string;
  spec_id?: string;
  batch_number?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_date?: string;
  inspector_id?: string;
  notes?: string;
}

/**
 * Complete In-Process Inspection Input
 */
export interface CompleteInProcessInspectionInput {
  result: 'pass' | 'fail' | 'conditional';
  result_notes?: string;
  defects_found?: number;
  major_defects?: number;
  minor_defects?: number;
  critical_defects?: number;
  conditional_reason?: string;
  conditional_restrictions?: string;
  conditional_expires_at?: string;
  create_ncr?: boolean;
  block_next_operation?: boolean;
  process_parameters?: Array<{
    parameter_name: string;
    measured_value: string;
    within_spec: boolean;
  }>;
}

/**
 * Complete In-Process Inspection Response
 */
export interface CompleteInProcessResult {
  inspection: QualityInspection;
  wo_operation_updated: boolean;
  wo_operation_qa_status: string;
  next_operation_blocked: boolean;
  ncr_id?: string;
  alert_sent_to?: string[];
}

/**
 * In-Process List Query Parameters
 */
export interface InProcessListParams {
  wo_id?: string;
  wo_operation_id?: string;
  status?: InspectionStatus;
  priority?: InspectionPriority;
  inspector_id?: string;
  product_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: 'inspection_number' | 'scheduled_date' | 'created_at' | 'priority';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * WO Inspections Response
 */
export interface WOInspectionsResponse {
  wo: {
    id: string;
    wo_number: string;
    status: string;
    product_name: string;
    batch_number: string;
  };
  inspections: QualityInspection[];
  summary: {
    total_operations: number;
    inspections_completed: number;
    inspections_passed: number;
    inspections_failed: number;
    inspections_pending: number;
  };
}

/**
 * Operation Inspection Response
 */
export interface OperationInspectionResponse {
  operation: WOOperationInfo;
  inspection: QualityInspection | null;
  previous_operation_qa: {
    operation_name: string;
    result: string;
  } | null;
}

/**
 * WO Quality Summary
 */
export interface WOQualitySummary {
  total_operations: number;
  qa_required: number;
  passed: number;
  failed: number;
  pending: number;
  conditional: number;
  overall_status: 'pass' | 'fail' | 'pending' | 'conditional';
}

/**
 * Can Start Next Operation Response
 */
export interface CanStartNextOperationResponse {
  canStart: boolean;
  blockedReason?: string;
  requiredAction?: string;
}
