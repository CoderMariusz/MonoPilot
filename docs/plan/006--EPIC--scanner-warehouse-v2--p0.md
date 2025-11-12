---
Status: Draft
Priority: P0
Epic: Scanner & Warehouse v2
Date: 2025-01-12
Owner: Warehouse & Production Teams
Dependencies: TD-001 (Client State Migration), EPIC-001 (BOM Complexity)
Related: 07_b_scanner_capabilities_and_ux.md, 07_WAREHOUSE_AND_SCANNER.md
---

# EPIC-002: Scanner & Warehouse Operations v2

## 🎯 Executive Summary

This epic implements **comprehensive scanner terminal and warehouse operations** for the MonoPilot MES system, enabling mobile device workflows for receiving, movement, Work Order execution, and traceability. Based on detailed requirements in `07_b_scanner_capabilities_and_ux.md`, this epic addresses critical gaps in ASN integration, LP genealogy, paletization, and real-time operator workflows.

**Business Value:**
- **100% real-time inventory accuracy** through scanner validation
- **50% reduction in receiving time** via ASN prefill
- **Complete traceability** from raw materials to finished goods
- **Zero manual data entry errors** with barcode scanning
- **Mobile-first operator experience** for warehouse and production floor

---

## 📊 Current State Analysis

### ✅ **Implemented (Desktop UI)**

| Feature | Status | Files | Notes |
|---------|--------|-------|-------|
| **GRN (Receiving)** | ✅ Partial | `CreateGRNModal.tsx`, `GRNTable.tsx` | Desktop only, no ASN prefill |
| **License Plates** | ✅ Basic | `LPOperationsTable.tsx`, `license_plates` table | Missing: batch, expiry, genealogy |
| **Stock Moves** | ✅ Basic | `StockMoveTable.tsx`, `stock_moves` table | Missing: move reasons, FIFO |
| **Split/Merge LP** | ✅ Partial | `SplitLPModal.tsx`, `AmendLPModal.tsx` | Missing: genealogy tracking |
| **QA Status** | ✅ Basic | `ChangeQAStatusModal.tsx` | Missing: QA workflows |
| **Scanner Terminals** | ✅ MVP | `scanner/process`, `scanner/pack` | MVP implementation, needs enhancement |

### ❌ **Missing Components (from 07_b_scanner_capabilities_and_ux.md)**

| Feature | Priority | Impact | Effort |
|---------|----------|--------|--------|
| **ASN (Advanced Shipping Notice)** | 🔥 P0 | High | Medium |
| **LP Genealogy** | 🔥 P0 | High | Medium |
| **Pallet Management** | 🔥 P0 | High | Medium |
| **Scanner UX (Menu + Line Selection)** | 🔥 P0 | High | High |
| **WO Reservation Logic** | 🔥 P0 | High | High |
| **Receive with ASN Prefill** | 🔥 P0 | High | Medium |
| **Move Reasons & Audit** | 🟡 P1 | Medium | Low |
| **LP Batch/Expiry Tracking** | 🟡 P1 | Medium | Low |
| **Label Printing** | 🟡 P1 | Medium | Medium |
| **Offline Mode** | 🟢 P2 | Low | Very High |

---

## 🏗️ Architecture Overview

### **Database Schema (New Tables)**

