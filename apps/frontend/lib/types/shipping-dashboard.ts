/**
 * Shipping Dashboard Types
 * Story: 07.15 - Shipping Dashboard + KPIs
 *
 * Type definitions for:
 * - KPI metrics and trends
 * - Alert types
 * - Activity feed
 * - Chart data
 * - Date range
 */

// ============================================================================
// Trend Types
// ============================================================================

export type TrendDirection = 'up' | 'down' | 'neutral'

export interface TrendIndicator {
  current: number
  previous: number
  percentage: number
  direction: TrendDirection
}

// ============================================================================
// Date Range Types
// ============================================================================

export type DateRangePreset = 'today' | 'last_7' | 'last_30' | 'custom'

export interface DateRange {
  from: Date
  to: Date
  preset: DateRangePreset
}

// ============================================================================
// KPI Types
// ============================================================================

export interface OrdersKPI {
  total: number
  by_status: {
    draft: number
    confirmed: number
    allocated: number
    picking: number
    packing: number
    shipped: number
    delivered: number
  }
  trend: TrendIndicator
}

export interface PickListsKPI {
  total: number
  by_status: {
    pending: number
    assigned: number
    in_progress: number
    completed: number
  }
  trend: TrendIndicator
}

export interface ShipmentsKPI {
  total: number
  by_status: {
    pending: number
    packing: number
    packed: number
    shipped: number
    delivered: number
  }
  trend: TrendIndicator
}

export interface BackordersKPI {
  count: number
  total_value: number
}

export interface DashboardKPIs {
  orders: OrdersKPI
  pick_lists: PickListsKPI
  shipments: ShipmentsKPI
  backorders: BackordersKPI
  on_time_delivery_pct: number
  avg_pick_time_hours: number
  avg_pack_time_hours: number
  last_updated: string
}

// ============================================================================
// Alert Types
// ============================================================================

export interface BackorderItem {
  so_line_id: string
  product_name: string
  qty_backordered: number
}

export interface DelayedShipmentItem {
  so_id: string
  order_number: string
  promised_date: string
  days_late: number
}

export interface PendingPickItem {
  pick_list_id: string
  pick_list_number: string
  created_at: string
  hours_pending: number
}

export interface AllergenConflictItem {
  so_id: string
  order_number: string
  customer_name: string
  conflicting_allergens: string[]
}

export interface AlertSummary {
  critical: number
  warning: number
  info: number
}

export interface DashboardAlerts {
  backorders: {
    count: number
    items: BackorderItem[]
  }
  delayed_shipments: {
    count: number
    items: DelayedShipmentItem[]
  }
  pending_picks_overdue: {
    count: number
    items: PendingPickItem[]
  }
  allergen_conflicts: {
    count: number
    items: AllergenConflictItem[]
  }
  alert_summary: AlertSummary
}

// ============================================================================
// Activity Types
// ============================================================================

export type ActivityType =
  | 'so_created'
  | 'so_confirmed'
  | 'so_shipped'
  | 'pick_completed'
  | 'shipment_packed'

export type EntityType = 'sales_order' | 'pick_list' | 'shipment'

export type ActivityStatus = 'success' | 'warning' | 'error'

export interface ActivityItem {
  id: string
  type: ActivityType
  entity_type: EntityType
  entity_id: string
  entity_number: string
  description: string
  created_at: string
  created_by: {
    id: string
    name: string
  }
  status: ActivityStatus
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface OrdersByStatusData {
  status: string
  count: number
}

export interface ShipmentsByDateData {
  date: string
  count: number
}

// ============================================================================
// Response Types
// ============================================================================

export interface RecentActivityResponse {
  activities: ActivityItem[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

// ============================================================================
// User Role Type
// ============================================================================

export type UserRole = 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'VIEWER'
