/**
 * Spec Parameter Service
 * Story: 06.4 - Test Parameters
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Provides CRUD operations for quality spec parameters:
 * - getBySpecId() - Get all parameters for a specification
 * - create() - Create new parameter with auto-sequence
 * - update() - Update parameter (draft specs only)
 * - delete() - Delete parameter (draft specs only)
 * - reorder() - Reorder parameters via sequence update
 * - cloneToNewSpec() - Clone parameters to new spec version
 * - validateValue() - Validate test value against parameter criteria
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 * - Draft Status Check: SAFE - Database trigger enforces draft-only modifications.
 */

import { createServerSupabase } from '@/lib/supabase/server';
import {
  NotFoundError,
  ValidationError,
  DatabaseError,
} from './specification-service';
import type {
  QualitySpecParameter,
  CreateParameterRequest,
  UpdateParameterRequest,
  ValueValidationResult,
} from '@/lib/types/quality';

/**
 * Helper to get authenticated user's org_id and user_id
 */
async function getUserInfo(): Promise<{ userId: string; orgId: string }> {
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
 * Get parameters for a specification
 */
export async function getBySpecId(specId: string): Promise<QualitySpecParameter[]> {
  const supabase = await createServerSupabase();

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(specId)) {
    throw new ValidationError('Invalid specification ID format');
  }

  const { data, error } = await supabase
    .from('quality_spec_parameters')
    .select(`
      *,
      instrument:machines!instrument_id(id, name, code)
    `)
    .eq('spec_id', specId)
    .order('sequence', { ascending: true });

  if (error) {
    throw new DatabaseError(`Failed to fetch parameters: ${error.message}`);
  }

  return (data || []).map((param: any) => ({
    ...param,
    instrument_name: param.instrument?.name || null,
  }));
}

/**
 * Create parameter with auto-sequence
 */
export async function create(
  specId: string,
  data: CreateParameterRequest,
  userId: string
): Promise<QualitySpecParameter> {
  const supabase = await createServerSupabase();

  // Get spec to verify it exists and is draft
  const { data: spec, error: specError } = await supabase
    .from('quality_specifications')
    .select('id, status')
    .eq('id', specId)
    .single();

  if (specError || !spec) {
    throw new NotFoundError('Specification not found');
  }

  if (spec.status !== 'draft') {
    throw new ValidationError('Cannot add parameters to non-draft specifications');
  }

  // Validate type-specific constraints
  // Helper to check if value is not null/undefined
  const hasValue = (value: any): boolean => value !== undefined && value !== null;

  if (data.parameter_type === 'numeric' || data.parameter_type === 'range') {
    if (!hasValue(data.min_value) && !hasValue(data.max_value)) {
      throw new ValidationError('Numeric and range parameters require at least one of min_value or max_value');
    }
  }

  if (data.parameter_type === 'range') {
    if (!hasValue(data.min_value) || !hasValue(data.max_value)) {
      throw new ValidationError('Range parameters require both min_value and max_value');
    }
  }

  if (hasValue(data.min_value) && hasValue(data.max_value)) {
    const minVal = data.min_value as number;
    const maxVal = data.max_value as number;
    if (minVal >= maxVal) {
      throw new ValidationError('min_value must be less than max_value');
    }
  }

  // Get next sequence
  const { data: seqData, error: seqError } = await supabase
    .rpc('get_next_parameter_sequence', { p_spec_id: specId });

  if (seqError) {
    throw new DatabaseError(`Failed to get next sequence: ${seqError.message}`);
  }

  const sequence = seqData || 1;

  const parameter = {
    spec_id: specId,
    sequence,
    parameter_name: data.parameter_name,
    parameter_type: data.parameter_type,
    target_value: data.target_value ?? null,
    min_value: data.min_value ?? null,
    max_value: data.max_value ?? null,
    unit: data.unit ?? null,
    test_method: data.test_method ?? null,
    instrument_required: data.instrument_required ?? false,
    instrument_id: data.instrument_id ?? null,
    is_critical: data.is_critical ?? false,
    acceptance_criteria: data.acceptance_criteria ?? null,
    sampling_instructions: data.sampling_instructions ?? null,
    created_by: userId,
  };

  const { data: created, error } = await supabase
    .from('quality_spec_parameters')
    .insert(parameter)
    .select()
    .single();

  if (error) {
    if (error.message.includes('Cannot modify parameters')) {
      throw new ValidationError('Cannot add parameters to non-draft specifications');
    }
    throw new DatabaseError(`Failed to create parameter: ${error.message}`);
  }

  return created;
}

/**
 * Update parameter
 */
