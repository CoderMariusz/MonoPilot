# Work Order Database Schema Documentation

**Story**: 03.10
**Module**: Planning (03)
**Last Updated**: 2025-12-31

---

## Overview

The work order system uses four core tables to manage the complete lifecycle of manufacturing work orders, from creation through completion. This document describes the database schema, RLS policies, triggers, and indexing strategy.

---

## Core Tables

### 1. work_orders

Main table storing work order header information.

**Table Definition**

```sql
CREATE TABLE work_orders (
  -- Identifiers
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_number TEXT NOT NULL,

  -- References
  product_id UUID NOT NULL REFERENCES products(id),
  bom_id UUID REFERENCES boms(id),
  routing_id UUID REFERENCES routings(id),
  production_line_id UUID REFERENCES production_lines(id),
  machine_id UUID REFERENCES machines(id),

  -- Planning
  planned_quantity DECIMAL(12,3) NOT NULL,
  produced_quantity DECIMAL(12,3) DEFAULT 0,
  uom TEXT NOT NULL,
  planned_start_date DATE NOT NULL,
  planned_end_date DATE,
  scheduled_start_time TIME,
  scheduled_end_time TIME,
  expiry_date DATE,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'planned', 'released', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),

  -- Production tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,
  actual_qty DECIMAL(12,3),
  yield_percent NUMERIC(5,2),

  -- Metadata
  source_of_demand TEXT,
  source_reference TEXT,
  notes TEXT,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Constraints
  UNIQUE (org_id, wo_number),
  CONSTRAINT valid_dates CHECK (planned_start_date <= COALESCE(planned_end_date, planned_start_date))
);

CREATE INDEX idx_work_orders_org_id ON work_orders(org_id);
CREATE INDEX idx_work_orders_status ON work_orders(org_id, status);
CREATE INDEX idx_work_orders_product_id ON work_orders(org_id, product_id);
CREATE INDEX idx_work_orders_line_id ON work_orders(org_id, production_line_id);
CREATE INDEX idx_work_orders_planned_start ON work_orders(org_id, planned_start_date);
CREATE INDEX idx_work_orders_created_at ON work_orders(org_id, created_at DESC);
```

**Column Descriptions**

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| id | UUID | Yes | Primary key | 550e8400-e29b-41d4-a716-446655440000 |
| org_id | UUID | Yes | Organization (RLS filter) | 123e4567-e89b-12d3-a456-426614174000 |
| wo_number | TEXT | Yes | Unique WO identifier | WO-20241220-0001 |
| product_id | UUID | Yes | Finished good product | prod-uuid-123 |
| bom_id | UUID | No | Bill of Materials snapshot | bom-uuid-456 |
| routing_id | UUID | No | Routing snapshot | routing-uuid-789 |
| production_line_id | UUID | No | Production line assignment | line-uuid-001 |
| machine_id | UUID | No | Optional machine | mach-uuid-002 |
| planned_quantity | DECIMAL | Yes | Ordered quantity | 1000 |
| produced_quantity | DECIMAL | No | Actual produced | 950 |
| uom | TEXT | Yes | Unit of measure | pc, kg, jar |
| planned_start_date | DATE | Yes | Scheduled start | 2024-12-20 |
| planned_end_date | DATE | No | Scheduled end | 2024-12-21 |
| scheduled_start_time | TIME | No | Start time on date | 08:00 |
| scheduled_end_time | TIME | No | End time on date | 16:00 |
| status | TEXT | Yes | Current status | planned, released, in_progress |
| priority | TEXT | No | Priority level | high, normal |
| started_at | TIMESTAMPTZ | No | Actual start timestamp | 2024-12-19T08:00:00Z |
| completed_at | TIMESTAMPTZ | No | Completion timestamp | 2024-12-20T16:00:00Z |
| paused_at | TIMESTAMPTZ | No | When paused | 2024-12-19T12:00:00Z |
| pause_reason | TEXT | No | Reason for pause | Machine breakdown |
| actual_qty | DECIMAL | No | Final good quantity | 950 |
| yield_percent | NUMERIC | No | (actual_qty / planned_qty) * 100 | 95.0 |
| expiry_date | DATE | No | Expiry/shelf life | 2025-06-20 |
| source_of_demand | TEXT | No | Origin of demand | manual, customer_order, forecast |
| source_reference | TEXT | No | External reference | SO-12345 |
| notes | TEXT | No | Free-form notes | Customer specific instructions |
| created_at | TIMESTAMPTZ | Yes | Record creation | 2024-12-14T10:30:00Z |
| updated_at | TIMESTAMPTZ | Yes | Last update | 2024-12-19T14:10:00Z |
| created_by | UUID | Yes | User who created | user-uuid-001 |
| updated_by | UUID | No | User who last updated | user-uuid-002 |

