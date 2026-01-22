/**
 * Quality Test Results Validation Schema
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Zod schemas for test result management:
 * - Create single test result
 * - Batch create multiple results
 * - Update test result
 * - Query test results with filters
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { z } from 'zod';

/**
 * Result status enum
 */
export const resultStatusEnum = z.enum(['pass', 'fail', 'marginal']);
export type ResultStatus = z.infer<typeof resultStatusEnum>;

/**
 * Shared test result fields (DRY)
 * Used by create, batch, and update schemas
 */
const testResultFields = {
  parameter_id: z.string().uuid('Invalid parameter ID'),
  measured_value: z.string().min(1, 'Measured value required'),
  numeric_value: z.number().optional(),
  equipment_id: z.string().uuid('Invalid equipment ID').optional().nullable(),
  calibration_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable(),
  notes: z.string().max(1000, 'Notes too long').optional().nullable(),
  attachment_url: z.string().url('Invalid URL').optional().nullable(),
};

/**
 * Create single test result schema
 */
export const testResultCreateSchema = z.object({
  inspection_id: z.string().uuid('Invalid inspection ID'),
  ...testResultFields,
});

export type TestResultCreate = z.infer<typeof testResultCreateSchema>;

/**
 * Batch create test results schema
 */
export const testResultBatchCreateSchema = z.object({
  inspection_id: z.string().uuid('Invalid inspection ID'),
  results: z
    .array(z.object(testResultFields))
    .min(1, 'At least one result required')
    .max(100, 'Max 100 results per batch'),
});

export type TestResultBatchCreate = z.infer<typeof testResultBatchCreateSchema>;

/**
 * Update test result schema (all fields optional)
 */
export const testResultUpdateSchema = z.object({
  id: z.string().uuid('Invalid result ID'),
  // Make all shared fields optional for updates
  ...Object.fromEntries(
    Object.entries(testResultFields).map(([key, schema]) => [
      key,
      schema instanceof z.ZodType ? schema.optional() : schema,
    ])
  ),
});

export type TestResultUpdate = z.infer<typeof testResultUpdateSchema>;

/**
 * Query test results schema
 */
export const testResultQuerySchema = z.object({
  inspection_id: z.string().uuid().optional(),
  parameter_id: z.string().uuid().optional(),
  result_status: resultStatusEnum.optional(),
  tested_by: z.string().uuid().optional(),
  from_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional(),
  to_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type TestResultQuery = z.infer<typeof testResultQuerySchema>;

/**
 * Test result type with all fields
 */
export interface TestResult {
  id: string;
  org_id: string;
  inspection_id: string;
  parameter_id: string;
  measured_value: string;
  numeric_value?: number | null;
  result_status: ResultStatus;
  deviation_pct?: number | null;
  tested_by: string;
  tested_at: string;
  equipment_id?: string | null;
  calibration_date?: string | null;
  notes?: string | null;
  attachment_url?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at?: string | null;
  // Relations
  parameter?: {
    id: string;
    parameter_name: string;
    parameter_type: string;
    target_value?: string | null;
    min_value?: number | null;
    max_value?: number | null;
    unit?: string | null;
    is_critical?: boolean;
    test_method?: string | null;
  };
  tester?: {
    id: string;
    name: string;
    email: string;
  };
  equipment?: {
    id: string;
    name: string;
    code: string;
  };
  inspection?: {
    id: string;
    inspection_number: string;
  };
}

/**
 * Inspection summary type
 */
export interface InspectionSummary {
  total: number;
  pass: number;
  fail: number;
  marginal: number;
  pass_rate: number;
}

/**
 * Parameter validation result type
 */
export interface ParameterValidationResult {
  result_status: ResultStatus;
  deviation_pct?: number;
  numeric_value?: number;
}
