# Epic 5 Batch A: Warehouse - License Plates & Receiving
## Technical Specification

**Date:** 2025-11-27
**Author:** Claude Code
**Epic ID:** 5
**Batch ID:** 5A (MVP)
**Status:** Draft

---

## Overview

Epic 5 Batch A (Warehouse MVP) implementuje fundamentalne procesy zarządzania inventaryzacją w systemie MonoPilot MES poprzez:

1. **License Plate (LP) Management** - Atomowe jednostki śledzenia inventaryzacji z unikalnym numerem, statusem, batch/expiry tracking
2. **ASN & GRN** - Advanced Shipping Notice i Goods Receipt Note dla procesu recepcji od dostawców
3. **Genealogy Tracking** - FDA-compliant śledzenie zależności między LPs (split, merge, consume, produce)

Batch obejmuje 13 stories (5.1-5.13) i realizuje FR-WH-01 do FR-WH-13 (Receiving, LP Creation, Status Tracking).

### Key Features
- ✅ LP Creation z auto-generated unique numbers
- ✅ LP Status Tracking (available, reserved, consumed, quarantine, shipped)
- ✅ Batch/Expiry Management (FIFO/FEFO support)
- ✅ LP Split/Merge z genealogy recording
- ✅ ASN Creation z PO integration
- ✅ GRN Creation z atomic LP batch creation (Gap 6)
- ✅ Over-receipt Validation
- ✅ Auto-Print Label Support
- ✅ PO/TO Received Qty Updates

---

## Objectives and Scope

### In Scope
- ✅ **LP Creation & Numbering**: CRUD LP, auto-generate unique lp_number, configurable format
- ✅ **LP Status Lifecycle**: available → reserved/quarantine → consumed/shipped
- ✅ **Batch & Expiry Tracking**: batch_number, supplier_batch, mfg_date, expiry_date, FEFO sorting
- ✅ **LP Operations**: Split (parent→children genealogy), Merge (sources→target)
- ✅ **LP Genealogy**: Atomic genealogy creation z FK validation, circular dependency check (Sprint 0 Gap 2)
- ✅ **ASN Management**: Create ASN from PO, pre-fill items from PO lines
- ✅ **GRN Creation**: Atomic GRN+LP transaction (Sprint 0 Gap 6), rollback on validation error
- ✅ **Receiving Flow**: ASN → GRN → LP + PO update + label print
- ✅ **Validation**: Over-receipt prevention, location validation, product availability
- ✅ **Label Printing**: ZPL format generation, printer integration prep
- ✅ **RLS Policies**: org_id isolation na wszystkich warehouse tables

### Out of Scope (Batches 5B, 5C)
- ❌ Pallet Management (Story 5.19-5.22) → Batch 5B
- ❌ Stock Moves/Location Transfers (Story 5.14-5.18) → Batch 5B
- ❌ Scanner Operations (Story 5.23-5.36) → Batch 5C
- ❌ Forward/Backward Traceability UI (Story 5.28-5.30) - zależy od Batch 5A
- ❌ Inventory Count (Story 5.35) → Batch 5C

---

## System Architecture Alignment

### Technology Stack
- **Frontend**: Next.js 15 App Router, React 19, TypeScript strict
- **UI**: Tailwind + Shadcn/UI (modals, forms, tables)
- **Backend**: Supabase PostgreSQL + RLS
- **State**: SWR dla data fetching
- **Validation**: Zod schemas (client + server)
- **API**: RESTful endpoints `/api/warehouse/*`
- **Printing**: ZPL template generation (print-ready, no device integration in MVP)

### Database Constraints
1. **Multi-tenancy**: `org_id UUID FK` + RLS policies na wszystkich tables
2. **Unique Constraints**:
   - `license_plates(org_id, lp_number)` - unique LP number per org
   - `asn(org_id, asn_number)` - unique ASN number per org
   - `grn(org_id, grn_number)` - unique GRN number per org
   - `lp_genealogy(parent_lp_id, child_lp_id)` - prevent duplicate links
