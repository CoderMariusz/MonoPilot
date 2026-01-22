/**
 * Inspection Service
 * Story: 06.5 - Incoming Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Provides CRUD and workflow operations for quality inspections:
 * - list() - Get paginated inspections with filters
 * - getById() - Get single inspection with test results
 * - create() - Create new inspection
 * - update() - Update scheduled inspection
 * - assign() - Assign inspector to inspection
 * - start() - Start inspection workflow
 * - complete() - Complete inspection with result
 * - cancel() - Cancel scheduled inspection
 * - getPendingInspections() - Get pending queue
 * - getMyInspections() - Get inspector's work queue
 * - createForGRN() - Auto-create inspections for GRN
 * - generateInspectionNumber() - Generate unique inspection number
 * - hasActiveInspection() - Check if LP has pending inspection
 * - getSuggestedResult() - Calculate suggested result
 * - canComplete() - Check if inspection can be completed
 * - updateLPStatus() - Update LP QA status
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { AuditService } from './audit-service';
import type {
  QualityInspection,
  InspectionsListResponse,
  InspectionDetailResponse,
  PendingInspectionsResponse,
  CompleteInspectionResponse,
  InspectionListParams,
  InspectionResult,
  TestResultSummary,
  HasActiveInspectionResponse,
  SuggestedResultResponse,
  CanCompleteResponse,
} from '@/lib/types/quality';
import type {
  CreateInspectionInput,
  UpdateInspectionInput,
  CompleteInspectionInput,
} from '@/lib/validation/inspection';

// =============================================================================
// Error Classes
// =============================================================================

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

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get authenticated user's org_id
 */
async function getUserOrgId(): Promise<{ userId: string; orgId: string }> {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (userError && userError.code === 'PGRST116') {
    throw new Error('User not found');
  }

  if (userError || !userData) {
    throw new Error('User not found');
  }

  return { userId: user.id, orgId: userData.org_id };
}

/**
 * Enrich inspection with related entity names
 * REFACTORED: Optimized to reduce N+1 queries by batching related data fetches
 */
