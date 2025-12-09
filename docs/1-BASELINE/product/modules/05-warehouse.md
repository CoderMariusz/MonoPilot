# Warehouse Module PRD

**Status:** 92% (Epic 5 - IN PROGRESS)
**Priority:** P0 - Core Module
**Epic:** 5
**Stories:** 36
**Phase:** MVP Phase 1

---

## 1. Overview

### 1.1 Cel Modulu
Modul Warehouse odpowiada za zarzadzanie zapasami poprzez License Plates (LP), ASN, GRN, ruchy magazynowe oraz operacje skanera. Jest krytycznym mostem miedzy Planning (PO/TO/WO) a Production.

### 1.2 Value Proposition
- **Problem:** Brak atomowego sledzenia zapasow i pelnej traceability
- **Rozwiazanie:** LP-based inventory z genealogia, split/merge, scanner workflows
- **Korzysc:** Pelna traceability od przyjecia do wydania, zgodnosc z FDA

### 1.3 Key Concepts
- **License Plate (LP):** Atomowa jednostka zapasow - brak "luznej ilosci"
- **ASN (Advanced Shipping Notice):** Pre-notyfikacja o nadchodzacej dostawie
- **GRN (Goods Receipt Note):** Dokument przyjecia tworzacy LP
- **Pallet:** Jednostka pakowania zawierajaca wiele LP
- **LP Genealogy:** Relacje parent-child dla pelnej traceability

### 1.4 Dependencies
- **Wymaga:** Settings (warehouses, locations), Technical (products), Planning (PO, TO)
- **Wymagany przez:** Production (material consumption), Quality (QA status), Shipping (picking)

---

## 2. User Roles & Permissions

| Rola | Uprawnienia |
|------|-------------|
| **Warehouse Operator** | Receive, Move LP, Split, View LP |
| **Warehouse Manager** | + Merge, Adjust, Configure locations |
| **Admin** | + Configure warehouse settings, Manage all warehouses |

---

## 3. Settings Configuration

**Route:** `/settings/warehouse`

### 3.1 LP Configuration

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `auto_generate_lp_number` | toggle | On | Auto-generuj numery LP |
| `lp_number_prefix` | string | "LP" | Prefix dla LP |
| `lp_number_format` | string | "LP-YYYY-NNNN" | Format numeru |
| `lp_number_sequence_length` | number | 8 | Dlugosc sekwencji |

### 3.2 Receipt Configuration

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `enable_asn` | toggle | Off | Wlacz workflow ASN |
| `allow_over_receipt` | toggle | Off | Pozwol na przyjecie wiecej niz zamowiono |
| `over_receipt_tolerance_pct` | decimal | 0 | % tolerancji over-receipt |
| `require_qa_on_receipt` | toggle | On | Wymagaj QA status przy przyjciu |
| `default_qa_status` | enum | pending | Domyslny QA status |
| `require_batch_on_receipt` | toggle | Off | Wymagaj nr partii |
| `require_expiry_on_receipt` | toggle | Off | Wymagaj daty waznosci |
| `print_label_on_receipt` | toggle | On | Auto-druk etykiety przy przyjciu |

### 3.3 Scanner Configuration

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `scanner_idle_timeout_sec` | number | 300 | Timeout sesji skanera (5 min) |
| `scanner_sound_feedback` | toggle | On | Feedback dzwiekowy |

### 3.4 Inventory Configuration

| Setting | Type | Default | Opis |
|---------|------|---------|------|
| `enable_split_merge` | toggle | On | Wlacz split/merge LP |
| `enable_pallets` | toggle | Off | Wlacz zarzadzanie paletami |
| `enable_fifo` | toggle | On | FIFO inventory management |
| `enable_fefo` | toggle | Off | FEFO (expiry-based) management |

---

## 4. Core Entities

