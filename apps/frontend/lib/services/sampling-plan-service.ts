/**
 * Sampling Plan Service
 * Story: 06.7 - Sampling Plans (AQL)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Provides CRUD operations for sampling plans and records:
 * - getAllSamplingPlans() - Get paginated sampling plans with filters
 * - getSamplingPlanById() - Get single sampling plan
 * - createSamplingPlan() - Create new sampling plan
 * - updateSamplingPlan() - Update sampling plan
 * - deleteSamplingPlan() - Soft delete (deactivate) sampling plan
 * - selectSamplingPlanForInspection() - Auto-select plan based on lot size and type
 * - createSamplingRecord() - Record a sample during inspection
 * - getSamplingRecordsForInspection() - Get samples for an inspection
 * - generateSampleIdentifier() - Generate next sample ID (S-001, S-002, etc.)
 * - determineInspectionResult() - Pure function to determine pass/fail/conditional
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 */

import { createServerSupabase } from '@/lib/supabase/server';
import type {
  CreateSamplingPlanInput,
  UpdateSamplingPlanInput,
  CreateSamplingRecordInput,
  SamplingPlansListQuery,
} from '@/lib/validation/sampling-plan-schemas';

// ============================================
// Constants
// ============================================

const ERROR_CODES = {
  NOT_FOUND: 'PGRST116',
  UNIQUE_VIOLATION: '23505',
} as const;

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  USER_NOT_FOUND: 'User not found',
  PLAN_NOT_FOUND: 'Sampling plan not found',
  PLAN_NAME_EXISTS: 'A plan with this name already exists',
  SAMPLE_IDENTIFIER_EXISTS: 'Sample identifier already exists for this inspection',
} as const;

// ============================================
// Types
// ============================================

export interface SamplingPlan {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  inspection_type: 'incoming' | 'in_process' | 'final';
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

export interface SamplingPlanSummary {
  id: string;
  name: string;
  description: string | null;
  inspection_type: 'incoming' | 'in_process' | 'final';
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

export interface SamplingPlansListResponse {
  sampling_plans: SamplingPlanSummary[];
  total: number;
  page: number;
  page_size: number;
}

export interface SamplingPlanDetailResponse {
  sampling_plan: SamplingPlan;
}

export interface SamplingRecordDetailResponse {
  sampling_record: SamplingRecord;
}

export interface SamplingRecordsListResponse {
  sampling_records: SamplingRecord[];
  total_samples: number;
  required_samples: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
  warning?: string;
}

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

// ============================================
// Error Classes
// ============================================

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Helper to get authenticated user's org_id
 */
async function getUserOrgId(): Promise<{ userId: string; orgId: string }> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
  }

  return { userId: user.id, orgId: userData.org_id };
}

/**
 * Get user display name by ID
 */
async function getUserDisplayName(userId: string | null, supabase: any): Promise<string | null> {
  if (!userId) {
    return null;
  }

  const { data: user } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', userId)
    .single();

  return user?.full_name || user?.email || null;
}

/**
 * Transform raw plan data to SamplingPlanSummary
 */
function transformToSamplingPlanSummary(rawPlan: any): SamplingPlanSummary {
  return {
    id: rawPlan.id,
    name: rawPlan.name,
    description: rawPlan.description,
    inspection_type: rawPlan.inspection_type,
    product_id: rawPlan.product_id,
    product_name: rawPlan.products?.name || null,
    aql_level: rawPlan.aql_level,
    lot_size_min: rawPlan.lot_size_min,
    lot_size_max: rawPlan.lot_size_max,
    sample_size: rawPlan.sample_size,
    acceptance_number: rawPlan.acceptance_number,
    rejection_number: rawPlan.rejection_number,
    is_active: rawPlan.is_active,
    created_at: rawPlan.created_at,
  };
}

// ============================================
// Sampling Plan CRUD
// ============================================

/**
 * List sampling plans with filters and pagination
 */
