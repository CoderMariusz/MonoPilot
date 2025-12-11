# Batch 02A-2: BOM & Routing Restructure

**Status:** 📋 PLANNED
**Priority:** P0 - Breaking change, required before Epic 4 WO
**Estimated Stories:** 6
**Dependencies:** 01B (Production Lines), 02A-1 (Products)

---

## Overview

Restructuryzacja systemu BOM i Routing:
1. **Routing** - usunięcie powiązania z produktem, dodanie labor_cost
2. **BOM Items** - dodanie `operation_seq`, `is_output`, `sequence`
3. **BOM Production Lines** - multi-line support
4. **Packaging** - units_per_box, boxes_per_pallet

## Breaking Changes

- DROP existing `routings`, `routing_operations`, `boms`, `bom_items` tables
- Recreate with new structure
- Existing data will be lost (acceptable for dev environment)

---

## Database Schema

### Routings (new structure)

```sql
DROP TABLE IF EXISTS routing_operations CASCADE;
DROP TABLE IF EXISTS routings CASCADE;

CREATE TABLE routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

CREATE TABLE routing_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  machine_id UUID REFERENCES machines(id),
  estimated_duration_minutes INTEGER,
  labor_cost_per_hour DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(routing_id, sequence)
);

CREATE INDEX idx_routings_org ON routings(org_id);
CREATE INDEX idx_routing_operations_routing ON routing_operations(routing_id);
```

### BOMs (new structure)

```sql
DROP TABLE IF EXISTS bom_items CASCADE;
DROP TABLE IF EXISTS bom_production_lines CASCADE;
DROP TABLE IF EXISTS boms CASCADE;

CREATE TABLE boms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  product_id UUID NOT NULL REFERENCES products(id),
  routing_id UUID REFERENCES routings(id),
  version INTEGER NOT NULL DEFAULT 1,
  name TEXT,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  batch_size DECIMAL(15,4) NOT NULL DEFAULT 1,
  batch_uom TEXT NOT NULL DEFAULT 'kg',
  units_per_box INTEGER,
  boxes_per_pallet INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  UNIQUE(org_id, product_id, version)
);

CREATE TABLE bom_production_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  line_id UUID NOT NULL REFERENCES production_lines(id),
  labor_cost_per_hour DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(bom_id, line_id)
);

CREATE TABLE bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
  component_id UUID NOT NULL REFERENCES products(id),
  operation_seq INTEGER NOT NULL DEFAULT 1,
  is_output BOOLEAN DEFAULT false,
  quantity DECIMAL(15,4) NOT NULL,
  uom TEXT NOT NULL,
  scrap_percent DECIMAL(5,2) DEFAULT 0,
  sequence INTEGER DEFAULT 1,
  line_ids UUID[],
  consume_whole_lp BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_boms_product ON boms(product_id);
CREATE INDEX idx_boms_routing ON boms(routing_id);
CREATE INDEX idx_bom_items_bom ON bom_items(bom_id);
CREATE INDEX idx_bom_items_component ON bom_items(component_id);
CREATE INDEX idx_bom_items_operation ON bom_items(bom_id, operation_seq);
CREATE INDEX idx_bom_items_line_ids ON bom_items USING GIN(line_ids);
CREATE INDEX idx_bom_production_lines_bom ON bom_production_lines(bom_id);
CREATE INDEX idx_bom_production_lines_line ON bom_production_lines(line_id);
```

### RLS Policies

```sql
-- Routings
ALTER TABLE routings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON routings FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON routing_operations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- BOMs
ALTER TABLE boms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON boms FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE bom_production_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON bom_production_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE bom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated" ON bom_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## Stories

| ID | Title | SP | Priority |
|----|-------|-----|----------|
| 2.24 | Routing Restructure | 3 | P0 |
| 2.25 | BOM Production Lines | 3 | P0 |
| 2.26 | BOM Items with Operation Assignment | 5 | P0 |
| 2.27 | BOM Item Alternatives | 2 | P1 |
| 2.28 | BOM Packaging Fields | 1 | P2 |
| 2.29 | Update existing BOM/Routing UI | 5 | P0 |

**Total:** 19 SP

---

## API Changes

### Routings

```
GET    /api/technical/routings
POST   /api/technical/routings
GET    /api/technical/routings/:id
PUT    /api/technical/routings/:id
DELETE /api/technical/routings/:id

GET    /api/technical/routings/:id/operations
POST   /api/technical/routings/:id/operations
PUT    /api/technical/routings/:id/operations/:opId
DELETE /api/technical/routings/:id/operations/:opId
```

### BOMs

```
GET    /api/technical/boms
POST   /api/technical/boms
GET    /api/technical/boms/:id
PUT    /api/technical/boms/:id
DELETE /api/technical/boms/:id

GET    /api/technical/boms/:id/lines
PUT    /api/technical/boms/:id/lines

GET    /api/technical/boms/:id/items
POST   /api/technical/boms/:id/items
PUT    /api/technical/boms/:id/items/:itemId
DELETE /api/technical/boms/:id/items/:itemId
```

---

## Frontend Changes

1. **RoutingForm** - usunąć product selector, dodać labor_cost per operation
2. **BOMForm** - dodać routing selector, production lines multi-select, packaging fields
3. **BOMItemModal** - dodać operation_seq dropdown, is_output checkbox, sequence, line_ids
4. **BOMItemsTable** - grupowanie items per operation, pokazywanie outputs