### 4.1 License Plate (LP)

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `lp_number` | string | Yes | Unikalny identyfikator (barcode) |
| `product_id` | FK | Yes | Referencja produktu |
| `quantity` | decimal | Yes | Aktualna ilosc |
| `uom` | string | Yes | Jednostka miary (z produktu) |
| `location_id` | FK | Yes | Aktualna lokalizacja |
| `warehouse_id` | FK | Yes | Magazyn |
| `status` | enum | Yes | available, reserved, consumed, blocked |
| `qa_status` | enum | Yes | pending, passed, failed, quarantine |
| `batch_number` | string | Toggle | Nr partii wewnetrzny |
| `supplier_batch_number` | string | Toggle | Nr partii dostawcy |
| `expiry_date` | date | Toggle | Data waznosci |
| `manufacture_date` | date | No | Data produkcji |
| `grn_id` | FK | No | Zrodlowy GRN |
| `wo_id` | FK | No | Zrodlowy WO (jesli output) |
| `parent_lp_id` | FK | No | Parent LP (split/merge) |
| `consumed_by_wo_id` | FK | No | WO ktore skonsumowalo |

### 4.2 LP Status Lifecycle

```
[Receipt] --> available
               |
           reserved (for WO/TO)
               |
           consumed (fully used) OR available (partial unreserve)

[Any Status] --> blocked (QC hold, damage)
```

### 4.3 LP QA Status

| Status | Opis | Can Ship | Can Consume |
|--------|------|----------|-------------|
| `pending` | Oczekuje na QA | No | Settings toggle |
| `passed` | QA zatwierdzone | Yes | Yes |
| `failed` | QA odrzucone | No | No |
| `quarantine` | W dochodzeniu | No | No |

### 4.4 GRN (Goods Receipt Note)

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `grn_number` | string | Yes | Unikalny nr GRN |
| `source_type` | enum | Yes | po, to, return |
| `po_id` | FK | Conditional | Jesli zrodlo = PO |
| `to_id` | FK | Conditional | Jesli zrodlo = TO |
| `supplier_id` | FK | Conditional | Z PO |
| `receipt_date` | datetime | Yes | Kiedy przyjeto |
| `warehouse_id` | FK | Yes | Magazyn docelowy |
| `location_id` | FK | Yes | Lokalizacja domyslna |
| `status` | enum | Yes | draft, completed, cancelled |
| `received_by` | FK | Yes | Kto przyjal |

### 4.5 ASN (Advanced Shipping Notice)

| Field | Type | Required | Opis |
|-------|------|----------|------|
| `asn_number` | string | Yes | Unikalny nr ASN |
| `po_id` | FK | Yes | Powiazane PO |
| `supplier_id` | FK | Yes | Dostawca |
| `expected_date` | date | Yes | Oczekiwana data |
| `actual_date` | date | No | Rzeczywista data |
| `carrier` | string | No | Przewoznik |
| `tracking_number` | string | No | Nr sledzenia |
| `status` | enum | Yes | pending, received, partial, cancelled |

### 4.6 LP Genealogy

| Field | Type | Opis |
|-------|------|------|
| `parent_lp_id` | FK | Zrodlowe LP |
| `child_lp_id` | FK | Wynikowe LP |
| `operation_type` | enum | split, merge, consume, produce |
| `quantity` | decimal | Ilosc |
| `wo_id` | FK | Powiazane WO (dla consume/produce) |
| `operation_date` | datetime | Kiedy wykonano |

---

## 5. Workflows

### 5.1 GRN Receipt Workflow (Desktop)

```
1. Select Source (PO or TO)
   - If PO: Show pending POs
   - If TO: Show in-transit TOs
2. Header Entry
   - Auto-fill: Supplier, Warehouse (from PO/TO)
   - User selects: Location
3. Items Entry
   - Pre-filled from source document
   - User enters for each line:
     * Received Qty (validate vs ordered)
     * Batch Number (if enabled)
     * Expiry Date (if enabled)
     * Location (can override)
     * QA Status
   - LP Number: Auto-generated or manual
4. Validation
   - No over-receipt unless allowed
   - Required fields based on toggles
5. Complete
   - Creates GRN record
   - Creates LP for each item
   - Updates PO/TO line received qty
   - Prints labels (if enabled)
```

