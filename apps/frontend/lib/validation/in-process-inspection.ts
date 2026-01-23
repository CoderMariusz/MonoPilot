/**
 * In-Process Inspection Validation Schemas
 * Story: 06.10 - In-Process Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Zod validation schemas for in-process inspection operations:
 * - Create in-process inspection with WO/operation reference
 * - Complete in-process inspection with WO operation update
 * - List query with WO/operation filters
 * - Inspector assignment
 */

import { z } from 'zod';

// =============================================================================
// Create In-Process Inspection Schema
// =============================================================================

export const createInProcessInspectionSchema = z.object({
  wo_id: z.string().uuid('Invalid Work Order ID'),
  wo_operation_id: z.string().uuid('Invalid Operation ID'),
  product_id: z.string().uuid('Invalid product ID').optional(),
  spec_id: z.string().uuid('Invalid specification ID').optional(),
  batch_number: z.string().max(100, 'Batch number must be 100 characters or less').optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  inspector_id: z.string().uuid('Invalid inspector ID').optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
});

export type CreateInProcessInspectionInput = z.infer<typeof createInProcessInspectionSchema>;

// =============================================================================
// Complete In-Process Inspection Schema
// =============================================================================

export const completeInProcessInspectionSchema = z.object({
  result: z.enum(['pass', 'fail', 'conditional']),
  result_notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  defects_found: z.number().int().min(0, 'Defects cannot be negative').default(0),
  major_defects: z.number().int().min(0, 'Defects cannot be negative').default(0),
  minor_defects: z.number().int().min(0, 'Defects cannot be negative').default(0),
  critical_defects: z.number().int().min(0, 'Defects cannot be negative').default(0),

  // Conditional fields
  conditional_reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
  conditional_restrictions: z.string().max(1000, 'Restrictions must be 1000 characters or less').optional(),
  conditional_expires_at: z.string().datetime().optional(),

  // Control flags
  create_ncr: z.boolean().default(false),
  block_next_operation: z.boolean().optional(),

  // Process parameters captured
  process_parameters: z.array(z.object({
    parameter_name: z.string(),
    measured_value: z.string(),
    within_spec: z.boolean(),
  })).optional(),
}).refine(
  (data) => {
    if (data.result === 'conditional') {
      return data.conditional_reason && data.conditional_restrictions;
    }
    return true;
  },
  {
    message: 'Conditional reason and restrictions required for conditional result',
    path: ['conditional_reason'],
  }
);

export type CompleteInProcessInspectionInput = z.infer<typeof completeInProcessInspectionSchema>;

// =============================================================================
// In-Process List Query Schema
// =============================================================================

export const inProcessListQuerySchema = z.object({
  wo_id: z.string().uuid().optional(),
  wo_operation_id: z.string().uuid().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  inspector_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().min(1).optional(),
  sort_by: z.enum(['inspection_number', 'scheduled_date', 'created_at', 'priority']).default('scheduled_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type InProcessListParams = z.infer<typeof inProcessListQuerySchema>;

// =============================================================================
// Assign Inspector Schema
// =============================================================================

export const assignInspectorSchema = z.object({
  inspector_id: z.string().uuid('Invalid inspector ID'),
});

export type AssignInspectorInput = z.infer<typeof assignInspectorSchema>;

// =============================================================================
// Export All
// =============================================================================

export default {
  createInProcessInspectionSchema,
  completeInProcessInspectionSchema,
  inProcessListQuerySchema,
  assignInspectorSchema,
};