```sql
-- ASN (Advanced Shipping Notice)
CREATE TABLE asns (
  id SERIAL PRIMARY KEY,
  asn_number VARCHAR(50) UNIQUE NOT NULL,
  po_id INTEGER REFERENCES purchase_orders(id),
  supplier_id INTEGER REFERENCES suppliers(id) NOT NULL,
  expected_arrival TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) CHECK (status IN ('draft', 'submitted', 'received', 'cancelled')),
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asn_items (
  id SERIAL PRIMARY KEY,
  asn_id INTEGER REFERENCES asns(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) NOT NULL,
  quantity NUMERIC(10,4) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  batch VARCHAR(50),
  expiry_date DATE,
  lp_number VARCHAR(50), -- Pre-assigned LP from supplier
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LP Genealogy (Parent-Child Relationships)
CREATE TABLE lp_genealogy (
  id SERIAL PRIMARY KEY,
  parent_lp_id INTEGER REFERENCES license_plates(id),
  child_lp_id INTEGER REFERENCES license_plates(id),
  operation_type VARCHAR(20) CHECK (operation_type IN ('SPLIT', 'MERGE', 'CONSUME', 'PRODUCE')),
  quantity NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- LP Compositions (What's inside an LP)
CREATE TABLE lp_compositions (
  id SERIAL PRIMARY KEY,
  parent_lp_id INTEGER REFERENCES license_plates(id) ON DELETE CASCADE,
  component_lp_id INTEGER REFERENCES license_plates(id),
  quantity NUMERIC(10,4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pallets
CREATE TABLE pallets (
  id SERIAL PRIMARY KEY,
  pallet_number VARCHAR(50) UNIQUE NOT NULL,
  pallet_type VARCHAR(20), -- 'EURO', 'CHEP', 'CUSTOM'
  location_id INTEGER REFERENCES locations(id),
  status VARCHAR(20) CHECK (status IN ('open', 'closed', 'shipped')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE TABLE pallet_items (
  id SERIAL PRIMARY KEY,
  pallet_id INTEGER REFERENCES pallets(id) ON DELETE CASCADE,
  lp_id INTEGER REFERENCES license_plates(id),
  quantity NUMERIC(10,4),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES users(id)
);

-- WO Reservations (Materials reserved for WO)
CREATE TABLE wo_reservations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
  material_id INTEGER REFERENCES products(id),
  lp_id INTEGER REFERENCES license_plates(id),
  quantity_reserved NUMERIC(10,4) NOT NULL,
  quantity_consumed NUMERIC(10,4) DEFAULT 0,
  reserved_at TIMESTAMPTZ DEFAULT NOW(),
  reserved_by UUID REFERENCES users(id),
  consumed_at TIMESTAMPTZ,
  consumed_by UUID REFERENCES users(id)
);
```

### **Enhanced Existing Tables**

```sql
-- Enhance license_plates table
ALTER TABLE license_plates
  ADD COLUMN batch VARCHAR(50),
  ADD COLUMN expiry_date DATE,
  ADD COLUMN uom VARCHAR(20) NOT NULL DEFAULT 'kg',
  ADD COLUMN parent_lp_id INTEGER REFERENCES license_plates(id),
  ADD COLUMN is_consumed BOOLEAN DEFAULT FALSE,
  ADD COLUMN consumed_at TIMESTAMPTZ,
  ADD COLUMN consumed_by UUID REFERENCES users(id);

-- Enhance stock_moves table
ALTER TABLE stock_moves
  ADD COLUMN move_reason VARCHAR(50) CHECK (move_reason IN (
    'RECEIPT_PO', 'RECEIPT_TO', 'TRANSFER_IN', 'TRANSFER_OUT',
    'ADJUSTMENT', 'SPLIT', 'MERGE', 'PUTAWAY', 'PICK',
    'WO_CONSUME', 'WO_OUTPUT', 'QA_HOLD', 'QA_RELEASE', 'SCRAP'
  )),
  ADD COLUMN reference_number VARCHAR(50), -- PO, WO, TO number
  ADD COLUMN notes TEXT;
```

---

## 📅 Implementation Plan (4 Phases)

---

### **PHASE 1: ASN & Receiving Enhancement (Week 1-2)** 🔥

**Goal:** Enable ASN-driven receiving with prefill and automatic LP creation

#### **Deliverables:**

1. **Database Schema**
   - ✅ Create `asns` table
   - ✅ Create `asn_items` table
   - ✅ Enhance `license_plates` (batch, expiry, uom)
   - ✅ Enhance `stock_moves` (move_reason, reference)

2. **API Endpoints**
   - `ASNsAPI.create()` - Create ASN from PO
   - `ASNsAPI.getAll()` - List ASNs with filters
   - `ASNsAPI.getById()` - Get ASN details
   - `ASNsAPI.link ToPO()` - Link ASN to PO
   - `ASNsAPI.receive()` - Receive ASN and create GRN + LPs

3. **UI Components (Desktop)**
   - `CreateASNModal` - Create ASN manually
   - `UploadASNModal` - Upload ASN from supplier (Excel/CSV)
   - `ASNTable` - List of ASNs
   - `ASNDetailsModal` - View ASN details
   - Enhanced `CreateGRNModal` - Prefill from ASN

4. **Scanner UI (Mobile)**
   - `scanner/receive` - Receive PO/TO with ASN prefill
   - Auto-generate LP numbers
   - Scan/manual entry for batch, expiry
   - Validation: no over-receipt