### 5.2 Scanner Receive Workflow

```
Step 1: Scan PO barcode OR Select from list
Step 2: Select Line (if multiple products)
Step 3: Enter Receipt Details
        - Batch Number
        - Expiry Date
        - Received Qty
        - Location
Step 4: Validate
        - Check over-receipt
        - Validate required fields
Step 5: Confirm & Print
        - Create GRN + LP
        - Print label
        - Option to receive more
```

### 5.3 LP Split Workflow

```
1. Select source LP
2. Enter quantity for new LP (must be < current qty)
3. Optionally select different location for new LP
4. New LP inherits: product, batch, expiry, all tracking info
5. Records genealogy (parent_lp_id)
6. Print new LP label (optional)
```

### 5.4 LP Merge Workflow

```
1. Select primary LP (will keep this LP number)
2. Add LPs to merge (must be same product/batch/uom/qa_status)
3. Validate merge rules
4. New quantity = sum of all
5. Location = primary LP location
6. Records genealogy for all merged LPs
```

### 5.5 LP Move Workflow

```
1. Scan or select LP
2. Display: Product, Qty, Current Location
3. Scan destination location barcode OR select from list
4. Validate: Location active, same warehouse
5. Enter quantity (full LP or partial --> triggers split)
6. Confirm --> LP location updated, stock_move recorded
```

---

## 6. Database Tables

### 6.1 license_plates
```sql
CREATE TABLE license_plates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    lp_number VARCHAR(50) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity NUMERIC(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    location_id UUID NOT NULL REFERENCES locations(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    status VARCHAR(20) NOT NULL DEFAULT 'available',
    qa_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    batch_number VARCHAR(100),
    supplier_batch_number VARCHAR(100),
    expiry_date DATE,
    manufacture_date DATE,
    grn_id UUID REFERENCES grns(id),
    wo_id UUID REFERENCES work_orders(id),
    parent_lp_id UUID REFERENCES license_plates(id),
    consumed_by_wo_id UUID REFERENCES work_orders(id),
    pallet_id UUID REFERENCES pallets(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, lp_number)
);
```

### 6.2 grns
```sql
CREATE TABLE grns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    grn_number VARCHAR(50) NOT NULL,
    source_type VARCHAR(20) NOT NULL,
    po_id UUID REFERENCES purchase_orders(id),
    to_id UUID REFERENCES transfer_orders(id),
    asn_id UUID REFERENCES asns(id),
    supplier_id UUID REFERENCES suppliers(id),
    receipt_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID NOT NULL REFERENCES locations(id),
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    received_by UUID REFERENCES auth.users(id),
    UNIQUE(org_id, grn_number)
);
```

### 6.3 grn_items
```sql
CREATE TABLE grn_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID NOT NULL REFERENCES grns(id),
    product_id UUID NOT NULL REFERENCES products(id),
    po_line_id UUID REFERENCES po_lines(id),
    ordered_qty NUMERIC(15,4) NOT NULL,
    received_qty NUMERIC(15,4) NOT NULL,
    uom VARCHAR(20) NOT NULL,
    lp_id UUID REFERENCES license_plates(id),
    batch_number VARCHAR(100),
    supplier_batch_number VARCHAR(100),
    expiry_date DATE,
    manufacture_date DATE,
    location_id UUID NOT NULL REFERENCES locations(id),
    qa_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    notes TEXT
);
```

### 6.4 lp_genealogy
```sql
CREATE TABLE lp_genealogy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    parent_lp_id UUID NOT NULL REFERENCES license_plates(id),
    child_lp_id UUID NOT NULL REFERENCES license_plates(id),
    operation_type VARCHAR(20) NOT NULL,
    quantity NUMERIC(15,4) NOT NULL,
    operation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    wo_id UUID REFERENCES work_orders(id),
    created_by UUID REFERENCES auth.users(id)
);
```