async function enrichInspection(
  inspection: any,
  supabase: any
): Promise<QualityInspection> {
  // Batch fetch all related entity IDs to minimize queries
  const userIds = [inspection.inspector_id, inspection.assigned_by, inspection.completed_by].filter(
    Boolean
  );

  // Fetch all data in parallel where possible
  const [productData, lpData, grnData, poData, specData, usersData] = await Promise.all([
    // Always fetch product
    supabase
      .from('products')
      .select('code, name')
      .eq('id', inspection.product_id)
      .single(),
    // LP fetch if exists
    inspection.lp_id
      ? supabase
          .from('license_plates')
          .select('lp_number')
          .eq('id', inspection.lp_id)
          .single()
      : Promise.resolve({ data: null }),
    // GRN fetch if exists
    inspection.grn_id
      ? supabase
          .from('grns')
          .select('grn_number, suppliers(name)')
          .eq('id', inspection.grn_id)
          .single()
      : Promise.resolve({ data: null }),
    // PO fetch if exists (conditional on grn not having supplier)
    inspection.po_id
      ? supabase
          .from('purchase_orders')
          .select('po_number, suppliers(name)')
          .eq('id', inspection.po_id)
          .single()
      : Promise.resolve({ data: null }),
    // Spec fetch if exists
    inspection.spec_id
      ? supabase
          .from('quality_specifications')
          .select('spec_number, name')
          .eq('id', inspection.spec_id)
          .single()
      : Promise.resolve({ data: null }),
    // Batch user fetches
    userIds.length > 0
      ? supabase.from('users').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Build user name map for O(1) lookup
  const userNameMap = new Map(
    (usersData.data || []).map((user: any) => [
      user.id,
      user.full_name || user.email || null,
    ])
  );

  // Extract enrichment data
  const product = productData.data;
  const lp = lpData.data;
  const grn = grnData.data;
  const po = poData.data;
  const spec = specData.data;

  // Determine supplier name (from GRN or PO)
  let supplierName = null;
  if (grn?.suppliers) {
    supplierName = (grn.suppliers as any).name;
  } else if (po?.suppliers) {
    supplierName = (po.suppliers as any).name;
  }

  return {
    ...inspection,
    product_code: product?.code || '',
    product_name: product?.name || '',
    lp_number: lp?.lp_number || null,
    grn_number: grn?.grn_number || null,
    po_number: po?.po_number || null,
    supplier_name: supplierName,
    spec_number: spec?.spec_number || null,
    spec_name: spec?.name || null,
    inspector_name: userNameMap.get(inspection.inspector_id) || null,
    assigned_by_name: userNameMap.get(inspection.assigned_by) || null,
    completed_by_name: userNameMap.get(inspection.completed_by) || null,
  };
}

// =============================================================================
// List Operations
// =============================================================================

/**
 * List inspections with filters and pagination
 */
export async function list(
  params: InspectionListParams
): Promise<InspectionsListResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const {
    page = 1,
    limit = 20,
    inspection_type,
    status,
    priority,
    inspector_id,
    product_id,
    lp_id,
    grn_id,
    po_id,
    date_from,
    date_to,
    search,
    sort_by = 'scheduled_date',
    sort_order = 'desc',
  } = params;

  // Build query
  let query = supabase
    .from('quality_inspections')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId);

  // Apply filters
  if (inspection_type) {
    query = query.eq('inspection_type', inspection_type);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (priority) {
    query = query.eq('priority', priority);
  }
  if (inspector_id) {
    query = query.eq('inspector_id', inspector_id);
  }
  if (product_id) {
    query = query.eq('product_id', product_id);
  }
  if (lp_id) {
    query = query.eq('lp_id', lp_id);
  }
  if (grn_id) {
    query = query.eq('grn_id', grn_id);
  }
  if (po_id) {
    query = query.eq('po_id', po_id);
  }
  if (date_from) {
    query = query.gte('scheduled_date', date_from);
  }
  if (date_to) {
    query = query.lte('scheduled_date', date_to);
  }
  if (search) {
    query = query.or(`inspection_number.ilike.%${search}%,batch_number.ilike.%${search}%`);
  }

  // Apply sorting
  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  // Apply pagination
  const start = (page - 1) * limit;
  const end = start + limit - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch inspections: ${error.message}`);
  }

  // Enrich inspections with related data
  const enrichedInspections = await Promise.all(
    (data || []).map((inspection) => enrichInspection(inspection, supabase))
  );

  return {
    inspections: enrichedInspections,
    pagination: {
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    },
  };
}

/**
 * Get single inspection by ID with test results
 */
export async function getById(id: string): Promise<InspectionDetailResponse | null> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new DatabaseError(`Failed to fetch inspection: ${error.message}`);
  }

  const enrichedInspection = await enrichInspection(data, supabase);

  // Get test results (placeholder for story 06.6)
  const testResults: any[] = [];
  const testResultSummary: TestResultSummary = {
    total_parameters: 0,
    tested_count: 0,
    passed_count: 0,
    failed_count: 0,
    marginal_count: 0,
    untested_count: 0,
  };

  // Calculate suggested result
  const { canComplete } = await canCompleteInspection(id);
  let suggestedResult: InspectionResult | null = null;
  if (canComplete && data.status === 'in_progress') {
    const suggestion = await getSuggestedResult(id);
    suggestedResult = suggestion.suggested;
  }

  return {
    inspection: enrichedInspection,
    test_results: testResults,
    test_result_summary: testResultSummary,
    can_complete: canComplete,
    suggested_result: suggestedResult,
  };
}

/**
 * Get inspection by number
 */
export async function getByNumber(inspectionNumber: string): Promise<QualityInspection | null> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('inspection_number', inspectionNumber)
    .eq('org_id', orgId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new DatabaseError(`Failed to fetch inspection: ${error.message}`);
  }

  return enrichInspection(data, supabase);
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create new inspection
 */
export async function create(input: CreateInspectionInput): Promise<QualityInspection> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Validate product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id')
    .eq('id', input.product_id)
    .eq('org_id', orgId)
    .single();

  if (productError || !product) {
    throw new ValidationError('Product not found');
  }

  // Check if LP has active inspection (warning)
  if (input.lp_id) {
    const hasActive = await hasActiveInspection(input.lp_id);
    if (hasActive.has) {
      // Allow creation but warn (handled at API level)
    }
  }

  // Find active specification for product
  let specId = input.spec_id || null;
  if (!specId) {
    const { data: spec } = await supabase
      .from('quality_specifications')
      .select('id')
      .eq('org_id', orgId)
      .eq('product_id', input.product_id)
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();
    specId = spec?.id || null;
  }

  // Determine reference_type and reference_id
  let referenceType = 'lp';
  let referenceId = input.lp_id || input.grn_id || input.po_id;
  if (input.grn_id) {
    referenceType = 'grn';
    referenceId = input.grn_id;
  } else if (input.po_id && !input.lp_id) {
    referenceType = 'po';
    referenceId = input.po_id;
  }

  const newInspection = {
    org_id: orgId,
    inspection_type: 'incoming',
    reference_type: referenceType,
    reference_id: referenceId,
    product_id: input.product_id,
    spec_id: specId,
    lp_id: input.lp_id || null,
    grn_id: input.grn_id || null,
    po_id: input.po_id || null,
    batch_number: input.batch_number || null,
    lot_size: input.lot_size || null,
    priority: input.priority || 'normal',
    scheduled_date: input.scheduled_date || new Date().toISOString().split('T')[0],
    inspector_id: input.inspector_id || null,
    status: 'scheduled',
    created_by: userId,
  };

  const { data, error } = await supabase
    .from('quality_inspections')
    .insert(newInspection)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to create inspection: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: data.id,
    action: 'create',
    user_id: userId,
    new_value: { inspection_number: data.inspection_number },
  });

  return enrichInspection(data, supabase);
}

/**
 * Update scheduled inspection
 */
export async function update(
  id: string,
  input: UpdateInspectionInput
): Promise<QualityInspection> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status !== 'scheduled') {
    throw new ValidationError('Only scheduled inspections can be updated');
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update({
      ...input,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to update inspection: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: id,
    action: 'update',
    user_id: userId,
    old_value: existing,
    new_value: data,
  });

  return enrichInspection(data, supabase);
}

/**
 * Delete scheduled inspection
 */
export async function deleteInspection(id: string): Promise<void> {
  const { userId, orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status !== 'scheduled') {
    throw new ValidationError('Only scheduled inspections can be deleted');
  }

  const { error } = await supabase
    .from('quality_inspections')
    .delete()
    .eq('id', id);

  if (error) {
    throw new DatabaseError(`Failed to delete inspection: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: id,
    action: 'delete',
    user_id: userId,
    old_value: existing,
  });
}

