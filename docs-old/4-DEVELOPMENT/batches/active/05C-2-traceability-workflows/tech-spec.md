# Batch 5C-2: Traceability & Workflows - Technical Specification

**Batch:** 5C-2 (Traceability & Workflows)
**Stories:** 5.28-5.35
**Status:** Solutioning

---

## Overview

This batch covers traceability features and warehouse workflows:
- **Forward/Backward Traceability**: Trace LP genealogy upstream/downstream
- **Genealogy Recording**: Record all LP relationships (split, merge, consume, produce)
- **Source Document Linking**: Link LPs to originating documents (PO, GRN, WO, TO)
- **Warehouse Settings**: Configure warehouse module parameters
- **Desktop Receive Workflows**: Receive from PO/TO using desktop UI
- **Scanner Receive Workflow**: Guided scanner workflow for receiving
- **Inventory Count**: Physical inventory verification with variance detection

**Key Concept:** All LP operations maintain **complete traceability** for FDA compliance and business intelligence.

---

## Database Schema

### lp_genealogy Table (Extension from Epic 2)

```sql
-- Already exists from Epic 2, verify these columns:
CREATE TABLE IF NOT EXISTS lp_genealogy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  parent_lp_id UUID REFERENCES license_plates(id),
  child_lp_id UUID REFERENCES license_plates(id),
  operation_type VARCHAR(20) NOT NULL,
    -- Enum: 'split', 'merge', 'consume', 'produce'
  wo_id UUID REFERENCES work_orders(id),
  to_id UUID REFERENCES transfer_orders(id),
  quantity DECIMAL(15,4),
  uom VARCHAR(10),
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),

  INDEX(org_id),
  INDEX(parent_lp_id),
  INDEX(child_lp_id),
  INDEX(operation_type),
  INDEX(wo_id),
  UNIQUE(org_id, parent_lp_id, child_lp_id)
);

ALTER TABLE lp_genealogy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users"
  ON lp_genealogy FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### warehouse_settings Table

```sql
CREATE TABLE IF NOT EXISTS warehouse_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  warehouse_id UUID REFERENCES warehouses(id),

  -- LP Configuration
  lp_number_format VARCHAR(50) DEFAULT 'LP-{WH}-YYYYMMDD-NNNN',
  auto_print_labels BOOLEAN DEFAULT false,
  allow_over_receipt BOOLEAN DEFAULT false,
  over_receipt_tolerance_pct DECIMAL(5,2) DEFAULT 5.00,

  -- Scanner Configuration
  scanner_session_timeout_mins INT DEFAULT 5,
  scanner_warning_timeout_secs INT DEFAULT 30,
  max_offline_operations INT DEFAULT 100,
  offline_warning_threshold_pct INT DEFAULT 80,

  -- Barcode Configuration
  barcode_format_lp VARCHAR(20) DEFAULT 'EAN128',
  barcode_format_product VARCHAR(20) DEFAULT 'EAN128',
  barcode_format_location VARCHAR(20) DEFAULT 'CODE128',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),

  INDEX(org_id),
  INDEX(warehouse_id)
);

ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users"
  ON warehouse_settings FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### inventory_counts Table

```sql
CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  count_number VARCHAR(50) NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  status VARCHAR(20) DEFAULT 'pending',
    -- Enum: 'pending', 'in_progress', 'completed', 'verified'

  -- Count Results
  expected_lps INT DEFAULT 0,
  scanned_lps INT DEFAULT 0,
  found_lps INT DEFAULT 0,
  missing_lps INT DEFAULT 0,
  variance_pct DECIMAL(5,2),

  initiated_by_user_id UUID NOT NULL REFERENCES users(id),
  completed_by_user_id UUID REFERENCES users(id),
  initiated_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,

  UNIQUE(org_id, count_number),
  INDEX(org_id),
  INDEX(location_id),
  INDEX(status),
  INDEX(initiated_at)
);

ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated users"
  ON inventory_counts FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### inventory_count_items Table

```sql
CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id),
  lp_id UUID NOT NULL REFERENCES license_plates(id),
  expected BOOLEAN DEFAULT true,
    -- true = expected to be here, false = unexpected found
  scanned_at TIMESTAMP,
  variance TEXT,
    -- e.g., "missing", "found", "qty_mismatch"

  INDEX(count_id),
  INDEX(lp_id)
);
```

### Extend license_plates Table

```sql
-- Add source tracking columns
ALTER TABLE license_plates ADD COLUMN IF NOT EXISTS
  source_type VARCHAR(20),
    -- Enum: 'receiving', 'production', 'transfer', 'manual'
  source_grn_id UUID REFERENCES grn(id),
  source_wo_id UUID REFERENCES work_orders(id),
  source_to_id UUID REFERENCES transfer_orders(id),
  source_po_id UUID REFERENCES purchase_orders(id);

