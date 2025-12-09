# Database Schema - MonoPilot

**Version:** 1.0
**Date:** 2025-12-09
**Database:** PostgreSQL 15 (Supabase)
**Status:** BASELINE

---

## 1. Overview

### 1.1 Database Architecture

- **Multi-tenant:** Every table has `org_id` column
- **RLS Enabled:** Row Level Security on all tables
- **Soft Deletes:** `deleted_at` column pattern
- **Audit Trail:** `created_at`, `updated_at`, `created_by`
- **UUID Primary Keys:** All tables use UUID v4

### 1.2 Schema Organization

```
public/
  +-- Core (Organizations, Users)
  +-- Settings (Warehouses, Locations, Machines, Lines, Allergens, Tax Codes)
  +-- Technical (Products, BOMs, Routings)
  +-- Planning (Suppliers, Purchase Orders, Transfer Orders)
  +-- Warehouse (License Plates, GRNs, Stock Movements)
  +-- Production (Work Orders, Material Reservations)
  +-- Quality (Holds, Specifications, NCRs) [Phase 2]
  +-- Shipping (Sales Orders, Shipments, Picks) [Phase 2]
```

---

## 2. Entity Relationship Diagram

### 2.1 Core & Settings Module

```
+-------------------+       +-------------------+
|   organizations   |       |      users        |
+-------------------+       +-------------------+
| id (PK)           |<---+  | id (PK)           |
| name              |    |  | org_id (FK)       |----+
| email             |    |  | email             |    |
| modules_enabled[] |    |  | name              |    |
| wizard_completed  |    |  | role              |    |
| created_at        |    |  | status            |    |
+-------------------+    |  | created_at        |    |
         ^               |  +-------------------+    |
         |               |                          |
         |               +----------------+---------+
         |                                |
+--------+---------+              +-------v--------+
|    warehouses    |              | user_invitations|
+------------------+              +----------------+
| id (PK)          |              | id (PK)        |
| org_id (FK)      |<----+        | org_id (FK)    |
| code (UNIQUE)    |     |        | email          |
| name             |     |        | role           |
| status           |     |        | token          |
| address          |     |        | status         |
| default_location |     |        | expires_at     |
| created_at       |     |        +----------------+
+------------------+     |
         |               |
         v               |
+------------------+     |        +------------------+
|    locations     |     |        |    allergens     |
+------------------+     |        +------------------+
| id (PK)          |     |        | id (PK)          |
| org_id (FK)      |     |        | org_id (FK)      |
| warehouse_id(FK) |-----+        | code             |
| code (UNIQUE)    |              | name             |
| name             |              | type (EU14/CUSTOM)|
| type             |              +------------------+
| zone             |
| is_quarantine    |              +------------------+
| status           |              |    tax_codes     |
+------------------+              +------------------+
                                  | id (PK)          |
+------------------+              | org_id (FK)      |
|    machines      |              | code             |
+------------------+              | name             |
| id (PK)          |              | rate             |
| org_id (FK)      |              | is_default       |
| warehouse_id(FK) |              +------------------+
| code             |
| name             |
| capacity_per_hour|
| status           |
+------------------+

+------------------+
| production_lines |
+------------------+
| id (PK)          |
| org_id (FK)      |
| warehouse_id(FK) |
| code             |
| name             |
| status           |
+------------------+
```

### 2.2 Technical Module

