/**
 * Production Dashboard Types
 * Story 04.1 - Production Dashboard
 */

/**
 * KPI metrics returned by the dashboard
 */
export interface DashboardKPIs {
  /** Count of WOs with status 'In Progress' or 'Paused' */
  activeWOs: number;
  /** Count of WOs completed today (between 00:00 and 23:59) */
  completedToday: number;
  /** Count of WOs completed this week (Monday to Sunday) */
  completedThisWeek: number;
  /** Average cycle time in hours for WOs completed today */
  avgCycleTimeHrs: number;
  /** Percentage of WOs completed on or before scheduled_end_date */
  onTimePercent: number;
  /** ISO timestamp of when KPIs were last calculated */
  timestamp: string;
}

/**
 * Individual Work Order row in the Active WOs table
 */
export interface ActiveWO {
  id: string;
  wo_number: string;
  product_name: string;
  status: 'Released' | 'In Progress' | 'Paused' | 'Completed' | 'Cancelled';
  planned_quantity: number;
  actual_qty: number;
  /** Progress percentage (0-100), capped at 100 */
  progress_percent: number;
  line_name: string;
  started_at: string | null;
}

/**
 * Paginated response for Active WOs list
 */
export interface ActiveWOsResponse {
  wos: ActiveWO[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Filters for querying Active WOs
 */
export interface DashboardFilters {
  lineId?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

/**
 * Material shortage alert
 */
export interface MaterialShortageAlert {
  wo_id: string;
  wo_number: string;
  product_name: string;
  /** Material availability percentage (0-100) */
  availability_percent: number;
  detected_at: string;
}

/**
 * Delayed Work Order alert
 */
export interface DelayedWOAlert {
  wo_id: string;
  wo_number: string;
  product_name: string;
  /** Number of days overdue (positive integer) */
  days_overdue: number;
  scheduled_end_date: string;
}

/**
 * All dashboard alerts grouped by type
 */
export interface DashboardAlerts {
  materialShortages: MaterialShortageAlert[];
  delayedWOs: DelayedWOAlert[];
}

/**
 * Refresh interval options for dashboard auto-refresh
 */
export type RefreshInterval = '15' | '30' | '60' | '120' | 'off';

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'xlsx';
