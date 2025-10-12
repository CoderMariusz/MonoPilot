export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export type UserRole = 'Operator' | 'Planner' | 'Technical' | 'Purchasing' | 'Warehouse' | 'QC' | 'Admin';

export interface WorkOrder {
  id: string;
  wo_number: string;
  product_id: string;
  quantity: number;
  status: WorkOrderStatus;
  due_date: string;
}

export type WorkOrderStatus = 'draft' | 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';

export interface LicensePlate {
  id: string;
  lp_code: string;
  item_id: string;
  quantity: number;
  location_id?: string;
  status: LicensePlateStatus;
}

export type LicensePlateStatus = 'Available' | 'Reserved' | 'In Production' | 'QA Hold' | 'QA Released' | 'QA Rejected' | 'Shipped';

export interface Supplier {
  id: number;
  name: string;
  legal_name?: string;
  vat_number?: string;
  country?: string;
  currency?: string;
  payment_terms?: string;
  incoterms?: string;
  email?: string;
  phone?: string;
  address?: any;
  default_tax_code_id?: number;
  lead_time_days?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductionOutput {
  id: number;
  wo_id: number;
  product_id: number;
  quantity: number;
  uom: string;
  lp_id?: number;
  created_by?: number;
  created_at: string;
}
