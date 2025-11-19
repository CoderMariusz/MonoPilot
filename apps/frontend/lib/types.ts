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

export type UserRole =
  | 'Operator'
  | 'Planner'
  | 'Technical'
  | 'Purchasing'
  | 'Warehouse'
  | 'QC'
  | 'Admin';
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
  // EPIC-001 Phase 3: Conditional Components
  order_flags?: string[]; // e.g., ['organic', 'gluten_free', 'vegan']
  customer_id?: number;
  order_type?: string; // e.g., 'standard', 'export', 'premium'
  line_id?: number; // Production line FK
  priority?: number;
  created_at: string;
  updated_at: string;
}

export type CreateWorkOrderData = Omit<WorkOrder, 'id'>;
export type UpdateWorkOrderData = Partial<CreateWorkOrderData>;

// WO status values must match database schema constraint (no 'draft' status in DB)
export type WorkOrderStatus =
  | 'planned'
  | 'released'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// EPIC-001: By-Products Support
export interface WOByProduct {
  id: number;
  wo_id: number;
  product_id: number;
  product?: any; // Populated from products table
  expected_quantity: number;
  actual_quantity: number;
  uom: UoM;
  lp_id?: number | null;
  lp?: any; // Populated from license_plates table
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LicensePlate {
  id: number;  // Fixed: was string
  org_id?: number;
  lp_number: string;  // Fixed: was optional, removed lp_code
  product_id: number;  // Fixed: was item_id and string
  quantity: number;
  uom: string;  // Fixed: was optional UoM
  status: LicensePlateStatus;
  location_id?: number | null;  // Fixed: was string
  warehouse_id: number;  // Added: was missing

  // Batch & Dates
  batch_number?: string | null;  // Fixed: was batch
  supplier_batch_number?: string | null;  // Added: was missing
  manufacture_date?: string | null;  // Added: was missing
  expiry_date?: string | null;

  // QA
  qa_status?: QAStatus;
  stage_suffix?: string | null;
  lp_type?: 'PR' | 'FG' | 'PALLET' | 'RM' | 'WIP';

  // Traceability
  po_id?: number | null;  // Added: was missing
  po_number?: string | null;  // Added: was missing
  grn_id?: number | null;
  wo_id?: number | null;  // Added: was missing
  parent_lp_id?: number | null;  // Fixed: was string | number
  parent_lp_number?: string | null;
  consumed_by_wo_id?: number | null;  // Added: was missing
  consumed_at?: string | null;

  // Origin
  origin_type?: 'GRN' | 'PRODUCTION' | 'SPLIT' | 'MANUAL';
  origin_ref?: Record<string, any>;

  // Pallet
  pallet_id?: number | null;  // Fixed: was pallet_code

  // Audit
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;

  // Relationships (computed)
  product?: Product;
  location?: Location;
  warehouse?: Warehouse;
}

/**
 * License Plate Status Lifecycle (Unified Enum - synchronized with database)
 *
 * Primary Lifecycle:
 *   available → reserved → in_production → consumed → (genealogy tracked)
 *
 * Shipping Path:
 *   consumed → (output LP created) → available → shipped
 *
 * QA Path (Optional):
 *   available → quarantine → qa_passed OR qa_rejected
 *   └─ (if qa_passed) → available
 *   └─ (if qa_rejected) → damaged OR (rework)
 *
 * Transit Path:
 *   available → in_transit → available (at destination warehouse)
 *
 * Status Definitions:
 * - available: LP in warehouse, ready for use/shipping
 * - reserved: LP reserved for specific Work Order (via lp_reservations)
 * - in_production: LP actively being consumed/processed in WO
 * - consumed: LP fully consumed, genealogy locked, traceability complete
 * - in_transit: LP moving between warehouses (via Transfer Order)
 * - quarantine: LP held for QA inspection
 * - qa_passed: LP passed QA inspection, available for use
 * - qa_rejected: LP failed QA inspection, may be damaged or require rework
 * - shipped: LP shipped to customer (final state)
 * - damaged: LP physically damaged, unusable
 *
 * IMPORTANT: Values must match database CHECK constraint exactly (lowercase snake_case)
 * See: migrations/058_fix_lp_status_enum.sql
 */
export type LicensePlateStatus =
  | 'available'
  | 'reserved'
  | 'in_production'
  | 'consumed'
  | 'in_transit'
  | 'quarantine'
  | 'qa_passed'
  | 'qa_rejected'
  | 'shipped'
  | 'damaged';

/**
 * QA Status Enum (synchronized with database)
 *
 * QA Inspection Workflow:
 *   pending → on_hold (inspection needed)
 *           → passed (approved for use)
 *           → failed (rejected)
 *
 * IMPORTANT: This is SEPARATE from main License Plate status field
 * - qa_status: Quality inspection result (THIS enum)
 * - status: Main LP lifecycle state (includes 'quarantine')
 *
 * Values must match database CHECK constraint exactly (lowercase snake_case)
 * See: migrations/025_license_plates.sql:14
 */
/**
 * Units of Measure - matches uom_master table
 * Extended from 4 units to 22 units for better coverage
 * Categories: weight, volume, length, count, container
 * See: migrations/059_uom_master_table.sql
 */
export type UoM =
  | 'KG' | 'POUND' | 'GRAM' | 'TON' | 'OUNCE'  // weight
  | 'LITER' | 'GALLON' | 'MILLILITER' | 'BARREL' | 'QUART'  // volume
  | 'METER' | 'FOOT' | 'INCH' | 'CENTIMETER'  // length
  | 'EACH' | 'DOZEN'  // count
  | 'BOX' | 'CASE' | 'PALLET' | 'DRUM' | 'BAG' | 'CARTON';  // container

export type QAStatus = 'pending' | 'passed' | 'failed' | 'on_hold';

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
  name: string | null;
  type: string | null;
  warehouse_id: number;
  zone?: string | null;
  capacity_qty?: number | null;
  capacity_uom?: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
  // Relationships
  warehouse?: Warehouse;
}

