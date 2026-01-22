/**
 * Test Results Service
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Service layer for quality test result management:
 * - validateResult() - Validate measured value against parameter criteria
 * - create() - Create single test result with auto-validation
 * - createBatch() - Batch create multiple results
 * - getByInspection() - Get all results for an inspection
 * - query() - Query results with filters and pagination
 * - getInspectionSummary() - Get pass/fail/marginal counts
 * - update() - Update test result (re-validates if measured_value changes)
 * - delete() - Delete test result
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { createServerSupabase } from '@/lib/supabase/server';
import type {
  TestResultCreate,
  TestResultBatchCreate,
  TestResultUpdate,
  TestResultQuery,
  TestResult,
  InspectionSummary,
  ParameterValidationResult,
  ResultStatus,
} from '@/lib/validation/quality-test-results-schema';

/**
 * Standard select query for test results with relations
 * Used in getByInspection(), query(), and other read operations
 */
const TEST_RESULT_SELECT = `
  *,
  parameter:quality_spec_parameters(*),
  tester:users(id, name, email),
  equipment:machines(id, name, code)
` as const;

/**
 * Check if a value represents boolean "true"
 * Helper to handle different boolean representations
 *
 * @param value - String value to check
 * @returns True if value represents "true"
 */
function isBooleanTrue(value: string): boolean {
  const lower = value.toLowerCase();
  return lower === 'true' || lower === 'yes' || lower === '1';
}

/**
 * Check if a value represents boolean "false"
 * Helper to handle different boolean representations
 *
 * @param value - String value to check
 * @returns True if value represents "false"
 */
function isBooleanFalse(value: string): boolean {
  const lower = value.toLowerCase();
  return lower === 'false' || lower === 'no' || lower === '0';
}

/**
 * Get user organization ID
 * Helper function to fetch and validate user org_id
 *
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns User organization ID
 * @throws Error if user not found
 */
async function getUserOrgId(supabase: any, userId: string): Promise<string> {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  return user.org_id;
}

/**
 * Prepare test result insert object
 * Helper function to avoid DRY violation
 *
 * @param data - Result data
 * @param userId - User ID
 * @param orgId - Organization ID
 * @param validation - Validation result
 * @returns Prepared insert object
 */
function prepareResultInsert(
  data: Omit<TestResultCreate, 'inspection_id'> & { inspection_id: string },
  userId: string,
  orgId: string,
  validation: ParameterValidationResult
): Record<string, unknown> {
  return {
    org_id: orgId,
    inspection_id: data.inspection_id,
    parameter_id: data.parameter_id,
    measured_value: data.measured_value,
    numeric_value: validation.numeric_value ?? null,
    result_status: validation.result_status,
    deviation_pct: validation.deviation_pct ?? null,
    tested_by: userId,
    tested_at: new Date().toISOString(),
    equipment_id: data.equipment_id ?? null,
    calibration_date: data.calibration_date ?? null,
    notes: data.notes ?? null,
    attachment_url: data.attachment_url ?? null,
    created_by: userId,
  };
}

/**
 * Validate test result against parameter criteria
 *
 * Business Rules:
 * - Boolean: true/yes/1 passes if target is true
 * - Text: Case-insensitive exact match
 * - Numeric/Range: Within min/max limits
 * - Marginal: Within 5% of either limit (inside valid range)
 * - Deviation % calculated for marginal/fail results
 *
 * @param measuredValue - The measured value as string
 * @param parameter - The parameter with validation criteria
 * @returns Validation result with status and optional deviation
 */
