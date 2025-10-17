# Database Schema Documentation

## Overview

This document describes the complete database schema for the MonoPilot MES system, including all tables, relationships, constraints, and business rules.

## Core Tables

### 1. work_orders
**Purpose**: Production work orders with enhanced tracking capabilities

```sql
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_number VARCHAR(20) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity_planned INTEGER NOT NULL,
  quantity_actual INTEGER,
  status work_order_status NOT NULL DEFAULT 'planned',
  priority work_order_priority NOT NULL DEFAULT 'normal',
  kpi_scope work_order_kpi_scope NOT NULL DEFAULT 'both',
  planned_start TIMESTAMP WITH TIME ZONE,
  planned_end TIMESTAMP WITH TIME ZONE,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**Key Features**:
- KPI scope tracking (PR/FG/Both)
- Actual vs planned timing
- Enhanced status management
- Audit trail with user tracking

### 2. license_plates
**Purpose**: Enhanced license plate management with parent relationships

```sql
CREATE TABLE license_plates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lp_number VARCHAR(20) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit_of_measure VARCHAR(10) NOT NULL,
  location_id UUID REFERENCES locations(id),
  status lp_status NOT NULL DEFAULT 'active',
  stage_suffix VARCHAR(2),
  parent_lp_id UUID REFERENCES license_plates(id),
  parent_lp_number VARCHAR(20),
  origin_type lp_origin_type NOT NULL DEFAULT 'grn',
  origin_ref VARCHAR(50),
  qa_status qa_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

**Key Features**:
- Parent-child LP relationships
- Stage suffix tracking (2-letter codes)
- Origin type and reference
- QA status management
- 8-digit LP numbering

### 3. stock_moves
**Purpose**: Enhanced stock movement tracking