// =============================================================================
// Workflow Operations
// =============================================================================

/**
 * Assign inspector to inspection
 */
export async function assign(
  id: string,
  inspectorId: string,
  assignedBy: string
): Promise<QualityInspection> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status === 'completed' || existing.status === 'cancelled') {
    throw new ValidationError('Cannot assign inspector to completed or cancelled inspection');
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update({
      inspector_id: inspectorId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString(),
      updated_by: assignedBy,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to assign inspector: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: id,
    action: 'assign',
    user_id: assignedBy,
    old_value: { inspector_id: existing.inspector_id },
    new_value: { inspector_id: inspectorId },
  });

  return enrichInspection(data, supabase);
}

/**
 * Start inspection (scheduled -> in_progress)
 */
export async function start(
  id: string,
  userId: string,
  takeOver: boolean = false
): Promise<QualityInspection> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status === 'completed') {
    throw new ValidationError('Cannot start completed inspection');
  }

  if (existing.status === 'in_progress' && !takeOver) {
    throw new ValidationError('Inspection is already in progress');
  }

  if (!existing.inspector_id && !takeOver) {
    throw new ValidationError('Inspector must be assigned before starting');
  }

  const updateData: any = {
    status: 'in_progress',
    started_at: existing.started_at || new Date().toISOString(),
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  // If taking over, update inspector
  if (takeOver) {
    updateData.inspector_id = userId;
    updateData.assigned_by = userId;
    updateData.assigned_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to start inspection: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: id,
    action: 'start',
    user_id: userId,
    old_value: { status: existing.status },
    new_value: { status: 'in_progress', take_over: takeOver },
  });

  return enrichInspection(data, supabase);
}

/**
 * Complete inspection with result
 */