CREATE INDEX idx_license_plates_source_grn_id ON license_plates(source_grn_id);
CREATE INDEX idx_license_plates_source_wo_id ON license_plates(source_wo_id);
```

---

## API Endpoints

### GET /api/warehouse/license-plates/:id/trace/forward

**Purpose:** Retrieve all downstream LPs (children, grandchildren, etc.)

**Response:**
```json
{
  "lp_id": "uuid",
  "trace": [
    {
      "lp_id": "uuid",
      "lp_number": "LP-20250120-0001",
      "operation_type": "split",
      "created_at": "2025-01-20T10:00:00Z",
      "depth": 1,
      "children": []
    }
  ]
}
```

### GET /api/warehouse/license-plates/:id/trace/backward

**Purpose:** Retrieve all upstream LPs (parents, grandparents, etc.)

**Response:**
```json
{
  "lp_id": "uuid",
  "trace": [
    {
      "lp_id": "uuid",
      "lp_number": "LP-20250120-0000",
      "operation_type": "split",
      "created_at": "2025-01-20T09:00:00Z",
      "depth": 1,
      "parents": []
    }
  ]
}
```

### POST /api/warehouse/receiving/from-po

**Purpose:** Desktop receiving from Purchase Order

**Request:**
```json
{
  "po_id": "uuid",
  "items": [
    {
      "po_line_id": "uuid",
      "qty_received": 100,
      "batch_number": "BATCH-001",
      "expiry_date": "2025-02-15",
      "location_id": "uuid"
    }
  ]
}
```

**Response:** Creates GRN + LPs

### POST /api/warehouse/receiving/from-to

**Purpose:** Desktop receiving from Transfer Order

**Request:**
```json
{
  "to_id": "uuid",
  "location_id": "uuid"
}
```

**Response:** Updates LP locations, marks TO as received

### POST /api/warehouse/settings

**Purpose:** Update warehouse settings (Admin only)

**Request:**
```json
{
  "lp_number_format": "LP-{WH}-YYYYMMDD-NNNN",
  "auto_print_labels": true,
  "scanner_session_timeout_mins": 5
}
```

### POST /api/warehouse/inventory-counts

**Purpose:** Initiate inventory count

**Request:**
```json
{
  "location_id": "uuid"
}
```

**Response:**
```json
{
  "count_id": "uuid",
  "location_id": "uuid",
  "expected_lps": 45,
  "status": "pending"
}
```

### POST /api/warehouse/inventory-counts/:id/scan

**Purpose:** Scan LP during inventory count

**Request:**
```json
{
  "lp_id": "uuid"
}
```

### POST /api/warehouse/inventory-counts/:id/complete

**Purpose:** Complete count and generate variance report

**Response:**
```json
{
  "count_id": "uuid",
  "status": "completed",
  "missing_lps": 2,
  "found_lps": 1,
  "variance_pct": 6.67
}
```

---

## Frontend Routes

- **GET** `/warehouse/traceability/:lp_id` - View LP genealogy tree
- **GET** `/warehouse/receiving` - Desktop receiving workspace
- **GET** `/warehouse/inventory-count` - Initiate/manage inventory counts
- **GET** `/settings/warehouse` - Warehouse settings (Admin)

---

## Services & Utilities

### TraceabilityService

**Methods:**
- `getForwardTrace(lp_id)` - Recursive query to get all children
- `getBackwardTrace(lp_id)` - Recursive query to get all parents
- `validateGenealogy(parent_id, child_id)` - Detect circular dependencies
- `recordGenealogy(parent_id, child_id, operation_type, wo_id)` - Create genealogy record

**Implementation:** Use PostgreSQL recursive CTEs:
```sql
WITH RECURSIVE descendants AS (
  SELECT child_lp_id, operation_type, wo_id, 1 AS depth
  FROM lp_genealogy WHERE parent_lp_id = $1
  UNION ALL
  SELECT g.child_lp_id, g.operation_type, g.wo_id, d.depth + 1
  FROM lp_genealogy g
  JOIN descendants d ON g.parent_lp_id = d.child_lp_id
  WHERE d.depth < 10
)
SELECT DISTINCT child_lp_id FROM descendants;
```

### ReceivingService

**Methods:**
- `receiveFromPO(po_id, items)` - Create GRN + LPs from PO
- `receiveFromTO(to_id, location_id)` - Update LP locations from TO

### InventoryCountService

**Methods:**
- `initiateCount(location_id)` - Start inventory count
- `scanLP(count_id, lp_id)` - Register LP scan
- `completeCount(count_id)` - Calculate variance report

---

## Dependencies

### Required Tables (Already Exist)
- `organizations`, `users`, `locations`, `warehouses`
- `license_plates` (Epic 5A-1)
- `lp_genealogy` (Epic 5A-2)
- `grn`, `grn_items` (Epic 5A-3)
- `purchase_orders`, `po_lines` (Epic 3)
- `transfer_orders` (Epic 3)
- `work_orders` (Epic 4)

### Depends On Stories
- Story 5.1: LP Creation
- Story 5.5: LP Split (genealogy source)
- Story 5.6: LP Merge (genealogy source)
- Story 5.7: LP Genealogy (foundation for traceability)
- Story 5.11: GRN Creation (for desktop receiving)

### Blocks Stories
- Story 5.36: Scanner Offline Queue (uses receiving workflow from 5.32/5.34)

---

## RLS Policies

All tables follow standard pattern:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
  ON table_name FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable insert for authenticated users"
  ON table_name FOR INSERT
  TO authenticated
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable update for authenticated users"
  ON table_name FOR UPDATE
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable delete for authenticated users"
  ON table_name FOR DELETE
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

---

## Components to Create

### Frontend
- `components/warehouse/TraceabilityViewer.tsx` - Display genealogy tree
- `components/warehouse/ReceivingForm.tsx` - Desktop receiving UI
- `components/warehouse/InventoryCountUI.tsx` - Count management UI
- `components/settings/WarehouseSettings.tsx` - Settings form

### Hooks
- `useTraceability(lp_id)` - Load forward/backward traces
- `useInventoryCount(location_id)` - Count state management
- `useWarehouseSettings()` - Load/update settings

---

## Testing Strategy

### Unit Tests
- Trace algorithms (forward/backward recursion)
- Genealogy validation (circular dependency detection)
- Receiving calculations (qty, variance)
- Count algorithms (variance %)

### Integration Tests
- GRN + LP creation via receiving endpoint
- Genealogy recording during split/merge
- Inventory count workflow (initiate → scan → complete)

### E2E Tests
- Full receiving workflow (PO → GRN → LPs)
- Genealogy traceability (split LP → trace forward → verify children)
- Inventory count (location → scan items → variance report)

---

## Effort Estimate

| Story | Points | Hours |
|-------|--------|-------|
| 5.28  | 8      | 8-10  |
| 5.29  | 5      | 5-6   |
| 5.30  | 5      | 5-6   |
| 5.31  | 5      | 5-6   |
| 5.32  | 8      | 8-10  |
| 5.33  | 5      | 5-6   |
| 5.34  | 8      | 8-10  |
| 5.35  | 8      | 8-10  |
| **TOTAL** | **52** | **50-64** |

---