---

### 2. wo_status_history

Audit trail of all status changes and transitions.

**Table Definition**

```sql
CREATE TABLE wo_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,

  CONSTRAINT valid_statuses CHECK (
    from_status IS NULL OR from_status IN ('draft', 'planned', 'released', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled')
  ),
  CONSTRAINT valid_to_status CHECK (
    to_status IN ('draft', 'planned', 'released', 'in_progress', 'on_hold', 'completed', 'closed', 'cancelled')
  )
);

CREATE INDEX idx_wo_status_history_wo_id ON wo_status_history(wo_id);
CREATE INDEX idx_wo_status_history_org_id ON wo_status_history(org_id);
CREATE INDEX idx_wo_status_history_changed_at ON wo_status_history(wo_id, changed_at ASC);
```

**Column Descriptions**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| org_id | UUID | Organization |
| wo_id | UUID | Work order reference |
| from_status | TEXT | Previous status (null for creation) |
| to_status | TEXT | New status |
| changed_by | UUID | User who made change |
| changed_at | TIMESTAMPTZ | Timestamp of change |
| notes | TEXT | Reason or notes about transition |

**Example Records**

```sql
-- Initial creation (no from_status)
INSERT INTO wo_status_history (wo_id, from_status, to_status, changed_by, notes)
VALUES ('wo-uuid-001', NULL, 'draft', 'user-1', NULL);

-- Status transition
INSERT INTO wo_status_history (wo_id, from_status, to_status, changed_by, notes)
VALUES ('wo-uuid-001', 'draft', 'planned', 'user-1', 'Scheduled for production');

-- Cancellation with reason
INSERT INTO wo_status_history (wo_id, from_status, to_status, changed_by, notes)
VALUES ('wo-uuid-001', 'planned', 'cancelled', 'user-2', 'Customer order cancelled');
```

---

### 3. wo_daily_sequence

Manages daily WO number sequence generation.

**Table Definition**

```sql
CREATE TABLE wo_daily_sequence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sequence_date DATE NOT NULL,
  next_sequence_number INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (org_id, sequence_date)
);

CREATE INDEX idx_wo_daily_sequence_org_date ON wo_daily_sequence(org_id, sequence_date);
```

**Purpose**

Generates unique daily WO numbers in format: `WO-YYYYMMDD-NNNN`

**Example**

```
Date: 2024-12-20
Org: org-uuid-123

Sequence Records:
- WO-20241220-0001
- WO-20241220-0002
- WO-20241220-0003 (next_sequence_number = 4)
```

---

## Related Tables

### wo_materials (Material Snapshot from BOM)

```sql
CREATE TABLE wo_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  bom_id UUID REFERENCES boms(id),
  product_id UUID NOT NULL REFERENCES products(id),

  sequence INTEGER NOT NULL,
  quantity DECIMAL(12,3) NOT NULL,
  uom TEXT NOT NULL,
  scrap_percent NUMERIC(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT FALSE,
  is_by_product BOOLEAN DEFAULT FALSE,
  yield_percent NUMERIC(5,2),

  -- Tracking
  consumed_qty DECIMAL(12,3) DEFAULT 0,
  reservation_status TEXT DEFAULT 'not_reserved'
    CHECK (reservation_status IN ('not_reserved', 'partially_reserved', 'fully_reserved')),
  reserved_qty DECIMAL(12,3) DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_materials_wo_id ON wo_materials(wo_id);
```

### wo_operations (Operations Snapshot from Routing)

```sql
CREATE TABLE wo_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  routing_id UUID REFERENCES routings(id),

  sequence INTEGER NOT NULL,
  operation_name TEXT NOT NULL,
  description TEXT,
  machine_id UUID REFERENCES machines(id),
  line_id UUID REFERENCES production_lines(id),

  expected_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  expected_yield_percent NUMERIC(5,2),

  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed')),

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  started_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_operations_wo_id ON wo_operations(wo_id);
```

---

## Row-Level Security (RLS) Policies

All work order tables enforce multi-tenancy via RLS policies.

### work_orders Policies

**SELECT Policy (Read)**

```sql
CREATE POLICY "Users can view work orders in their org"
  ON work_orders FOR SELECT
  USING (org_id = auth.jwt() ->> 'org_id'::text);
```

**INSERT Policy (Create)**

```sql
CREATE POLICY "Users can create work orders in their org"
  ON work_orders FOR INSERT
  WITH CHECK (org_id = auth.jwt() ->> 'org_id'::text);
```