export function validateResult(
  measuredValue: string,
  parameter: {
    parameter_type: string;
    target_value?: string | null;
    min_value?: number | null;
    max_value?: number | null;
  }
): ParameterValidationResult {
  const paramType = parameter.parameter_type;

  // Handle null/undefined/empty measured value
  if (measuredValue === null || measuredValue === undefined || measuredValue === '') {
    return { result_status: 'fail' };
  }

  // Boolean type
  if (paramType === 'boolean') {
    // Check if target is "true" (default pass behavior)
    const targetIsTrue = !parameter.target_value || isBooleanTrue(parameter.target_value);
    const targetIsFalse = parameter.target_value && isBooleanFalse(parameter.target_value);

    // Check measured value against target
    const measuredIsTrue = isBooleanTrue(measuredValue);
    const measuredIsFalse = isBooleanFalse(measuredValue);

    let passes = false;
    if (targetIsTrue) {
      passes = measuredIsTrue;
    } else if (targetIsFalse) {
      passes = measuredIsFalse;
    }

    return {
      result_status: passes ? 'pass' : 'fail',
    };
  }

  // Text type (exact match, case-insensitive)
  if (paramType === 'text') {
    const passes = measuredValue.toLowerCase() === parameter.target_value?.toLowerCase();
    return {
      result_status: passes ? 'pass' : 'fail',
    };
  }

  // Numeric and Range types
  if (paramType === 'numeric' || paramType === 'range') {
    const numValue = parseFloat(measuredValue);

    if (isNaN(numValue)) {
      return { result_status: 'fail' };
    }

    const min = parameter.min_value;
    const max = parameter.max_value;

    // Both limits defined
    if (min !== null && min !== undefined && max !== null && max !== undefined) {
      const range = max - min;
      const marginThreshold = range * 0.05; // 5% of range

      // Calculate deviation from nearest limit
      if (numValue < min) {
        const deviationPct = ((min - numValue) / range) * 100;
        return { result_status: 'fail', deviation_pct: deviationPct, numeric_value: numValue };
      }

      if (numValue > max) {
        const deviationPct = ((numValue - max) / range) * 100;
        return { result_status: 'fail', deviation_pct: deviationPct, numeric_value: numValue };
      }

      // Within limits - check if marginal
      if (numValue <= min + marginThreshold) {
        const deviationPct = ((min + marginThreshold - numValue) / range) * 100;
        return {
          result_status: 'marginal',
          deviation_pct: deviationPct,
          numeric_value: numValue,
        };
      }

      if (numValue >= max - marginThreshold) {
        const deviationPct = ((numValue - (max - marginThreshold)) / range) * 100;
        return {
          result_status: 'marginal',
          deviation_pct: deviationPct,
          numeric_value: numValue,
        };
      }

      // Pass - well within limits
      return { result_status: 'pass', numeric_value: numValue };
    }

    // Only min limit
    if (min !== null && min !== undefined) {
      if (numValue < min) {
        const deviationPct = ((min - numValue) / Math.abs(min)) * 100;
        return { result_status: 'fail', deviation_pct: deviationPct, numeric_value: numValue };
      }

      // Check marginal for single min limit (within 5%)
      const marginThreshold = Math.abs(min) * 0.05;
      if (numValue < min + marginThreshold) {
        const deviationPct = ((min + marginThreshold - numValue) / Math.abs(min)) * 100;
        return { result_status: 'marginal', deviation_pct: deviationPct, numeric_value: numValue };
      }

      return { result_status: 'pass', numeric_value: numValue };
    }

    // Only max limit
    if (max !== null && max !== undefined) {
      if (numValue > max) {
        const deviationPct = ((numValue - max) / Math.abs(max)) * 100;
        return { result_status: 'fail', deviation_pct: deviationPct, numeric_value: numValue };
      }

      // Check marginal for single max limit (within 5%)
      const marginThreshold = Math.abs(max) * 0.05;
      if (numValue > max - marginThreshold) {
        const deviationPct = ((numValue - (max - marginThreshold)) / Math.abs(max)) * 100;
        return { result_status: 'marginal', deviation_pct: deviationPct, numeric_value: numValue };
      }

      return { result_status: 'pass', numeric_value: numValue };
    }

    // No limits defined - pass by default for numeric
    return { result_status: 'pass', numeric_value: numValue };
  }

  // Unknown type - default fail
  return { result_status: 'fail' };
}

/**
 * Create a single test result
 *
 * @param data - Test result data
 * @param userId - Current user ID
 * @returns Created test result
 */
export async function create(data: TestResultCreate, userId: string): Promise<TestResult> {
  const supabase = await createServerSupabase();

  // Get user org_id
  const orgId = await getUserOrgId(supabase, userId);

  // Get parameter details for validation
  const { data: parameter, error: paramError } = await supabase
    .from('quality_spec_parameters')
    .select('*')
    .eq('id', data.parameter_id)
    .single();

  if (paramError || !parameter) {
    throw new Error('Parameter not found');
  }

  // Validate result
  const validation = validateResult(data.measured_value, parameter);

  // Prepare and insert test result
  const insertData = prepareResultInsert(data, userId, orgId, validation);
  const { data: result, error } = await supabase
    .from('quality_test_results')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return result;
}

/**
 * Create multiple test results (batch)
 *
 * @param data - Batch create data with inspection_id and results array
 * @param userId - Current user ID
 * @returns Array of created test results
 */
export async function createBatch(
  data: TestResultBatchCreate,
  userId: string
): Promise<TestResult[]> {
  const supabase = await createServerSupabase();

  // Get user org_id
  const orgId = await getUserOrgId(supabase, userId);

  // Get all parameters for validation
  const parameterIds = data.results.map((r) => r.parameter_id);
  const { data: parameters, error: paramsError } = await supabase
    .from('quality_spec_parameters')
    .select('*')
    .in('id', parameterIds);

  if (paramsError || !parameters) {
    throw new Error('Parameters not found');
  }

  const parameterMap = new Map(parameters.map((p) => [p.id, p]));

  // Validate and prepare inserts
  const inserts = data.results.map((result) => {
    const parameter = parameterMap.get(result.parameter_id);
    if (!parameter) {
      throw new Error(`Parameter ${result.parameter_id} not found`);
    }

    const validation = validateResult(result.measured_value, parameter);
    return prepareResultInsert(
      { ...result, inspection_id: data.inspection_id },
      userId,
      orgId,
      validation
    );
  });

  // Batch insert
  const { data: results, error } = await supabase
    .from('quality_test_results')
    .insert(inserts)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return results || [];
}

