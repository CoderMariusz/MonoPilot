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

export type WorkOrderStatus = 'Released' | 'Started' | 'In Progress' | 'Completed' | 'Closed';

export interface LicensePlate {
  id: string;
  lp_code: string;
  item_id: string;
  quantity: number;
  location_id?: string;
  status: LicensePlateStatus;
}

export type LicensePlateStatus = 'Available' | 'Reserved' | 'In Production' | 'QA Hold' | 'QA Released' | 'QA Rejected' | 'Shipped';
