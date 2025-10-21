# Database Schema Documentation

## Overview

This document describes the complete database schema for the MonoPilot MES system, including all tables, relationships, constraints, and business rules.

**Last Updated**: 2025-01-21
**Version**: 2.0 - BOM Lifecycle & Versioning Update

## Core Tables

### 0. products
**Purpose**: Product catalog with taxonomy aligned to application logic

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  part_number TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('RM', 'DG', 'PR', 'FG', 'WIP')),
  uom TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  std_price DECIMAL(12,4),
  
  -- App taxonomy
  product_group TEXT CHECK (product_group IN ('MEAT', 'DRYGOODS', 'COMPOSITE')),
  product_type TEXT CHECK (product_type IN ('RM_MEAT', 'PR', 'FG', 'DG_ING', 'DG_LABEL', 'DG_WEB', 'DG_BOX', 'DG_SAUCE')),
  
  -- Planning & commercial
  preferred_supplier_id INTEGER REFERENCES suppliers(id),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq DECIMAL(10,4),
  production_lines TEXT[],
  
  -- Lifecycle
  expiry_policy TEXT CHECK (expiry_policy IN ('DAYS_STATIC', 'FROM_MFG_DATE', 'FROM_DELIVERY_DATE', 'FROM_CREATION_DATE')),
  shelf_life_days INTEGER,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**Indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_products_part_number ON products(part_number);
