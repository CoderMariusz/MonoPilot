/**
 * Validation Schemas: Warehouse Dashboard
 * Story: 05.7 - Warehouse Dashboard
 *
 * Zod schemas for warehouse dashboard API query validation
 */

import { z } from 'zod'

// Dashboard KPI Query (for /api/warehouse/dashboard/kpis)
// No query parameters - org_id from session
export const warehouseDashboardKPIQuerySchema = z.object({}).strict()

export type WarehouseDashboardKPIQuery = z.infer<typeof warehouseDashboardKPIQuerySchema>

// Dashboard Alerts Query (for /api/warehouse/dashboard/alerts)
// No query parameters - org_id from session, returns top 10 of each category
export const warehouseDashboardAlertsQuerySchema = z.object({}).strict()

export type WarehouseDashboardAlertsQuery = z.infer<typeof warehouseDashboardAlertsQuerySchema>

// Dashboard Activity Query (for /api/warehouse/dashboard/activity)
export const warehouseDashboardActivityQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(20),
}).strict()

export type WarehouseDashboardActivityQuery = z.infer<typeof warehouseDashboardActivityQuerySchema>
