/**
 * Sampling Plan Validation Schemas
 * Story: 06.7 - Sampling Plans (AQL)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Zod schemas for sampling plan CRUD operations
 * Based on ISO 2859 / ANSI Z1.4 standards
 *
 * - Inspection Levels: I, II, III
 * - AQL Values: 0.065, 0.10, 0.15, 0.25, 0.40, 0.65, 1.0, 1.5, 2.5, 4.0, 6.5, 10.0
 * - Lot size range mapping to sample sizes
 */

import { z } from 'zod';

/**
 * Inspection Type enum
 */
export const inspectionTypeEnum = z.enum(['incoming', 'in_process', 'final']);
export type InspectionType = z.infer<typeof inspectionTypeEnum>;

/**
 * AQL Level enum (General Inspection Levels I, II, III)
 */
export const aqlLevelEnum = z.enum(['I', 'II', 'III']);
export type AqlLevel = z.infer<typeof aqlLevelEnum>;

/**
 * Special Level enum (Phase 2 - not used in MVP)
 */
export const specialLevelEnum = z.enum(['S-1', 'S-2', 'S-3', 'S-4']);
export type SpecialLevel = z.infer<typeof specialLevelEnum>;

/**
 * Shared sampling plan fields schema
 * Common validation rules for create and update
 */
const samplingPlanBaseFields = {
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(200, 'Name must be at most 200 characters'),
  description: z.string().max(1000).optional().nullable(),
  inspection_type: inspectionTypeEnum,
  product_id: z.string().uuid('Invalid product').optional().nullable(),
  aql_level: aqlLevelEnum.optional().nullable(),
  lot_size_min: z.number().int('Lot size min must be an integer').positive('Lot size min must be positive'),
  lot_size_max: z.number().int('Lot size max must be an integer').positive('Lot size max must be positive'),
  sample_size: z.number().int('Sample size must be an integer').positive('Sample size must be > 0'),
  acceptance_number: z.number().int('Acceptance number must be an integer').nonnegative('Acceptance number must be >= 0'),
  rejection_number: z.number().int('Rejection number must be an integer').positive('Rejection number must be > 0'),
} as const;

/**
 * Sampling plan validation refinements
 * Applied to both create and update schemas
 */
const samplingPlanRefinements = (schema: z.ZodType<any>) =>
  schema
    .refine(
      (data) => data.lot_size_min <= data.lot_size_max,
      { message: 'Lot size min must be <= max', path: ['lot_size_max'] }
    )
    .refine(
      (data) => data.acceptance_number < data.rejection_number,
      { message: 'Acceptance number must be < rejection number', path: ['rejection_number'] }
    );

/**
 * Create Sampling Plan Schema
 * Required fields for creating a new sampling plan
 */
export const createSamplingPlanSchema = samplingPlanRefinements(
  z.object(samplingPlanBaseFields)
);

export type CreateSamplingPlanInput = z.infer<typeof createSamplingPlanSchema>;

/**
 * Update Sampling Plan Schema
 * All fields from create plus is_active
 */
export const updateSamplingPlanSchema = samplingPlanRefinements(
  z.object({
    ...samplingPlanBaseFields,
    is_active: z.boolean().optional(),
  })
);

export type UpdateSamplingPlanInput = z.infer<typeof updateSamplingPlanSchema>;

/**
 * Create Sampling Record Schema
 * Required fields for recording a sample during inspection
 */
export const createSamplingRecordSchema = z.object({
  plan_id: z.string().uuid('Invalid sampling plan'),
  inspection_id: z.string().uuid('Invalid inspection'),
  sample_identifier: z.string()
    .min(1, 'Sample identifier required')
    .max(50, 'Sample identifier must be at most 50 characters'),
  location_description: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CreateSamplingRecordInput = z.infer<typeof createSamplingRecordSchema>;

/**
 * Sampling Plans List Query Schema
 */
export const samplingPlansListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(100).default(20),
  inspection_type: inspectionTypeEnum.optional(),
  is_active: z.coerce.boolean().optional(),
  include_inactive: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  sort_by: z.string().optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SamplingPlansListQuery = z.infer<typeof samplingPlansListQuerySchema>;

/**
 * ISO 2859 Reference Query Schema
 */
export const iso2859QuerySchema = z.object({
  lot_size: z.coerce.number().int().positive().optional(),
  inspection_level: aqlLevelEnum.optional(),
});

export type ISO2859Query = z.infer<typeof iso2859QuerySchema>;