### 6.5 stock_movements
```sql
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    move_number VARCHAR(50) NOT NULL,
    lp_id UUID NOT NULL REFERENCES license_plates(id),
    move_type VARCHAR(20) NOT NULL,
    from_location_id UUID REFERENCES locations(id),
    to_location_id UUID REFERENCES locations(id),
    quantity NUMERIC(15,4) NOT NULL,
    move_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    reason VARCHAR(255),
    wo_id UUID REFERENCES work_orders(id),
    moved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, move_number)
);
```

### 6.6 warehouse_settings
```sql
CREATE TABLE warehouse_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL UNIQUE REFERENCES organizations(id),
    enable_asn BOOLEAN DEFAULT false,
    auto_generate_lp_number BOOLEAN DEFAULT true,
    lp_number_prefix VARCHAR(10) DEFAULT 'LP',
    lp_number_format VARCHAR(50) DEFAULT 'LP-YYYY-NNNN',
    enable_pallets BOOLEAN DEFAULT false,
    enable_split_merge BOOLEAN DEFAULT true,
    require_qa_on_receipt BOOLEAN DEFAULT true,
    default_qa_status VARCHAR(20) DEFAULT 'pending',
    allow_over_receipt BOOLEAN DEFAULT false,
    over_receipt_tolerance_pct NUMERIC(5,2) DEFAULT 0,
    require_batch_on_receipt BOOLEAN DEFAULT false,
    require_expiry_on_receipt BOOLEAN DEFAULT false,
    enable_fifo BOOLEAN DEFAULT true,
    enable_fefo BOOLEAN DEFAULT false,
    scanner_idle_timeout_sec INTEGER DEFAULT 300,
    scanner_sound_feedback BOOLEAN DEFAULT true,
    print_label_on_receipt BOOLEAN DEFAULT true,
    label_copies_default INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. API Endpoints

### 7.1 License Plates
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/warehouse/license-plates` | Lista LP z filtrami |
| GET | `/api/warehouse/license-plates/:id` | Szczegoly LP |
| POST | `/api/warehouse/license-plates` | Utworz LP (zwykle przez GRN) |
| PUT | `/api/warehouse/license-plates/:id` | Aktualizuj LP (ograniczone pola) |
| POST | `/api/warehouse/license-plates/:id/split` | Split LP |
| POST | `/api/warehouse/license-plates/merge` | Merge wiele LP |
| POST | `/api/warehouse/license-plates/:id/print` | Drukuj etykiete LP |
| GET | `/api/warehouse/license-plates/:id/genealogy` | Genealogia LP |
| GET | `/api/warehouse/license-plates/:id/history` | Historia ruchow LP |

### 7.2 GRN
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/warehouse/grns` | Lista GRN z filtrami |
| GET | `/api/warehouse/grns/:id` | Szczegoly GRN |
| POST | `/api/warehouse/grns` | Utworz GRN i LP |
| POST | `/api/warehouse/grns/:id/receive` | Zatwierdz przyjecie |

### 7.3 Stock Movements
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/warehouse/stock-movements` | Lista ruchow |
| POST | `/api/warehouse/stock-movements` | Utworz ruch |

### 7.4 Settings
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/warehouse/settings` | Pobierz ustawienia |
| PUT | `/api/warehouse/settings` | Aktualizuj ustawienia |

### 7.5 Scanner
| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/scanner/pending-receipts` | Oczekujace PO/TO/ASN |
| POST | `/api/scanner/receive` | Quick receive |
| POST | `/api/scanner/move` | Quick move |
| POST | `/api/scanner/split` | Quick split |
| GET | `/api/scanner/lp/:barcode` | Lookup LP by barcode |
| GET | `/api/scanner/location/:barcode` | Lookup location |

---

## 8. Functional Requirements