CREATE INDEX IF NOT EXISTS idx_products_product_group ON products(product_group);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
```

**Business Rules**:
- `is_active = true`: Product is visible in MEAT/DRYGOODS/FINISHED_GOODS/PROCESS tabs
- `is_active = false`: Product appears only in ARCHIVE tab (for MEAT/DRYGOODS)
- For COMPOSITE products, archive status is controlled by BOM status

**Used By**
- Pages: /technical/bom, /production, /planning, /warehouse, /scanner
- APIs: ProductsAPI, WorkOrdersAPI, PurchaseOrdersAPI, GRNsAPI, LicensePlatesAPI

## BOM Management Tables (Enhanced)

### 3. boms
**Purpose**: Bill of Materials with versioning and lifecycle management

```sql
CREATE TABLE boms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  version TEXT NOT NULL,
  
  -- BOM Lifecycle
  status bom_status NOT NULL DEFAULT 'draft',  -- ENUM: 'draft', 'active', 'archived'
  archived_at TIMESTAMP WITH TIME ZONE NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NULL,
  
  -- BOM Configuration
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER REFERENCES routings(id),
  notes TEXT,
  effective_from DATE,
  effective_to DATE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT boms_single_active UNIQUE (product_id) WHERE status = 'active'
);
```

**Indexes**
```sql
CREATE UNIQUE INDEX IF NOT EXISTS boms_single_active_idx ON boms(product_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_boms_status ON boms(status);
CREATE INDEX IF NOT EXISTS idx_boms_product_id ON boms(product_id);
```

**Key Features**:
- **BOM versioning**: Tracks version numbers (1.0, 1.1, 2.0, etc.)
- **Lifecycle management**: draft → active → archived
- **Single active BOM**: Only one active BOM per product (enforced by unique index)
- **Clone-on-edit**: Editing an active BOM creates a new draft version
- **Soft delete**: `deleted_at` timestamp for audit trail

**Version Bumping Rules**:
- **Minor changes** (1.0 → 1.1): Description, Std Price, Expiry Policy, Shelf Life, Allergens
- **Major changes** (1.0 → 2.0): BOM items added/removed/modified

**Business Logic**:
1. **Draft BOM**: Can be edited directly, deleted hard if unused
2. **Active BOM**: Clone-on-edit (creates new draft), cannot be deleted
3. **Archived BOM**: Read-only, appears in ARCHIVE tab
4. **Activation**: When a BOM is activated, previous active BOM is automatically archived

### 4. bom_items
**Purpose**: BOM components with enhanced tracking and PO prefill capabilities

```sql
CREATE TABLE bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES boms(id) NOT NULL,
  material_id INTEGER REFERENCES products(id) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  uom TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  priority INTEGER,
  
  -- Production Control
  production_lines TEXT[],
  production_line_restrictions TEXT[],
  scrap_std_pct DECIMAL(5,2) DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false,
  consume_whole_lp BOOLEAN DEFAULT false,  -- Renamed from one_to_one
  
  -- PO Prefill Data (Migration 033)
  unit_cost_std DECIMAL(12,4),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq DECIMAL(12,4),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes**
```sql
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_id ON bom_items(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_items_material_id ON bom_items(material_id);
```

**Field Descriptions**:
- `consume_whole_lp`: If true, consume entire LP regardless of quantity (1:1 LP relationship)
- `is_optional`: Component can be omitted from production
- `is_phantom`: Component is not physically present but used for costing
- `scrap_std_pct`: Standard scrap percentage for material loss calculation
- `unit_cost_std`: Standard unit cost for PO prefill
- `tax_code_id`: Tax code for PO prefill
- `lead_time_days`: Lead time for PO planning
- `moq`: Minimum order quantity for PO planning

**Key Features**:
- Material consumption tracking
- Scrap percentage calculation
- Optional and phantom components
- **Consume Whole LP** (1:1): Enforce 1:1 consumption in scanner
- Production line restrictions
- **PO Prefill**: Auto-populate PO fields from BOM data

## Product Categories and Types

### Product Category Mapping
The system supports four main product categories with specific type mappings:

| Category | Product Type | Description | Supplier Required | BOM Required |
|----------|--------------|-------------|-------------------|--------------|
| MEAT | RM_MEAT | Raw meat materials | Yes | No |
| DRYGOODS | DG_WEB, DG_LABEL, DG_BOX, DG_ING, DG_SAUCE | Dry goods and ingredients | Yes | No |
| PROCESS | PR | Processed products (WIP) | No | Yes |
| FINISHED_GOODS | FG | Finished goods | No | Yes |

### Category-Specific Features
- **MEAT & DRYGOODS**: 
  - Require supplier information
  - Support all expiry policies
  - Status controlled by `products.is_active`
  - Appear in ARCHIVE tab when `is_active = false`
  
- **PROCESS & FINISHED_GOODS (COMPOSITE)**: 
  - Manufactured products
  - Require BOM
  - Status controlled by `boms.status`
  - Appear in ARCHIVE tab when `boms.status = 'archived'`

### BOM Component Rules
- **PROCESS products (PR)**: Can only use MEAT and DRYGOODS materials
- **FINISHED_GOODS products (FG)**: Can use MEAT, DRYGOODS, and PROCESS materials
- **Consume Whole LP**: Available for all BOM components to consume entire LP regardless of quantity

### Archive Tab Logic
The ARCHIVE tab displays:
- **MEAT/DRYGOODS**: `products.is_active = false`
- **COMPOSITE (PR/FG)**: `boms.status = 'archived'`

## BOM Lifecycle & Triggers

### 1. Guard BOM Hard Delete
```sql
CREATE OR REPLACE FUNCTION guard_boms_hard_delete() RETURNS trigger AS $$
BEGIN
  -- Block hard-delete if not draft
  IF OLD.status <> 'draft' THEN
    RAISE EXCEPTION 'Cannot hard-delete non-draft BOM';
  END IF;
  
  -- Block hard-delete if referenced by work orders
  IF EXISTS (SELECT 1 FROM work_orders WHERE bom_id = OLD.id) THEN
    RAISE EXCEPTION 'Cannot hard-delete BOM referenced by Work Orders';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_boms_guard_delete BEFORE DELETE ON boms 
FOR EACH ROW EXECUTE FUNCTION guard_boms_hard_delete();
```

**Business Rules**:
- Only draft BOMs can be hard-deleted
- BOMs referenced by work orders cannot be deleted
- Archive BOMs instead of deleting

### 2. Allergen Inheritance
```sql
-- Allergens are automatically inherited from BOM components to composite products
-- Managed by UI and application logic
-- product_allergens table stores both inherited and manually selected allergens
```

## New Production Tables

### 5. wo_materials
**Purpose**: BOM snapshots for work orders

```sql
CREATE TABLE wo_materials (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) NOT NULL,
  material_id INTEGER REFERENCES products(id) NOT NULL,
  qty_per_unit DECIMAL(10,4) NOT NULL,
  uom TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  consume_whole_lp BOOLEAN DEFAULT false,  -- Renamed from one_to_one
  is_optional BOOLEAN DEFAULT false,
  scrap_std_pct DECIMAL(5,2),
  
  -- PO Prefill Data
  unit_cost_std DECIMAL(12,4),
  tax_code_id INTEGER REFERENCES settings_tax_codes(id),
  lead_time_days INTEGER,
  moq DECIMAL(12,4),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Hard BOM snapshot on WO creation
- Consume whole LP tracking
- Optional component support
- PO prefill data captured

## Product Allergens

### product_allergens
**Purpose**: Track allergens for products with inheritance support

```sql
CREATE TABLE product_allergens (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  allergen_id INTEGER REFERENCES allergens(id) NOT NULL,
  contains BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(product_id, allergen_id)
);
```

**Allergen Inheritance**:
- Composite products automatically inherit allergens from BOM components
- Manual override allowed (can add additional allergens)
- Combined set of inherited + manual allergens saved to `product_allergens`

## Migration History

### Migration 031: Rename one_to_one → consume_whole_lp
- Renames `one_to_one` to `consume_whole_lp` in `bom_items`
- Renames `one_to_one` to `consume_whole_lp` in `wo_materials`
- Updates all references and documentation

### Migration 032: BOM Lifecycle Status
- Adds `status` ENUM ('draft', 'active', 'archived')
- Adds `archived_at` and `deleted_at` timestamps
- Creates unique index for single active BOM per product
- Adds `guard_boms_hard_delete` trigger

### Migration 033: BOM Items PO Prefill
- Adds `tax_code_id`, `lead_time_days`, `moq` to `bom_items`
- Enables PO creation with prefilled data from BOM

## Performance Considerations

### Query Optimization
- Use appropriate indexes for common queries
- Implement query caching where possible
- Monitor slow queries and optimize
- Use connection pooling for high concurrency

### Data Archiving Strategy
**Active Data** (visible in main tabs):
- MEAT/DRYGOODS: `is_active = true`
- COMPOSITE: `boms.status IN ('draft', 'active')`

**Archived Data** (visible in ARCHIVE tab):
- MEAT/DRYGOODS: `is_active = false`
- COMPOSITE: `boms.status = 'archived'`

**Audit Trail**:
- All BOM versions retained (draft, active, archived)
- `deleted_at` timestamp for soft-deleted BOMs
- `archived_at` timestamp for archived BOMs
- User tracking (`created_by`, `updated_by`)

### Backup Strategy
- Daily full backups
- Transaction log backups every 15 minutes
- Point-in-time recovery capability
- Test restore procedures regularly

## TODO: Future Enhancements

### Data Validation
- [ ] Add constraint to prevent circular BOM references
- [ ] Validate BOM version format (X.Y)
- [ ] Add triggers to validate product_type vs allowed materials
- [ ] Implement max BOM depth limit (prevent deep nesting)

### Archive & Audit Trail
- [ ] Create `audit_log` table for tracking all changes:
  ```sql
  CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'ARCHIVE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_reason TEXT
  );
  ```
- [ ] Add triggers to populate audit_log for:
  - BOM status changes (draft → active → archived)
  - Product activation/deactivation (`is_active`)
  - BOM version bumps
  - Critical field changes (price, allergens, BOM items)
- [ ] Implement change reason field (user must provide reason for major changes)
- [ ] Create audit trail viewer UI in admin panel

### BOM Versioning Enhancements
- [ ] Add BOM comparison tool (diff between versions)
- [ ] Implement BOM approval workflow (requires manager approval)
- [ ] Add "effective from/to" date range enforcement
- [ ] Create BOM history viewer showing all versions

### WO Snapshot Management
- [ ] Implement WO snapshot update for PLANNED status
- [ ] Add snapshot preview with diff view
- [ ] Block snapshot update if WO has issues/outputs
- [ ] Create snapshot update approval workflow

### Scanner Validation
- [ ] Enforce 1:1 validation for `consume_whole_lp` materials
- [ ] Add scanner validation rules table
- [ ] Implement real-time validation feedback
- [ ] Create scanner error logging

### PO Prefill
- [ ] Modify PO creation endpoint to use BOM prefill data
- [ ] Add override capability for prefilled values
- [ ] Track which PO fields were prefilled vs manual
- [ ] Implement prefill accuracy reporting

## Database Relationships Diagram

```
products (1) ──> (M) boms (1) ──> (M) bom_items (M) ──> (1) products [materials]
    │                    │
    │                    └──> (M) wo_materials (M) ──> (1) work_orders
    │
    ├──> (M) product_allergens (M) ──> (1) allergens
    │
    └──> (M) work_orders (1) ──> (M) wo_materials
```

**Key Relationships**:
1. **products → boms**: One product can have multiple BOM versions (1:M)
2. **boms → bom_items**: One BOM contains multiple materials (1:M)
3. **bom_items → products**: Each BOM item references a material product (M:1)
4. **boms → wo_materials**: BOM is snapshotted into WO materials (1:M)
5. **products → product_allergens**: Product allergens with inheritance (1:M)

**Cascade Rules**:
- Deleting a product: Cascades to boms (if no WO references)
- Deleting a BOM: Blocked if referenced by work_orders
- Archiving a BOM: Soft delete (sets status='archived')