```
+------------------+       +------------------+       +------------------+
|    products      |       |      boms        |       |    routings      |
+------------------+       +------------------+       +------------------+
| id (PK)          |<--+   | id (PK)          |       | id (PK)          |
| org_id (FK)      |   |   | org_id (FK)      |       | org_id (FK)      |
| code (UNIQUE)    |   |   | code             |       | code             |
| name             |   |   | name             |       | name             |
| type (RM/WIP/FG) |   |   | product_id (FK)  |---+   | version          |
| category         |   |   | version          |   |   | status           |
| uom              |   |   | status           |   |   +--------+---------+
| version          |   |   | effective_from   |   |            |
| shelf_life_days  |   |   | effective_to     |   |            v
| cost_per_unit    |   |   | quantity         |   |   +------------------+
| status           |   |   | yield_percentage |   |   |routing_operations|
+--------+---------+   |   +--------+---------+   |   +------------------+
         |             |            |             |   | id (PK)          |
         |             |            v             |   | routing_id (FK)  |
         |             |   +------------------+   |   | operation_number |
         |             |   |    bom_items     |   |   | name             |
         |             |   +------------------+   |   | machine_id (FK)  |
         |             |   | id (PK)          |   |   | setup_time_min   |
         |             +---| component_id(FK) |   |   | cycle_time_min   |
         |                 | bom_id (FK)      |   |   | is_quality_check |
         |                 | line_number      |   |   +------------------+
         |                 | quantity         |   |
         |                 | uom              |   |   +------------------+
         |                 | scrap_percentage |   |   | product_routings |
         |                 | is_byproduct     |   |   +------------------+
         |                 +------------------+   |   | product_id (FK)  |
         |                                        +---| routing_id (FK)  |
         v                                            +------------------+
+------------------+
| product_allergens|       +------------------+
+------------------+       |product_version_  |
| product_id (FK)  |       |    history       |
| allergen_id (FK) |       +------------------+
| relation_type    |       | id (PK)          |
| (contains/may)   |       | product_id (FK)  |
+------------------+       | version          |
                           | changed_fields   |
                           | changed_by (FK)  |
                           | changed_at       |
                           +------------------+
```

### 2.3 Planning Module

```
+------------------+       +------------------+
|    suppliers     |       | purchase_orders  |
+------------------+       +------------------+
| id (PK)          |<---+  | id (PK)          |
| org_id (FK)      |    |  | org_id (FK)      |
| code             |    |  | po_number        |
| name             |    +--| supplier_id (FK) |
| email            |       | order_date       |
| phone            |       | expected_delivery|
| payment_terms    |       | status           |
| lead_time_days   |       | total_amount     |
| status           |       | warehouse_id(FK) |
+--------+---------+       +--------+---------+
         |                          |
         v                          v
+------------------+       +------------------+
| supplier_products|       |    po_lines      |
+------------------+       +------------------+
| supplier_id (FK) |       | id (PK)          |
| product_id (FK)  |       | po_id (FK)       |
| supplier_code    |       | product_id (FK)  |
| price_per_unit   |       | line_number      |
| min_order_qty    |       | quantity         |
| is_preferred     |       | uom              |
+------------------+       | price_per_unit   |
                           | received_qty     |
                           | tax_code_id (FK) |
                           +------------------+

+------------------+       +------------------+
| transfer_orders  |       |    to_lines      |
+------------------+       +------------------+
| id (PK)          |       | id (PK)          |
| org_id (FK)      |       | to_id (FK)       |
| to_number        |       | product_id (FK)  |
| from_warehouse   |       | quantity         |
| to_warehouse     |       | shipped_qty      |
| order_date       |       | received_qty     |
| status           |       +--------+---------+
+------------------+                |
                                    v
                           +------------------+
                           |   to_line_lps    |
                           +------------------+
                           | to_line_id (FK)  |
                           | lp_id (FK)       |
                           | picked_at        |
                           +------------------+
```

### 2.4 Warehouse Module