### 8.1 LP Management
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| WH-FR-01 | LP creation with unique number | Must | DONE |
| WH-FR-02 | LP Status Tracking (available, reserved, consumed, blocked) | Must | DONE |
| WH-FR-03 | LP Batch/Expiry Tracking | Must | DONE |
| WH-FR-04 | LP Number Generation (configurable format) | Must | DONE |
| WH-FR-05 | LP Split with Genealogy | Must | DONE |
| WH-FR-06 | LP Merge | Should | DONE |
| WH-FR-07 | LP Genealogy Tracking (FDA compliance) | Must | DONE |

### 8.2 Receiving
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| WH-FR-08 | Receive from PO and TO | Must | DONE |
| WH-FR-09 | ASN Pre-fill (when enabled) | Should | DONE |
| WH-FR-10 | Over-receipt Validation | Must | DONE |
| WH-FR-11 | GRN and LP Creation (atomic) | Must | DONE |
| WH-FR-12 | Auto-print Labels on Receive | Should | BUG-001/002 |
| WH-FR-13 | Update PO/TO Received Qty | Must | DONE |

### 8.3 Stock Movements
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| WH-FR-14 | LP Location Move | Must | DONE |
| WH-FR-15 | Movement Audit Trail | Must | DONE |
| WH-FR-16 | Partial Move (Split on Move) | Must | DONE |
| WH-FR-17 | Destination Validation | Must | DONE |
| WH-FR-18 | Movement Types (transfer, issue, receipt, adjustment) | Must | DONE |

### 8.4 Pallet Management
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| WH-FR-19 | Pallet Creation | Should | DONE |
| WH-FR-20 | Pallet LP Management | Should | DONE |
| WH-FR-21 | Pallet Move | Should | DONE |
| WH-FR-22 | Pallet Status | Should | DONE |

### 8.5 Scanner Operations
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| WH-FR-23 | Scanner Guided Workflows | Must | DONE |
| WH-FR-24 | Scanner Barcode Validation | Must | DONE |
| WH-FR-25 | Scanner Feedback (visual/audio) | Should | DONE |
| WH-FR-26 | Scanner Operations Menu | Must | DONE |
| WH-FR-27 | Scanner Session Timeout | Must | BUG-006 |

### 8.6 Traceability
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| WH-FR-28 | Forward/Backward Traceability | Must | DONE |
| WH-FR-29 | Genealogy Recording | Must | DONE |
| WH-FR-30 | Source Document Linking | Must | DONE |

---

## 9. Known Bugs (Active)

### BUG-001: Print Integration Incomplete
- **Status:** OPEN
- **Priority:** HIGH
- **File:** `apps/frontend/app/api/warehouse/grns/[id]/receive/route.ts:224`
- **Issue:** `// TODO: Queue print job or call print endpoint`
- **Impact:** Auto-print on receive doesn't work - labels must be printed manually
- **Story:** 5.12 Auto-Print Labels

### BUG-002: Print API is Stub Only
- **Status:** OPEN
- **Priority:** HIGH
- **File:** `apps/frontend/app/api/warehouse/license-plates/[id]/print/route.ts:94`
- **Issue:** `// TODO: In production, send to actual printer`
- **Impact:** Label printing is simulation only - no actual ZPL/IPP printer support
- **Story:** 5.12 Auto-Print Labels

### BUG-003: GRN Items - LP Navigation Missing
- **Status:** FIXED (2025-12-09)
- **Priority:** MEDIUM
- **File:** `apps/frontend/components/warehouse/GRNItemsTable.tsx`
- **Resolution:** LP click navigates to LP detail page

### BUG-004: Scanner Receive Not PO-Barcode Driven
- **Status:** FIXED (2025-12-09)
- **Priority:** MEDIUM
- **File:** `apps/frontend/app/(authenticated)/scanner/warehouse/receive/page.tsx`
- **Resolution:** Scan PO barcode first, then show items

### BUG-005: No Warehouse Settings UI Page
- **Status:** OPEN
- **Priority:** HIGH
- **File:** Missing `/settings/warehouse` page
- **Issue:** API exists but no UI to configure
- **Impact:** Admins cannot configure LP numbering, over-receipt tolerance via UI
- **Story:** 5.31 Warehouse Settings

