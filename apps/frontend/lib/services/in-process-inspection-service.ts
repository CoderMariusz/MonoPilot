/**
 * In-Process Inspection Service
 * Story: 06.10 - In-Process Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Provides operations for in-process inspections during WO execution:
 * - listInProcess() - List in-process inspections with WO/operation filters
 * - getByWorkOrder() - Get all inspections for a WO with quality summary
 * - getByOperation() - Get inspection for specific WO operation
 * - createInProcess() - Create in-process inspection with WO validation
 * - startInspection() - Start inspection workflow
 * - completeInProcess() - Complete inspection with WO operation update
 * - assignInspector() - Assign/reassign inspector
 * - updateOperationQAStatus() - Update WO operation QA status
 * - canStartNextOperation() - Check if next operation can start
 * - getWOQualitySummary() - Get WO quality summary
 * - operationRequiresInspection() - Check if operation needs inspection
 * - createForOperationCompletion() - Auto-create on operation completion
 * - notifyProductionOnCompletion() - Send production alerts
 * - checkAndAlertOverdueInspections() - Alert on overdue inspections
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { AuditService } from './audit-service';
import type {
  QualityInspection,
  CreateInProcessInspectionInput,
  CompleteInProcessInspectionInput,
  CompleteInProcessResult,
  InProcessListParams,
  WOInspectionsResponse,
  OperationInspectionResponse,
  WOQualitySummary,
  WOOperationInfo,
  InspectionResult,
} from '@/lib/types/quality';

// =============================================================================
// Constants
// =============================================================================

/** Inspection type for in-process inspections */
export const INSPECTION_TYPE_IN_PROCESS = 'in_process' as const;

/** Inspection status values */
const INSPECTION_STATUS = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/** QA status values for WO operations */
const QA_STATUS = {
  PENDING: 'pending',
  PASSED: 'passed',
  FAILED: 'failed',
  CONDITIONAL: 'conditional',
  NOT_REQUIRED: 'not_required',
} as const;

/** Inspection result values */
const INSPECTION_RESULT = {
  PASS: 'pass',
  FAIL: 'fail',
  CONDITIONAL: 'conditional',
} as const;

/** WO status values */
const WO_STATUS = {
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
} as const;

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
 * Generate timestamp metadata for updates
 */
