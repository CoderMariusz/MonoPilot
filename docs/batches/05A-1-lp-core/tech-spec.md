# Batch 5A-1: License Plate Core - Technical Specification

**Batch:** 5A-1 (MVP Foundation)
**Stories:** 5.1-5.4
**Duration:** 3-4 days
**Effort:** 28-35 hours

---

## Overview

Batch 5A-1 implements the **foundational License Plate (LP) system** for atomic inventory tracking:

- **LP Creation**: CRUD operations with auto-generated unique numbers
- **Status Lifecycle**: Available → Reserved/Consumed/Quarantine → Shipped
- **Batch & Expiry Tracking**: FIFO/FEFO support with date filtering
- **Number Generation**: Configurable auto-numbering format (LP-YYYYMMDD-NNNN)

---

## Architecture

### Database Schema

```sql
-- Main LP table
CREATE TABLE license_plates (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_number VARCHAR(50) NOT NULL UNIQUE,
  product_id UUID NOT NULL REFERENCES products(id),
  batch_number VARCHAR(50) NOT NULL,
  supplier_batch_number VARCHAR(50),
  quantity DECIMAL(15, 4) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  manufacture_date DATE,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'available',
  location_id UUID REFERENCES locations(id),
  grn_id UUID REFERENCES grns(id),
  qa_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by_user_id UUID REFERENCES users(id),
  UNIQUE(org_id, lp_number),
  INDEX(org_id, status),
  INDEX(org_id, product_id),
  INDEX(expiry_date)
);

-- LP numbering sequence (daily reset)
CREATE TABLE lp_number_sequence (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE,
  sequence_date DATE NOT NULL,
  next_sequence INT DEFAULT 1,
  UNIQUE(org_id, sequence_date)
);

-- Warehouse settings (LP number format, etc)
ALTER TABLE warehouse_settings ADD COLUMN IF NOT EXISTS (
  lp_number_format VARCHAR(100) DEFAULT 'LP-YYYYMMDD-NNNN',
  allow_over_receipt BOOLEAN DEFAULT false
);
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
- ✅ **Epic 1**: Organizations, Users, Locations, warehouse_settings table
- ✅ **Epic 2**: Products table with UoM

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