### BUG-006: Scanner Session Timeout Missing
- **Status:** OPEN
- **Priority:** LOW
- **File:** `apps/frontend/app/(authenticated)/scanner/layout.tsx`
- **Issue:** No session timeout implementation
- **Impact:** Scanner sessions don't auto-logout after inactivity
- **Story:** 5.27 Scanner Session Management

### BUG-007: Offline Queue Not Implemented
- **Status:** OPEN (Phase 3)
- **Priority:** LOW
- **Impact:** Scanner requires constant network connection
- **Story:** 5.36 Offline Queue Management

---

## 10. Integration Points

### 10.1 Z Planning Module
- **PO:** Receive creates GRN + LP, updates po_line.received_qty
- **TO:** Receive updates to_line.received_qty, uses transit location

### 10.2 Z Production Module
- **WO Material Consumption:** Reserves and consumes LP, creates genealogy
- **WO Output:** Creates new LP from production, links to consumed materials

### 10.3 Z Technical Module
- **Products:** LP references product for name, UoM, expiry policy

### 10.4 Z Settings Module
- **Warehouses:** LP and location belong to warehouse
- **Locations:** LP current location, movement destinations

### 10.5 Z Quality Module (Phase 2)
- **QA Status:** Field on LP
- **Quarantine:** Moves LP to quarantine location

---

## 11. Story Map

| Story | Tytul | Priority | Status |
|-------|-------|----------|--------|
| 5.1 | License Plate Creation | Must | DONE |
| 5.2 | LP Status Tracking | Must | DONE |
| 5.3 | LP Batch/Expiry Tracking | Must | DONE |
| 5.4 | LP Number Generation | Must | DONE |
| 5.5 | LP Split | Must | DONE |
| 5.6 | LP Merge | Should | DONE |
| 5.7 | LP Genealogy Tracking | Must | DONE |
| 5.8 | ASN Creation | Should | DONE |
| 5.9 | ASN Item Management | Should | DONE |
| 5.10 | Over-Receipt Validation | Must | DONE |
| 5.11 | GRN and LP Creation | Must | DONE |
| 5.12 | Auto-Print Labels | Should | BUG-001/002 |
| 5.13 | Update PO/TO Received Qty | Must | DONE |
| 5.14 | LP Location Move | Must | DONE |
| 5.15 | Movement Audit Trail | Must | DONE |
| 5.16 | Partial Move (Split on Move) | Must | DONE |
| 5.17 | Destination Validation | Must | DONE |
| 5.18 | Movement Types | Must | DONE |
| 5.19 | Pallet Creation | Should | DONE |
| 5.20 | Pallet LP Management | Should | DONE |
| 5.21 | Pallet Move | Should | DONE |
| 5.22 | Pallet Status | Should | DONE |
| 5.23 | Scanner Guided Workflows | Must | DONE |
| 5.24 | Scanner Barcode Validation | Must | DONE |
| 5.25 | Scanner Feedback | Should | DONE |
| 5.26 | Scanner Operations Menu | Must | DONE |
| 5.27 | Scanner Session Timeout | Must | BUG-006 |
| 5.28 | Forward/Backward Traceability | Must | DONE |
| 5.29 | Genealogy Recording | Must | DONE |
| 5.30 | Source Document Linking | Must | DONE |
| 5.31 | Warehouse Settings Configuration | Must | BUG-005 |
| 5.32 | Receive from PO (Desktop) | Must | DONE |
| 5.33 | Receive from TO (Desktop) | Must | DONE |
| 5.34 | Scanner Receive Workflow | Must | DONE |
| 5.35 | Inventory Count | Should | DONE |
| 5.36 | Scanner Offline Queue (PWA) | Could | Phase 3 |

**Summary:** 36 stories, 33 DONE, 3 with bugs = 92% complete

---

## 12. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-09 | PM-Agent | Initial PRD from Epic 5 consolidation |
