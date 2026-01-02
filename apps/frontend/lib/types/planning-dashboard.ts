/**
 * Type Definitions: Planning Dashboard
 * Story: 03.16 - Planning Dashboard
 *
 * Types for dashboard KPIs, alerts, and activities
 */

/**
 * KPI Data - 6 key metrics
 */
export interface KPIData {
  po_pending_approval: number
  po_this_month: number
  to_in_transit: number
  wo_scheduled_today: number
  wo_overdue: number
  open_orders: number
}

/**
 * Alert Types
 */
export type AlertType = 'overdue_po' | 'pending_approval' | 'low_inventory' | 'material_shortage'
export type AlertSeverity = 'warning' | 'critical'
export type AlertEntityType = 'purchase_order' | 'transfer_order' | 'work_order'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  entity_type: AlertEntityType
  entity_id: string
  entity_number: string
  description: string
  days_overdue?: number
  created_at: string
}

export interface AlertsResponse {
  alerts: Alert[]
  total: number
}

/**
 * Activity Types
 */
export type ActivityAction = 'created' | 'updated' | 'approved' | 'cancelled' | 'completed'
export type ActivityEntityType = 'purchase_order' | 'transfer_order' | 'work_order'

export interface Activity {
  id: string
  entity_type: ActivityEntityType
  entity_id: string
  entity_number: string
  action: ActivityAction
  user_id: string
  user_name: string
  timestamp: string
}

export interface ActivityResponse {
  activities: Activity[]
  total: number
}
