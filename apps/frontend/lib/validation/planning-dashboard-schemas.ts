/**
 * Validation Schemas: Planning Dashboard
 * Story: 03.16 - Planning Dashboard
 *
 * Zod schemas for dashboard API query validation
 */

import { z } from 'zod'

// Dashboard KPI Query (for /api/planning/dashboard/kpis)
// No query parameters - org_id from session
export const dashboardKPIQuerySchema = z.object({})

export type DashboardKPIQuery = z.infer<typeof dashboardKPIQuerySchema>

// Dashboard Alerts Query (for /api/planning/dashboard/alerts)
export const dashboardAlertsQuerySchema = z.object({
  limit: z.number().int().min(1).max(50).optional().default(10),
})

export type DashboardAlertsQuery = z.infer<typeof dashboardAlertsQuerySchema>

// Dashboard Activity Query (for /api/planning/dashboard/activity)
export const dashboardActivityQuerySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
})

export type DashboardActivityQuery = z.infer<typeof dashboardActivityQuerySchema>