export type CreateLocationData = Omit<
  Location,
  'id' | 'created_at' | 'updated_at'
>;
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

export type CreateMachineData = Omit<
  Machine,
  'id' | 'created_at' | 'updated_at'
>;
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

export type CreateProductionLineData = Omit<
  ProductionLine,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdateProductionLineData = Partial<CreateProductionLineData>;

export interface Supplier {
  id: number;
  code: string;
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

export type CreateSupplierData = Omit<
  Supplier,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdateSupplierData = Partial<CreateSupplierData>;

// ============================================================================
// EPIC-002: Scanner & Warehouse v2 - ASN (Advanced Shipping Notice)
// ============================================================================

export type ASNStatus = 'draft' | 'submitted' | 'received' | 'cancelled';

export interface ASN {
  id: number;
  asn_number: string;
  po_id?: number | null;
  supplier_id: number;
  expected_arrival: string; // TIMESTAMPTZ
  actual_arrival?: string | null; // TIMESTAMPTZ
  status: ASNStatus;
  notes?: string | null;
  attachments?: Array<{ name: string; url: string }> | null; // JSONB
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  // Relationships
  supplier?: Supplier;
  purchase_order?: POHeader;
  asn_items?: ASNItem[];
}

export interface ASNItem {
  id: number;
  asn_id: number;
  product_id: number;
  quantity: number;
  uom: UoM;
  batch?: string | null; // Pre-assigned batch from supplier
  expiry_date?: string | null; // DATE
  lp_number?: string | null; // Pre-assigned LP number
  notes?: string | null;
  created_at: string;
  // Relationships
  product?: Product;
}

export interface CreateASNData {
  asn_number: string;
  po_id?: number | null;
  supplier_id: number;
  expected_arrival: string;
  status?: ASNStatus;
  notes?: string | null;
  attachments?: Array<{ name: string; url: string }> | null;
  asn_items?: CreateASNItemData[];
}

export interface CreateASNItemData {
  product_id: number;
  quantity: number;
  uom: UoM;
  batch?: string | null;
  expiry_date?: string | null;
  lp_number?: string | null;
  notes?: string | null;
}

export interface UpdateASNData extends Partial<CreateASNData> {
  id: number;
}

export interface ASNForReceiving {
  asn_id: number;
  asn_number: string;
  supplier_name: string;
  expected_arrival: string;
  items_count: number;
  total_quantity: number;
}

// Enhanced License Plate with genealogy and batch tracking
export interface LicensePlateEnhanced extends LicensePlate {
  batch?: string | null;
  expiry_date?: string | null; // DATE
  uom: UoM;
  parent_lp_id?: number | null;
  is_consumed: boolean;
  consumed_at?: string | null;
  consumed_by?: string | null;
  asn_id?: number | null;
  // Relationships
  parent_lp?: LicensePlate;
  asn?: ASN;
}

export interface LPForFIFO {
  lp_id: number;
  lp_number: string;
  quantity: number;
  uom: UoM;
  batch?: string | null;
  expiry_date?: string | null;
  created_at: string;
  location_name: string;
}

export interface LPGenealogyChain {
  lp_id: number;
  lp_number: string;
  parent_lp_id?: number | null;
  parent_lp_number?: string | null;
  level: number; // 0 = target, negative = parents, positive = children
  quantity: number;
  batch?: string | null;
}

// Phase 1 Planning Types - Updated for new schema

// PO status values must match database schema constraint
export type POStatus =
  | 'draft'
  | 'submitted'
  | 'confirmed'
  | 'received'
  | 'cancelled'
  | 'closed';
// TO status values must match database schema constraint
// Lifecycle: draft → submitted → in_transit → received → closed (finalized, audit complete)
// Can be cancelled at any stage before closed
export type TOStatus =
  | 'draft'
  | 'submitted'
  | 'in_transit'
  | 'received'
  | 'closed'
  | 'cancelled';

// PO Header (replacing PurchaseOrder)
export interface POHeader {
  id: number;
  org_id?: number;
  po_number: string;  // Match DB: was 'number'
  supplier_id: number;
  warehouse_id?: number;
  status: POStatus;
  currency: string;
  exchange_rate?: number;
  order_date: string;
  expected_date?: string;
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
  notes?: string;
  created_by?: string;
  updated_by?: string;
  approved_by?: string;
  created_at?: string;
  updated_at?: string;
  // Relationships
  supplier?: Supplier;
  warehouse?: Warehouse;
  po_lines?: POLine[];
  po_corrections?: POCorrection[];
}

// PO Line (replacing PurchaseOrderItem)
export interface POLine {
  id: number;
  po_id: number;
  line_number: number;  // Match DB: was 'line_no'
  product_id: number;   // Match DB: was 'item_id'
  uom: string;
  quantity: number;     // Match DB: was 'qty_ordered'
  received_qty: number; // Match DB: was 'qty_received'
  unit_price: number;
  vat_rate?: number;
  tax_code_id?: number;
  requested_delivery_date?: string;
  promised_delivery_date?: string;
  default_location_id?: number;
  notes?: string;       // Match DB: was 'note'
  created_at?: string;
  updated_at?: string;
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
  id: number;
  number: string;
  status: TOStatus;
  from_wh_id: number;
  to_wh_id: number;
  transfer_date?: string | null;
  requested_date?: string | null;
  planned_ship_date?: string | null;
  actual_ship_date?: string | null;
  planned_receive_date?: string | null;
  actual_receive_date?: string | null;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  approved_by?: string | null;
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
  uom: UoM;
  qty_planned: number;
  qty_shipped: number;
  qty_received: number;
  lp_id?: number | null;
  batch?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships
  item?: Product;
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
export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'partially_received'
  | 'received'
  | 'cancelled'
  | 'submitted'
  | 'closed';
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
  asn_id?: number | null; // EPIC-002: Link to source ASN
  grn_number: string;
  received_date: string;
  status: string;
  notes?: string;
  created_by: string;
  grn_items?: any[];
  po?: PurchaseOrder;
  asn?: {
    // EPIC-002: ASN relationship
    asn_number: string;
    status: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  address?: any | null;
  type?: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export type CreateWarehouseData = Omit<
  Warehouse,
  'id' | 'created_at' | 'updated_at'
>;
export type UpdateWarehouseData = Partial<CreateWarehouseData>;

// TransferOrderStatus type for legacy TransferOrder
// TransferOrderStatus is deprecated, use TOStatus instead (which matches DB schema)
export type TransferOrderStatus = TOStatus;

// Transfer Order Item (to_line table)
export interface TransferOrderItem {
  id: number;
  to_id: number;
  line_number: number;
  product_id: number;
  uom: string;
  quantity: number;
  transferred_qty?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships (populated from joins)
  product?: Product;
  // Deprecated aliases for backward compatibility
  line_no?: number;
  item_id?: number;
  qty_planned?: number;
  qty_shipped?: number;
  qty_received?: number;
  lp_id?: number | null;
  batch?: string | null;
}

export interface TransferOrder {
  id: number;
  to_number: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: TransferOrderStatus;
  scheduled_date?: string | null;
  notes?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships (populated from joins)
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  items?: TransferOrderItem[];
  // Deprecated aliases for backward compatibility
  transfer_order_items?: TransferOrderItem[];
  from_wh_id?: number;
  to_wh_id?: number;
  transfer_date?: string;
  planned_ship_date?: string;
  actual_ship_date?: string;
  planned_receive_date?: string;
  actual_receive_date?: string;
}

export interface ProductionOutput {
  id: number;
  wo_id: number;
  product_id: number;
  quantity: number;
  uom: UoM;
  lp_id?: number;
  created_by?: number;
  created_at: string;
}

// New enums for product taxonomy
export type ProductGroup = 'MEAT' | 'DRYGOODS' | 'COMPOSITE';
export type ProductType =
  | 'RM_MEAT'
  | 'PR'
  | 'FG'
  | 'DG_WEB'
  | 'DG_LABEL'
  | 'DG_BOX'
  | 'DG_ING'
  | 'DG_SAUCE'
  | 'DG_OTHER';

// Product types that require expiry date tracking
export const EXPIRY_REQUIRED_TYPES: ProductType[] = ['RM_MEAT', 'DG_ING', 'DG_SAUCE', 'PR', 'FG'];

// Product types that are packaging (no expiry required)
export const PACKAGING_TYPES: ProductType[] = ['DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_OTHER'];

// Helper function to check if product type requires expiry date
export function requiresExpiryDate(productType: ProductType): boolean {
  return EXPIRY_REQUIRED_TYPES.includes(productType);
}

// Enhanced Product interface
export interface Product {
  id: number;
  part_number: string;
  description: string;
  type: 'RM' | 'DG' | 'PR' | 'FG' | 'WIP'; // DB required field
  group: ProductGroup;
  product_group?: ProductGroup; // keep optional for backward compatibility in UI
  product_type: ProductType;
  subtype?: string;
  category?: string;
  uom: UoM;
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
export type ExpiryPolicy =
  | 'DAYS_STATIC'
  | 'FROM_MFG_DATE'
  | 'FROM_DELIVERY_DATE'
  | 'FROM_CREATION_DATE';

export interface ProductInsert {
  type: DbType;
  part_number: string;
  description: string;
  uom: UoM;
  product_group?: ProductGroup;
  product_type?: ProductType;
  product_version?: string; // Product version
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
  uom: UoM;
  sequence?: number;
  priority?: number | null;
  production_lines?: string[];
  production_line_restrictions?: string[];
  scrap_percent?: number | null;
  scrap_std_pct?: number | null;
  is_optional?: boolean;
  is_phantom?: boolean;
  consume_whole_lp?: boolean;
  unit_cost_std?: number | null;
  lead_time_days?: number | null;
  moq?: number | null;
  line_id?: number[] | null;
  notes?: string | null;
  // EPIC-001 planned fields
  is_by_product?: boolean;
  yield_percentage?: number | null;
}

export interface CreateSinglePayload {
  product: ProductInsert;
}

export interface CreateCompositePayload {
  product: ProductInsert;
  bom: { version?: string; status?: 'Active' | 'Draft' | 'Archived' | 'active' | 'draft' | 'archived' };
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

export type UpdateProductData = Partial<
  Omit<Product, 'id' | 'created_at' | 'updated_at' | 'activeBom'>
>;

// Tax codes
export interface TaxCode {
  id: number;
  code: string;
  description: string | null;
  rate: number;
  is_active: boolean | null;
  created_at: string | null;
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

export type CreateAllergenData = Omit<
  Allergen,
  'id' | 'created_at' | 'updated_at'
>;
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
  sequence: number;
  operation_name: string;
  machine_id?: number | null;
  run_time_mins?: number | null;
  setup_time_mins?: number | null;
  work_center?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutingOperationName {
  id: number;
  name: string;
  description?: string | null;
  is_active: boolean | null;
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
  uom?: UoM;
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
  line_id?: number[] | null; // Array of production line IDs
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

// EPIC-001 Phase 3: Conditional BOM Item types
export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'in';

export interface ConditionRule {
  field: string; // e.g., 'order_flags', 'customer_id', 'order_type'
  operator: ConditionOperator;
  value: string | number | any;
}

export interface BomItemCondition {
  type: 'AND' | 'OR';
  rules: ConditionRule[];
}

export interface BomItem {
  id: number;
  bom_id: number;
  material_id: number;
  quantity: number;
  uom: UoM;
  sequence: number;
  priority?: number;
  production_lines?: string[];
  production_line_restrictions?: string[];
  scrap_std_pct?: number;
  is_optional: boolean;
  is_phantom: boolean;
  consume_whole_lp: boolean; // renamed from one_to_one
  unit_cost_std?: number;
  tax_code_id?: number | null;
  lead_time_days?: number | null;
  moq?: number | null;
  // EPIC-001 Phase 1: By-Products Support
  is_by_product?: boolean;
  // EPIC-001 Phase 3: Conditional Components
  condition?: BomItemCondition | null;
  created_at: string;
  updated_at: string;
  // Enhanced relationships
  material?: Product;
}

export interface BomHistory {
  id: number;
  bom_id: number;
  change_type: string;
  changed_by?: string | null;
  created_at: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  // Enhanced relationships from API
  changed_by_user?: {
    id: string;
    email: string;
  };
  bom?: {
    id: number;
    product_id: number;
    version: number;
    status: string;
    products?: {
      id: number;
      part_number: string;
      description: string;
    };
  };
  // Deprecated aliases for backward compatibility
  version?: string;
  changed_at?: string;
  status_from?: string;
  status_to?: string;
  description?: string;
  changes?: {
    bom?: Record<string, { old: any; new: any }>;
    product?: Record<string, { old: any; new: any }>;
    items?: {
      added?: any[];
      removed?: any[];
      modified?: any[];
    };
  };
}

// WO Materials interface for BOM snapshot functionality
export interface WoMaterial {
  id: number;
  wo_id: number;
  material_id: number;
  qty_per_unit: number;
  uom: UoM;
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
// ============================================================================
// EPIC-003 Phase 1: Cost Calculation & Analysis Types
// ============================================================================

// Material Cost tracking
export interface MaterialCost {
  id: number;
  product_id: number;
  org_id: number;
  cost: number;
  currency: string;
  uom: UoM;
  effective_from: string;
  effective_to?: string | null;
  source: 'manual' | 'supplier' | 'average' | 'import';
  notes?: string | null;
  created_by?: number;
  created_at: string;
  updated_by?: number;
  updated_at: string;
  // Relationships
  product?: Product;
}

// BOM Cost snapshot
export interface BOMCost {
  id: number;
  bom_id: number;
  org_id: number;
  total_cost: number;
  material_costs: number;
  labor_cost: number;
  overhead_cost: number;
  currency: string;
  material_costs_json?: BOMCostBreakdown;
  calculated_at: string;
  calculated_by?: number;
  calculation_method?: string;
  notes?: string | null;
  created_at: string;
  // Relationships
  bom?: Bom;
}

// BOM Cost Breakdown structure
export interface BOMCostBreakdown {
  bom_id: number;
  total_cost: number;
  material_cost: number;
  labor_cost: number;
  overhead_cost: number;
  currency: string;
  calculated_at: string;
  materials: MaterialCostItem[];
}

// Individual material cost in BOM
export interface MaterialCostItem {
  product_id: number;
  product_name: string;
  quantity: number;
  uom: UoM;
  unit_cost: number;
  total_cost: number;
}

// Product Pricing
export interface ProductPrice {
  id: number;
  product_id: number;
  org_id: number;
  price: number;
  currency: string;
  effective_from: string;
  effective_to?: string | null;
  price_type: 'wholesale' | 'retail' | 'export' | 'internal' | 'custom';
  customer_id?: number | null;
  notes?: string | null;
  created_by?: number;
  created_at: string;
  updated_by?: number;
  updated_at: string;
  // Relationships
  product?: Product;
}

// Work Order Costs
export interface WOCost {
  id: number;
  wo_id: number;
  org_id: number;
  // Planned costs
  planned_cost: number;
  planned_material_cost: number;
  planned_labor_cost: number;
  planned_overhead_cost: number;
  // Actual costs
  actual_cost: number;
  actual_material_cost: number;
  actual_labor_cost: number;
  actual_overhead_cost: number;
  // Variance (computed)
  cost_variance: number;
  variance_percent: number;
  currency: string;
  planned_calculated_at: string;
  actual_calculated_at?: string | null;
  created_at: string;
  updated_at: string;
  // Relationships
  work_order?: WorkOrder;
}

// Margin Analysis result
export interface MarginAnalysis {
  product_id: number;
  product_name: string;
  product_code?: string;
  cost: number;
  price: number;
  margin: number;
  margin_percent: number;
  currency: string;
  price_type: string;
  effective_date: string;
}

// Cost Comparison between BOM versions
export interface BOMCostComparison {
  bom_1: BOMCostBreakdown;
  bom_2: BOMCostBreakdown;
  cost_difference: number;
  cost_difference_percent: number;
  comparison_date: string;
  changed_materials?: MaterialCostDiff[];
}

// Material cost difference in comparison
export interface MaterialCostDiff {
  product_id: number;
  product_name: string;
  cost_1: number;
  cost_2: number;
  difference: number;
  difference_percent: number;
}

// Cost trend data point
export interface CostTrendPoint {
  date: string;
  cost: number;
  source: string;
}

// WO Cost Variance detail
export interface WOCostVariance {
  wo_id: number;
  wo_number: string;
  product_name: string;
  planned_cost: number;
  actual_cost: number;
  variance: number;
  variance_percent: number;
  material_variance: number;
  labor_variance: number;
  overhead_variance: number;
  currency: string;
}

// API request/response types
export interface SetMaterialCostRequest {
  product_id: number;
  cost: number;
  currency?: string;
  uom: UoM;
  effective_from?: string;
  effective_to?: string | null;
  source?: 'manual' | 'supplier' | 'average' | 'import';
  notes?: string;
}

export interface SetProductPriceRequest {
  product_id: number;
  price: number;
  currency?: string;
  effective_from?: string;
  effective_to?: string | null;
  price_type?: 'wholesale' | 'retail' | 'export' | 'internal' | 'custom';
  customer_id?: number | null;
  notes?: string;
}

export interface CalculateBOMCostRequest {
  bom_id: number;
  as_of_date?: string;
  include_labor?: boolean;
  include_overhead?: boolean;
}

export interface CompareBOMCostsRequest {
  bom_id_1: number;
  bom_id_2: number;
  as_of_date?: string;
}
