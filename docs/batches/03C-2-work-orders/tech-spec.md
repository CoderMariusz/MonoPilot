# Batch 03C-2: Work Orders - Technical Specification

**Batch ID:** 03C-2
**Epic:** 3 - Planning Operations
**Stories:** 3.10-3.16
**Prerequisites:** Epic 2 (Products, BOMs, Routings)

---

## Overview

Work Order management with auto-generated WO numbers, BOM auto-selection, material snapshot creation, routing operations copy, configurable statuses, and demand source tracking.

---

## Database Schema

### Table: work_orders

```sql
CREATE TABLE work_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_number VARCHAR(20) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id),
  bom_id UUID REFERENCES boms(id),
  quantity NUMERIC(15,3) NOT NULL CHECK (quantity > 0),
  scheduled_date DATE NOT NULL,
  actual_start_date DATE,
  actual_finish_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  source_type VARCHAR(50),
  source_reference VARCHAR(100),
  source_id UUID,
  line_id UUID REFERENCES production_lines(id),
  machine_id UUID REFERENCES machines(id),
  priority VARCHAR(20) DEFAULT 'medium',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_work_orders_wo_number ON work_orders(org_id, wo_number);
CREATE INDEX idx_work_orders_source ON work_orders(org_id, source_type);
CREATE INDEX idx_work_orders_status ON work_orders(org_id, status);
CREATE INDEX idx_work_orders_scheduled ON work_orders(org_id, scheduled_date);
```

### Table: wo_materials (Story 3.12)

```sql
CREATE TABLE wo_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  bom_item_id UUID REFERENCES bom_items(id),
  quantity NUMERIC(15,3) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  scrap_percent NUMERIC(5,2) DEFAULT 0,
  consume_whole_lp BOOLEAN DEFAULT false,
  is_by_product BOOLEAN DEFAULT false,
  yield_percent NUMERIC(5,2) DEFAULT 100,
  condition_flags JSONB,
  consumed_qty NUMERIC(15,3) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_materials_wo_id ON wo_materials(wo_id);
CREATE INDEX idx_wo_materials_product ON wo_materials(product_id);

-- RLS Policies
ALTER TABLE wo_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON wo_materials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON wo_materials FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON wo_materials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

### Table: wo_operations (Story 3.14)

```sql
CREATE TABLE wo_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  wo_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  routing_operation_id UUID REFERENCES routing_operations(id),
  sequence INTEGER NOT NULL,
  operation_name VARCHAR(100) NOT NULL,
  machine_id UUID REFERENCES machines(id),
  line_id UUID REFERENCES production_lines(id),
  expected_duration_minutes INTEGER,
  expected_yield_percent NUMERIC(5,2) DEFAULT 100,
  status VARCHAR(50) DEFAULT 'not_started',
  actual_start_time TIMESTAMPTZ,
  actual_end_time TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  operator_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wo_operations_wo_id ON wo_operations(wo_id);
CREATE UNIQUE INDEX idx_wo_operations_sequence ON wo_operations(wo_id, sequence);

-- RLS Policies
ALTER TABLE wo_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON wo_operations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON wo_operations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON wo_operations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
```

### Planning Settings Extensions

```sql
-- Add WO-specific settings to planning_settings table
ALTER TABLE planning_settings ADD COLUMN IF NOT EXISTS wo_statuses JSONB DEFAULT '[
  {"code": "draft", "label": "Draft", "color": "gray", "is_default": true, "sequence": 1},
  {"code": "planned", "label": "Planned", "color": "blue", "is_default": false, "sequence": 2},
  {"code": "released", "label": "Released", "color": "green", "is_default": false, "sequence": 3},
  {"code": "in_progress", "label": "In Progress", "color": "yellow", "is_default": false, "sequence": 4},
  {"code": "completed", "label": "Completed", "color": "purple", "is_default": false, "sequence": 5},
  {"code": "closed", "label": "Closed", "color": "gray", "is_default": false, "sequence": 6}
]';

ALTER TABLE planning_settings ADD COLUMN IF NOT EXISTS wo_default_status VARCHAR(50) DEFAULT 'draft';
ALTER TABLE planning_settings ADD COLUMN IF NOT EXISTS wo_status_expiry_days INTEGER;
ALTER TABLE planning_settings ADD COLUMN IF NOT EXISTS wo_material_check BOOLEAN DEFAULT true;
ALTER TABLE planning_settings ADD COLUMN IF NOT EXISTS wo_copy_routing BOOLEAN DEFAULT true;
ALTER TABLE planning_settings ADD COLUMN IF NOT EXISTS wo_source_of_demand BOOLEAN DEFAULT false;
```

---

## WO Number Format

`WO-YYYYMMDD-NNNN` (e.g., WO-20251126-0001)
- Sequential per org per day
- Resets daily

---

## API Endpoints

| Method | Endpoint | Description | Story |
|--------|----------|-------------|-------|
| GET | `/api/planning/work-orders` | List WOs | 3.10 |
| POST | `/api/planning/work-orders` | Create WO | 3.10 |
| GET | `/api/planning/work-orders/:id` | Get WO | 3.10 |
| PUT | `/api/planning/work-orders/:id` | Update WO | 3.10 |
| DELETE | `/api/planning/work-orders/:id` | Delete WO | 3.10 |
| PUT | `/api/planning/work-orders/:id/status` | Change status | 3.10 |
| GET | `/api/planning/products/:id/active-bom` | Get active BOM for date | 3.11 |
| GET | `/api/planning/work-orders/:id/materials` | Get WO materials | 3.12 |
| POST | `/api/planning/work-orders/availability-check` | Check material availability | 3.13 |
| GET | `/api/planning/work-orders/:id/operations` | Get WO operations | 3.14 |
| GET | `/api/planning/settings` | Get planning settings | 3.15 |
| PUT | `/api/planning/settings` | Update planning settings | 3.15 |

---

## Stories

| Story | Title | Points | Effort |
|-------|-------|--------|--------|
| 3.10 | WO CRUD | 5 | 4-6h |
| 3.11 | BOM Auto-Selection for WO | 5 | 4-6h |
| 3.12 | WO Materials Snapshot | 8 | 6-8h |
| 3.13 | Material Availability Check | 5 | 4-6h |
| 3.14 | Routing Copy to WO | 5 | 4-6h |
| 3.15 | Configurable WO Statuses | 3 | 3-4h |
| 3.16 | WO Source of Demand | 3 | 2-3h |

**Total:** 34 points (~30-40 hours)

---

## Dependencies

### Requires
- Epic 1: Organizations, Users, Settings
- Epic 2: Products, BOMs, Routings
- Story 2.6: BOM CRUD (for BOM auto-selection)
- Story 2.15: Routings (for routing copy)

### Blocks
- Epic 4: Production (operation execution, material consumption)
- Epic 5: LP management (for material availability check)

---

## Key Technical Decisions

1. **BOM Snapshot Immutability**: wo_materials are copied from BOM at WO creation and never updated from BOM changes (Gap 3 resolution)

2. **Quantity Scaling**: `wo_material.qty = bom_item.qty × (wo.qty / bom.output_qty)`

3. **Material Lock on Release**: wo_materials cannot be modified after WO status = 'Released'

4. **Operation Status Flow**: not_started → in_progress → completed → closed

5. **Source Tracking**: Optional demand source tracking for MRP purposes