5. **Validation & Business Rules**
   - ✅ ASN must have valid PO or supplier
   - ✅ ASN items match PO items (product, UOM)
   - ✅ Receiving cannot exceed ASN quantity (configurable tolerance)
   - ✅ Batch/expiry required per product policy
   - ✅ Auto-create LPs with batch/expiry inheritance

**Acceptance Criteria:**
- [ ] ASN created from PO with all items prefilled
- [ ] GRN created from ASN with auto LP generation
- [ ] LP has batch, expiry, UOM populated
- [ ] Stock move records `RECEIPT_PO` with PO reference
- [ ] Scanner shows ASN items with prefilled quantities
- [ ] Over-receipt blocked (or tolerance-based warning)

---

### **PHASE 2: LP Genealogy & Traceability (Week 3-4)** 🔥

**Goal:** Complete traceability from RM to FG via LP genealogy

#### **Deliverables:**

1. **Database Schema**
   - ✅ Create `lp_genealogy` table
   - ✅ Create `lp_compositions` table
   - ✅ RPC function: `get_lp_genealogy_tree(lp_id)` - Recursive tree
   - ✅ RPC function: `get_lp_reverse_genealogy(lp_id)` - Where-used

2. **API Endpoints**
   - `LicensePlatesAPI.split()` - Split LP with genealogy
   - `LicensePlatesAPI.merge()` - Merge LPs with composition
   - `LicensePlatesAPI.getGenealogy()` - Get genealogy tree
   - `LicensePlatesAPI.getReverseGenealogy()` - Get where-used

3. **Enhanced Components**
   - `SplitLPModal` - Record genealogy on split
   - `AmendLPModal` - Update with genealogy notes
   - `LPGenealogyTree` - Visual tree component
   - `TraceabilityView` - Full trace from RM to FG

4. **Scanner Enhancements**
   - Split LP on scanner with genealogy
   - Merge LP on scanner with validation
   - View genealogy on scanner (last 3 levels)

5. **Business Rules**
   - ✅ Split: child LPs inherit batch/expiry from parent
   - ✅ Merge: only same product/batch/expiry/QA
   - ✅ Genealogy records operation type and user
   - ✅ Consumed LPs cannot be moved/split

**Acceptance Criteria:**
- [ ] Split LP creates 2+ child LPs with genealogy link
- [ ] Merge LP creates composition record
- [ ] Genealogy tree shows RM → PR → Pack → Box chain
- [ ] Reverse genealogy shows where LP was used
- [ ] Scanner displays genealogy on LP scan
- [ ] Audit trail: who/when/what for every operation

---

### **PHASE 3: Pallet Management & WO Reservations (Week 5-6)** 🔥

**Goal:** Enable pallet packing and WO material reservations

#### **Deliverables:**

1. **Database Schema**
   - ✅ Create `pallets` table
   - ✅ Create `pallet_items` table
   - ✅ Create `wo_reservations` table

2. **API Endpoints**
   - `PalletsAPI.create()` - Create pallet
   - `PalletsAPI.addLP()` - Add LP to pallet
   - `PalletsAPI.removeLP()` - Remove LP from pallet
   - `PalletsAPI.close()` - Close pallet (no more changes)
   - `WorkOrdersAPI.reserveMaterial()` - Reserve LP for WO
   - `WorkOrdersAPI.getReservations()` - Get WO reservations

3. **UI Components**
   - `CreatePalletModal` - Create pallet
   - `PalletDetailsModal` - View pallet contents
   - `AddLPToPalletModal` - Add LP to pallet
   - `WOReservationsTable` - View WO reservations

4. **Scanner UX (from 07_b_scanner_capabilities_and_ux.md)**
   - **Menu Flow:**
     1. Login → Select Line/Process (mandatory)
     2. Filter WO list by selected line
     3. WO detail: Progress bar, Required Items, Reservations
   - **Scan Flow:**
     1. Scan LP → Enter quantity OR press "Full" button
     2. Table: "Scanned for WO" (LP, product, qty, UOM, batch, expiry)
     3. Required Items checklist updates (progress per component)
   - **Pallet Creation:**
     - Condition: ALL components for unit must be reserved
     - Alert if insufficient components: [Confirm] / [Reject]
     - Book BOX quantity on pallet
   - **Validations:**
     - Start WO only for status `Released/Realise`
     - Reservation cannot exceed required quantity
     - Pallet with BOX blocked if components not fully reserved

