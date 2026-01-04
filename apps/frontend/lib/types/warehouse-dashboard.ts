/**
 * Warehouse Dashboard Types
 * Story: 05.7 - Warehouse Dashboard
 */

export interface DashboardKPIs {
  total_lps: number;
  available_lps: number;
  reserved_lps: number;
  consumed_today: number;
  expiring_soon: number;
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  product_code: string;
  current_count: number;
  min_stock: number;
}

export interface ExpiringItemAlert {
  lp_id: string;
  lp_number: string;
  product_name: string;
  expiry_date: string;
  days_until_expiry: number;
}

export interface BlockedLPAlert {
  lp_id: string;
  lp_number: string;
  product_name: string;
  qa_status: 'quarantine' | 'failed';
  block_reason: string | null;
}

export interface DashboardAlerts {
  low_stock: LowStockAlert[];
  expiring_items: ExpiringItemAlert[];
  blocked_lps: BlockedLPAlert[];
}

export type OperationType = 'create' | 'consume' | 'split' | 'merge' | 'move';

export interface ActivityItem {
  timestamp: string;
  operation_type: OperationType;
  lp_id: string;
  lp_number: string;
  user_name: string;
  description: string;
}

export interface DashboardActivity {
  activities: ActivityItem[];
}
