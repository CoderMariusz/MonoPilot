/**
 * Inspection Validation Schemas
 * Story: 06.5 - Incoming Inspection
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Zod validation schemas for inspection operations:
 * - Create inspection validation
 * - Assign inspector validation
 * - Start inspection validation
 * - Complete inspection validation
 * - Cancel inspection validation
 * - List query validation
 */

import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const inspectionTypeEnum = z.enum(['incoming', 'in_process', 'final']);
export const inspectionStatusEnum = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);
export const inspectionPriorityEnum = z.enum(['low', 'normal', 'high', 'urgent']);
export const inspectionResultEnum = z.enum(['pass', 'fail', 'conditional']);
export const referenceTypeEnum = z.enum(['po', 'grn', 'wo', 'lp', 'batch']);

// =============================================================================
// Create Inspection Schema
// =============================================================================

export const createInspectionSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  lp_id: z.string().uuid('Invalid LP ID').optional(),
  grn_id: z.string().uuid('Invalid GRN ID').optional(),
  po_id: z.string().uuid('Invalid PO ID').optional(),
  spec_id: z.string().uuid('Invalid specification ID').optional(),
  batch_number: z.string().max(100, 'Batch number must be 100 characters or less').optional(),
  lot_size: z.number().int().positive('Lot size must be positive').optional(),
  priority: inspectionPriorityEnum.default('normal'),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  inspector_id: z.string().uuid('Invalid inspector ID').optional(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
}).refine(
  (data) => data.lp_id || data.grn_id || data.po_id,
  { message: 'At least one reference (LP, GRN, or PO) is required' }
);

export type CreateInspectionInput = z.input<typeof createInspectionSchema>;

// =============================================================================
// Update Inspection Schema
// =============================================================================

export const updateInspectionSchema = z.object({
  spec_id: z.string().uuid('Invalid specification ID').optional().nullable(),
  batch_number: z.string().max(100).optional().nullable(),
  lot_size: z.number().int().positive().optional().nullable(),
  priority: inspectionPriorityEnum.optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type UpdateInspectionInput = z.infer<typeof updateInspectionSchema>;

// =============================================================================
// Assign Inspector Schema
// =============================================================================

export const assignInspectionSchema = z.object({
  inspector_id: z.string().uuid('Invalid inspector ID'),
});

export type AssignInspectionInput = z.infer<typeof assignInspectionSchema>;

// =============================================================================
// Start Inspection Schema
// =============================================================================

export const startInspectionSchema = z.object({
  take_over: z.boolean().default(false),
});

export type StartInspectionInput = z.infer<typeof startInspectionSchema>;

// =============================================================================
// Complete Inspection Schema
// =============================================================================

export const completeInspectionSchema = z.object({
  result: inspectionResultEnum,
  result_notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional(),
  defects_found: z.number().int().min(0, 'Defects cannot be negative').default(0),
  major_defects: z.number().int().min(0, 'Defects cannot be negative').default(0),
  minor_defects: z.number().int().min(0, 'Defects cannot be negative').default(0),
  critical_defects: z.number().int().min(0, 'Defects cannot be negative').default(0),

  // Conditional fields
  conditional_reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
  conditional_restrictions: z.string().max(1000, 'Restrictions must be 1000 characters or less').optional(),
  conditional_expires_at: z.string().datetime().optional(),

  // NCR creation
  create_ncr: z.boolean().default(false),
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

export type CompleteInspectionInput = z.input<typeof completeInspectionSchema>;

// =============================================================================
// Cancel Inspection Schema
// =============================================================================

export const cancelInspectionSchema = z.object({
  cancellation_reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must be 500 characters or less'),
});

export type CancelInspectionInput = z.infer<typeof cancelInspectionSchema>;

// =============================================================================
// List Query Schema
// =============================================================================

export const inspectionListQuerySchema = z.object({
  inspection_type: inspectionTypeEnum.optional(),
  status: inspectionStatusEnum.optional(),
  priority: inspectionPriorityEnum.optional(),
  inspector_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  lp_id: z.string().uuid().optional(),
  grn_id: z.string().uuid().optional(),
  po_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().min(1).optional(),
  sort_by: z.enum(['inspection_number', 'scheduled_date', 'created_at', 'priority']).default('scheduled_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type InspectionListQuery = z.input<typeof inspectionListQuerySchema>;

// =============================================================================
// Export All
// =============================================================================

export default {
  inspectionTypeEnum,
  inspectionStatusEnum,
  inspectionPriorityEnum,
  inspectionResultEnum,
  referenceTypeEnum,
  createInspectionSchema,
  updateInspectionSchema,
  assignInspectionSchema,
  startInspectionSchema,
  completeInspectionSchema,
  cancelInspectionSchema,
  inspectionListQuerySchema,
};
