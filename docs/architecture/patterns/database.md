# Database Architecture

## Overview

PostgreSQL database via Supabase with multi-tenant isolation, full audit trails, and industry-agnostic design.

## Multi-Tenancy Pattern

### Organization Isolation
Every business table includes `org_id` with RLS policy:

```sql
-- Standard RLS policy
CREATE POLICY "Tenant isolation" ON products
  FOR ALL
  USING (org_id = auth.jwt() ->> 'org_id');

-- UUID for org_id
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- settings...
);
```

### No Organization Hierarchy
- Flat structure (no parent_org_id)
- Each organization is independent
- Holding companies use separate orgs

## Audit Trail Pattern

### Standard Audit Columns
```sql
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- business fields...

  -- Audit columns
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Soft delete (per-table decision)
  deleted_at TIMESTAMPTZ,

  org_id UUID NOT NULL REFERENCES organizations(id)
);

-- Auto-update timestamp
CREATE TRIGGER update_timestamp
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Full Audit Log
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Queryable for reports
CREATE INDEX idx_audit_log_org_table ON audit_log(org_id, table_name, changed_at);
CREATE INDEX idx_audit_log_record ON audit_log(record_id, changed_at);
```

### Soft Delete Strategy
Per-table configuration based on business needs:

| Table | Soft Delete | Reason |
|-------|-------------|--------|
| work_orders | Yes | Historical reference |
| license_plates | Yes | Traceability |
| products | Yes | BOM references |
| boms | Yes | WO snapshots |
| po_header | Yes | Audit trail |
| stock_moves | No | Archive instead |
| notifications | No | Cleanup after read |

## Versioning Patterns

### Date-Based BOM Versioning
```sql
CREATE TABLE boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  version INTEGER NOT NULL,
  status bom_status NOT NULL DEFAULT 'draft',
  effective_from DATE NOT NULL,
  effective_to DATE, -- NULL = no end date

  UNIQUE (product_id, version),
  org_id UUID NOT NULL
);

-- Prevent overlapping dates
CREATE OR REPLACE FUNCTION check_bom_date_overlap()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM boms
    WHERE product_id = NEW.product_id
      AND id != NEW.id
      AND status = 'active'
      AND (
        (NEW.effective_from <= effective_to OR effective_to IS NULL)
        AND (NEW.effective_to >= effective_from OR NEW.effective_to IS NULL)
      )
  ) THEN
    RAISE EXCEPTION 'BOM date ranges cannot overlap';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Specification Versioning (Similar Pattern)
```sql
CREATE TABLE product_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  version INTEGER NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  -- spec attributes...
  org_id UUID NOT NULL
);
```

### Routing Versioning (Future Phase)
Same pattern, enabled when MES matures.

## Industry Abstraction

### Toggle-Based Features
All industry-specific features controlled via `org_settings`:

```sql
CREATE TABLE org_settings (
  org_id UUID PRIMARY KEY REFERENCES organizations(id),

  -- Industry features as toggles
  enable_allergens BOOLEAN DEFAULT true,          -- Food
  enable_hazmat BOOLEAN DEFAULT false,            -- Chemical
  enable_lot_tracking BOOLEAN DEFAULT true,       -- Pharma
  enable_serial_tracking BOOLEAN DEFAULT false,   -- Electronics
  enable_coa_requirement BOOLEAN DEFAULT true,    -- Quality cert
  enable_custom_compliance JSONB DEFAULT '{}',    -- Extensible

  -- Other settings...
);
```

### Compliance Attributes Table
```sql
CREATE TABLE compliance_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  attribute_type TEXT NOT NULL, -- 'allergen', 'hazmat', 'custom'
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  regulatory_body TEXT, -- 'FDA', 'EPA', 'custom'
  UNIQUE (org_id, attribute_type, code)
);

-- Link to products
CREATE TABLE product_compliance (
  product_id UUID REFERENCES products(id),
  attribute_id UUID REFERENCES compliance_attributes(id),
  PRIMARY KEY (product_id, attribute_id)
);
```

## Indexing Strategy

### High-Priority Indexes
```sql
-- Stock movements (most queried)
CREATE INDEX idx_stock_moves_org_date ON stock_moves(org_id, created_at DESC);
CREATE INDEX idx_stock_moves_from_loc ON stock_moves(from_location_id, created_at DESC);
CREATE INDEX idx_stock_moves_to_loc ON stock_moves(to_location_id, created_at DESC);

-- License plates
CREATE INDEX idx_lp_org_status ON license_plates(org_id, status);
CREATE INDEX idx_lp_product_expiry ON license_plates(product_id, expiry_date);
CREATE INDEX idx_lp_location ON license_plates(location_id);