5. **Business Rules**
   - ✅ Pallet can only contain LPs of same product (configurable)
   - ✅ Closed pallets cannot be modified
   - ✅ WO reservation locks LP (cannot be moved/split)
   - ✅ Consume LP releases reservation and creates genealogy
   - ✅ Progress bar: `reserved qty / required qty`

**Acceptance Criteria:**
- [ ] Pallet created with multiple LPs
- [ ] Pallet closed and moved as single unit
- [ ] WO shows Required Items checklist
- [ ] Scan LP → reserves material → updates progress
- [ ] Pallet creation blocked if components not reserved
- [ ] Alert shown when booking BOX > available components
- [ ] Audit: who/when reserved and consumed materials

---

### **PHASE 4: Scanner UX Polish & Extensions (Week 7-8)** 🟡

**Goal:** Production-ready scanner experience with error handling and offline mode

#### **Deliverables:**

1. **Scanner Menu & Navigation**
   - Line/Process selection on login (persistent session)
   - "Change Line/Process" in menu
   - Breadcrumbs: Home > Line > WO > Detail
   - Back button handling
   - Logout confirmation

2. **Scanner Input Enhancements**
   - Auto-focus on scan input field
   - Manual LP entry fallback (keyboard)
   - Barcode symbology support (Code-128, GS1-128, QR)
   - GS1 AI parsing (01=GTIN, 10=Batch, 17=Expiry)
   - Audio feedback (beep on success, buzzer on error)

3. **Error Handling & Validation**
   - Error codes standardized:
     - `LP_NOT_FOUND` - LP doesn't exist
     - `LP_ALREADY_CONSUMED` - LP consumed elsewhere
     - `LP_QA_BLOCKED` - QA status not Available
     - `OVER_RESERVE` - Quantity exceeds required
     - `DUPLICATE_SCAN` - LP already scanned
   - User-friendly error messages
   - Retry mechanism (3 attempts)
   - Override with supervisor PIN (configurable)

4. **Label Printing Service**
   - Print LP label after GRN
   - Print pallet label after pallet close
   - Print queue with retry logic
   - ZPL template engine
   - PDF fallback for non-ZPL printers

5. **Offline Mode (Optional)**
   - Queue operations when offline
   - Sync queue when online
   - Conflict resolution (last-write-wins or manual)
   - Visual indicator: Online / Offline / Syncing

6. **E2E Tests**
   - Scenario: Receive PO with ASN → Create LP
   - Scenario: Split LP → Verify genealogy
   - Scenario: Create pallet → Add LPs → Close
   - Scenario: Start WO → Scan LP → Reserve → Check progress
   - Scenario: Create pallet with BOX → Verify component validation
   - Scenario: Consume LP → Verify genealogy + reservation release

**Acceptance Criteria:**
- [ ] Scanner menu navigable with line selection
- [ ] Barcode scan auto-populates fields
- [ ] Error messages clear and actionable
- [ ] LP label prints after GRN
- [ ] Pallet label prints after close
- [ ] E2E tests pass for all scenarios
- [ ] Offline mode queues operations (if implemented)

---

## 🧪 Testing Strategy

### **Unit Tests (Vitest)**
- **ASNsAPI**: create, getAll, getById, receive
- **LicensePlatesAPI**: split, merge, getGenealogy, getReverseGenealogy
- **PalletsAPI**: create, addLP, removeLP, close
- **WorkOrdersAPI**: reserveMaterial, consumeMaterial, getReservations
- **Validation logic**: batch inheritance, QA checks, over-receipt

### **Integration Tests (Playwright + Supabase)**
- ASN creation → GRN → LP generation
- LP split → genealogy record → child LPs
- Pallet creation → add LPs → close
- WO reservation → scan LP → consume → output

### **E2E Tests (Playwright - Scanner)**
- Full receive flow: ASN → GRN → LP → Label print
- Full WO flow: Select line → Start WO → Scan LP → Reserve → Consume → Output
- Full pallet flow: Create → Add LPs → Close → Label print
- Error scenarios: Over-receipt, QA blocked, duplicate scan

### **Manual Testing Checklist**
- [ ] Scanner on real Android device
- [ ] Physical barcode scanner (USB/Bluetooth)
- [ ] Label printer (ZPL over network)
- [ ] Line selection persists across sessions
- [ ] Progress bar updates real-time
- [ ] Pallet validation alerts work
- [ ] Audit logs captured correctly

