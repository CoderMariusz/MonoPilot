// All types are now defined locally for deployment compatibility
// This file maintains backward compatibility while ensuring single source of truth

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  last_login?: string;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  user_name?: string;
  ip_address?: string;
  location?: string;
  device?: string;
  login_time?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  general?: {
    company_name: string;
    timezone: string;
    date_format: string;
    currency: string;
  };
  warehouse?: {
    default_location_id: number;
    qa_required: boolean;
    lp_split_allowed: boolean;
  };
  production?: {
    default_lp_prefix: string;
    wo_number_format: string;
    auto_complete_wos: boolean;
  };
  notifications?: {
    email_notifications: boolean;
    low_stock_alerts: boolean;
    threshold_quantity: number;
  };
  created_at: string;
  updated_at: string;
}

export interface OrderProgress {
  id: string;
  order_id: string;
  order_type: string;
  status: string;
  progress_percentage: number;
  wo_id?: string;
  line?: string;
  started_at?: string;
  staged_lps?: StagedLP[];
  boxes_created?: number;
  consumed_materials?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'Operator' | 'Planner' | 'Technical' | 'Purchasing' | 'Warehouse' | 'QC' | 'Admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface WorkOrder {
  id: string;
  wo_number: string;
  product_id: string;
  quantity: number;
  status: WorkOrderStatus;
  due_date: string;
  scheduled_start?: string;
  scheduled_end?: string;
  machine_id?: string;
  machine?: any;
  product?: any;
  line_number?: string;
  priority?: number;
  created_at: string;
  updated_at: string;
}

export type CreateWorkOrderData = Omit<WorkOrder, 'id'>;
export type UpdateWorkOrderData = Partial<CreateWorkOrderData>;

export type WorkOrderStatus = 'draft' | 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';

export interface LicensePlate {
  id: string;
  lp_code: string;
  lp_number?: string;
  item_id: string;
  product_id?: string;
  product?: any;
  quantity: number;
  location_id?: string;
  location?: any;
  status: LicensePlateStatus;
  qa_status?: string;
  grn_id?: number;
  created_at: string;
  updated_at: string;
}

export type LicensePlateStatus = 'Available' | 'Reserved' | 'In Production' | 'QA Hold' | 'QA Released' | 'QA Rejected' | 'Shipped';

export type QAStatus = 'Passed' | 'Failed' | 'Pending' | 'Hold' | 'Quarantine';

export interface StockMove {
  id: string;
  move_number?: string;
  lp_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  reason: string;
  status?: string;
  move_date?: string;
  wo_number?: string;
  lp?: LicensePlate;
  from_location?: Location;
  to_location?: Location;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: number;
  code: string;
  name: string;
  type: string;
  warehouse_id: number;
  zone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: number;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

export type CreateSupplierData = Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
export type UpdateSupplierData = Partial<CreateSupplierData>;

export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled' | 'submitted' | 'closed';

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  status: PurchaseOrderStatus;
  order_date: string;
  expected_delivery: string;
  due_date?: string;
  warehouse_id?: number;
  request_delivery_date?: string;
  expected_delivery_date?: string;
  buyer_id?: string;
  buyer_name?: string;
  total_amount: number;
  notes?: string;
  supplier?: Supplier;
  warehouse?: Warehouse;
  purchase_order_items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  po_id: number;
  product_id: number;
  quantity_ordered: number;
  quantity_received: number;
  unit_price: number;
  total_price: number;
  product?: Product;
  confirmed?: boolean;
}

