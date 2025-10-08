export interface Product {
  id: number;
  part_number: string;
  description: string;
  type: 'RM' | 'PR' | 'FG';
  uom: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  zone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: number;
  wo_number: string;
  product_id: number;
  product?: Product;
  quantity: string;
  status: 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string | null;
  machine_id: number | null;
  machine?: Machine;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  product?: Product;
  quantity: string;
  unit_price: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'received' | 'cancelled';
  due_date: string | null;
  purchase_order_items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface TransferOrderItem {
  id: number;
  transfer_order_id: number;
  product_id: number;
  product?: Product;
  quantity: string;
  created_at: string;
  updated_at: string;
}

export interface TransferOrder {
  id: number;
  to_number: string;
  from_location_id: number;
  from_location?: Location;
  to_location_id: number;
  to_location?: Location;
  status: 'draft' | 'submitted' | 'in_transit' | 'received' | 'cancelled';
  transfer_order_items?: TransferOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface CreateWorkOrderData {
  wo_number: string;
  product_id: number;
  quantity: number;
  status?: WorkOrder['status'];
  due_date?: string;
  machine_id?: number;
}

export interface UpdateWorkOrderData extends Partial<CreateWorkOrderData> {}

export interface CreatePurchaseOrderData {
  po_number: string;
  supplier: string;
  status?: PurchaseOrder['status'];
  due_date?: string;
}

export interface UpdatePurchaseOrderData extends Partial<CreatePurchaseOrderData> {}

export interface CreateTransferOrderData {
  to_number: string;
  from_location_id: number;
  to_location_id: number;
  status?: TransferOrder['status'];
}

export interface UpdateTransferOrderData extends Partial<CreateTransferOrderData> {}

export interface YieldReportWorkOrder {
  id: number;
  wo_number: string;
  product: {
    id: number;
    part_number: string;
    description: string;
  } | null;
  target_qty: number;
  actual_output: number;
  scrap: number;
  yield_percentage: number;
  date: string;
  status: WorkOrder['status'];
}

export interface YieldReportSummary {
  total_output: number;
  total_target: number;
  yield_rate: number;
  scrap_rate: number;
  total_work_orders: number;
}

export interface YieldReport {
  summary: YieldReportSummary;
  work_orders: YieldReportWorkOrder[];
  date_range: {
    from: string;
    to: string;
  };
}

export interface ConsumeReportRecord {
  wo_number: string;
  material: {
    id: number;
    part_number: string;
    description: string;
    uom: string;
  } | null;
  standard_qty: number;
  consumed_qty: number;
  variance: number;
  variance_percentage: number;
  date: string;
  wo_status: WorkOrder['status'];
}

export interface MaterialSummary {
  material: {
    id: number;
    part_number: string;
    description: string;
    uom: string;
  } | null;
  total_consumed: number;
  total_standard: number;
  total_variance: number;
}

export interface ConsumeReportSummary {
  total_materials_consumed: number;
  total_value: number;
  unique_materials: number;
  total_work_orders: number;
}

export interface ConsumeReport {
  summary: ConsumeReportSummary;
  consumption_records: ConsumeReportRecord[];
  material_summary: MaterialSummary[];
  date_range: {
    from: string;
    to: string;
  };
}
