/**
 * Gantt Chart Validation Schemas (Story 03.15)
 * Zod schemas for Gantt API validation
 */

import { z } from 'zod';

// ============================================================================
// HELPER PATTERNS
// ============================================================================

/**
 * ISO date format regex (YYYY-MM-DD)
 */
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Time format regex (HH:mm or HH:mm:ss)
 */
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

/**
 * View by options
 */
const viewByEnum = z.enum(['line', 'machine']);

/**
 * WO status options
 */
const woStatusEnum = z.enum([
  'draft',
  'planned',
  'released',
  'in_progress',
  'on_hold',
  'completed',
  'closed',
  'cancelled',
]);

// ============================================================================
// GET GANTT DATA SCHEMA
// ============================================================================

/**
 * Schema for GET /api/planning/work-orders/gantt query params
 */
export const getGanttDataSchema = z.object({
  view_by: viewByEnum.default('line'),
  from_date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
  to_date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format').optional(),
  status: z.array(z.string()).optional(),
  line_id: z.string().uuid('Invalid production line ID').optional().nullable(),
  product_id: z.string().uuid('Invalid product ID').optional().nullable(),
  search: z.string().optional(),
}).refine(
  (data) => {
    // Validate from_date <= to_date if both provided
    if (data.from_date && data.to_date) {
      return data.from_date <= data.to_date;
    }
    return true;
  },
  {
    message: 'from_date must be before or equal to to_date',
    path: ['from_date'],
  }
).refine(
  (data) => {
    // Validate date range <= 90 days
    if (data.from_date && data.to_date) {
      const from = new Date(data.from_date);
      const to = new Date(data.to_date);
      const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    }
    return true;
  },
  {
    message: 'Date range cannot exceed 90 days',
    path: ['to_date'],
  }
);

export type GetGanttDataInput = z.infer<typeof getGanttDataSchema>;

// ============================================================================
// RESCHEDULE WO SCHEMA
// ============================================================================

/**
 * Helper: Convert time string to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

/**
 * Schema for POST /api/planning/work-orders/:id/reschedule body
 */
export const rescheduleWOSchema = z.object({
  scheduled_date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  scheduled_start_time: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  scheduled_end_time: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  production_line_id: z.string().uuid('Invalid production line ID').optional(),
  validate_dependencies: z.boolean().default(true),
  validate_materials: z.boolean().default(true),
}).refine(
  (data) => {
    // Validate start time < end time
    const startMinutes = timeToMinutes(data.scheduled_start_time);
    const endMinutes = timeToMinutes(data.scheduled_end_time);
    return startMinutes < endMinutes;
  },
  {
    message: 'scheduled_start_time must be before scheduled_end_time',
    path: ['scheduled_start_time'],
  }
).refine(
  (data) => {
    // Validate duration >= 1 hour (60 minutes)
    const startMinutes = timeToMinutes(data.scheduled_start_time);
    const endMinutes = timeToMinutes(data.scheduled_end_time);
    return (endMinutes - startMinutes) >= 60;
  },
  {
    message: 'Duration must be at least 1 hour',
    path: ['scheduled_end_time'],
  }
);

export type RescheduleWOInput = z.infer<typeof rescheduleWOSchema>;

// ============================================================================
// CHECK AVAILABILITY SCHEMA
// ============================================================================

/**
 * Schema for POST /api/planning/work-orders/check-availability body
 */
export const checkAvailabilitySchema = z.object({
  line_id: z.string().uuid('Invalid production line ID'),
  scheduled_date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  scheduled_start_time: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  scheduled_end_time: z.string().regex(timeRegex, 'Time must be in HH:mm format'),
  exclude_wo_id: z.string().uuid('Invalid WO ID').optional(),
}).refine(
  (data) => {
    // Validate start time < end time
    const startMinutes = timeToMinutes(data.scheduled_start_time);
    const endMinutes = timeToMinutes(data.scheduled_end_time);
    return startMinutes < endMinutes;
  },
  {
    message: 'scheduled_start_time must be before scheduled_end_time',
    path: ['scheduled_start_time'],
  }
);

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;

// ============================================================================
// EXPORT GANTT SCHEMA
// ============================================================================

/**
 * Schema for GET /api/planning/work-orders/gantt/export query params
 */
export const exportGanttSchema = z.object({
  format: z.enum(['pdf']).default('pdf'),
  from_date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  to_date: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  view_by: viewByEnum.default('line'),
  status: z.array(z.string()).optional(),
}).refine(
  (data) => {
    // Validate from_date <= to_date
    return data.from_date <= data.to_date;
  },
  {
    message: 'from_date must be before or equal to to_date',
    path: ['from_date'],
  }
);

export type ExportGanttInput = z.infer<typeof exportGanttSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get default date range (today + 30 days)
 */
export function getDefaultDateRange(): { from_date: string; to_date: string } {
  const today = new Date();
  const toDate = new Date(today);
  toDate.setDate(today.getDate() + 30);

  return {
    from_date: today.toISOString().split('T')[0],
    to_date: toDate.toISOString().split('T')[0],
  };
}

/**
 * Default status filter (excludes completed)
 */
export const DEFAULT_STATUS_FILTER = [
  'draft',
  'planned',
  'released',
  'in_progress',
  'on_hold',
];