export interface GRN {
  id: number;
  po_id: number;
  grn_number: string;
  received_date: string;
  status: string;
  notes?: string;
  created_by: string;
  grn_items?: any[];
  po?: PurchaseOrder;
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

export type CreateWarehouseData = Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>;
export type UpdateWarehouseData = Partial<CreateWarehouseData>;

export interface TransferOrder {
  id: number;
  to_number: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: string;
  transfer_date: string;
  notes?: string;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  transfer_order_items?: any[];
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

// New enums for product taxonomy
export type ProductGroup = 'MEAT' | 'DRYGOODS' | 'COMPOSITE';
export type ProductType = 'RM_MEAT' | 'PR' | 'FG' | 'DG_WEB' | 'DG_LABEL' | 'DG_BOX' | 'DG_ING' | 'DG_SAUCE';

// Enhanced Product interface
export interface Product {
  id: number;
  part_number: string;
  description: string;
  group: ProductGroup;
  product_type: ProductType;
  subtype?: string;
  category?: string;
  uom: string;
  is_active: boolean;
  preferred_supplier_id?: number;
  lead_time_days?: number;
  moq?: number;
  tax_code_id?: number;
  std_price?: number;
  shelf_life_days?: number;
  expiry_policy?: string;
  rate?: number;
  production_lines?: string[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Remove: category (migrated to group/product_type)
  // Enhanced relationships
  activeBom?: Bom;
  allergens?: ProductAllergen[];
  supplierProducts?: SupplierProduct[];
}

// Tax codes
export interface TaxCode {
  id: number;
  code: string;
  name: string;
  rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product allergens junction
export interface ProductAllergen {
  id: number;
  product_id: number;
  allergen_id: number;
  contains: boolean;
  created_at: string;
  updated_at: string;
}

// Enhanced Allergen interface
export interface Allergen {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Supplier products junction
export interface SupplierProduct {
  id: number;
  supplier_id: number;
  product_id: number;
  supplier_sku?: string;
  lead_time_days?: number;
  moq?: number;
  price_excl_tax?: number;
  tax_code_id?: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Routing interfaces
export interface Routing {
  id: number;
  name: string;
  product_id?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  operations?: RoutingOperation[];
}

export interface RoutingOperation {
  id: number;
  routing_id: number;
  seq_no: number;
  name: string;
  code?: string;
  description?: string;
  requirements?: string[];
  created_at: string;
  updated_at: string;
}

export interface WoOperation {
  id: number;
  wo_id: number;
  routing_operation_id?: number;
  seq_no: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  operator_id?: string;
  device_id?: number;
  started_at?: string;
  finished_at?: string;
  created_at: string;
}

export interface ConsumeReport {
  id?: number;
  wo_id?: number;
  material_id?: number;
  material?: Product;
  planned_qty?: number;
  actual_qty?: number;
  variance_qty?: number;
  variance_pct?: number;
  created_at?: string;
  updated_at?: string;
  summary?: {
    total_materials_consumed: number;
    total_value: number;
    unique_materials: number;
    total_work_orders: number;
  };
  consumption_records?: any[];
}

export interface StagedLP {
  lp: LicensePlate;
  quantity: number;
  staged_at: string;
  line?: string;
}

export interface YieldReportDetail {
  id: number;
  wo_id: number;
  work_order_id?: number;
  material_id: number;
  planned_qty: number;
  actual_qty: number;
  variance: number;
  created_at: string;
  materials_used?: YieldReportMaterial[];
  work_order_number?: string;
  product_name?: string;
  efficiency?: number;
  line_number?: string;
  target_quantity?: number;
  actual_quantity?: number;
  efficiency_percentage?: number;
  created_by?: string;
}

export interface YieldReportMaterial {
  material_id: number;
  material_name: string;
  planned_qty: number;
  actual_qty: number;
  variance: number;
  item_code?: string;
  item_name?: string;
  standard_qty?: number;
  consumed_qty?: number;
  uom?: string;
  yield_percentage?: number;
}

export interface YieldReport {
  summary: {
    total_output: number;
    total_target: number;
    yield_rate: number;
    scrap_rate: number;
    total_work_orders: number;
  };
  work_orders: Array<{
    id: number;
    wo_number: string;
    product: { id: number; part_number: string; description: string };
    target_qty: number;
    actual_output: number;
    scrap: number;
    yield_percentage: number;
    date: string;
    status: string;
  }>;
}

// Enhanced BOM interfaces
export interface Bom {
  id: number;
  product_id: number;
  version: string;
  status: 'draft' | 'active' | 'archived';
  is_active: boolean;
  effective_from?: string;
  effective_to?: string;
  requires_routing: boolean;
  default_routing_id?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  bomItems?: BomItem[];
  defaultRouting?: Routing;
}

export interface BomItem {
  id: number;
  bom_id: number;
  material_id: number;
  quantity: number;
  uom: string;
  sequence: number;
  priority?: number;
  production_lines?: string[];
  production_line_restrictions?: string[];
  scrap_std_pct?: number;
  is_optional: boolean;
  is_phantom: boolean;
  unit_cost_std?: number;
  created_at: string;
  updated_at: string;
  // Enhanced relationships
  material?: Product;
}