```sql
CREATE TABLE stock_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lp_id UUID REFERENCES license_plates(id) NOT NULL,
  move_type stock_move_type NOT NULL,
  status stock_move_status NOT NULL DEFAULT 'pending',
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  quantity DECIMAL(10,3) NOT NULL,
  wo_id UUID REFERENCES work_orders(id),
  operation_seq INTEGER,
  meta JSONB,
  source VARCHAR(50) DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

**Key Features**:
- Move type classification
- Status tracking
- Work order association
- Metadata storage
- Source tracking

## BOM Management Tables

### 3. bom
**Purpose**: Bill of Materials with versioning support

```sql
CREATE TABLE bom (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  version TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);
```

**Key Features**:
- BOM versioning for product changes
- Active BOM tracking
- Audit trail with user tracking

### 4. bom_items
**Purpose**: BOM components with enhanced tracking capabilities

```sql
CREATE TABLE bom_items (
  id SERIAL PRIMARY KEY,
  bom_id INTEGER REFERENCES bom(id) NOT NULL,
  material_id INTEGER REFERENCES products(id) NOT NULL,
  quantity DECIMAL(10,4) NOT NULL,
  uom TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  priority INTEGER,
  production_lines TEXT[],
  scrap_std_pct DECIMAL(5,2) DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  is_phantom BOOLEAN DEFAULT false,
  one_to_one BOOLEAN DEFAULT false,
  unit_cost_std DECIMAL(12,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Material consumption tracking
- Scrap percentage calculation
- Optional and phantom components
- One-to-one LP consumption (consume entire LP regardless of quantity)
- Production line restrictions
- Standard cost tracking

**Field Descriptions**:
- `one_to_one`: If true, consume entire LP regardless of quantity (1:1 LP relationship)
- `is_optional`: Component can be omitted from production
- `is_phantom`: Component is not physically present but used for costing
- `scrap_std_pct`: Standard scrap percentage for material loss calculation
- `unit_cost_std`: Standard unit cost for the material

## Product Categories and Types

### Product Category Mapping
The system supports four main product categories with specific type mappings:

| Category | Product Type | Description | Supplier Required |
|----------|--------------|-------------|-------------------|
| MEAT | RM_MEAT | Raw meat materials | Yes |
| DRYGOODS | DG_WEB, DG_LABEL, DG_BOX, DG_ING, DG_SAUCE | Dry goods and ingredients | Yes |
| PROCESS | PR | Processed products (WIP) | No |
| FINISHED_GOODS | FG | Finished goods | No |

### Category-Specific Features
- **MEAT & DRYGOODS**: Require supplier information, support all expiry policies
- **PROCESS**: Manufactured products, fixed expiry policy (FROM_CREATION_DATE), require BOM
- **FINISHED_GOODS**: Final products, support BOM with both RM and PR materials, require BOM

### BOM Component Rules
- **PROCESS products**: Can only use MEAT and DRYGOODS materials
- **FINISHED_GOODS products**: Can use MEAT, DRYGOODS, and PROCESS materials
- **One-to-One LP consumption**: Available for all BOM components to consume entire LP regardless of quantity

## New Production Tables

### 5. wo_materials
**Purpose**: BOM snapshots for work orders

```sql
CREATE TABLE wo_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID REFERENCES work_orders(id) NOT NULL,
  bom_id UUID REFERENCES boms(id) NOT NULL,
  bom_item_id UUID REFERENCES bom_items(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity_required DECIMAL(10,3) NOT NULL,
  unit_of_measure VARCHAR(10) NOT NULL,
  one_to_one BOOLEAN NOT NULL DEFAULT FALSE,
  is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  substitution_group VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Hard BOM snapshot on WO creation
- One-to-one component tracking
- Optional component support
- Substitution group management

### 6. lp_reservations
**Purpose**: License plate reservations for work orders

```sql
CREATE TABLE lp_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lp_id UUID REFERENCES license_plates(id) NOT NULL,
  wo_id UUID REFERENCES work_orders(id) NOT NULL,
  operation_seq INTEGER NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  status reservation_status NOT NULL DEFAULT 'active',
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reserved_by UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancelled_by UUID REFERENCES users(id)
);
```

**Key Features**:
- Reservation management
- Expiration handling
- Cancellation tracking
- User audit trail

### 7. lp_compositions
**Purpose**: LP composition tracking for traceability

```sql
CREATE TABLE lp_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_lp_id UUID REFERENCES license_plates(id) NOT NULL,
  child_lp_id UUID REFERENCES license_plates(id) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  operation_seq INTEGER,
  wo_id UUID REFERENCES work_orders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features**:
- Parent-child LP relationships
- Operation tracking
- Work order association
- Traceability support

### 8. pallets
**Purpose**: Pallet management system

```sql
CREATE TABLE pallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_number VARCHAR(20) UNIQUE NOT NULL,
  location_id UUID REFERENCES locations(id),
  status pallet_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);
```

### 9. pallet_items
**Purpose**: Pallet contents tracking

```sql
CREATE TABLE pallet_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pallet_id UUID REFERENCES pallets(id) NOT NULL,
  lp_id UUID REFERENCES license_plates(id) NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  added_by UUID REFERENCES users(id)
);
```

## Enhanced Tables

### 10. wo_operations
**Purpose**: Per-operation weight tracking and loss calculations

```sql
CREATE TABLE wo_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wo_id UUID REFERENCES work_orders(id) NOT NULL,
  seq INTEGER NOT NULL,
  operation_name VARCHAR(100) NOT NULL,
  input_weight DECIMAL(10,3),
  output_weight DECIMAL(10,3),
  loss_weight DECIMAL(10,3),
  yield_percentage DECIMAL(5,2),
  status operation_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Views and Functions

### 1. Yield Views
```sql
-- PR Yield Daily
CREATE VIEW vw_yield_pr_daily AS
SELECT 
  DATE(wo.actual_start AT TIME ZONE 'Europe/London') as report_date,
  p.product_name,
  SUM(wo.quantity_actual) as actual_output,
  SUM(wo.quantity_planned) as planned_output,
  ROUND((SUM(wo.quantity_actual)::DECIMAL / SUM(wo.quantity_planned)) * 100, 2) as yield_percentage
FROM work_orders wo
JOIN products p ON wo.product_id = p.id
WHERE wo.kpi_scope IN ('pr', 'both')
  AND wo.status = 'completed'
GROUP BY DATE(wo.actual_start AT TIME ZONE 'Europe/London'), p.product_name;
```

### 2. Consumption View
```sql
CREATE VIEW vw_consume AS
SELECT 
  wo.id as wo_id,
  wo.wo_number,
  p.product_name,
  wm.product_id as material_id,
  m.product_name as material_name,
  wm.quantity_required as planned_quantity,
  COALESCE(SUM(sm.quantity), 0) as actual_quantity,
  ROUND(((COALESCE(SUM(sm.quantity), 0) - wm.quantity_required) / wm.quantity_required) * 100, 2) as variance_percentage
FROM work_orders wo
JOIN wo_materials wm ON wo.id = wm.wo_id
JOIN products p ON wo.product_id = p.id
JOIN products m ON wm.product_id = m.id
LEFT JOIN stock_moves sm ON wo.id = sm.wo_id AND wm.product_id = sm.lp_id
GROUP BY wo.id, wo.wo_number, p.product_name, wm.product_id, m.product_name, wm.quantity_required;
```

### 3. Traceability Views
```sql
-- Forward Trace
CREATE VIEW vw_trace_forward AS
WITH RECURSIVE trace_forward AS (
  SELECT 
    lp.id as lp_id,
    lp.lp_number,
    lp.product_id,
    p.product_name,
    lp.quantity,
    lp.stage_suffix,
    lp.origin_type,
    lp.origin_ref,
    0 as level
  FROM license_plates lp
  JOIN products p ON lp.product_id = p.id
  WHERE lp.origin_type = 'grn'
  
  UNION ALL
  
  SELECT 
    child.id as lp_id,
    child.lp_number,
    child.product_id,
    p.product_name,
    child.quantity,
    child.stage_suffix,
    child.origin_type,
    child.origin_ref,
    tf.level + 1
  FROM license_plates child
  JOIN products p ON child.product_id = p.id
  JOIN lp_compositions lc ON child.id = lc.child_lp_id
  JOIN trace_forward tf ON lc.parent_lp_id = tf.lp_id
)
SELECT * FROM trace_forward;
```

## Business Logic Functions

### 1. Available Quantity Calculation
```sql
CREATE OR REPLACE FUNCTION get_available_quantity(lp_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_quantity DECIMAL;
  reserved_quantity DECIMAL;
BEGIN
  SELECT quantity INTO total_quantity
  FROM license_plates
  WHERE id = lp_id;
  
  SELECT COALESCE(SUM(quantity), 0) INTO reserved_quantity
  FROM lp_reservations
  WHERE lp_id = lp_id AND status = 'active';
  
  RETURN total_quantity - reserved_quantity;
END;
$$ LANGUAGE plpgsql;
```

### 2. BOM Snapshot Trigger
```sql
CREATE OR REPLACE FUNCTION trg_snapshot_bom_on_wo_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wo_materials (wo_id, bom_id, bom_item_id, product_id, quantity_required, unit_of_measure, one_to_one, is_optional, substitution_group)
  SELECT 
    NEW.id,
    b.id,
    bi.id,
    bi.product_id,
    bi.quantity,
    bi.unit_of_measure,
    bi.one_to_one,
    bi.is_optional,
    bi.substitution_group
  FROM boms b
  JOIN bom_items bi ON b.id = bi.bom_id
  WHERE b.product_id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_snapshot_bom_on_wo_create
  AFTER INSERT ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION trg_snapshot_bom_on_wo_create();
```

## Row Level Security (RLS)

### Work Orders
```sql
-- Users can only see work orders they created or are assigned to
CREATE POLICY work_orders_select_policy ON work_orders
  FOR SELECT USING (
    created_by = auth.uid() OR 
    id IN (SELECT wo_id FROM wo_assignments WHERE user_id = auth.uid())
  );
```

### License Plates
```sql
-- Users can see all license plates but only modify their own
CREATE POLICY license_plates_select_policy ON license_plates
  FOR SELECT USING (true);
  
CREATE POLICY license_plates_modify_policy ON license_plates
  FOR ALL USING (created_by = auth.uid());
```

## Indexes for Performance

### Primary Indexes
```sql
-- Work orders
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_product ON work_orders(product_id);
CREATE INDEX idx_work_orders_dates ON work_orders(planned_start, planned_end);

-- License plates
CREATE INDEX idx_license_plates_stage ON license_plates(stage_suffix);
CREATE INDEX idx_license_plates_parent ON license_plates(parent_lp_id);
CREATE INDEX idx_license_plates_qa ON license_plates(qa_status);

-- Stock moves
CREATE INDEX idx_stock_moves_wo ON stock_moves(wo_id);
CREATE INDEX idx_stock_moves_lp ON stock_moves(lp_id);
CREATE INDEX idx_stock_moves_type ON stock_moves(move_type);

-- Reservations
CREATE INDEX idx_reservations_active ON lp_reservations(lp_id, status);
CREATE INDEX idx_reservations_wo ON lp_reservations(wo_id);

-- Compositions
CREATE INDEX idx_compositions_parent ON lp_compositions(parent_lp_id);
CREATE INDEX idx_compositions_child ON lp_compositions(child_lp_id);
```

## Data Integrity Constraints

### Check Constraints
```sql
-- Work order quantities must be positive
ALTER TABLE work_orders ADD CONSTRAINT chk_quantity_positive 
  CHECK (quantity_planned > 0 AND (quantity_actual IS NULL OR quantity_actual > 0));

-- License plate quantities must be positive
ALTER TABLE license_plates ADD CONSTRAINT chk_lp_quantity_positive 
  CHECK (quantity > 0);

-- Stage suffix must be 2 characters
ALTER TABLE license_plates ADD CONSTRAINT chk_stage_suffix_length 
  CHECK (stage_suffix IS NULL OR LENGTH(stage_suffix) = 2);

-- Reservation quantities must be positive
ALTER TABLE lp_reservations ADD CONSTRAINT chk_reservation_quantity_positive 
  CHECK (quantity > 0);
```

### Foreign Key Constraints
```sql
-- Ensure work order materials reference valid BOM items
ALTER TABLE wo_materials ADD CONSTRAINT fk_wo_materials_bom_item 
  FOREIGN KEY (bom_item_id) REFERENCES bom_items(id);

-- Ensure reservations reference valid work orders
ALTER TABLE lp_reservations ADD CONSTRAINT fk_reservations_wo 
  FOREIGN KEY (wo_id) REFERENCES work_orders(id);

-- Ensure compositions reference valid license plates
ALTER TABLE lp_compositions ADD CONSTRAINT fk_compositions_parent 
  FOREIGN KEY (parent_lp_id) REFERENCES license_plates(id);
  
ALTER TABLE lp_compositions ADD CONSTRAINT fk_compositions_child 
  FOREIGN KEY (child_lp_id) REFERENCES license_plates(id);
```

## Migration History

### Migration 019: WO Materials BOM Snapshot
- Creates `wo_materials` table
- Adds BOM snapshot functionality
- Implements hard BOM versioning

### Migration 020: LP Reservations
- Creates `lp_reservations` table
- Adds reservation management
- Implements quantity tracking

### Migration 021: LP Compositions
- Creates `lp_compositions` table
- Adds traceability support
- Implements parent-child relationships

### Migration 022: Pallets
- Creates `pallets` and `pallet_items` tables
- Adds pallet management
- Implements pallet tracking

### Migration 023: BOM Snapshot Trigger
- Creates trigger for automatic BOM snapshot
- Ensures data consistency
- Implements business rules

### Migration 024: License Plates Enhancement
- Enhances `license_plates` table
- Adds parent relationships
- Implements stage suffix support

### Migration 025: Enhanced Trace Functions
- Updates traceability views
- Adds composition support
- Implements pallet tracking

## Performance Considerations

### Query Optimization
- Use appropriate indexes for common queries
- Implement query caching where possible
- Monitor slow queries and optimize
- Use connection pooling for high concurrency

### Data Archiving
- Archive completed work orders older than 1 year
- Archive old stock moves for completed work orders
- Implement data retention policies
- Use partitioning for large tables

### Backup Strategy
- Daily full backups
- Transaction log backups every 15 minutes
- Point-in-time recovery capability
- Test restore procedures regularly