```
+------------------+       +------------------+       +------------------+
| license_plates   |       |      grns        |       | stock_movements  |
+------------------+       +------------------+       +------------------+
| id (PK)          |<--+   | id (PK)          |<--+   | id (PK)          |
| org_id (FK)      |   |   | org_id (FK)      |   |   | org_id (FK)      |
| lp_number        |   |   | grn_number       |   |   | move_number      |
| product_id (FK)  |   |   | source_type      |   +---| lp_id (FK)       |
| quantity         |   |   | po_id (FK)       |       | move_type        |
| uom              |   |   | to_id (FK)       |       | from_location_id |
| location_id (FK) |   |   | supplier_id (FK) |       | to_location_id   |
| warehouse_id(FK) |   |   | receipt_date     |       | quantity         |
| status           |   |   | warehouse_id(FK) |       | reason           |
| qa_status        |   |   | location_id (FK) |       | wo_id (FK)       |
| batch_number     |   |   | status           |       | moved_by (FK)    |
| supplier_batch   |   |   | received_by(FK)  |       | move_date        |
| expiry_date      |   |   +------------------+       +------------------+
| grn_id (FK)      |---+
| wo_id (FK)       |           +------------------+
| parent_lp_id(FK) |---------->|   lp_genealogy   |
| consumed_by_wo   |           +------------------+
| pallet_id (FK)   |           | id (PK)          |
+--------+---------+           | org_id (FK)      |
         |                     | parent_lp_id(FK) |
         |                     | child_lp_id (FK) |
         |                     | operation_type   |
         |                     | quantity         |
         |                     | wo_id (FK)       |
         v                     | operation_date   |
+------------------+           +------------------+
|    grn_items     |
+------------------+           +------------------+
| id (PK)          |           |     pallets      |
| grn_id (FK)      |           +------------------+
| product_id (FK)  |           | id (PK)          |
| po_line_id (FK)  |           | org_id (FK)      |
| ordered_qty      |           | pallet_number    |
| received_qty     |           | warehouse_id(FK) |
| lp_id (FK)       |           | location_id (FK) |
| batch_number     |           | status           |
| expiry_date      |           +------------------+
| qa_status        |
+------------------+           +------------------+
                               |warehouse_settings|
                               +------------------+
                               | org_id (FK/UNIQUE)|
                               | enable_asn       |
                               | auto_generate_lp |
                               | lp_number_prefix |
                               | enable_pallets   |
                               | enable_split_merge|
                               | require_qa_receipt|
                               | allow_over_receipt|
                               | enable_fifo      |
                               | enable_fefo      |
                               +------------------+
```

### 2.5 Production Module

```
+------------------+       +------------------+       +------------------+
|   work_orders    |       |    wo_materials  |       |   wo_outputs     |
+------------------+       +------------------+       +------------------+
| id (PK)          |<--+   | id (PK)          |       | id (PK)          |
| org_id (FK)      |   |   | wo_id (FK)       |---+   | wo_id (FK)       |
| wo_number        |   |   | bom_item_id (FK) |   |   | product_id (FK)  |
| product_id (FK)  |   |   | product_id (FK)  |   |   | lp_id (FK)       |
| bom_id (FK)      |   |   | planned_qty      |   |   | quantity         |
| routing_id (FK)  |   |   | consumed_qty     |   |   | uom              |
| warehouse_id(FK) |   |   | uom              |   |   | is_byproduct     |
| line_id (FK)     |   |   +------------------+   |   | registered_at    |
| planned_qty      |   |                         |   | registered_by(FK)|
| produced_qty     |   |   +------------------+   |   +------------------+
| planned_start    |   |   |wo_material_reserv|   |
| planned_end      |   |   +------------------+   |
| actual_start     |   |   | id (PK)          |   |
| actual_end       |   |   | wo_material_id   |---+
| status           |   |   | lp_id (FK)       |
| priority         |   |   | reserved_qty     |
+--------+---------+   |   | consumed_qty     |
         |             |   | status           |
         |             |   +------------------+
         v             |
+------------------+   |   +------------------+
|  wo_operations   |   |   |production_settings|
+------------------+   |   +------------------+
| id (PK)          |   |   | org_id (UNIQUE)  |
| wo_id (FK)       |---+   | enable_scheduling|
| routing_op_id(FK)|       | enable_scrap_track|
| operation_number |       | allow_overproduction|
| status           |       | require_qa_output|
| started_at       |       | enable_byproducts|
| completed_at     |       +------------------+
| completed_by(FK) |
+------------------+
```

### 2.6 Quality Module (Phase 2)