3. **Foreign Keys** (with validation):
   - `license_plates.product_id` → products(id)
   - `license_plates.location_id` → locations(id)
   - `license_plates.grn_id` → grns(id)
   - `asn.po_id` → purchase_orders(id)
   - `grn.asn_id` → asns(id)
   - `lp_genealogy.parent_lp_id, child_lp_id` → license_plates(id)

### Cache & Invalidation
```typescript
// Batch 5A caches
CACHE_KEYS = {
  lp_settings: 'lp-settings:{org_id}',        // LP format config, TTL 30 min
  asn_pending: 'asn-pending:{org_id}',         // Pending ASNs, TTL 5 min
}
// Events to emit: 'lp.created', 'lp.status_changed', 'grn.completed'
```

---

## Detailed Design

### Services & API Endpoints

#### LicensePlateService
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| List LPs | `/api/warehouse/license-plates` | GET | authenticated | Filter by status, product, location, batch |
| Get LP Detail | `/api/warehouse/license-plates/:id` | GET | authenticated | Include genealogy, movements |
| Create LP | `/api/warehouse/license-plates` | POST | authenticated | Auto-generate lp_number if not provided |
| Update LP Status | `/api/warehouse/license-plates/:id/status` | PATCH | authenticated | Validate status transition |
| Split LP | `/api/warehouse/license-plates/:id/split` | POST | authenticated | Create genealogy record, validate qty |
| Merge LPs | `/api/warehouse/license-plates/merge` | POST | authenticated | Validate same product/batch, create genealogy |

#### ASNService
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| List ASNs | `/api/warehouse/asns` | GET | authenticated | Filter by status, PO |
| Get ASN Detail | `/api/warehouse/asns/:id` | GET | authenticated | Include items, PO details |
| Create ASN | `/api/warehouse/asns` | POST | authenticated | Auto-generate asn_number, pre-fill from PO |
| Update ASN | `/api/warehouse/asns/:id` | PATCH | authenticated | Update expected_arrival, carrier, tracking |
| Cancel ASN | `/api/warehouse/asns/:id/cancel` | POST | authenticated | Only if no GRN received |

#### GRNService
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| List GRNs | `/api/warehouse/grns` | GET | authenticated | Filter by status, ASN, PO |
| Get GRN Detail | `/api/warehouse/grns/:id` | GET | authenticated | Include items, LPs, GRN number |
| Create GRN (Atomic) | `/api/warehouse/grns` | POST | authenticated | **TRANSACTION: GRN+LPs+PO update** (Gap 6) |
| Cancel GRN | `/api/warehouse/grns/:id/cancel` | POST | authenticated | Reverse LPs + PO received_qty |

#### GenealoggyService
| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| List Genealogy | `/api/warehouse/lp-genealogy` | GET | authenticated | Filter by parent_lp_id, child_lp_id |
| Create Genealogy | `/api/warehouse/lp-genealogy` | POST | authenticated | **TRANSACTION: FK validation, circular check** (Gap 2) |
| Trace Forward | `/api/warehouse/license-plates/:id/trace-forward` | GET | authenticated | Recursive query: parent → descendants |
| Trace Backward | `/api/warehouse/license-plates/:id/trace-backward` | GET | authenticated | Recursive query: child → ancestors |

---

## Data Models

### License Plates Table
```sql
CREATE TABLE license_plates (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  lp_number VARCHAR(50) NOT NULL UNIQUE, -- LP-YYYYMMDD-NNNN format
  product_id UUID NOT NULL REFERENCES products(id),
  batch_number VARCHAR(50) NOT NULL,
  supplier_batch_number VARCHAR(50),
  quantity DECIMAL(15, 4) NOT NULL,
  uom VARCHAR(10) NOT NULL, -- from product
  manufacture_date DATE,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'available', -- available, reserved, consumed, quarantine, shipped
  location_id UUID REFERENCES locations(id),
  grn_id UUID REFERENCES grns(id),
  qa_status VARCHAR(20) DEFAULT 'pending', -- pending, passed, rejected
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by_user_id UUID REFERENCES users(id),
  UNIQUE(org_id, lp_number),
  INDEX(org_id, status),
  INDEX(org_id, product_id),
  INDEX(org_id, location_id),
  INDEX(expiry_date) -- for FEFO sorting
);
```

