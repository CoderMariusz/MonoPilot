/**
 * Specification Validation Schemas
 * Story: 06.3 - Product Specifications
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Zod schemas for specification CRUD operations
 */

import { z } from 'zod';

/**
 * Common date format validation (ISO 8601: YYYY-MM-DD)
 */
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)');

/**
 * Common name validation (3-200 chars)
 */
const specName = z.string()
  .min(3, 'Name must be at least 3 characters')
  .max(200, 'Name must not exceed 200 characters');

/**
 * Common review frequency validation (1-3650 days)
 */
const reviewFrequency = z.number().int().min(1).max(3650).default(365);

/**
 * Create Specification Schema
 * Required fields for creating a new specification
 */
export const createSpecificationSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  name: specName,
  description: z.string().max(2000).optional().nullable(),
  effective_date: dateString,
  expiry_date: dateString.optional().nullable(),
  review_frequency_days: reviewFrequency,
  notes: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => !data.expiry_date || data.expiry_date > data.effective_date,
  { message: 'Expiry date must be after effective date', path: ['expiry_date'] }
);

export type CreateSpecificationInput = z.infer<typeof createSpecificationSchema>;

/**
 * Update Specification Schema
 * All fields optional for partial updates
 * Cannot change product_id (immutable)
 */
export const updateSpecificationSchema = z.object({
  name: specName.optional(),
  description: z.string().max(2000).optional().nullable(),
  effective_date: dateString.optional(),
  expiry_date: dateString.optional().nullable(),
  review_frequency_days: reviewFrequency.optional(),
  notes: z.string().max(2000).optional().nullable(),
}).refine(
  (data) => {
    if (data.expiry_date && data.effective_date) {
      return data.expiry_date > data.effective_date;
    }
    return true;
  },
  { message: 'Expiry date must be after effective date', path: ['expiry_date'] }
);

export type UpdateSpecificationInput = z.infer<typeof updateSpecificationSchema>;

/**
 * Approve Specification Schema
 */
export const approveSpecificationSchema = z.object({
  approval_notes: z.string().max(500).optional(),
});

export type ApproveSpecificationInput = z.infer<typeof approveSpecificationSchema>;

/**
 * Complete Review Schema
 */
export const completeReviewSchema = z.object({
  review_notes: z.string().max(1000).optional(),
});

export type CompleteReviewInput = z.infer<typeof completeReviewSchema>;

/**
 * Specification List Query Schema
 */
export const specificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['draft', 'active', 'expired', 'superseded']).optional(),
  product_id: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sort_by: z.string().optional().default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SpecificationListQuery = z.infer<typeof specificationListQuerySchema>;