```
+------------------+       +------------------+       +------------------+
| quality_holds    |       |  specifications  |       |      ncrs        |
+------------------+       +------------------+       +------------------+
| id (PK)          |       | id (PK)          |       | id (PK)          |
| org_id (FK)      |       | org_id (FK)      |       | org_id (FK)      |
| hold_number      |       | product_id (FK)  |       | ncr_number       |
| reason           |       | attribute_name   |       | lp_id (FK)       |
| hold_type        |       | attribute_type   |       | wo_id (FK)       |
| status           |       | min_value        |       | po_id (FK)       |
| priority         |       | max_value        |       | ncr_type         |
| held_by (FK)     |       | target_value     |       | description      |
| held_at          |       | is_critical      |       | severity         |
| assigned_to (FK) |       | test_method      |       | status           |
| released_by (FK) |       +------------------+       | root_cause       |
| released_at      |                                  | corrective_action|
+--------+---------+       +------------------+       | closed_by (FK)   |
         |                 |  quality_tests   |       +------------------+
         v                 +------------------+
+------------------+       | id (PK)          |       +------------------+
| quality_hold_lps |       | org_id (FK)      |       |      coas        |
+------------------+       | test_number      |       +------------------+
| hold_id (FK)     |       | lp_id (FK)       |       | id (PK)          |
| lp_id (FK)       |       | specification_id |       | org_id (FK)      |
+------------------+       | tested_by (FK)   |       | grn_id (FK)      |
                           | result_value     |       | supplier_id (FK) |
                           | result_pass      |       | certificate_no   |
                           +------------------+       | document_url     |
                                                      | verified_by (FK) |
                                                      | status           |
                                                      +------------------+
```

### 2.7 Shipping Module (Phase 2)

```
+------------------+       +------------------+       +------------------+
|    so_header     |       |    shipments     |       |   pick_lists     |
+------------------+       +------------------+       +------------------+
| id (PK)          |<--+   | id (PK)          |<--+   | id (PK)          |
| org_id (FK)      |   |   | org_id (FK)      |   |   | org_id (FK)      |
| so_number        |   |   | shipment_number  |   |   | pick_number      |
| customer_id (FK) |   |   | warehouse_id(FK) |   |   | shipment_id (FK) |--+
| order_date       |   |   | ship_date        |   |   | so_id (FK)       |  |
| requested_date   |   |   | status           |   |   | warehouse_id(FK) |  |
| ship_to_address  |   |   | carrier          |   |   | status           |  |
| warehouse_id(FK) |   |   | tracking_number  |   |   | assigned_to (FK) |  |
| status           |   |   | weight_kg        |   |   +--------+---------+  |
| priority         |   |   | pod_date         |   |            |            |
+--------+---------+   |   +------------------+   |            v            |
         |             |                         |   +------------------+   |
         v             |                         |   |   pick_items     |   |
+------------------+   |   +------------------+   |   +------------------+   |
|    so_lines      |   |   | shipment_items   |   |   | pick_id (FK)     |   |
+------------------+   |   +------------------+   |   | so_line_id (FK)  |   |
| id (PK)          |   |   | shipment_id (FK) |---+   | product_id (FK)  |   |
| so_id (FK)       |---+   | so_line_id (FK)  |       | required_qty     |   |
| product_id (FK)  |       | product_id (FK)  |       | picked_qty       |   |
| quantity         |       | quantity         |       | from_location_id |   |
| uom              |       | lp_id (FK)       |       | lp_id (FK)       |   |
| picked_qty       |       +------------------+       | status           |   |
| shipped_qty      |                                  +------------------+   |
| unit_price       |                                                         |
| line_status      |   +------------------+       +------------------+       |
+------------------+   |    packages      |       | package_items    |       |
                       +------------------+       +------------------+       |
                       | id (PK)          |<------| pack_id (FK)     |       |
                       | org_id (FK)      |       | lp_id (FK)       |       |
                       | pack_number      |       | quantity         |       |
                       | shipment_id (FK) |-------+------------------+       |
                       | weight_kg        |                                  |
                       | tracking_number  |                                  |
                       | status           |                                  |
                       | packed_by (FK)   |<---------------------------------+
                       +------------------+
```

---

## 3. Multi-Tenancy Implementation

### 3.1 org_id Pattern

Every tenant-scoped table MUST have:

```sql
CREATE TABLE example_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    -- other columns...

    -- Unique constraint per org
    UNIQUE(org_id, code)
);

-- Index for org_id queries
CREATE INDEX idx_example_table_org_id ON example_table(org_id);
```

### 3.2 RLS Policy Pattern

```sql
-- Enable RLS
ALTER TABLE example_table ENABLE ROW LEVEL SECURITY;

-- Policy: Service role bypasses, users filtered by org_id
CREATE POLICY example_table_isolation ON example_table
    FOR ALL
    USING (
        -- Service role can access all
        (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
        OR
        -- User must belong to same org
        org_id = (auth.jwt() ->> 'org_id')::uuid
    );
```

### 3.3 Service Layer Implementation

```typescript
// Always use admin client + manual org_id filtering
export async function listItems() {
  const supabaseAdmin = createServerSupabaseAdmin() // Bypasses RLS
  const orgId = await getCurrentOrgId()

  const { data, error } = await supabaseAdmin
    .from('items')
    .select('*')
    .eq('org_id', orgId)  // Manual isolation

  return { data, error }
}
```

---

## 4. Index Strategy

### 4.1 Standard Indexes

Every table should have:

```sql
-- Primary key (automatic)
-- org_id index (for tenant queries)
CREATE INDEX idx_{table}_org_id ON {table}(org_id);

-- Foreign key indexes
CREATE INDEX idx_{table}_{fk}_id ON {table}({fk}_id);

-- Status/type columns
CREATE INDEX idx_{table}_status ON {table}(status);
```

### 4.2 Composite Indexes

```sql
-- Unique code per org
UNIQUE(org_id, code)

-- Date range queries
CREATE INDEX idx_boms_effective ON boms(org_id, product_id, effective_from, effective_to);

-- LP location tracking
CREATE INDEX idx_lps_location ON license_plates(org_id, warehouse_id, location_id, status);

-- WO status tracking
CREATE INDEX idx_wo_status ON work_orders(org_id, status, planned_start);
```

### 4.3 Full-Text Search Indexes

```sql
-- Product search
CREATE INDEX idx_products_search ON products
    USING gin(to_tsvector('english', code || ' ' || name || ' ' || COALESCE(description, '')));

-- Supplier search
CREATE INDEX idx_suppliers_search ON suppliers
    USING gin(to_tsvector('english', code || ' ' || name));
```

---

## 5. Constraints & Validations

### 5.1 Check Constraints

```sql
-- LP Status
ALTER TABLE license_plates ADD CONSTRAINT chk_lp_status
    CHECK (status IN ('available', 'reserved', 'consumed', 'blocked', 'shipped'));

-- LP QA Status
ALTER TABLE license_plates ADD CONSTRAINT chk_lp_qa_status
    CHECK (qa_status IN ('pending', 'passed', 'failed', 'quarantine'));

-- Product Type
ALTER TABLE products ADD CONSTRAINT chk_product_type
    CHECK (type IN ('RM', 'WIP', 'FG', 'PKG', 'BP', 'CUSTOM'));

-- Quantity non-negative
ALTER TABLE license_plates ADD CONSTRAINT chk_lp_quantity_positive
    CHECK (quantity >= 0);
```

### 5.2 Trigger Validations

```sql
-- BOM Date Overlap Prevention
CREATE OR REPLACE FUNCTION validate_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM boms
        WHERE org_id = NEW.org_id
        AND product_id = NEW.product_id
        AND id != COALESCE(NEW.id, uuid_nil())
        AND status = 'approved'
        AND (
            (NEW.effective_from BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'))
            OR (COALESCE(NEW.effective_to, '9999-12-31') BETWEEN effective_from AND COALESCE(effective_to, '9999-12-31'))
        )
    ) THEN
        RAISE EXCEPTION 'BOM date range overlaps with existing approved BOM';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bom_date_overlap
    BEFORE INSERT OR UPDATE ON boms
    FOR EACH ROW
    WHEN (NEW.status = 'approved')
    EXECUTE FUNCTION validate_bom_date_overlap();
```

---

## 6. Audit Trail Pattern