-- Production
CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id, status);
CREATE INDEX idx_production_outputs_wo ON production_outputs(wo_id, created_at DESC);

-- Pallets
CREATE INDEX idx_pallet_items_pallet ON pallet_items(pallet_id);
```

### Partial Indexes
```sql
-- Only active items
CREATE INDEX idx_lp_active ON license_plates(org_id, product_id)
  WHERE status = 'available' AND deleted_at IS NULL;

-- Pending orders
CREATE INDEX idx_po_pending ON po_header(org_id, created_at)
  WHERE status IN ('draft', 'submitted', 'approved');
```

## Table Partitioning

### Time-Based Partitioning (Future)
For high-volume tables:

```sql
-- Stock moves partitioned by month
CREATE TABLE stock_moves (
  id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  -- other columns...
) PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE stock_moves_2025_01 PARTITION OF stock_moves
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

### Candidate Tables
- `stock_moves` - very high volume
- `audit_log` - continuous growth
- `production_outputs` - per-shift data

## Data Archival

### Archival Strategy
- Default retention: 12 months in live tables
- Configurable per tenant
- Archived data moved to archive schema

```sql
-- Archive schema
CREATE SCHEMA archive;

-- Archive table (same structure)
CREATE TABLE archive.stock_moves (LIKE public.stock_moves INCLUDING ALL);

-- Archival function
CREATE OR REPLACE FUNCTION archive_old_stock_moves(months INTEGER)
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH moved AS (
    DELETE FROM public.stock_moves
    WHERE created_at < now() - (months || ' months')::INTERVAL
    RETURNING *
  )
  INSERT INTO archive.stock_moves SELECT * FROM moved;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql;
```

### Archive Access
- Separate API endpoint for historical queries
- Combined views when needed
- Export to data warehouse (Phase 4)

## Enum Types

### Status Enums
```sql
CREATE TYPE bom_status AS ENUM ('draft', 'active', 'phased_out', 'inactive');
CREATE TYPE wo_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE po_status AS ENUM ('draft', 'submitted', 'approved', 'receiving', 'closed', 'cancelled');
CREATE TYPE lp_status AS ENUM ('available', 'reserved', 'consumed', 'quarantine', 'shipped');
```

### Adding Enum Values
```sql
-- Safe enum extension
ALTER TYPE wo_status ADD VALUE 'on_hold' AFTER 'in_progress';
```

## Foreign Key Strategy

### Cascade Deletes
Limited use - only for true child records:
- `bom_items` when `bom` deleted
- `po_line` when `po_header` deleted
- `wo_materials` when `work_order` deleted

### Soft Delete References
```sql
-- Use soft delete for referenced entities
ALTER TABLE work_orders
  ADD CONSTRAINT fk_wo_product
  FOREIGN KEY (product_id) REFERENCES products(id)
  ON DELETE RESTRICT; -- Prevent deletion if referenced
```

## Database Functions

### Common Functions
```sql
-- Generate sequence numbers
CREATE OR REPLACE FUNCTION next_wo_number(org UUID)
RETURNS TEXT AS $$
DECLARE
  seq INTEGER;
BEGIN
  UPDATE org_sequences
  SET wo_seq = wo_seq + 1
  WHERE org_id = org
  RETURNING wo_seq INTO seq;

  RETURN 'WO-' || to_char(now(), 'YYYYMM') || '-' || lpad(seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Validate BOM availability
CREATE OR REPLACE FUNCTION get_active_bom(p_product_id UUID, p_date DATE)
RETURNS UUID AS $$
SELECT id FROM boms
WHERE product_id = p_product_id
  AND status = 'active'
  AND effective_from <= p_date
  AND (effective_to IS NULL OR effective_to >= p_date)
ORDER BY effective_from DESC
LIMIT 1;
$$ LANGUAGE sql STABLE;
```

## Migration Strategy

### File Naming
```
001_initial_schema.sql
002_add_allergens.sql
003_bom_versioning.sql
...
```

### Migration Best Practices
1. Always backward compatible
2. Add columns as nullable first
3. Use transactions
4. Test rollback
5. Document in `docs/13_DATABASE_MIGRATIONS.md`

### Rollback Support
```sql
-- Up migration
ALTER TABLE products ADD COLUMN new_field TEXT;

-- Down migration (stored separately)
ALTER TABLE products DROP COLUMN new_field;
```

## Performance Considerations

### Query Optimization
- Always filter by `org_id` first
- Use covering indexes for common queries
- Avoid `SELECT *` in production code
- Paginate large result sets

### Connection Management
- Supabase PgBouncer for pooling
- Keep connections short
- Use prepared statements

### Monitoring Queries
```sql
-- Find slow queries
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY total_time DESC
LIMIT 20;
```