### ASN (Advanced Shipping Notice) Table
```sql
CREATE TABLE asns (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id),
  asn_number VARCHAR(50) NOT NULL,
  expected_arrival_date DATE,
  carrier VARCHAR(100),
  tracking_number VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending, received, completed, cancelled
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(org_id, asn_number),
  INDEX(org_id, po_id, status)
);

CREATE TABLE asn_items (
  id UUID PRIMARY KEY,
  asn_id UUID NOT NULL REFERENCES asns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_expected DECIMAL(15, 4) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  supplier_batch_number VARCHAR(50),
  manufacture_date DATE,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT now()
);
```

### GRN (Goods Receipt Note) Table
```sql
CREATE TABLE grns (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  asn_id UUID REFERENCES asns(id),
  po_id UUID NOT NULL REFERENCES purchase_orders(id), -- denormalized for direct queries
  grn_number VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),
  UNIQUE(org_id, grn_number),
  INDEX(org_id, po_id, status)
);

CREATE TABLE grn_items (
  id UUID PRIMARY KEY,
  grn_id UUID NOT NULL REFERENCES grns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_received DECIMAL(15, 4) NOT NULL,
  uom VARCHAR(10) NOT NULL,
  batch_number VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### LP Genealogy Table
```sql
CREATE TABLE lp_genealogy (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id),
  parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
  child_lp_id UUID NOT NULL REFERENCES license_plates(id),
  wo_id UUID REFERENCES work_orders(id),
  operation_type VARCHAR(20) NOT NULL, -- split, merge, consume, produce
  created_at TIMESTAMP DEFAULT now(),
  created_by_user_id UUID REFERENCES users(id),
  UNIQUE(parent_lp_id, child_lp_id),
  INDEX(org_id, parent_lp_id),
  INDEX(org_id, child_lp_id),
  CHECK (parent_lp_id != child_lp_id) -- prevent self-links
);
```

### Warehouse Settings Table
```sql
CREATE TABLE warehouse_settings (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
  lp_number_format VARCHAR(100) DEFAULT 'LP-YYYYMMDD-NNNN',
  allow_over_receipt BOOLEAN DEFAULT false,
  auto_print_labels BOOLEAN DEFAULT false,
  printer_name VARCHAR(100),
  label_format VARCHAR(50) DEFAULT 'ZPL',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

---

## Implementation Dependencies

### Required from Previous Epics
- ✅ Epic 1: Organizations, Users, Locations, warehouse_settings table
- ✅ Epic 2: Products table z UoM, suppliers
- ✅ Epic 3: Purchase Orders z po_line table

### Dependencies Within Batch 5A
1. **Story 5.1** (LP Creation) → Base entity
2. **Story 5.2-5.4** → Depend on 5.1
3. **Story 5.5-5.6** (Split/Merge) → Depend on 5.1
4. **Story 5.7** (Genealogy) → Depends on 5.1, 5.5, 5.6
5. **Story 5.8-5.10** (ASN) → Depends on PO (Epic 3)
6. **Story 5.11** (GRN) → Depends on 5.1, 5.8, 5.7
7. **Story 5.12** (Label Print) → Depends on 5.11
8. **Story 5.13** (PO Update) → Depends on 5.11

### Parallel Implementation Tracks
- **Track 1**: LP CRUD (5.1-5.4) + Settings (5.31)
- **Track 2**: Split/Merge/Genealogy (5.5-5.7) - starts when 5.1 done
- **Track 3**: ASN/GRN/Receiving (5.8-5.13) - starts when PO ready

---

## Transaction Atomicity (Sprint 0 Gap 6)

### Story 5.11: GRN + LP Creation (ATOMIC)

**Problem**: Currently GRN and LPs created separately → data inconsistency risk

**Solution**: Single atomic transaction

```typescript
async function createGRNWithLPs(input: GRNInput): Promise<GRNResponse> {
  const transaction = await db.transaction(async (trx) => {
    // 1. Validate FK constraints
    const asn = input.asn_id ? await trx('asns').where({id: input.asn_id, org_id}).first() : null;
    if (input.asn_id && !asn) throw new Error('ASN not found');

    // 2. Create GRN
    const grn = await trx('grns').insert({
      id: uuid(),
      org_id,
      asn_id: input.asn_id,
      po_id: input.po_id,
      grn_number: generateGRNNumber(),
      created_by_user_id: userId
    }).returning('*');

    // 3. Create GRN items (validate product_id)
    const grnItems = await Promise.all(
      input.items.map(item => {
        // Validate product exists
        return trx('grn_items').insert({
          grn_id: grn[0].id,
          product_id: item.product_id,
          quantity_received: item.quantity,
          batch_number: item.batch_number
        });
      })
    );

    // 4. Create License Plates (validate location_id)
    const lps = await Promise.all(
      input.items.map(item =>
        trx('license_plates').insert({
          id: uuid(),
          org_id,
          lp_number: generateLPNumber(),
          product_id: item.product_id,
          batch_number: item.batch_number,
          quantity: item.quantity,
          location_id: item.location_id, // Validate exists
          grn_id: grn[0].id,
          status: 'available',
          created_by_user_id: userId
        })
      )
    );

    // 5. Update PO received_qty
    await trx('purchase_order_lines')
      .where({po_id: input.po_id})
      .increment('received_qty', input.items.sum(i => i.quantity));

    // 6. Update ASN status (if from ASN)
    if (input.asn_id) {
      await trx('asns').where({id: input.asn_id}).update({status: 'completed'});
    }

    // 7. COMMIT automatically on success
    return { grn: grn[0], lps, asn: input.asn_id ? asn : null };
  });

  // On error: AUTO ROLLBACK (all-or-nothing)
  return transaction;
}
```

**Rollback Scenarios:**
| Error | Result |
|-------|--------|
| ASN not found | ROLLBACK: no GRN created |
| Product not found | ROLLBACK: no LP created |
| Location not found | ROLLBACK: all LPs rolled back |
| PO update fails | ROLLBACK: entire transaction |

---

## LP Genealogy Atomicity (Sprint 0 Gap 2)

### Story 5.7: LP Genealogy Tracking

**Validation Flow** (before INSERT):
1. ✅ parent_lp_id exists in license_plates
2. ✅ child_lp_id exists in license_plates
3. ✅ Both belong to same org_id
4. ✅ parent_lp_id != child_lp_id
5. ✅ No circular dependency (recursive CTE check)
6. ✅ Duplicate link check: unique(parent_lp_id, child_lp_id)

```typescript
async function createGenealogy(input: {
  parent_lp_id: string;
  child_lp_id: string;
  operation_type: 'split' | 'merge' | 'consume' | 'produce';
  wo_id?: string;
}) {
  // 1. Check for circular dependency
  const isCircular = await db.raw(`
    WITH RECURSIVE ancestors AS (
      SELECT parent_lp_id FROM lp_genealogy WHERE child_lp_id = ?
      UNION ALL
      SELECT lg.parent_lp_id FROM lp_genealogy lg
      JOIN ancestors a ON lg.child_lp_id = a.parent_lp_id
      WHERE depth < 10
    )
    SELECT EXISTS(SELECT 1 FROM ancestors WHERE parent_lp_id = ?)
  `, [input.child_lp_id, input.parent_lp_id]);

  if (isCircular) throw new Error('Circular dependency detected');

  // 2. Insert genealogy (unique constraint handles duplicate check)
  try {
    return await db('lp_genealogy').insert({
      id: uuid(),
      org_id,
      parent_lp_id: input.parent_lp_id,
      child_lp_id: input.child_lp_id,
      operation_type: input.operation_type,
      wo_id: input.wo_id,
      created_by_user_id: userId
    });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      throw new Error('Genealogy link already exists');
    }
    throw err;
  }
}
```

---

## Error Handling & Validation

### GRN Creation Errors
| Scenario | HTTP | Error Message | Action |
|----------|------|---------------|--------|
| ASN not found | 404 | "ASN #12345 not found" | Show error, retry |
| Product not found | 404 | "Product SKU-001 no longer exists" | Show error, select different |
| Location inactive | 400 | "Location WH-A-01 is inactive" | Show error, select different |
| PO over-receipt | 400 | "Cannot receive 150 units. Remaining: 100" | Show warning, adjust qty |
| Duplicate GRN# | 409 | "GRN already exists for this ASN" | Show error, refresh |

### Genealogy Errors
| Scenario | HTTP | Error Message |
|----------|------|---------------|
| Parent LP not found | 404 | "Parent LP-001234 does not exist" |
| Child LP not found | 404 | "Child LP-005678 does not exist" |
| Different orgs | 403 | "Cannot link LPs from different organizations" |
| Circular dep | 400 | "Circular dependency: LP-001234 → LP-005678 → LP-001234" |
| Duplicate link | 409 | "Link already exists" |

---

## Acceptance Criteria Summary

| Story | MVP AC | P1 AC | P2 AC |
|-------|--------|-------|-------|
| 5.1 | LP creation modal, auto-generate #, save | Batch edit, bulk upload | N/A |
| 5.2 | Status transitions, timestamp record | Status reason, approval flow | N/A |
| 5.3 | Batch/expiry fields, FEFO sort, red highlight | Batch search, expiry alerts | N/A |
| 5.4 | Auto-generate format, configurable | Multi-format templates | N/A |
| 5.5 | Split qty, genealogy record | Partial move on split, label print | N/A |
| 5.6 | Merge same product/batch, genealogy | Merge different batches (P2) | N/A |
| 5.7 | FK validation, circular check, immutable audit | Forward/backward trace UI (P1) | Recall simulation (P2) |
| 5.8 | Create ASN modal, link to PO, auto-number | Expected date, carrier tracking | N/A |
| 5.9 | Items pre-filled from PO, can edit | Supplier metadata pre-fill | N/A |
| 5.10 | Warn on over-receipt, show qty summary | Block over-receipt toggle | N/A |
| 5.11 | Atomic GRN+LP creation, update PO | QA status assignment, location select | N/A |
| 5.12 | Generate ZPL label, save template | Send to printer device | Print queue mgmt (P2) |
| 5.13 | Auto-update PO received, status changes | TO handling, closed PO validation | N/A |

---

## Testing Strategy

### Unit Tests
- LP CRUD operations
- Genealogy validation (circular, FK, duplicate)
- Number generation (auto-increment format)
- Status transition validation
- Over-receipt validation

### Integration Tests
- GRN + LP atomic transaction (success path)
- GRN + LP rollback (all error paths)
- Genealogy with genealogy conflicts
- ASN → GRN → PO update flow

### E2E Tests
- Full receiving workflow: PO → ASN → GRN → LP → Label
- Split/Merge genealogy tracking
- Batch/Expiry FEFO sorting
- Over-receipt warning/block

---

## Deployment Plan

**Phase 1 (Week 1-2)**: LP Core + Genealogy
- Stories 5.1-5.7 (DB + API + basic UI)
- RLS policies for LP tables

**Phase 2 (Week 2-3)**: Receiving Flow
- Stories 5.8-5.13 (ASN/GRN/PO integration)
- Atomic transaction testing

**Phase 3 (Week 3)**: QA & Label Printing
- E2E testing, label template setup
- Production deployment

---

## References
- Epic 5 Definition: [docs/epics/05-warehouse.md]
- Gap 2 (LP Genealogy): [docs/readiness-assessment/3-gaps-and-risks.md]
- Gap 6 (GRN Atomicity): [docs/readiness-assessment/3-gaps-and-risks.md]
- FDA 21 CFR Part 117 (Traceability): https://www.fda.gov/food/fsma