---

## 📋 Definition of Done (DoD)

### **Phase 1: ASN & Receiving**
- [ ] ASN tables created and migrated
- [ ] ASNsAPI methods implemented and tested
- [ ] Desktop UI: Create/Upload/View ASN
- [ ] Scanner UI: Receive with ASN prefill
- [ ] GRN creates LPs with batch/expiry
- [ ] Unit tests: 15+ tests, 90%+ coverage
- [ ] E2E tests: 3 scenarios
- [ ] Documentation updated

### **Phase 2: Genealogy & Traceability**
- [ ] Genealogy tables created
- [ ] RPC functions for tree queries
- [ ] LicensePlatesAPI enhanced
- [ ] Split/Merge record genealogy
- [ ] TraceabilityView component working
- [ ] Scanner shows genealogy
- [ ] Unit tests: 10+ tests
- [ ] E2E tests: 2 scenarios

### **Phase 3: Pallets & WO Reservations**
- [ ] Pallet tables created
- [ ] WO reservations table created
- [ ] PalletsAPI implemented
- [ ] WorkOrdersAPI.reserveMaterial() working
- [ ] Scanner menu: Line selection → WO list → Detail
- [ ] Required Items checklist updates
- [ ] Pallet creation validation (component check)
- [ ] Alert system for insufficient components
- [ ] Unit tests: 12+ tests
- [ ] E2E tests: 4 scenarios

### **Phase 4: Scanner Polish**
- [ ] Error codes standardized
- [ ] Label printing service working
- [ ] Barcode symbology support (GS1)
- [ ] Audio feedback on scan
- [ ] E2E tests: 6 scenarios
- [ ] Manual testing completed
- [ ] Documentation finalized

---

## 📈 Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Receiving Time** | 15 min/PO | 7 min/PO | Time from truck → LPs created |
| **Inventory Accuracy** | 95% | 99.5% | Cycle count variance |
| **Scanner Adoption** | 0% | 80% | % of operators using scanner |
| **Traceability Coverage** | 40% | 100% | % of LPs with genealogy |
| **Label Print Success** | N/A | 95% | % of labels printed on first try |
| **WO Material Errors** | ~5% | <1% | % of WOs with wrong materials consumed |

---

## 🚧 Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Barcode scanner compatibility** | High | Medium | Test with 3+ scanner brands early |
| **Offline mode complexity** | Medium | Low | Defer to P2 if timeline tight |
| **Label printer network issues** | Medium | Medium | Implement retry queue + PDF fallback |
| **GS1 AI parsing errors** | Low | Medium | Extensive unit tests + fallback to manual |
| **Scanner UX on small screens** | High | Low | Mobile-first design + real device testing |
| **Genealogy performance (deep trees)** | Medium | Low | Optimize RPC with recursive CTEs |

---

## 📚 Dependencies

### **Internal**
- ✅ **TD-001**: Client State Migration (90% complete)
- ✅ **EPIC-001 Phase 1**: By-Products (100% complete)
- ✅ **EPIC-001 Phase 2**: BOM Versioning (100% complete)
- 🟡 **EPIC-001 Phase 3**: Conditional Components (in progress)

### **External**
- Barcode scanner hardware (Android/Windows CE)
- Label printer (ZPL-compatible)
- Network infrastructure (WiFi for scanners)

---

## 🎓 References

- **`07_b_scanner_capabilities_and_ux.md`** - Detailed scanner requirements
- **`07_WAREHOUSE_AND_SCANNER.md`** - System overview
- **`12_DATABASE_TABLES.md`** - Database schema reference
- **TD-002 Summary** - E2E test patterns

---

## 🔄 Related Epics

- **EPIC-001**: BOM Complexity Enhancement (dependency)
- **EPIC-003**: Production Execution (future - uses scanner outputs)
- **EPIC-004**: QA & Traceability (future - uses genealogy)
- **TD-005**: Component Library (UI consistency for scanner)

---

**Epic Owner:** Warehouse & Production Teams  
**Estimated Duration:** 8 weeks (4 phases × 2 weeks)  
**Priority:** P0 (Critical for production readiness)  
**Status:** Ready for Implementation

---

**Prepared by:** AI Assistant (Claude Sonnet 4.5)  
**Date:** January 12, 2025  
**Review Status:** Draft - Ready for User Review