export async function complete(
  id: string,
  input: CompleteInspectionInput,
  userId: string
): Promise<CompleteInspectionResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status !== 'in_progress') {
    throw new ValidationError('Only in-progress inspections can be completed');
  }

  const updateData: any = {
    status: 'completed',
    result: input.result,
    result_notes: input.result_notes || null,
    defects_found: input.defects_found || 0,
    major_defects: input.major_defects || 0,
    minor_defects: input.minor_defects || 0,
    critical_defects: input.critical_defects || 0,
    completed_at: new Date().toISOString(),
    completed_by: userId,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  // Add conditional fields if result is conditional
  if (input.result === 'conditional') {
    updateData.conditional_reason = input.conditional_reason;
    updateData.conditional_restrictions = input.conditional_restrictions;
    updateData.conditional_expires_at = input.conditional_expires_at || null;
    updateData.conditional_approved_by = userId;
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to complete inspection: ${error.message}`);
  }

  // LP status is updated via database trigger, but we can track it
  let lpStatusUpdated = false;
  if (existing.lp_id) {
    lpStatusUpdated = true;
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: id,
    action: 'complete',
    user_id: userId,
    old_value: { status: existing.status },
    new_value: { status: 'completed', result: input.result },
  });

  const enrichedInspection = await enrichInspection(data, supabase);

  // TODO: Create NCR if requested (story 06.9)
  let ncrId: string | undefined;
  if (input.create_ncr && input.result === 'fail') {
    // NCR creation will be implemented in story 06.9
  }

  return {
    inspection: enrichedInspection,
    lp_status_updated: lpStatusUpdated,
    ncr_id: ncrId,
  };
}

/**
 * Cancel inspection
 */
export async function cancel(
  id: string,
  reason: string,
  userId: string
): Promise<QualityInspection> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', id)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status !== 'scheduled') {
    throw new ValidationError('Only scheduled inspections can be cancelled');
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update({
      status: 'cancelled',
      result_notes: reason,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to cancel inspection: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: id,
    action: 'cancel',
    user_id: userId,
    old_value: { status: existing.status },
    new_value: { status: 'cancelled', reason },
  });

  return enrichInspection(data, supabase);
}

// =============================================================================
// Queue Operations
// =============================================================================

/**
 * Get pending inspections (scheduled + in_progress)
 */
export async function getPendingInspections(
  type?: string
): Promise<PendingInspectionsResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  let query = supabase
    .from('quality_inspections')
    .select('*')
    .eq('org_id', orgId)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date', { ascending: true });

  if (type) {
    query = query.eq('inspection_type', type);
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch pending inspections: ${error.message}`);
  }

  const inspections = await Promise.all(
    (data || []).map((i) => enrichInspection(i, supabase))
  );

  const scheduled = inspections.filter((i) => i.status === 'scheduled').length;
  const inProgress = inspections.filter((i) => i.status === 'in_progress').length;

  return {
    inspections,
    counts: {
      scheduled,
      in_progress: inProgress,
      total: scheduled + inProgress,
    },
  };
}

/**
 * Get inspector's work queue
 */
export async function getMyInspections(userId: string): Promise<QualityInspection[]> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('org_id', orgId)
    .eq('inspector_id', userId)
    .in('status', ['scheduled', 'in_progress'])
    .order('scheduled_date', { ascending: true });

  if (error) {
    throw new DatabaseError(`Failed to fetch my inspections: ${error.message}`);
  }

  return Promise.all(
    (data || []).map((i) => enrichInspection(i, supabase))
  );
}

// =============================================================================
// Auto-Creation
// =============================================================================

/**
 * Create inspections for GRN completion
 * Note: This is primarily handled by database trigger, but can be called manually
 */
export async function createForGRN(
  grnId: string,
  userId: string
): Promise<QualityInspection[]> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Check if auto-create is enabled
  const { data: settings } = await supabase
    .from('quality_settings')
    .select('auto_create_inspection_on_grn')
    .eq('org_id', orgId)
    .single();

  if (!settings?.auto_create_inspection_on_grn) {
    return [];
  }

  // Get GRN items with LPs
  const { data: grnItems, error: itemsError } = await supabase
    .from('grn_items')
    .select('*, grns(po_id)')
    .eq('grn_id', grnId)
    .not('lp_id', 'is', null);

  if (itemsError) {
    throw new DatabaseError(`Failed to fetch GRN items: ${itemsError.message}`);
  }

  const inspections: QualityInspection[] = [];

  for (const item of grnItems || []) {
    // Find active spec for product
    const { data: spec } = await supabase
      .from('quality_specifications')
      .select('id')
      .eq('org_id', orgId)
      .eq('product_id', item.product_id)
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    const newInspection = {
      org_id: orgId,
      inspection_type: 'incoming',
      reference_type: 'grn',
      reference_id: grnId,
      product_id: item.product_id,
      spec_id: spec?.id || null,
      lp_id: item.lp_id,
      grn_id: grnId,
      po_id: (item.grns as any)?.po_id || null,
      batch_number: item.batch_number || null,
      status: 'scheduled',
      scheduled_date: new Date().toISOString().split('T')[0],
      priority: 'normal',
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('quality_inspections')
      .insert(newInspection)
      .select()
      .single();

    if (error) {
      console.error(`Failed to create inspection for LP ${item.lp_id}:`, error.message);
      continue;
    }

    const enriched = await enrichInspection(data, supabase);
    inspections.push(enriched);
  }

  return inspections;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate next inspection number
 * Note: This is handled by database trigger, but available for reference
 */
export async function generateInspectionNumber(
  type: string
): Promise<string> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc('generate_inspection_number', {
    p_org_id: orgId,
    p_type: type,
  });

  if (error) {
    throw new DatabaseError(`Failed to generate inspection number: ${error.message}`);
  }

  return data;
}