### 6.1 Standard Audit Columns

Every table should have:

```sql
CREATE TABLE example_table (
    -- ...columns...
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Auto-update updated_at
CREATE TRIGGER trg_example_table_updated_at
    BEFORE UPDATE ON example_table
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime(updated_at);
```

### 6.2 Detailed Audit Log

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_log_org_table ON audit_log(org_id, table_name, changed_at DESC);
```

---

## 7. Sequence Generation

### 7.1 Document Number Sequences

```sql
-- Sequence table per document type per org
CREATE TABLE document_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    document_type VARCHAR(20) NOT NULL, -- PO, GRN, WO, LP, etc.
    prefix VARCHAR(10),
    current_value INTEGER NOT NULL DEFAULT 0,
    year INTEGER NOT NULL,
    UNIQUE(org_id, document_type, year)
);

-- Function to get next number
CREATE OR REPLACE FUNCTION get_next_document_number(
    p_org_id UUID,
    p_document_type VARCHAR,
    p_prefix VARCHAR DEFAULT NULL
) RETURNS VARCHAR AS $$
DECLARE
    v_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    v_next_value INTEGER;
    v_prefix VARCHAR;
BEGIN
    -- Upsert sequence
    INSERT INTO document_sequences (org_id, document_type, prefix, current_value, year)
    VALUES (p_org_id, p_document_type, p_prefix, 1, v_year)
    ON CONFLICT (org_id, document_type, year)
    DO UPDATE SET current_value = document_sequences.current_value + 1
    RETURNING current_value, prefix INTO v_next_value, v_prefix;

    -- Format: PREFIX-YYYY-NNNN
    RETURN COALESCE(v_prefix, p_document_type) || '-' || v_year || '-' || LPAD(v_next_value::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Usage
SELECT get_next_document_number('org-uuid', 'PO', 'PO');  -- Returns: PO-2025-0001
SELECT get_next_document_number('org-uuid', 'LP', 'LP');  -- Returns: LP-2025-0001
```

---

## 8. Data Migration Patterns

### 8.1 Migration File Structure

```
supabase/migrations/
  001_initial_schema.sql
  002_settings_module.sql
  003_technical_module.sql
  004_planning_module.sql
  005_warehouse_module.sql
  006_production_module.sql
  007_quality_module.sql       # Phase 2
  008_shipping_module.sql      # Phase 2
  019_sync_org_id_to_jwt.sql   # JWT sync trigger
```

### 8.2 Migration Template

```sql
-- Migration: XXX_description.sql
-- Author: name
-- Date: YYYY-MM-DD

-- Up migration
BEGIN;

CREATE TABLE new_table (
    -- columns
);

ALTER TABLE existing_table ADD COLUMN new_column TYPE;

-- RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY new_table_isolation ON new_table ...;

-- Indexes
CREATE INDEX idx_new_table_... ON new_table(...);

COMMIT;

-- Down migration (comment out)
-- DROP TABLE new_table;
-- ALTER TABLE existing_table DROP COLUMN new_column;
```

---

## 9. Performance Considerations

### 9.1 Query Optimization

```sql
-- Always filter by org_id FIRST
EXPLAIN ANALYZE
SELECT * FROM products
WHERE org_id = 'xxx'  -- First filter
AND type = 'FG'       -- Then additional filters
ORDER BY name;

-- Use covering indexes for common queries
CREATE INDEX idx_products_list ON products(org_id, status, type, name);
```

### 9.2 Connection Pooling

```
Supabase Pooler: pgbouncer
Mode: transaction
Pool size: 100 connections
```

### 9.3 Large Table Partitioning (Future)

```sql
-- Partition by org_id for large tables (>1M rows)
CREATE TABLE stock_movements (
    -- columns
) PARTITION BY HASH (org_id);

CREATE TABLE stock_movements_p0 PARTITION OF stock_movements FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE stock_movements_p1 PARTITION OF stock_movements FOR VALUES WITH (MODULUS 4, REMAINDER 1);
-- etc.
```

---

## 10. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | Architect | Initial baseline schema documentation |
