# Batch 5A-1: License Plate Core - Technical Specification

**Batch:** 5A-1 (MVP Foundation)
**Stories:** 5.1-5.4
**Duration:** 3-4 days
**Effort:** 28-35 hours

---

## Overview

Batch 5A-1 implements the **foundational License Plate (LP) system** for atomic inventory tracking:

- **LP Extension**: Extend existing STUB table with full functionality
- **Status Lifecycle**: Available → Reserved/Consumed/Quarantine/Merged → Shipped
- **Batch & Expiry Tracking**: FIFO/FEFO support with date filtering
- **Number Generation**: Configurable auto-numbering format per warehouse (LP-{WH}-YYYYMMDD-NNNN)

---

## Architecture

### Database Schema

#### EXISTING `license_plates` Table (STUB from Epic 2)

Current columns in database:
- `id`, `org_id`, `lp_number`, `batch_number` (nullable), `product_id`, `quantity`, `uom`
- `status` CHECK: 'available', 'consumed', 'shipped', 'quarantine', 'recalled'
- `location_id`, `manufacturing_date`, `expiry_date`, `received_date`
- `created_by`, `created_at`, `updated_at`

#### Migration: Extend `license_plates`

```sql
-- Add missing columns
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS supplier_batch_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS qa_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id);

-- Update status CHECK to include 'reserved' and 'merged'
ALTER TABLE license_plates DROP CONSTRAINT IF EXISTS license_plates_status_check;
ALTER TABLE license_plates ADD CONSTRAINT license_plates_status_check
  CHECK (status IN ('available', 'reserved', 'consumed', 'shipped', 'quarantine', 'recalled', 'merged'));

-- Add qa_status CHECK
ALTER TABLE license_plates ADD CONSTRAINT license_plates_qa_status_check
  CHECK (qa_status IN ('pending', 'passed', 'failed', 'on_hold'));

-- Rename column for consistency (optional, check app code first)
-- ALTER TABLE license_plates RENAME COLUMN manufacturing_date TO manufacture_date;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_license_plates_org_status ON license_plates(org_id, status);
CREATE INDEX IF NOT EXISTS idx_license_plates_org_product ON license_plates(org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_license_plates_expiry ON license_plates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_license_plates_warehouse ON license_plates(warehouse_id);
```

#### NEW: `warehouse_settings` Table (1:1 with warehouses)

```sql
CREATE TABLE warehouse_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL UNIQUE REFERENCES warehouses(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id),

  -- LP Number Generation
  lp_number_format VARCHAR(100) DEFAULT 'LP-{WH}-YYYYMMDD-NNNN',

  -- Receiving Settings
  allow_over_receipt BOOLEAN DEFAULT false,
  over_receipt_tolerance_percent DECIMAL(5,2) DEFAULT 0,

  -- Label Printing
  printer_ip VARCHAR(50),
  auto_print_on_receive BOOLEAN DEFAULT false,
  copies_per_label INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE warehouse_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users"
  ON warehouse_settings FOR ALL TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

#### NEW: `lp_number_sequence` Table (per org + warehouse)

```sql
CREATE TABLE lp_number_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  sequence_date DATE NOT NULL,
  next_sequence INTEGER DEFAULT 1,

  UNIQUE(org_id, warehouse_id, sequence_date)
);

-- RLS
ALTER TABLE lp_number_sequence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for authenticated users"
  ON lp_number_sequence FOR ALL TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

### API Endpoints

| Operation | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| List LPs | `/api/warehouse/license-plates` | GET | Fetch all LPs with filters (status, product, location, batch) |
| Get LP | `/api/warehouse/license-plates/:id` | GET | Fetch single LP detail |
| Create LP | `/api/warehouse/license-plates` | POST | Create new LP (auto-generate lp_number) |
| Update Status | `/api/warehouse/license-plates/:id/status` | PATCH | Change LP status (available → reserved → consumed) |
| Get Settings | `/api/warehouse/settings` | GET | Fetch LP numbering format |

### Frontend Routes

- `/warehouse/license-plates` - List all LPs
- `/warehouse/license-plates/:id` - LP detail page
- `/settings/warehouse` - Settings (LP format)

---

## Dependencies

### Required from Previous Epics
- ✅ **Epic 1**: Organizations, Users, Warehouses, Locations
- ✅ **Epic 2**: Products table with UoM
- ⚠️ **STUB exists**: `license_plates` table (Epic 2) - will be EXTENDED

### Internal Dependencies
- **Story 5.1** → Base entity (blocks all)
- **Story 5.2** → Depends on 5.1
- **Story 5.3** → Depends on 5.1
- **Story 5.4** → Depends on 5.1

### External Blockers
- **Batch 5A-1** → Blocks **Batch 5A-2** (split/merge), **Batch 5A-3** (receiving), **Batch 5B** (movements)

---

## Story Breakdown

| Story | Title | Points | Hours | Focus |
|-------|-------|--------|-------|-------|
| 5.1 | LP Creation | 8 | 8-10 | CRUD operations, auto-number |
| 5.2 | LP Status Tracking | 5 | 5-6 | Status lifecycle, transitions |
| 5.3 | Batch/Expiry Tracking | 5 | 5-6 | Batch number, FEFO sorting, expiry |
| 5.4 | LP Number Generation | 5 | 5-8 | Auto-format generation, daily reset |
| **Total** | | **23** | **28-35** | |

---

## RLS Policies

All tables protected by `org_id` isolation:

```sql
-- Example for license_plates
CREATE POLICY "Enable read for authenticated users"
  ON license_plates FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "Enable insert for authenticated users"
  ON license_plates FOR INSERT
  TO authenticated
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Similar for UPDATE, DELETE
```

---

## References

- **Batch Stories**: See `./stories/` folder (5.1-5.4 individual files)
- **Context XMLs**: See `./stories/context/` (5.1.context.xml, etc.)
- **Epic 5 Index**: [../index.md](../index.md)
