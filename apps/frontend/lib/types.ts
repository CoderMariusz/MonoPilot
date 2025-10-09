export type CategoryType = 'MEAT' | 'DRYGOODS' | 'FINISHED_GOODS' | 'PROCESS';
export type ExpiryPolicyType = 'DAYS_STATIC' | 'FROM_MFG_DATE' | 'FROM_DELIVERY_DATE' | 'FROM_CREATION_DATE';

export interface BomItem {
  id: number;
  bom_id: number;
  material_id: number;
  material?: Product;
  quantity: string;
  uom: string;
  sequence: number;
  created_at: string;
  updated_at: string;
}

export interface Bom {
  id: number;
  product_id: number;
  version: string;
  is_active: boolean;
  bomItems?: BomItem[];
  created_at: string;
  updated_at: string;
}

export interface ProductLineSettings {
  id: number;
  product_id: number;
  machine_id: number;
  std_cost: string;
  labor_rate?: string | null;
  machine_rate?: string | null;
  throughput_packs_per_min?: string | null;
  yield_cut_override?: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  machine?: Machine;
}

export interface Product {
  id: number;
  part_number: string;
  description: string;
  type: 'RM' | 'PR' | 'FG' | 'WIP';
  uom: string;
  is_active: boolean;
  category?: CategoryType;
  subtype?: string | null;
  expiry_policy?: ExpiryPolicyType | null;
  shelf_life_days?: number | null;
  std_price?: string | null;
  activeBom?: Bom | null;
  lineSettings?: ProductLineSettings[];
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

export interface CreateProductData {
  part_number: string;
  description: string;
  uom: string;
  category: CategoryType;
  subtype?: string;
  std_price?: number;
  expiry_policy?: ExpiryPolicyType;
  shelf_life_days?: number;
  is_active?: boolean;
  bom_items?: Array<{
    material_id: number;
    quantity: number;
    uom: string;
    sequence?: number;
  }>;
}

export interface UpdateProductData {
  part_number?: string;
  description?: string;
  uom?: string;
  category?: CategoryType;
  subtype?: string;
  std_price?: number;
  expiry_policy?: ExpiryPolicyType;
  shelf_life_days?: number;
  is_active?: boolean;
}

export interface CreateLineSettingData {
  machine_id: number;
  std_cost: number;
  labor_rate?: number;
  machine_rate?: number;
  throughput_packs_per_min?: number;
  yield_cut_override?: number;
}

export interface UpdateLineSettingData {
  std_cost?: number;
  labor_rate?: number;
  machine_rate?: number;
  throughput_packs_per_min?: number;
  yield_cut_override?: number;
}

export interface BulkUpsertLineSettingsData {
  settings: CreateLineSettingData[];
}

export type QAStatus = 'Pending' | 'Passed' | 'Failed' | 'Quarantine';

export interface LicensePlate {
  id: number;
  lp_number: string;
  product_id: number;
  product?: Product;
  location_id: number;
  location?: Location;
  quantity: string;
  qa_status: QAStatus;
  grn_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface GRNItem {
  id: number;
  grn_id: number;
  product_id: number;
  product?: Product;
  quantity_ordered: string;
  quantity_received: string;
  location_id: number;
  location?: Location;
  lp_number?: string | null;
  created_at: string;
  updated_at: string;
}

export interface GRN {
  id: number;
  grn_number: string;
  po_id: number;
  po?: PurchaseOrder;
  status: 'draft' | 'completed' | 'cancelled';
  received_date: string | null;
  grn_items?: GRNItem[];
  created_at: string;
  updated_at: string;
}

export interface StockMove {
  id: number;
  move_number: string;
  lp_id: number;
  lp?: LicensePlate;
  from_location_id: number;
  from_location?: Location;
  to_location_id: number;
  to_location?: Location;
  quantity: string;
  status: 'draft' | 'completed' | 'cancelled';
  move_date: string | null;
  created_at: string;
  updated_at: string;
}