**UPDATE Policy (Modify)**

```sql
CREATE POLICY "Users can update work orders in their org"
  ON work_orders FOR UPDATE
  USING (org_id = auth.jwt() ->> 'org_id'::text)
  WITH CHECK (org_id = auth.jwt() ->> 'org_id'::text);
```

**DELETE Policy (Remove)**

```sql
CREATE POLICY "Users can delete their org's work orders"
  ON work_orders FOR DELETE
  USING (org_id = auth.jwt() ->> 'org_id'::text);
```

---

## Database Functions

### 1. generate_wo_number()

Generates next sequential WO number for a date.

**Signature**

```sql
CREATE OR REPLACE FUNCTION generate_wo_number(
  p_org_id UUID,
  p_date DATE
) RETURNS TEXT AS $$
DECLARE
  v_year_month TEXT;
  v_next_seq INTEGER;
BEGIN
  v_year_month := TO_CHAR(p_date, 'YYYYMMDD');

  -- Increment sequence for date
  UPDATE wo_daily_sequence
  SET next_sequence_number = next_sequence_number + 1,
      updated_at = NOW()
  WHERE org_id = p_org_id AND sequence_date = p_date;

  -- If no record exists, create it
  IF NOT FOUND THEN
    INSERT INTO wo_daily_sequence (org_id, sequence_date, next_sequence_number)
    VALUES (p_org_id, p_date, 2);
    v_next_seq := 1;
  ELSE
    -- Get the new sequence number
    SELECT next_sequence_number - 1 INTO v_next_seq
    FROM wo_daily_sequence
    WHERE org_id = p_org_id AND sequence_date = p_date;
  END IF;

  RETURN 'WO-' || v_year_month || '-' || LPAD(v_next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

**Usage**

```sql
SELECT generate_wo_number('org-uuid-123', '2024-12-20');
-- Returns: 'WO-20241220-0001'
```

---

### 2. get_active_bom_for_date()

Auto-selects active BOM for product on a scheduled date.

**Signature**

```sql
CREATE OR REPLACE FUNCTION get_active_bom_for_date(
  p_product_id UUID,
  p_org_id UUID,
  p_scheduled_date DATE
) RETURNS TABLE (
  bom_id UUID,
  bom_code TEXT,
  bom_version INTEGER,
  output_qty DECIMAL,
  effective_from DATE,
  effective_to DATE,
  routing_id UUID,
  item_count INTEGER,
  is_current BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.code,
    b.version,
    b.output_qty,
    b.effective_from,
    b.effective_to,
    b.routing_id,
    (SELECT COUNT(*) FROM bom_items WHERE bom_id = b.id)::INTEGER,
    TRUE
  FROM boms b
  WHERE
    b.product_id = p_product_id
    AND b.org_id = p_org_id
    AND b.status = 'active'
    AND b.effective_from <= p_scheduled_date
    AND (b.effective_to IS NULL OR b.effective_to >= p_scheduled_date)
  ORDER BY b.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```

**Usage**

```sql
SELECT * FROM get_active_bom_for_date(
  'prod-uuid-123',
  'org-uuid-123',
  '2024-12-20'
);

-- Returns BOM v1.2 if active on that date
```

---

### 3. get_all_active_boms_for_product()

Returns all active BOMs for manual selection.

**Signature**

```sql
CREATE OR REPLACE FUNCTION get_all_active_boms_for_product(
  p_product_id UUID,
  p_org_id UUID
) RETURNS TABLE (
  bom_id UUID,
  bom_code TEXT,
  bom_version INTEGER,
  output_qty DECIMAL,
  effective_from DATE,
  effective_to DATE,
  routing_id UUID,
  item_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.code,
    b.version,
    b.output_qty,
    b.effective_from,
    b.effective_to,
    b.routing_id,
    (SELECT COUNT(*) FROM bom_items WHERE bom_id = b.id)::INTEGER
  FROM boms b
  WHERE
    b.product_id = p_product_id
    AND b.org_id = p_org_id
    AND b.status = 'active'
  ORDER BY b.version DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### 1. Update work_orders.updated_at on change

```sql
CREATE TRIGGER update_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Create status history record on status change

```sql
CREATE TRIGGER log_work_order_status_change
  AFTER UPDATE ON work_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_wo_status_change();
```

**Trigger Function**

```sql
CREATE OR REPLACE FUNCTION log_wo_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wo_status_history (org_id, wo_id, from_status, to_status, changed_by)
  VALUES (NEW.org_id, NEW.id, OLD.status, NEW.status, NEW.updated_by);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Indexing Strategy

**Primary Indexes**

```sql
-- Performance for list queries
CREATE INDEX idx_work_orders_org_status ON work_orders(org_id, status);
CREATE INDEX idx_work_orders_org_date ON work_orders(org_id, planned_start_date DESC);
CREATE INDEX idx_work_orders_org_product ON work_orders(org_id, product_id);
CREATE INDEX idx_work_orders_org_line ON work_orders(org_id, production_line_id);

-- Performance for detail queries
CREATE INDEX idx_work_orders_id_org ON work_orders(id, org_id);

-- Performance for history queries
CREATE INDEX idx_wo_status_history_wo ON wo_status_history(wo_id, changed_at DESC);

-- Performance for material queries
CREATE INDEX idx_wo_materials_wo ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_product ON wo_materials(product_id);

-- Performance for operation queries
CREATE INDEX idx_wo_operations_wo ON wo_operations(wo_id);
```

---

## Constraints & Validation

### Data Integrity

| Constraint | Rule | Enforcement |
|-----------|------|-------------|
| Unique WO Number | (org_id, wo_number) must be unique | UNIQUE constraint |
| Product Required | product_id cannot be NULL | NOT NULL + FK |
| Quantity > 0 | planned_quantity must be > 0 | Application validation |
| Status Enum | Only valid statuses allowed | CHECK constraint |
| Priority Enum | Only valid priorities allowed | CHECK constraint |
| Date Logic | start_date <= end_date | CHECK constraint |
| Org Isolation | All queries filtered by org_id | RLS policy |

### Status Transition Rules

**Valid Transitions**

```
draft     → planned, cancelled
planned   → released, draft, cancelled
released  → in_progress, cancelled
in_progress → on_hold, completed
on_hold   → in_progress, cancelled
completed → closed
closed    → (terminal)
cancelled → (terminal)
```

**Enforced In Application Layer** (not database)

---

## Data Integrity Examples

### Create Work Order with Auto-Selected BOM

```sql
-- 1. Get active BOM for product on date
SELECT * FROM get_active_bom_for_date('prod-123', 'org-123', '2024-12-20');

-- 2. Generate WO number
SELECT generate_wo_number('org-123', '2024-12-20');

-- 3. Insert work order
INSERT INTO work_orders (
  org_id, wo_number, product_id, bom_id, routing_id, planned_quantity,
  uom, planned_start_date, status, created_by
) VALUES (
  'org-123', 'WO-20241220-0001', 'prod-123', 'bom-456', 'routing-789',
  1000, 'pc', '2024-12-20', 'draft', 'user-001'
);

-- 4. Copy BOM items to wo_materials (application layer)
-- 5. Copy routing operations to wo_operations (application layer)
```

### Query Work Orders with Materials

```sql
SELECT
  w.id,
  w.wo_number,
  w.status,
  w.product_id,
  COUNT(m.id) as material_count,
  SUM(m.quantity) as total_material_qty
FROM work_orders w
LEFT JOIN wo_materials m ON w.id = m.wo_id
WHERE w.org_id = 'org-123'
  AND w.status = 'in_progress'
GROUP BY w.id
ORDER BY w.created_at DESC;
```

---

## Backup & Recovery

- **Backup Strategy**: Daily incremental snapshots
- **Recovery Point Objective**: 24 hours
- **Retention**: 30 days
- **Test Recovery**: Monthly test restores

---

## Performance Targets

| Query | Target | Notes |
|-------|--------|-------|
| List 1000 WOs | < 500ms | With filters and pagination |
| Get single WO detail | < 100ms | With all relations |
| Create WO | < 1s | Including BOM/routing copy |
| Update WO | < 500ms | Single field or multiple |
| Status transition | < 500ms | Creates history record |

---

## Migration History

### Migration 069: Create work_orders table
- Initial schema with all core columns
- RLS policies for multi-tenancy

### Migration 070: Create wo_status_history
- Audit trail for status changes

### Migration 071: Create wo_daily_sequence
- WO number generation support

### Migration 072: Create wo_materials
- BOM snapshot storage

### Migration 073: Create wo_operations
- Routing snapshot storage

### Migration 074: Add indexes and functions
- Performance optimization
- Database functions for auto-selection

---

## Related Documentation

- [Work Order API Reference](./API-WORK-ORDERS.md)
- [Work Order Components](./COMPONENTS-WORK-ORDERS.md)
- [Work Order Developer Guide](./DEV-GUIDE-WORK-ORDERS.md)
- [CLAUDE.md - Database Section](/.claude/CLAUDE.md)

---

**Last Reviewed**: 2025-12-31
**Version**: 1.0
**Status**: Complete
