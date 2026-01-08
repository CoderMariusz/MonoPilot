import { z } from 'zod';

/**
 * Validation schemas for Production Dashboard
 * Story 04.1 - Production Dashboard
 */

/**
 * Schema for dashboard filters (line, product, pagination)
 */
export const DashboardFiltersSchema = z.object({
  lineId: z.string().uuid('Invalid line ID format').optional(),
  productId: z.string().uuid('Invalid product ID format').optional(),
  page: z.coerce
    .number({ invalid_type_error: 'Page must be a number' })
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),
  limit: z.coerce
    .number({ invalid_type_error: 'Limit must be a number' })
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
});

/**
 * Schema for refresh interval selection
 */
export const RefreshIntervalSchema = z.enum(['15', '30', '60', '120', 'off'], {
  errorMap: () => ({ message: 'Invalid refresh interval' }),
});

/**
 * Schema for export format selection
 */
export const ExportFormatSchema = z.enum(['csv', 'xlsx'], {
  errorMap: () => ({ message: 'Invalid export format' }),
});

/**
 * Schema for KPI request parameters
 */
export const DashboardKPIsRequestSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID'),
});

/**
 * Schema for Active WOs request parameters
 */
export const ActiveWOsRequestSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID'),
  filters: DashboardFiltersSchema.optional(),
});

/**
 * Schema for Alerts request parameters
 */
export const DashboardAlertsRequestSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID'),
});

/**
 * Schema for CSV export request parameters
 */
export const ExportRequestSchema = z.object({
  orgId: z.string().uuid('Invalid organization ID'),
  filters: DashboardFiltersSchema.optional(),
  format: ExportFormatSchema.default('csv'),
});

// Type exports from schemas
export type DashboardFiltersInput = z.infer<typeof DashboardFiltersSchema>;
export type RefreshIntervalInput = z.infer<typeof RefreshIntervalSchema>;
export type ExportFormatInput = z.infer<typeof ExportFormatSchema>;