/**
 * Get test results for an inspection
 *
 * @param inspectionId - Inspection ID
 * @returns Array of test results with relations
 */
export async function getByInspection(inspectionId: string): Promise<TestResult[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quality_test_results')
    .select(TEST_RESULT_SELECT)
    .eq('inspection_id', inspectionId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

/**
 * Query test results with filters
 *
 * @param filters - Query filters
 * @returns Paginated results
 */
export async function query(filters: TestResultQuery): Promise<{
  results: TestResult[];
  total: number;
  page: number;
  limit: number;
}> {
  const supabase = await createServerSupabase();

  let queryBuilder = supabase
    .from('quality_test_results')
    .select(TEST_RESULT_SELECT, { count: 'exact' });

  // Apply filters
  if (filters.inspection_id) {
    queryBuilder = queryBuilder.eq('inspection_id', filters.inspection_id);
  }
  if (filters.parameter_id) {
    queryBuilder = queryBuilder.eq('parameter_id', filters.parameter_id);
  }
  if (filters.result_status) {
    queryBuilder = queryBuilder.eq('result_status', filters.result_status);
  }
  if (filters.tested_by) {
    queryBuilder = queryBuilder.eq('tested_by', filters.tested_by);
  }
  if (filters.from_date) {
    queryBuilder = queryBuilder.gte('tested_at', filters.from_date);
  }
  if (filters.to_date) {
    queryBuilder = queryBuilder.lte('tested_at', filters.to_date + 'T23:59:59.999Z');
  }

  // Pagination
  const offset = (filters.page - 1) * filters.limit;
  queryBuilder = queryBuilder.range(offset, offset + filters.limit - 1);
  queryBuilder = queryBuilder.order('tested_at', { ascending: false });

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw new Error(error.message);
  }

  return {
    results: data || [],
    total: count || 0,
    page: filters.page,
    limit: filters.limit,
  };
}

/**
 * Count test results by status
 * Helper function to count results grouped by status
 *
 * @param results - Array of test results
 * @param status - Status to count
 * @returns Count of results with given status
 */
function countByStatus(results: Array<{ result_status: string }>, status: string): number {
  return results?.filter((r) => r.result_status === status).length || 0;
}

/**
 * Get test result summary for inspection (pass/fail/marginal counts)
 *
 * @param inspectionId - Inspection ID
 * @returns Summary with counts and pass rate
 */
export async function getInspectionSummary(inspectionId: string): Promise<InspectionSummary> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('quality_test_results')
    .select('result_status')
    .eq('inspection_id', inspectionId);

  if (error) {
    throw new Error(error.message);
  }

  const total = data?.length || 0;
  const pass = countByStatus(data || [], 'pass');
  const fail = countByStatus(data || [], 'fail');
  const marginal = countByStatus(data || [], 'marginal');

  return {
    total,
    pass,
    fail,
    marginal,
    pass_rate: total > 0 ? (pass / total) * 100 : 0,
  };
}

/**
 * Update test result (limited fields)
 *
 * @param id - Test result ID
 * @param data - Update data
 * @returns Updated test result
 */
export async function update(id: string, data: Partial<TestResultUpdate>): Promise<TestResult> {
  const supabase = await createServerSupabase();

  // If measured_value changed, re-validate
  let updateData: Record<string, unknown> = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Remove id from update data (it's in the where clause)
  delete updateData.id;

  if (data.measured_value) {
    // Get parameter for re-validation
    const { data: result } = await supabase
      .from('quality_test_results')
      .select('parameter_id')
      .eq('id', id)
      .single();

    if (result) {
      const { data: parameter } = await supabase
        .from('quality_spec_parameters')
        .select('*')
        .eq('id', result.parameter_id)
        .single();

      if (parameter) {
        const validation = validateResult(data.measured_value, parameter);
        updateData = {
          ...updateData,
          numeric_value: validation.numeric_value ?? null,
          result_status: validation.result_status,
          deviation_pct: validation.deviation_pct ?? null,
        };
      }
    }
  }

  const { data: updated, error } = await supabase
    .from('quality_test_results')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return updated;
}

/**
 * Delete test result
 *
 * @param id - Test result ID
 */
export async function deleteResult(id: string): Promise<void> {
  const supabase = await createServerSupabase();

  const { error } = await supabase.from('quality_test_results').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

// Export as class-like static methods for compatibility with existing patterns
export const TestResultsService = {
  validateResult,
  create,
  createBatch,
  getByInspection,
  query,
  getInspectionSummary,
  update,
  delete: deleteResult,
};

export default TestResultsService;