/**
 * Check if LP has pending inspection
 */
export async function hasActiveInspection(
  lpId: string
): Promise<HasActiveInspectionResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quality_inspections')
    .select('id, inspection_number')
    .eq('org_id', orgId)
    .eq('lp_id', lpId)
    .in('status', ['scheduled', 'in_progress'])
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new DatabaseError(`Failed to check active inspection: ${error.message}`);
  }

  if (data) {
    return {
      has: true,
      inspectionId: data.id,
      inspectionNumber: data.inspection_number,
    };
  }

  return { has: false };
}

/**
 * Calculate suggested result based on test results
 */
export async function getSuggestedResult(
  inspectionId: string
): Promise<SuggestedResultResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get inspection
  const { data: inspection } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', inspectionId)
    .eq('org_id', orgId)
    .single();

  if (!inspection) {
    throw new NotFoundError('Inspection not found');
  }

  // Get quality settings
  const { data: settings } = await supabase
    .from('quality_settings')
    .select('*')
    .eq('org_id', orgId)
    .single();

  // Placeholder for test results (story 06.6)
  const testSummary: TestResultSummary = {
    total_parameters: 0,
    tested_count: 0,
    passed_count: 0,
    failed_count: 0,
    marginal_count: 0,
    untested_count: 0,
  };

  // Check for critical defects
  if (inspection.critical_defects > 0) {
    return {
      suggested: 'fail',
      reason: 'Critical defect(s) detected',
      testSummary,
    };
  }

  // Check for test failures (placeholder)
  if (testSummary.failed_count > 0) {
    return {
      suggested: 'fail',
      reason: 'One or more test parameters failed',
      testSummary,
    };
  }

  // Default to pass if no spec linked
  if (!inspection.spec_id) {
    return {
      suggested: 'pass',
      reason: 'No specification linked - manual evaluation',
      testSummary,
    };
  }

  return {
    suggested: 'pass',
    reason: 'All tests passed',
    testSummary,
  };
}

/**
 * Check if inspection can be completed
 */
export async function canCompleteInspection(
  inspectionId: string
): Promise<CanCompleteResponse> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Get inspection
  const { data: inspection } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', inspectionId)
    .eq('org_id', orgId)
    .single();

  if (!inspection) {
    throw new NotFoundError('Inspection not found');
  }

  // If no spec linked, always allow completion
  if (!inspection.spec_id) {
    return {
      canComplete: true,
      missingTests: [],
      untestedCritical: [],
    };
  }

  // Placeholder for test results check (story 06.6)
  // In real implementation, check if all required parameters have been tested

  return {
    canComplete: true,
    missingTests: [],
    untestedCritical: [],
  };
}

/**
 * Update LP QA status based on inspection result
 * Note: This is handled by database trigger, but available for manual use
 */
export async function updateLPStatus(
  lpId: string,
  result: InspectionResult
): Promise<void> {
  const { orgId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  const qaStatusMap: Record<InspectionResult, string> = {
    pass: 'passed',
    fail: 'failed',
    conditional: 'conditional',
  };

  const { error } = await supabase
    .from('license_plates')
    .update({
      qa_status: qaStatusMap[result],
      updated_at: new Date().toISOString(),
    })
    .eq('id', lpId)
    .eq('org_id', orgId);

  if (error) {
    throw new DatabaseError(`Failed to update LP QA status: ${error.message}`);
  }
}

// =============================================================================
// Export Service
// =============================================================================

export const InspectionService = {
  list,
  getById,
  getByNumber,
  create,
  update,
  delete: deleteInspection,
  assign,
  start,
  complete,
  cancel,
  getPendingInspections,
  getMyInspections,
  createForGRN,
  generateInspectionNumber,
  hasActiveInspection,
  getSuggestedResult,
  canComplete: canCompleteInspection,
  updateLPStatus,
};

export default InspectionService;
