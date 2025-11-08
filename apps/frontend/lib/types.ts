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
  actual_start?: string;
  actual_end?: string;
  source_demand_type?: string; // 'Manual' | 'TO' | 'PO' | 'SO'
  source_demand_id?: number;
  bom_id?: string | number;
  created_by?: string;
  machine_id?: string;
  machine?: any;
  product?: any;
  bom?: {
    id: number;
    version: number;
    status: string;
  };
  line_number?: string;
  line_id?: number;  // Production line FK
  priority?: number;
  created_at: string;
  updated_at: string;
}

export type CreateWorkOrderData = Omit<WorkOrder, 'id'>;
export type UpdateWorkOrderData = Partial<CreateWorkOrderData>;

// WO status values must match database schema constraint (no 'draft' status in DB)
export type WorkOrderStatus = 'planned' | 'released' | 'in_progress' | 'completed' | 'cancelled';

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
  // Relationships
  warehouse?: Warehouse;
}

export type CreateLocationData = Omit<Location, 'id' | 'created_at' | 'updated_at'>;
export type UpdateLocationData = Partial<CreateLocationData>;

export interface Machine {
  id: number;
  code: string;
  name: string;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateMachineData = Omit<Machine, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMachineData = Partial<CreateMachineData>;

// Production Lines
export interface ProductionLine {
  id: number;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  warehouse_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export type CreateProductionLineData = Omit<ProductionLine, 'id' | 'created_at' | 'updated_at'>;
export type UpdateProductionLineData = Partial<CreateProductionLineData>;

export interface Supplier {
  id: number;
  name: string;
  legal_name?: string;
  vat_number?: string;
  tax_number?: string;
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

// Phase 1 Planning Types - Updated for new schema

// PO status values must match database schema constraint
export type POStatus = 'draft' | 'submitted' | 'confirmed' | 'received' | 'cancelled' | 'closed';
// TO status values must match database schema constraint (no 'closed' status in DB)
export type TOStatus = 'draft' | 'submitted' | 'in_transit' | 'received' | 'cancelled';

// PO Header (replacing PurchaseOrder)
export interface POHeader {
  id: number;
  number: string;
  supplier_id: number;
  status: POStatus;
  currency: string;
  exchange_rate?: number;
  order_date: string;
  requested_delivery_date?: string;
  promised_delivery_date?: string;
  payment_due_date?: string;
  snapshot_supplier_name?: string;
  snapshot_supplier_vat?: string;
  snapshot_supplier_address?: string;
  asn_ref?: string;
  net_total?: number;
  vat_total?: number;
  gross_total?: number;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  supplier?: Supplier;
  po_lines?: POLine[];
  po_corrections?: POCorrection[];
}

// PO Line (replacing PurchaseOrderItem)
export interface POLine {
  id: number;
  po_id: number;
  line_no: number;
  item_id: number;
  uom: string;
  qty_ordered: number;
  qty_received: number;
  unit_price: number;
  vat_rate: number;
  requested_delivery_date?: string;
  promised_delivery_date?: string;
  default_location_id?: number;
  note?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  item?: Product;
  default_location?: Location;
}

// PO Correction (new table)
export interface POCorrection {
  id: number;
  po_id: number;
  po_line_id?: number;
  reason: string;
  delta_amount: number;
  created_by?: string;
  created_at: string;
  // Relationships
  po_header?: POHeader;
  po_line?: POLine;
}

// TO Header (replacing TransferOrder)
export interface TOHeader {
  transfer_date: any;
  id: number;
  number: string;
  status: TOStatus;
  from_wh_id: number;
  to_wh_id: number;
  requested_date?: string;
  planned_ship_date?: string;
  actual_ship_date?: string;
  planned_receive_date?: string;
  actual_receive_date?: string;
  created_by?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
  // Relationships
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  to_lines?: TOLine[];
}

// TO Line (replacing TransferOrderItem)
export interface TOLine {
  id: number;
  to_id: number;
  line_no: number;
  item_id: number;
  uom: string;
  qty_planned: number;
  qty_moved: number;
  from_location_id?: number;
  to_location_id?: number;
  lp_id?: number;
  batch?: string;
  scan_required: boolean;
  approved_line: boolean;
  created_at: string;
  updated_at: string;
  // Relationships
  item?: Product;
  from_location?: Location;
  to_location?: Location;
}

// Audit Log (enhanced audit_events)
export interface AuditLogEntry {
  id: number;
  entity: string;
  entity_id: number;
  action: string;
  before?: any;
  after?: any;
  actor_id?: string;
  created_at: string;
  // Relationships
  actor?: User;
}

// Legacy types for backward compatibility (deprecated)
export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled' | 'submitted' | 'closed';
export interface PurchaseOrder extends POHeader {
  po_number: string;
  expected_delivery: string;
  due_date?: string;
  payment_due_date?: string;
  warehouse_id?: number;
  request_delivery_date?: string;
  expected_delivery_date?: string;
  buyer_id?: string;
  buyer_name?: string;
  total_amount: number;
  notes?: string;
  purchase_order_items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem extends POLine {
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

// TransferOrderStatus type for legacy TransferOrder
// TransferOrderStatus is deprecated, use TOStatus instead (which matches DB schema)
export type TransferOrderStatus = TOStatus;

// Legacy TransferOrder for backward compatibility (deprecated)
export interface TransferOrder {
  id: number;
  to_number: string;
  from_wh_id?: number;
  to_wh_id?: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: TransferOrderStatus;
  transfer_date: string;
  requested_date?: string;
  planned_ship_date?: string;
  actual_ship_date?: string;
  planned_receive_date?: string;
  actual_receive_date?: string;
  notes?: string;
  created_by?: string;
  updated_by?: string;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  transfer_order_items?: Array<{
    id: number;
    product_id: number;
    quantity: number;
    quantity_planned: number;
    quantity_actual: number;
    lp_id?: number;
    batch?: string;
    product?: Product;
    [key: string]: any;
  }>;
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
  type: 'RM' | 'DG' | 'PR' | 'FG' | 'WIP';  // DB required field
  group: ProductGroup;
  product_group?: ProductGroup; // keep optional for backward compatibility in UI
  product_type: ProductType;
  subtype?: string;
  category?: string;
  uom: string;
  is_active: boolean;
  supplier_id?: number;
  lead_time_days?: number;
  moq?: number;
  tax_code_id?: number;
  std_price?: number;
  shelf_life_days?: number;
  expiry_policy?: string;
  rate?: number;
  production_lines?: string[];
  default_routing_id?: number | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  boxes_per_pallet?: number;
  packs_per_box?: number;
  // Remove: category (migrated to group/product_type)
  // Enhanced relationships
  activeBom?: Bom;
  allergens?: ProductAllergen[];
}

// Types for product creation and BOM inputs (align UI and API)
// Note: ProductGroup and ProductType are already declared above; only declare if not present, else fix duplication.

export type DbType = 'RM' | 'DG' | 'PR' | 'FG' | 'WIP';
export type ExpiryPolicy = 'DAYS_STATIC' | 'FROM_MFG_DATE' | 'FROM_DELIVERY_DATE' | 'FROM_CREATION_DATE';


export interface ProductInsert {
  type: DbType;
  part_number: string;
  description: string;
  uom: string;
  product_group?: ProductGroup;
  product_type?: ProductType;
  product_version?: string;  // Product version
  is_active?: boolean;
  supplier_id?: number | null;
  tax_code_id?: number | null;
  lead_time_days?: number | null;
  moq?: number | null;
  expiry_policy?: ExpiryPolicy | null;
  shelf_life_days?: number | null;
  std_price?: number | null;
  production_lines?: string[];
  default_routing_id?: number | null;
  packs_per_box?: number | null;
  boxes_per_pallet?: number | null;
}

export interface BomItemInput {
  material_id: number | null;
  quantity: number;
  uom: string;
  sequence?: number;
  priority?: number | null;
  production_lines?: string[];
  production_line_restrictions?: string[];
  scrap_std_pct?: number | null;
  is_optional?: boolean;
  is_phantom?: boolean;
  consume_whole_lp?: boolean;  // renamed from one_to_one
  unit_cost_std?: number | null;
  tax_code_id?: number | null;
  lead_time_days?: number | null;
  moq?: number | null;
  line_id?: number[] | null;  // Array of production line IDs for line-specific materials
}

export interface CreateSinglePayload {
  product: ProductInsert;
}

export interface CreateCompositePayload {
  product: ProductInsert;
  bom: { version?: string; status?: 'active' | 'draft' | 'archived' };
  items: BomItemInput[];
}

export interface CreateProductData {
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>;
  bom_items?: BomItemInput[];
  bom_meta?: {
    requires_routing?: boolean;
    default_routing_id?: number;
    version?: string;
    status?: 'active' | 'inactive' | 'draft';
  };
}

export type UpdateProductData = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'activeBom'>>;

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

export type CreateAllergenData = Omit<Allergen, 'id' | 'created_at' | 'updated_at'>;
export type UpdateAllergenData = Partial<CreateAllergenData>;

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
  machine_id?: number;
  expected_yield_pct?: number;
  created_at: string;
  updated_at: string;
}

export interface RoutingOperationName {
  id: number;
  name: string;
  alias?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
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
  line_id?: number[] | null;  // Array of production line IDs
  notes?: string;
  archived_at?: string | null;
  deleted_at?: string | null;
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
  consume_whole_lp: boolean;  // renamed from one_to_one
  unit_cost_std?: number;
  tax_code_id?: number | null;
  lead_time_days?: number | null;
  moq?: number | null;
  created_at: string;
  updated_at: string;
  // Enhanced relationships
  material?: Product;
}

export interface BomHistory {
  id: number;
  bom_id: number;
  version: string;
  changed_by?: string;
  changed_at: string;
  status_from?: string;
  status_to?: string;
  changes: {
    bom?: Record<string, { old: any; new: any }>;
    product?: Record<string, { old: any; new: any }>;
    items?: {
      added?: any[];
      removed?: any[];
      modified?: any[];
    };
  };
  description?: string;
  // Enhanced relationships from API
  changed_by_user?: {
    id: string;
    email: string;
  };
  bom?: {
    id: number;
    product_id: number;
    version: string;
    status: string;
    products?: {
      id: number;
      part_number: string;
      description: string;
    };
  };
}

// WO Materials interface for BOM snapshot functionality
export interface WoMaterial {
  id: number;
  wo_id: number;
  material_id: number;
  qty_per_unit: number;
  uom: string;
  sequence: number;
  consume_whole_lp: boolean;
  is_optional: boolean;
  scrap_std_pct?: number;
  unit_cost_std?: number;
  tax_code_id?: number;
  lead_time_days?: number;
  moq?: number;
  created_at: string;
  updated_at: string;
  // Enhanced relationships
  material?: Product;
}