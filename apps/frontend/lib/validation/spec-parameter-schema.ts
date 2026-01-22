/**
 * Quality Spec Parameter Validation Schemas
 * Story: 06.4 - Test Parameters
 * Phase: P4 - Refactor (DRY improvements)
 *
 * Zod schemas for parameter CRUD operations:
 * - createParameterSchema: Parameter creation with type-specific validation
 * - updateParameterSchema: Partial updates
 * - reorderParametersSchema: Reorder parameter sequence
 */

import { z } from 'zod';

/**
 * UUID validation pattern - extracted constant for reuse
 */
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Helper function to validate UUID format
 */
export function isValidUUID(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * Helper to check if value is not null/undefined
 */
function hasValue(value: any): boolean {
  return value !== undefined && value !== null;
}

/**
 * Parameter Type Enum
 */
export const parameterTypeEnum = z.enum(['numeric', 'text', 'boolean', 'range']);

/**
 * Create Parameter Schema
 * Validates parameter creation with type-specific rules:
 * - numeric: requires at least min_value or max_value
 * - range: requires both min_value and max_value
 * - min_value must be less than max_value when both provided
 */
export const createParameterSchema = z.object({
  parameter_name: z.string()
    .min(2, 'Parameter name must be at least 2 characters')
    .max(200, 'Parameter name must not exceed 200 characters'),
  parameter_type: parameterTypeEnum,
  target_value: z.string().max(500).optional().nullable(),
  min_value: z.number().optional().nullable(),
  max_value: z.number().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  test_method: z.string().max(200).optional().nullable(),
  instrument_required: z.boolean().default(false),
  instrument_id: z.string().uuid().optional().nullable(),
  is_critical: z.boolean().default(false),
  acceptance_criteria: z.string().max(1000).optional().nullable(),
  sampling_instructions: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    // Numeric and range types require at least min or max
    if (data.parameter_type === 'numeric' || data.parameter_type === 'range') {
      return hasValue(data.min_value) || hasValue(data.max_value);
    }
    return true;
  },
  {
    message: 'Numeric and range parameters require at least one of min_value or max_value',
    path: ['min_value']
  }
).refine(
  (data) => {
    // Range type requires both min and max
    if (data.parameter_type === 'range') {
      return hasValue(data.min_value) && hasValue(data.max_value);
    }
    return true;
  },
  {
    message: 'Range parameters require both min_value and max_value',
    path: ['min_value']
  }
).refine(
  (data) => {
    // If both min and max provided, min must be less than max
    if (hasValue(data.min_value) && hasValue(data.max_value)) {
      return (data.min_value as number) < (data.max_value as number);
    }
    return true;
  },
  {
    message: 'min_value must be less than max_value',
    path: ['max_value']
  }
);

export type CreateParameterInput = z.infer<typeof createParameterSchema>;

/**
 * Update Parameter Schema
 * All fields optional for partial updates
 * Validates type-specific constraints when relevant fields are provided
 */
export const updateParameterSchema = z.object({
  parameter_name: z.string()
    .min(2, 'Parameter name must be at least 2 characters')
    .max(200, 'Parameter name must not exceed 200 characters')
    .optional(),
  parameter_type: parameterTypeEnum.optional(),
  target_value: z.string().max(500).optional().nullable(),
  min_value: z.number().optional().nullable(),
  max_value: z.number().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  test_method: z.string().max(200).optional().nullable(),
  instrument_required: z.boolean().optional(),
  instrument_id: z.string().uuid().optional().nullable(),
  is_critical: z.boolean().optional(),
  acceptance_criteria: z.string().max(1000).optional().nullable(),
  sampling_instructions: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    // If both min and max provided, min must be less than max
    if (hasValue(data.min_value) && hasValue(data.max_value)) {
      return (data.min_value as number) < (data.max_value as number);
    }
    return true;
  },
  {
    message: 'min_value must be less than max_value',
    path: ['max_value']
  }
);

export type UpdateParameterInput = z.infer<typeof updateParameterSchema>;

/**
 * Reorder Parameters Schema
 * Validates array of parameter UUIDs for reordering
 */
export const reorderParametersSchema = z.object({
  parameter_ids: z.array(z.string().uuid()).min(1, 'At least one parameter ID required'),
});

export type ReorderParametersInput = z.infer<typeof reorderParametersSchema>;
