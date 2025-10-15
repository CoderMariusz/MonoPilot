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
  id: number;
  wo_id: number;
  material_id: number;
  material: Product;
  planned_qty: number;
  actual_qty: number;
  variance_qty: number;
  variance_pct: number;
  created_at: string;
  updated_at: string;
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
  scrap_std_pct?: number;
  is_optional: boolean;
  is_phantom: boolean;
  unit_cost_std?: number;
  created_at: string;
  updated_at: string;
  // Enhanced relationships
  material?: Product;
}