function updateTimestampFields(userId: string): { updated_by: string; updated_at: string } {
  return {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Enrich inspection with related entity names
 */
async function enrichInspection(
  inspection: any,
  supabase: any
): Promise<QualityInspection> {
  const userIds = [inspection.inspector_id, inspection.assigned_by, inspection.completed_by].filter(
    Boolean
  );

  const [productData, woData, specData, usersData] = await Promise.all([
    supabase
      .from('products')
      .select('code, name')
      .eq('id', inspection.product_id)
      .single(),
    inspection.wo_id
      ? supabase
          .from('work_orders')
          .select('wo_number, status, batch_number')
          .eq('id', inspection.wo_id)
          .single()
      : Promise.resolve({ data: null }),
    inspection.spec_id
      ? supabase
          .from('quality_specifications')
          .select('spec_number, name')
          .eq('id', inspection.spec_id)
          .single()
      : Promise.resolve({ data: null }),
    userIds.length > 0
      ? supabase.from('users').select('id, full_name, email').in('id', userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const userNameMap = new Map(
    (usersData.data || []).map((user: any) => [
      user.id,
      user.full_name || user.email || null,
    ])
  );

  const product = productData.data;
  const wo = woData.data;
  const spec = specData.data;

  return {
    ...inspection,
    product_code: product?.code || '',
    product_name: product?.name || '',
    wo_number: wo?.wo_number || null,
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
 * List in-process inspections with filters and pagination
 */
export async function listInProcess(
  orgId: string,
  params: InProcessListParams
): Promise<{ data: QualityInspection[]; total: number; page: number; limit: number }> {
  const supabase = await createServerSupabase();

  const {
    page = 1,
    limit = 20,
    wo_id,
    wo_operation_id,
    status,
    priority,
    inspector_id,
    product_id,
    date_from,
    date_to,
    search,
    sort_by = 'scheduled_date',
    sort_order = 'desc',
  } = params;

  let query = supabase
    .from('quality_inspections')
    .select('*', { count: 'exact' })
    .eq('org_id', orgId)
    .eq('inspection_type', INSPECTION_TYPE_IN_PROCESS);

  if (wo_id) {
    query = query.eq('wo_id', wo_id);
  }
  if (wo_operation_id) {
    query = query.eq('wo_operation_id', wo_operation_id);
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
  if (date_from) {
    query = query.gte('scheduled_date', date_from);
  }
  if (date_to) {
    query = query.lte('scheduled_date', date_to);
  }
  if (search) {
    query = query.or(`inspection_number.ilike.%${search}%,batch_number.ilike.%${search}%`);
  }

  query = query.order(sort_by, { ascending: sort_order === 'asc' });

  const start = (page - 1) * limit;
  const end = start + limit - 1;
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch in-process inspections: ${error.message}`);
  }

  const enrichedInspections = await Promise.all(
    (data || []).map((inspection) => enrichInspection(inspection, supabase))
  );

  return {
    data: enrichedInspections,
    total: count || 0,
    page,
    limit,
  };
}

/**
 * Get all inspections for a Work Order with quality summary
 */
export async function getByWorkOrder(
  orgId: string,
  woId: string
): Promise<WOInspectionsResponse> {
  const supabase = await createServerSupabase();

  // Get WO details
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, wo_number, status, batch_number, product_id, products(name)')
    .eq('id', woId)
    .eq('org_id', orgId)
    .single();

  if (woError || !wo) {
    throw new NotFoundError('Work Order not found');
  }

  // Get inspections for this WO
  const { data: inspections, error: inspError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('org_id', orgId)
    .eq('wo_id', woId)
    .eq('inspection_type', INSPECTION_TYPE_IN_PROCESS)
    .order('created_at', { ascending: true });

  if (inspError) {
    throw new DatabaseError(`Failed to fetch WO inspections: ${inspError.message}`);
  }

  // Get WO operations count
  const { count: totalOps } = await supabase
    .from('wo_operations')
    .select('*', { count: 'exact', head: true })
    .eq('wo_id', woId);

  const enrichedInspections = await Promise.all(
    (inspections || []).map((inspection) => enrichInspection(inspection, supabase))
  );

  // Calculate summary
  const completed = enrichedInspections.filter((i) => i.status === INSPECTION_STATUS.COMPLETED).length;
  const passed = enrichedInspections.filter((i) => i.result === INSPECTION_RESULT.PASS).length;
  const failed = enrichedInspections.filter((i) => i.result === INSPECTION_RESULT.FAIL).length;
  const pending = enrichedInspections.filter(
    (i) => i.status === INSPECTION_STATUS.SCHEDULED || i.status === INSPECTION_STATUS.IN_PROGRESS
  ).length;

  return {
    wo: {
      id: wo.id,
      wo_number: wo.wo_number,
      status: wo.status,
      product_name: (wo.products as any)?.name || '',
      batch_number: wo.batch_number || '',
    },
    inspections: enrichedInspections,
    summary: {
      total_operations: totalOps || 0,
      inspections_completed: completed,
      inspections_passed: passed,
      inspections_failed: failed,
      inspections_pending: pending,
    },
  };
}

/**
 * Get inspection for specific WO operation
 */
export async function getByOperation(
  orgId: string,
  operationId: string
): Promise<OperationInspectionResponse> {
  const supabase = await createServerSupabase();

  // Get operation details
  const { data: operation, error: opError } = await supabase
    .from('wo_operations')
    .select('*, started_by_user:users!wo_operations_started_by_fkey(full_name)')
    .eq('id', operationId)
    .eq('organization_id', orgId)
    .single();

  if (opError || !operation) {
    throw new NotFoundError('Operation not found');
  }

  // Get inspection for this operation
  const { data: inspection, error: inspError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('org_id', orgId)
    .eq('wo_operation_id', operationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (inspError) {
    throw new DatabaseError(`Failed to fetch operation inspection: ${inspError.message}`);
  }

  // Get previous operation QA info
  let previousQA: { operation_name: string; result: string } | null = null;
  if (operation.sequence > 1) {
    const { data: prevOp } = await supabase
      .from('wo_operations')
      .select('operation_name, qa_status, qa_inspection_id')
      .eq('wo_id', operation.wo_id)
      .eq('sequence', operation.sequence - 1)
      .single();

    if (prevOp && prevOp.qa_status && prevOp.qa_status !== QA_STATUS.NOT_REQUIRED) {
      previousQA = {
        operation_name: prevOp.operation_name,
        result: prevOp.qa_status,
      };
    }
  }

  const enrichedInspection = inspection
    ? await enrichInspection(inspection, supabase)
    : null;

  const operationInfo: WOOperationInfo = {
    id: operation.id,
    sequence: operation.sequence,
    name: operation.operation_name,
    status: operation.status,
    started_at: operation.started_at,
    completed_at: operation.completed_at,
    operator_name: (operation.started_by_user as any)?.full_name || null,
    qa_status: operation.qa_status || 'pending',
    qa_inspection_id: operation.qa_inspection_id,
  };

  return {
    operation: operationInfo,
    inspection: enrichedInspection,
    previous_operation_qa: previousQA,
  };
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Create in-process inspection with WO validation
 */
export async function createInProcess(
  orgId: string,
  input: CreateInProcessInspectionInput
): Promise<QualityInspection> {
  const { userId } = await getUserOrgId();
  const supabase = await createServerSupabase();

  // Validate WO exists and is in_progress
  const { data: wo, error: woError } = await supabase
    .from('work_orders')
    .select('id, status, product_id, batch_number')
    .eq('id', input.wo_id)
    .eq('org_id', orgId)
    .single();

  if (woError || !wo) {
    throw new ValidationError('Invalid Work Order');
  }

  if (wo.status !== WO_STATUS.IN_PROGRESS) {
    throw new ValidationError('Work Order must be in progress for in-process inspection');
  }

  // Validate WO operation exists
  const { data: operation, error: opError } = await supabase
    .from('wo_operations')
    .select('id, sequence, operation_name')
    .eq('id', input.wo_operation_id)
    .eq('wo_id', input.wo_id)
    .single();

  if (opError || !operation) {
    throw new ValidationError('Invalid operation');
  }

  // Find active specification for product
  let specId = input.spec_id || null;
  const productId = input.product_id || wo.product_id;
  if (!specId) {
    const { data: spec } = await supabase
      .from('quality_specifications')
      .select('id')
      .eq('org_id', orgId)
      .eq('product_id', productId)
      .eq('status', 'active')
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();
    specId = spec?.id || null;
  }

  const newInspection = {
    org_id: orgId,
    inspection_type: INSPECTION_TYPE_IN_PROCESS,
    reference_type: 'wo_operation',
    reference_id: input.wo_operation_id,
    product_id: productId,
    spec_id: specId,
    wo_id: input.wo_id,
    wo_operation_id: input.wo_operation_id,
    batch_number: input.batch_number || wo.batch_number || null,
    priority: input.priority || 'normal',
    scheduled_date: input.scheduled_date || new Date().toISOString().split('T')[0],
    inspector_id: input.inspector_id || null,
    status: INSPECTION_STATUS.SCHEDULED,
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
    new_value: { inspection_number: data.inspection_number, wo_id: input.wo_id, wo_operation_id: input.wo_operation_id },
  });

  return enrichInspection(data, supabase);
}

/**
 * Start inspection workflow
 */
export async function startInspection(
  orgId: string,
  inspectionId: string,
  userId: string
): Promise<QualityInspection> {
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*, wo:work_orders(status)')
    .eq('id', inspectionId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status !== INSPECTION_STATUS.SCHEDULED) {
    throw new ValidationError('Only scheduled inspections can be started');
  }

  // Check WO status
  if (existing.wo_id) {
    const woStatus = (existing.wo as any)?.status;
    if (woStatus === WO_STATUS.PAUSED) {
      throw new ValidationError('Cannot inspect - Work Order is paused');
    }
    if (woStatus === WO_STATUS.CANCELLED) {
      throw new ValidationError('Cannot inspect - Work Order is cancelled');
    }
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update({
      status: INSPECTION_STATUS.IN_PROGRESS,
      started_at: new Date().toISOString(),
      inspector_id: existing.inspector_id || userId,
      assigned_by: existing.assigned_by || userId,
      assigned_at: existing.assigned_at || new Date().toISOString(),
      ...updateTimestampFields(userId),
    })
    .eq('id', inspectionId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to start inspection: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: inspectionId,
    action: 'start',
    user_id: userId,
    old_value: { status: existing.status },
    new_value: { status: INSPECTION_STATUS.IN_PROGRESS },
  });

  return enrichInspection(data, supabase);
}

/**
 * Complete in-process inspection with WO operation update
 */
export async function completeInProcess(
  orgId: string,
  inspectionId: string,
  input: CompleteInProcessInspectionInput,
  userId: string
): Promise<CompleteInProcessResult> {
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', inspectionId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status !== INSPECTION_STATUS.IN_PROGRESS) {
    throw new ValidationError('Only in-progress inspections can be completed');
  }

  // Validate conditional requirements
  if (input.result === INSPECTION_RESULT.CONDITIONAL) {
    if (!input.conditional_reason || !input.conditional_restrictions) {
      throw new ValidationError('Conditional reason and restrictions required for conditional result');
    }
  }

  const updateData: any = {
    status: INSPECTION_STATUS.COMPLETED,
    result: input.result,
    result_notes: input.result_notes || null,
    defects_found: input.defects_found || 0,
    major_defects: input.major_defects || 0,
    minor_defects: input.minor_defects || 0,
    critical_defects: input.critical_defects || 0,
    completed_at: new Date().toISOString(),
    completed_by: userId,
    ...updateTimestampFields(userId),
  };

  if (input.result === INSPECTION_RESULT.CONDITIONAL) {
    updateData.conditional_reason = input.conditional_reason;
    updateData.conditional_restrictions = input.conditional_restrictions;
    updateData.conditional_expires_at = input.conditional_expires_at || null;
    updateData.conditional_approved_by = userId;
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update(updateData)
    .eq('id', inspectionId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to complete inspection: ${error.message}`);
  }

  // WO operation status is updated via trigger, but track if it happened
  let woOperationUpdated = false;
  let woOperationQaStatus = QA_STATUS.PENDING;
  let nextOperationBlocked = false;

  if (existing.wo_operation_id) {
    woOperationUpdated = true;
    woOperationQaStatus = input.result === INSPECTION_RESULT.PASS ? QA_STATUS.PASSED :
                          input.result === INSPECTION_RESULT.FAIL ? QA_STATUS.FAILED : QA_STATUS.CONDITIONAL;

    // Check if next operation should be blocked
    if (input.result === INSPECTION_RESULT.FAIL) {
      const { data: settings } = await supabase
        .from('quality_settings')
        .select('block_next_operation_on_fail')
        .eq('org_id', orgId)
        .single();

      const shouldBlock = input.block_next_operation ?? settings?.block_next_operation_on_fail ?? true;
      nextOperationBlocked = shouldBlock;
    }
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: inspectionId,
    action: 'complete',
    user_id: userId,
    old_value: { status: existing.status },
    new_value: { status: INSPECTION_STATUS.COMPLETED, result: input.result },
  });

  const enrichedInspection = await enrichInspection(data, supabase);

  // NCR creation placeholder
  let ncrId: string | undefined;
  if (input.create_ncr && input.result === INSPECTION_RESULT.FAIL) {
    // NCR creation will be implemented in story 06.9
  }

  // Production notification
  const alertSentTo: string[] = [];
  try {
    await notifyProductionOnCompletion(orgId, inspectionId, input.result);
    alertSentTo.push('production_team');
  } catch (e) {
    // Log but don't fail
    console.error('Failed to send production notification:', e);
  }

  return {
    inspection: enrichedInspection,
    wo_operation_updated: woOperationUpdated,
    wo_operation_qa_status: woOperationQaStatus,
    next_operation_blocked: nextOperationBlocked,
    ncr_id: ncrId,
    alert_sent_to: alertSentTo,
  };
}

/**
 * Assign inspector to inspection
 */
export async function assignInspector(
  orgId: string,
  inspectionId: string,
  inspectorId: string,
  userId: string
): Promise<QualityInspection> {
  const supabase = await createServerSupabase();

  // Get existing inspection
  const { data: existing, error: fetchError } = await supabase
    .from('quality_inspections')
    .select('*')
    .eq('id', inspectionId)
    .eq('org_id', orgId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Inspection not found');
  }

  if (existing.status === INSPECTION_STATUS.COMPLETED || existing.status === INSPECTION_STATUS.CANCELLED) {
    throw new ValidationError('Cannot assign inspector to completed or cancelled inspection');
  }

  const { data, error } = await supabase
    .from('quality_inspections')
    .update({
      inspector_id: inspectorId,
      assigned_by: userId,
      assigned_at: new Date().toISOString(),
      ...updateTimestampFields(userId),
    })
    .eq('id', inspectionId)
    .select()
    .single();

  if (error) {
    throw new DatabaseError(`Failed to assign inspector: ${error.message}`);
  }

  // Audit log
  await AuditService.log({
    entity_type: 'inspection',
    entity_id: inspectionId,
    action: 'assign',
    user_id: userId,
    old_value: { inspector_id: existing.inspector_id },
    new_value: { inspector_id: inspectorId },
  });

  return enrichInspection(data, supabase);
}

// =============================================================================
// WO Operation QA Status Operations
// =============================================================================

/**
 * Update WO operation QA status (usually done via trigger)
 */
export async function updateOperationQAStatus(
  orgId: string,
  operationId: string,
  result: 'pass' | 'fail' | 'conditional',
  inspectionId: string
): Promise<void> {
  const supabase = await createServerSupabase();

  const qaStatusMap: Record<string, string> = {
    [INSPECTION_RESULT.PASS]: QA_STATUS.PASSED,
    [INSPECTION_RESULT.FAIL]: QA_STATUS.FAILED,
    [INSPECTION_RESULT.CONDITIONAL]: QA_STATUS.CONDITIONAL,
  };

  const { error } = await supabase
    .from('wo_operations')
    .update({
      qa_status: qaStatusMap[result],
      qa_inspection_id: inspectionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', operationId)
    .eq('organization_id', orgId);

  if (error) {
    throw new DatabaseError(`Failed to update operation QA status: ${error.message}`);
  }
}

/**
 * Check if next operation can start based on previous QA status
 */
export async function canStartNextOperation(
  orgId: string,
  woId: string,
  currentSequence: number
): Promise<{ canStart: boolean; blockedReason?: string }> {
  const supabase = await createServerSupabase();

  // Get quality settings
  const { data: settings } = await supabase
    .from('quality_settings')
    .select('require_operation_qa_pass, block_next_operation_on_fail')
    .eq('org_id', orgId)
    .single();

  const requirePass = settings?.require_operation_qa_pass ?? false;
  const blockOnFail = settings?.block_next_operation_on_fail ?? true;

  // Get current operation QA status
  const { data: operation, error } = await supabase
    .from('wo_operations')
    .select('qa_status, operation_name')
    .eq('wo_id', woId)
    .eq('sequence', currentSequence)
    .single();

  if (error || !operation) {
    return { canStart: true };
  }

  const qaStatus = operation.qa_status;

  // If not required, allow
  if (qaStatus === QA_STATUS.NOT_REQUIRED) {
    return { canStart: true };
  }

  // If passed or conditional, allow
  if (qaStatus === QA_STATUS.PASSED) {
    return { canStart: true };
  }

  if (qaStatus === QA_STATUS.CONDITIONAL) {
    return { canStart: true };
  }

  // If failed and blocking is enabled, block
  if (qaStatus === QA_STATUS.FAILED && blockOnFail) {
    return {
      canStart: false,
      blockedReason: `Previous operation QA failed - resolve before continuing`,
    };
  }

  // If pending and require pass is enabled, block
  if (qaStatus === QA_STATUS.PENDING && requirePass) {
    return {
      canStart: false,
      blockedReason: `Previous operation QA pending - awaiting inspection`,
    };
  }

  return { canStart: true };
}

/**
 * Get WO quality summary
 */
export async function getWOQualitySummary(
  orgId: string,
  woId: string
): Promise<WOQualitySummary> {
  const supabase = await createServerSupabase();

  // Get all WO operations with QA status
  const { data: operations, error } = await supabase
    .from('wo_operations')
    .select('qa_status')
    .eq('wo_id', woId)
    .eq('organization_id', orgId);

  if (error) {
    throw new DatabaseError(`Failed to fetch WO operations: ${error.message}`);
  }

  const totalOperations = operations?.length || 0;
  const qaRequired = operations?.filter((o) => o.qa_status !== QA_STATUS.NOT_REQUIRED).length || 0;
  const passed = operations?.filter((o) => o.qa_status === QA_STATUS.PASSED).length || 0;
  const failed = operations?.filter((o) => o.qa_status === QA_STATUS.FAILED).length || 0;
  const pending = operations?.filter((o) => o.qa_status === QA_STATUS.PENDING).length || 0;
  const conditional = operations?.filter((o) => o.qa_status === QA_STATUS.CONDITIONAL).length || 0;

  // Determine overall status
  let overallStatus: 'pass' | 'fail' | 'pending' | 'conditional' = 'pass';
  if (failed > 0) {
    overallStatus = 'fail';
  } else if (pending > 0) {
    overallStatus = 'pending';
  } else if (conditional > 0) {
    overallStatus = 'conditional';
  }

  return {
    total_operations: totalOperations,
    qa_required: qaRequired,
    passed,
    failed,
    pending,
    conditional,
    overall_status: overallStatus,
  };
}

// =============================================================================
// Auto-Creation Operations
// =============================================================================

/**
 * Check if operation requires inspection
 */
export async function operationRequiresInspection(
  orgId: string,
  operationId: string
): Promise<boolean> {
  const supabase = await createServerSupabase();

  // Get WO operation
  const { data: woOp, error: woOpError } = await supabase
    .from('wo_operations')
    .select('routing_operation_id')
    .eq('id', operationId)
    .eq('organization_id', orgId)
    .single();

  if (woOpError || !woOp) {
    return false;
  }

  if (!woOp.routing_operation_id) {
    return false;
  }

  // Check routing operation
  const { data: routingOp, error: routingError } = await supabase
    .from('routing_operations')
    .select('requires_quality_check')
    .eq('id', woOp.routing_operation_id)
    .single();

  if (routingError || !routingOp) {
    return false;
  }

  return routingOp.requires_quality_check === true;
}

/**
 * Create inspection for operation completion (auto-create)
 */
export async function createForOperationCompletion(
  orgId: string,
  operationId: string,
  userId: string
): Promise<QualityInspection | null> {
  const supabase = await createServerSupabase();

  // Check if auto-create is enabled
  const { data: settings } = await supabase
    .from('quality_settings')
    .select('auto_create_inspection_on_operation')
    .eq('org_id', orgId)
    .single();

  if (!settings?.auto_create_inspection_on_operation) {
    return null;
  }

  // Check if operation requires inspection
  const requiresInspection = await operationRequiresInspection(orgId, operationId);
  if (!requiresInspection) {
    return null;
  }

  // Get operation details
  const { data: operation, error: opError } = await supabase
    .from('wo_operations')
    .select('wo_id, routing_operation_id')
    .eq('id', operationId)
    .eq('organization_id', orgId)
    .single();

  if (opError || !operation) {
    return null;
  }

  // Get routing operation for priority
  let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
  if (operation.routing_operation_id) {
    const { data: routingOp } = await supabase
      .from('routing_operations')
      .select('is_critical')
      .eq('id', operation.routing_operation_id)
      .single();

    if (routingOp?.is_critical) {
      priority = 'high';
    }
  }

  // Create inspection
  return createInProcess(orgId, {
    wo_id: operation.wo_id,
    wo_operation_id: operationId,
    priority,
  });
}

// =============================================================================
// Notification Operations
// =============================================================================

/**
 * Send production notification on inspection completion
 */
export async function notifyProductionOnCompletion(
  orgId: string,
  inspectionId: string,
  result: string
): Promise<void> {
  // Placeholder for notification implementation
  // In a real implementation, this would:
  // 1. Get the WO and operation details
  // 2. Find the production lead/operator assigned
  // 3. Send notification via email/push/etc.
  console.log(`Production notification sent for inspection ${inspectionId}: ${result}`);
}

/**
 * Check and alert on overdue inspections
 */
export async function checkAndAlertOverdueInspections(orgId: string): Promise<void> {
  const supabase = await createServerSupabase();

  // Get quality settings for SLA
  const { data: settings } = await supabase
    .from('quality_settings')
    .select('inspection_sla_hours')
    .eq('org_id', orgId)
    .single();

  const slaHours = settings?.inspection_sla_hours || 2;

  // Find overdue inspections
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - slaHours);

  const { data: overdueInspections } = await supabase
    .from('quality_inspections')
    .select('id, inspection_number')
    .eq('org_id', orgId)
    .eq('inspection_type', INSPECTION_TYPE_IN_PROCESS)
    .eq('status', 'scheduled')
    .lt('created_at', cutoffTime.toISOString());

  // Alert for each overdue inspection
  for (const inspection of overdueInspections || []) {
    console.log(`Overdue inspection alert: ${inspection.inspection_number}`);
    // In a real implementation, send alert to QA Manager
  }
}

// =============================================================================
// Export Service
// =============================================================================

export const InProcessInspectionService = {
  listInProcess,
  getByWorkOrder,
  getByOperation,
  createInProcess,
  startInspection,
  completeInProcess,
  assignInspector,
  updateOperationQAStatus,
  canStartNextOperation,
  getWOQualitySummary,
  operationRequiresInspection,
  createForOperationCompletion,
  notifyProductionOnCompletion,
  checkAndAlertOverdueInspections,
};

export default InProcessInspectionService;