export async function update(
  parameterId: string,
  data: UpdateParameterRequest,
  userId: string
): Promise<QualitySpecParameter> {
  const supabase = await createServerSupabase();

  // Helper to check if value is not null/undefined
  const hasValue = (value: any): boolean => value !== undefined && value !== null;

  // Validate min/max when both provided
  if (hasValue(data.min_value) && hasValue(data.max_value)) {
    const minVal = data.min_value as number;
    const maxVal = data.max_value as number;
    if (minVal >= maxVal) {
      throw new ValidationError('min_value must be less than max_value');
    }
  }

  // Get existing parameter to check type constraints
  const { data: existing, error: fetchError } = await supabase
    .from('quality_spec_parameters')
    .select('*')
    .eq('id', parameterId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Parameter not found');
  }

  // Merge with existing to validate type constraints
  const merged = { ...existing, ...data };
  if (merged.parameter_type === 'numeric' || merged.parameter_type === 'range') {
    if (!hasValue(merged.min_value) && !hasValue(merged.max_value)) {
      throw new ValidationError('Numeric and range parameters require at least one of min_value or max_value');
    }
  }

  const { data: updated, error } = await supabase
    .from('quality_spec_parameters')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', parameterId)
    .select()
    .single();

  if (error) {
    if (error.message.includes('Cannot modify parameters')) {
      throw new ValidationError('Cannot modify parameters on non-draft specifications');
    }
    throw new DatabaseError(`Failed to update parameter: ${error.message}`);
  }

  return updated;
}

/**
 * Delete parameter
 * Note: RLS policy enforces draft-only deletion
 */
export async function deleteParameter(parameterId: string): Promise<void> {
  const supabase = await createServerSupabase();

  // Check if parameter exists
  const { data: existing, error: fetchError } = await supabase
    .from('quality_spec_parameters')
    .select('id')
    .eq('id', parameterId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Parameter not found');
  }

  const { error } = await supabase
    .from('quality_spec_parameters')
    .delete()
    .eq('id', parameterId);

  if (error) {
    // RLS policy blocks deletion on non-draft specs
    throw new DatabaseError(`Failed to delete parameter: ${error.message}`);
  }
}

// Export as 'delete' for service interface (delete is reserved keyword)
export { deleteParameter as delete };

/**
 * Reorder parameters
 */
export async function reorder(
  specId: string,
  parameterIds: string[]
): Promise<QualitySpecParameter[]> {
  const supabase = await createServerSupabase();

  // Verify spec exists and is draft
  const { data: spec, error: specError } = await supabase
    .from('quality_specifications')
    .select('id, status')
    .eq('id', specId)
    .single();

  if (specError || !spec) {
    throw new NotFoundError('Specification not found');
  }

  if (spec.status !== 'draft') {
    throw new ValidationError('Cannot reorder parameters on non-draft specifications');
  }

  // Call reorder function
  const { error } = await supabase
    .rpc('reorder_spec_parameters', {
      p_spec_id: specId,
      p_parameter_ids: parameterIds
    });

  if (error) {
    throw new DatabaseError(`Failed to reorder parameters: ${error.message}`);
  }

  // Return updated list
  return getBySpecId(specId);
}

/**
 * Clone parameters to new spec version
 * (Called from SpecificationService.cloneAsNewVersion)
 */
export async function cloneToNewSpec(
  sourceSpecId: string,
  targetSpecId: string,
  userId: string
): Promise<void> {
  const sourceParams = await getBySpecId(sourceSpecId);

  for (const param of sourceParams) {
    const {
      id: _id,
      spec_id: _specId,
      created_at: _createdAt,
      created_by: _createdBy,
      updated_at: _updatedAt,
      updated_by: _updatedBy,
      instrument_name: _instrumentName,
      ...paramData
    } = param;

    await create(targetSpecId, paramData as CreateParameterRequest, userId);
  }
}

/**
 * Validate parameter value against parameter definition
 * (Used in story 06.6 - Test Results Recording)
 */
export function validateValue(
  parameter: QualitySpecParameter,
  value: string | number | boolean
): ValueValidationResult {
  // Helper to check if value is not null/undefined
  const hasValue = (val: any): boolean => val !== undefined && val !== null;

  switch (parameter.parameter_type) {
    case 'numeric':
    case 'range':
      const numValue = typeof value === 'number' ? value : parseFloat(value as string);
      if (isNaN(numValue)) {
        return { valid: false, reason: 'Invalid numeric value' };
      }
      if (hasValue(parameter.min_value) && numValue < (parameter.min_value as number)) {
        return { valid: false, reason: `Below minimum (${parameter.min_value})` };
      }
      if (hasValue(parameter.max_value) && numValue > (parameter.max_value as number)) {
        return { valid: false, reason: `Above maximum (${parameter.max_value})` };
      }
      return { valid: true };

    case 'boolean':
      if (parameter.target_value) {
        const match = value.toString().toLowerCase() === parameter.target_value.toLowerCase();
        return { valid: match, reason: match ? undefined : `Expected ${parameter.target_value}` };
      }
      return { valid: true };

    case 'text':
      // Text parameters are manually evaluated
      return { valid: true };

    default:
      return { valid: false, reason: 'Unknown parameter type' };
  }
}

/**
 * Export service as object
 */
export const SpecParameterService = {
  getBySpecId,
  create,
  update,
  delete: deleteParameter,
  reorder,
  cloneToNewSpec,
  validateValue,
};

export default SpecParameterService;