export async function getAllSamplingPlans(
  params: SamplingPlansListQuery
): Promise<SamplingPlansListResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const {
    page = 1,
    page_size = 20,
    inspection_type,
    is_active,
    include_inactive,
    search,
    sort_by = 'created_at',
    sort_order = 'desc',
  } = params;

  // Build query
  let query = supabase
    .from('sampling_plans')
    .select('*, products(name)', { count: 'exact' })
    .eq('org_id', orgId);

  // Apply inspection type filter
  if (inspection_type) {
    query = query.eq('inspection_type', inspection_type);
  }

  // Apply active status filter
  const shouldFilterByActive = !include_inactive || is_active !== undefined;
  if (shouldFilterByActive) {
    const activeStatus = is_active !== undefined ? is_active : true;
    query = query.eq('is_active', activeStatus);
  }

  // Apply name search filter
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Apply sorting and pagination
  query = query
    .order(sort_by, { ascending: sort_order === 'asc' })
    .range((page - 1) * page_size, page * page_size - 1);

  const { data, error, count } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch sampling plans: ${error.message}`);
  }

  // Transform raw data to summaries
  const plans = (data || []).map(transformToSamplingPlanSummary);

  return {
    sampling_plans: plans,
    total: count || 0,
    page,
    page_size,
  };
}

/**
 * Get single sampling plan by ID
 */
export async function getSamplingPlanById(
  planId: string
): Promise<SamplingPlanDetailResponse | null> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('sampling_plans')
    .select('*')
    .eq('id', planId)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new DatabaseError(`Failed to fetch sampling plan: ${error.message}`);
  }

  return { sampling_plan: data };
}

/**
 * Create new sampling plan
 */
export async function createSamplingPlan(
  input: CreateSamplingPlanInput
): Promise<SamplingPlan> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const newPlan = {
    org_id: orgId,
    name: input.name,
    description: input.description || null,
    inspection_type: input.inspection_type,
    product_id: input.product_id || null,
    aql_level: input.aql_level || null,
    lot_size_min: input.lot_size_min,
    lot_size_max: input.lot_size_max,
    sample_size: input.sample_size,
    acceptance_number: input.acceptance_number,
    rejection_number: input.rejection_number,
    is_active: true,
    created_by: userId,
    updated_by: userId,
  };

  const { data, error } = await supabase
    .from('sampling_plans')
    .insert(newPlan)
    .select()
    .single();

  if (error) {
    if (error.code === ERROR_CODES.UNIQUE_VIOLATION) {
      throw new ValidationError(ERROR_MESSAGES.PLAN_NAME_EXISTS);
    }
    throw new DatabaseError(`Failed to create sampling plan: ${error.message}`);
  }

  return data;
}

/**
 * Update sampling plan
 */
export async function updateSamplingPlan(
  planId: string,
  input: UpdateSamplingPlanInput
): Promise<SamplingPlan> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Check if plan exists
  const { data: existing, error: fetchError } = await supabase
    .from('sampling_plans')
    .select('*')
    .eq('id', planId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError(ERROR_MESSAGES.PLAN_NOT_FOUND);
  }

  const { data, error } = await supabase
    .from('sampling_plans')
    .update({
      ...input,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .select()
    .single();

  if (error) {
    if (error.code === ERROR_CODES.UNIQUE_VIOLATION) {
      throw new ValidationError(ERROR_MESSAGES.PLAN_NAME_EXISTS);
    }
    throw new DatabaseError(`Failed to update sampling plan: ${error.message}`);
  }

  return data;
}

/**
 * Delete (soft delete/deactivate) sampling plan
 */
export async function deleteSamplingPlan(
  planId: string
): Promise<DeleteResponse> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Check if plan exists
  const { data: existing, error: fetchError } = await supabase
    .from('sampling_plans')
    .select('*')
    .eq('id', planId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError(ERROR_MESSAGES.PLAN_NOT_FOUND);
  }

  // Check if used by active inspections
  const { count: inspectionCount } = await supabase
    .from('quality_inspections')
    .select('*', { count: 'exact', head: true })
    .eq('sampling_plan_id', planId)
    .in('status', ['scheduled', 'in_progress']);

  const warning = inspectionCount && inspectionCount > 0
    ? `This plan is used by ${inspectionCount} inspections. Deactivate instead?`
    : undefined;

  // Soft delete (deactivate)
  const { error } = await supabase
    .from('sampling_plans')
    .update({
      is_active: false,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId);

  if (error) {
    throw new DatabaseError(`Failed to delete sampling plan: ${error.message}`);
  }

  return {
    success: true,
    message: 'Sampling plan deactivated',
    warning,
  };
}

// ============================================
// Plan Selection
// ============================================

/**
 * Auto-select sampling plan for inspection based on lot size and type
 */
export async function selectSamplingPlanForInspection(
  inspectionType: 'incoming' | 'in_process' | 'final',
  lotSize: number,
  productId?: string
): Promise<SamplingPlan | null> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Build query to find matching plans
  let query = supabase
    .from('sampling_plans')
    .select('*')
    .eq('org_id', orgId)
    .eq('inspection_type', inspectionType)
    .eq('is_active', true)
    .lte('lot_size_min', lotSize)
    .gte('lot_size_max', lotSize)
    .order('created_at', { ascending: true });

  const { data: plans, error } = await query;

  if (error || !plans || plans.length === 0) {
    return null;
  }

  // Prefer product-specific plan over generic
  if (productId) {
    const productSpecific = plans.find((p: any) => p.product_id === productId);
    if (productSpecific) {
      return productSpecific;
    }
  }

  // Return generic plan (product_id is null) or first matching
  const genericPlan = plans.find((p: any) => p.product_id === null);
  return genericPlan || plans[0];
}

// ============================================
// Sampling Records
// ============================================

/**
 * Create sampling record during inspection
 */
export async function createSamplingRecord(
  input: CreateSamplingRecordInput
): Promise<SamplingRecord> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get user's name
  const sampledByName = await getUserDisplayName(userId, supabase) || 'Unknown';

  const newRecord = {
    org_id: orgId,
    plan_id: input.plan_id,
    inspection_id: input.inspection_id,
    sample_identifier: input.sample_identifier,
    location_description: input.location_description || null,
    notes: input.notes || null,
    sampled_by: userId,
    sampled_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sampling_records')
    .insert(newRecord)
    .select()
    .single();

  if (error) {
    if (error.code === ERROR_CODES.UNIQUE_VIOLATION) {
      throw new ValidationError(ERROR_MESSAGES.SAMPLE_IDENTIFIER_EXISTS);
    }
    throw new DatabaseError(`Failed to create sampling record: ${error.message}`);
  }

  return {
    ...data,
    sampled_by_name: sampledByName,
  };
}

/**
 * Get sampling records for an inspection
 */
export async function getSamplingRecordsForInspection(
  inspectionId: string
): Promise<SamplingRecordsListResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get the inspection to find required sample size
  const { data: inspection } = await supabase
    .from('quality_inspections')
    .select('sampling_plan_id')
    .eq('id', inspectionId)
    .eq('org_id', orgId)
    .single();

  let requiredSamples = 0;
  if (inspection?.sampling_plan_id) {
    const { data: plan } = await supabase
      .from('sampling_plans')
      .select('sample_size')
      .eq('id', inspection.sampling_plan_id)
      .single();
    requiredSamples = plan?.sample_size || 0;
  }

  // Get sampling records
  const { data: records, error } = await supabase
    .from('sampling_records')
    .select('*, users!sampled_by(full_name, email)')
    .eq('inspection_id', inspectionId)
    .eq('org_id', orgId)
    .order('sampled_at', { ascending: true });

  if (error) {
    throw new DatabaseError(`Failed to fetch sampling records: ${error.message}`);
  }

  // Transform with user names
  const samplingRecords: SamplingRecord[] = (records || []).map((r: any) => ({
    id: r.id,
    org_id: r.org_id,
    plan_id: r.plan_id,
    inspection_id: r.inspection_id,
    sample_identifier: r.sample_identifier,
    location_description: r.location_description,
    sampled_by: r.sampled_by,
    sampled_by_name: r.users?.full_name || r.users?.email || 'Unknown',
    sampled_at: r.sampled_at,
    notes: r.notes,
    created_at: r.created_at,
  }));

  return {
    sampling_records: samplingRecords,
    total_samples: samplingRecords.length,
    required_samples: requiredSamples,
  };
}

/**
 * Generate next sample identifier for inspection
 * Format: S-001, S-002, etc.
 */
export async function generateSampleIdentifier(
  inspectionId: string
): Promise<string> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Count existing samples for this inspection
  const { count } = await supabase
    .from('sampling_records')
    .select('*', { count: 'exact', head: true })
    .eq('inspection_id', inspectionId)
    .eq('org_id', orgId);

  const nextNumber = (count || 0) + 1;
  return `S-${String(nextNumber).padStart(3, '0')}`;
}

// ============================================
// ISO 2859 Reference
// ============================================

/**
 * Get ISO 2859 reference table
 */
export async function getISO2859Reference(
  lotSize?: number,
  inspectionLevel?: 'I' | 'II' | 'III'
): Promise<ISO2859Entry[]> {
  const supabase = await createServerSupabase();

  let query = supabase
    .from('iso_2859_reference')
    .select('*')
    .order('lot_size_min', { ascending: true });

  if (inspectionLevel) {
    query = query.eq('inspection_level', inspectionLevel);
  }

  if (lotSize) {
    query = query
      .lte('lot_size_min', lotSize)
      .gte('lot_size_max', lotSize);
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch ISO 2859 reference: ${error.message}`);
  }

  return data || [];
}

// ============================================
// Inspection Result Determination
// ============================================

/**
 * Determine inspection result based on defects found and Ac/Re numbers
 * Pure function - no database calls
 */
export function determineInspectionResult(
  defectsFound: number,
  acceptanceNumber: number,
  rejectionNumber: number
): 'pass' | 'fail' | 'conditional' {
  if (defectsFound <= acceptanceNumber) {
    return 'pass';
  } else if (defectsFound >= rejectionNumber) {
    return 'fail';
  } else {
    // Between Ac and Re - edge case
    return 'conditional';
  }
}

// ============================================
// Export as Service Object
// ============================================

export const SamplingPlanService = {
  getAllSamplingPlans,
  getSamplingPlanById,
  createSamplingPlan,
  updateSamplingPlan,
  deleteSamplingPlan,
  selectSamplingPlanForInspection,
  createSamplingRecord,
  getSamplingRecordsForInspection,
  generateSampleIdentifier,
  getISO2859Reference,
  determineInspectionResult,
  NotFoundError,
  ValidationError,
  DatabaseError,
};

export default SamplingPlanService;
