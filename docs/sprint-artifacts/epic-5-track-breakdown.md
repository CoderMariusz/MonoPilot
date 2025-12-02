# Epic 5: Warehouse Module - Track Breakdown

**Date:** 2025-11-29
**Epic:** 5 - Warehouse & Scanner
**Total Stories:** 27 stories w 6 batches (05A-05C)
**Parallel Tracks:** 2 (Desktop + Scanner)

---

## Track Strategy

Epic 5 ma **3 grupy funkcjonalności** które można prowadzić równolegle:

### Track A: LP Core + Receiving (Foundation) - **ZRÓB PIERWSZY**
- LP creation, status, expiry, numbering
- ASN/GRN receiving workflow
- PO/TO receiving updates

### Track B: LP Operations + Stock Moves (Desktop)
- LP split/merge/genealogy
- Stock moves (location transfers, audit trail)
- Pallet management

### Track C: Scanner Workflows (Mobile-First)
- Scanner guided workflows
- Barcode validation
- Offline queue, session timeout

**⚠️ DEPENDENCY:** Track C wymaga Track A (LP core musi istnieć przed scanner workflows)

**✅ PARALLEL:** Track B może biec równolegle z Track A (od Story 5.5)

---

## Track A: LP Core + Receiving (MUST GO FIRST)

**Batches:** 05A-1, 05A-3
**Stories:** 10 stories (5.1-5.4, 5.8-5.13)
**Effort:** ~50-60 hours (~2 weeks)
**Priority:** P0 (blocks Track C)

### Story Sequence

#### Phase 1: LP Foundation (Batch 05A-1)
1. **5.1 - LP Creation** (8h)
   - Extend license_plates table (add warehouse_id, supplier_batch_number, qa_status, updated_by)
   - API: POST /api/warehouse/license-plates
   - Basic LP creation logic

2. **5.2 - LP Status Lifecycle** (6h)
   - Status transitions: Available → Reserved/Consumed/Quarantine/Merged → Shipped
   - API: PUT /api/warehouse/license-plates/:id/status
   - Status validation (cannot unreserve consumed LP)

3. **5.3 - LP Expiry & Batch Tracking** (6h)
   - FIFO/FEFO filtering logic
   - Expiry warnings (color-coded badges)
   - Batch number search

4. **5.4 - LP Number Generation** (8h)
   - Create warehouse_settings table (lp_number_format, printer_ip, auto_print)
   - Create lp_number_sequence table (org + warehouse + date counter)
   - Generate LP numbers: LP-{WH}-YYYYMMDD-NNNN
   - API: GET /api/warehouse/settings/:warehouseId

**Total:** 28 hours (3-4 days)

---

#### Phase 2: Receiving Workflow (Batch 05A-3)

5. **5.8 - ASN Creation** (6h)
   - Create asn, asn_items tables
   - API: POST /api/warehouse/asn
   - ASN list UI

6. **5.9 - ASN Item Management** (5h)
   - Add/edit/remove ASN items
   - API: POST /api/warehouse/asn/:id/items

7. **5.10 - Over-Receipt Validation** (4h)
   - Validate received qty vs PO qty
   - Over-receipt tolerance from warehouse_settings
   - Warning modal if over tolerance

8. **5.11 - GRN + LP Creation (Atomic)** (10h)
   - Create grn, grn_items tables
   - API: POST /api/warehouse/grn (transaction: GRN + LP creation)
   - Validate: ASN vs actual received
   - **ATOMIC:** If LP creation fails → rollback GRN

9. **5.12 - Auto-Print Labels** (4h)
   - ZPL label generation (product, qty, batch, expiry, barcode)
   - API: POST /api/warehouse/license-plates/:id/print
   - Auto-print if warehouse_settings.auto_print_on_receive = true

10. **5.13 - Update PO/TO Received Qty** (3h)
    - Update po_lines.received_qty after GRN
    - Update to_lines.received_qty after GRN
    - Auto-transition PO status (Receiving → Received if 100%)

**Total:** 32 hours (4-5 days)

**Track A Total:** 60 hours (~2 weeks, 1 developer)

---

## Track B: LP Operations + Stock Moves (PARALLEL from Story 5.5)

**Batches:** 05A-2, 05B-1, 05B-2
**Stories:** 12 stories (5.5-5.7, 5.14-5.22)
**Effort:** ~60-70 hours (~2 weeks)
**Priority:** P1 (can run parallel with Track A after 5.4)

### Dependency Note
**Track B wymaga Story 5.1-5.4 (LP Core)** ale NIE wymaga receiving (5.8-5.13).

Możesz zacząć Track B po Story 5.4 (LP numbering complete).

### Story Sequence

#### Phase 1: LP Operations (Batch 05A-2)

1. **5.5 - LP Split** (8h)
   - API: POST /api/warehouse/license-plates/:id/split
   - Split logic: Parent LP qty -= split_qty, new child LP created
   - Insert into lp_genealogy (relationship_type = 'split')
   - **DEPENDS ON:** 5.1 (LP creation), 5.4 (LP numbering)

2. **5.6 - LP Merge** (8h)
   - API: POST /api/warehouse/license-plates/merge
   - Merge logic: Multiple source LPs (same product+batch) → 1 combined LP
   - Source LPs status → 'merged'
   - Insert into lp_genealogy (relationship_type = 'combine')
   - **DEPENDS ON:** 5.1, 5.4

3. **5.7 - LP Genealogy Visualization** (6h)
   - API: GET /api/warehouse/license-plates/:id/genealogy
   - Tree visualization (parent/children)
   - Forward trace (all descendants)
   - Backward trace (all ancestors)
   - **DEPENDS ON:** 5.5, 5.6

**Total:** 22 hours (3 days)

---

#### Phase 2: Stock Moves (Batch 05B-1)

4. **5.14 - LP Location Move** (6h)
   - Create stock_moves table
   - API: POST /api/warehouse/stock-moves
   - Move LP from location A → location B
   - Update license_plates.location_id
   - **DEPENDS ON:** 5.1 (LP exists)

5. **5.15 - Movement Audit Trail** (4h)
   - Insert into stock_moves (from, to, qty, user, timestamp)
   - API: GET /api/warehouse/stock-moves (filter by LP, location, date)

6. **5.16 - Partial Move** (5h)
   - Split LP before move (use Story 5.5 logic)
   - Move portion to new location
   - **DEPENDS ON:** 5.5 (split), 5.14 (move)

7. **5.17 - Destination Validation** (3h)
   - Validate destination location in same warehouse
   - Quarantine locations require QA status = 'failed'
   - **DEPENDS ON:** 5.2 (LP status)

8. **5.18 - Movement Types** (4h)
   - Create movement_types enum (Transfer, Adjustment, Quarantine, Release, Return)
   - API: GET /api/warehouse/movement-types

**Total:** 22 hours (3 days)

---

#### Phase 3: Pallets (Batch 05B-2)

9. **5.19 - Pallet Creation** (5h)
   - Create pallets table
   - API: POST /api/warehouse/pallets
   - **DEPENDS ON:** 5.1 (LP core)

10. **5.20 - Pallet LP Management** (6h)
    - Add/remove LPs to pallet
    - API: POST /api/warehouse/pallets/:id/lps

11. **5.21 - Pallet Move** (4h)
    - Move entire pallet (all LPs)
    - Validate: All LPs same location before move
    - **DEPENDS ON:** 5.14 (stock moves)

12. **5.22 - Pallet Status** (3h)
    - Pallet status inherits from LPs (if any LP reserved → pallet reserved)
    - Status badges

**Total:** 18 hours (2-3 days)

**Track B Total:** 62 hours (~2 weeks, 1 developer)

---

## Track C: Scanner Workflows (START AFTER Track A Story 5.4)

**Batches:** 05C-1, 05C-2, 05C-3
**Stories:** 8 stories (5.23-5.27, 5.32, 5.36, plus offline queue)
**Effort:** ~45-55 hours (~1.5 weeks)
**Priority:** P1 (mobile-first for operators)

### Dependency Note
**Track C wymaga LP Core (5.1-5.4)** - operators skanują LPs, więc LP numbering musi działać.

**NIE wymaga Track B** - scanner może działać bez split/merge/pallets.

### Story Sequence

#### Phase 1: Scanner Core (Batch 05C-1)

1. **5.23 - Scanner Guided Workflows** (10h)
   - Mobile-first UI for receiving, consumption, output
   - Step-by-step flow (scan LP → confirm qty → submit)
   - Large touch targets (min 44px)
   - **DEPENDS ON:** 5.1-5.4 (LP core), 5.11 (GRN creation for receiving workflow)

2. **5.24 - Scanner Barcode Validation** (6h)
   - Validate LP barcode format
   - Validate location barcode
   - Error feedback (invalid barcode, LP not found)
   - **DEPENDS ON:** 5.1 (LP exists)

3. **5.25 - Scanner Feedback** (5h)
   - Success/error toasts
   - Audio beep on success
   - Vibration on error (mobile)

4. **5.26 - Scanner Operations Menu** (4h)
   - Main menu: Receive, Consume, Output, Move, Check Stock
   - Role-based filtering (operator sees subset)

5. **5.27 - Scanner Session Timeout** (3h)
   - Auto-logout after 30 min inactivity (configurable)
   - Warning 2 min before timeout
   - Resume workflow after re-login

**Total:** 28 hours (3-4 days)

---

#### Phase 2: Traceability Workflows (Batch 05C-2)

6. **5.32 - Scanner Quick Trace** (8h)
   - Scan LP → show genealogy (parents + children)
   - Mobile-optimized tree view
   - **DEPENDS ON:** 5.7 (genealogy visualization)

**Total:** 8 hours (1 day)

---

#### Phase 3: Offline Support (Batch 05C-3)

7. **5.36 - Offline Queue** (10h)
   - IndexedDB storage for offline actions
   - Queue sync when online
   - Conflict resolution (if LP changed while offline)

**Total:** 10 hours (1-2 days)

**Track C Total:** 46 hours (~1.5 weeks, 1 developer)

---

## Recommended Execution Plan

### Option 1: Sequential (1 Developer, Safe)

```
Week 1-2: Track A (LP Core + Receiving)
  └─ Stories 5.1 → 5.2 → 5.3 → 5.4 → 5.8 → 5.9 → 5.10 → 5.11 → 5.12 → 5.13

Week 3-4: Track B (LP Operations + Stock Moves)
  └─ Stories 5.5 → 5.6 → 5.7 → 5.14 → 5.15 → 5.16 → 5.17 → 5.18 → 5.19 → 5.20 → 5.21 → 5.22

Week 5-6: Track C (Scanner)
  └─ Stories 5.23 → 5.24 → 5.25 → 5.26 → 5.27 → 5.32 → 5.36
```

**Total Time:** 6 weeks (1 developer)

---

### Option 2: Parallel (2 Developers, Faster) ✅ RECOMMENDED

**Developer 1: Track A + Track C**
```
Week 1-2: Track A (LP Core + Receiving)
  └─ 5.1 → 5.2 → 5.3 → 5.4 → 5.8 → 5.9 → 5.10 → 5.11 → 5.12 → 5.13

Week 3-4: Track C (Scanner)
  └─ 5.23 → 5.24 → 5.25 → 5.26 → 5.27 → 5.32 → 5.36
```

**Developer 2: Track B (starts Week 1, after 5.4 done)**
```
Week 1: Wait for 5.4 (LP numbering) - work on Epic 4 Track B/C

Week 2-3: Track B (LP Operations + Stock Moves)
  └─ 5.5 → 5.6 → 5.7 → 5.14 → 5.15 → 5.16 → 5.17 → 5.18 → 5.19 → 5.20 → 5.21 → 5.22
```

**Total Time:** 4 weeks (2 developers in parallel)
**Speedup:** 33% faster (6 weeks → 4 weeks)

---

### Option 3: Maximum Parallelization (3 Developers) ⚡

**Developer 1: Track A (LP Core + Receiving)**
```
Week 1-2: Stories 5.1 → 5.2 → 5.3 → 5.4 → 5.8 → 5.9 → 5.10 → 5.11 → 5.12 → 5.13
```

**Developer 2: Track B Part 1 (LP Operations)**
```
Week 1: Wait for 5.4, work on Epic 4 Track B
Week 2: Stories 5.5 → 5.6 → 5.7
```

**Developer 3: Track B Part 2 (Stock Moves + Pallets)**
```
Week 1: Wait for 5.1-5.4, work on Epic 4 Track C
Week 2-3: Stories 5.14 → 5.15 → 5.16 → 5.17 → 5.18 → 5.19 → 5.20 → 5.21 → 5.22
```

**Then Developer 1 switches to Track C:**
```
Week 3-4: Stories 5.23 → 5.24 → 5.25 → 5.26 → 5.27 → 5.32 → 5.36
```

**Total Time:** 3 weeks (3 developers)
**Speedup:** 50% faster (6 weeks → 3 weeks)

---

## Dependency Matrix

### Critical Path Dependencies

```
Story 5.1 (LP Creation) ← FOUNDATION, BLOCKS ALL
  ↓
Story 5.2 (LP Status) ← BLOCKS: 5.17 (destination validation)
  ↓
Story 5.3 (LP Expiry) ← BLOCKS: Nothing
  ↓
Story 5.4 (LP Numbering) ← BLOCKS: 5.5, 5.6, 5.14, 5.23 (all create LPs)
  ├─────────────────┬─────────────────┐
  ↓                 ↓                 ↓
Track A           Track B           Track C
5.8 → 5.13        5.5 → 5.22        5.23 → 5.36
```

### Story-Level Dependencies

**NO dependencies (can run parallel after prerequisites):**
- 5.3 (Expiry) - independent filter logic
- 5.8, 5.9 (ASN) - new tables, no LP interaction
- 5.12 (Auto-print) - uses existing LP, no writes
- 5.18 (Movement types) - reference data only

**Depends on 5.1 (LP Creation):**
- 5.2 (Status) - updates license_plates.status
- 5.5 (Split) - reads + creates LPs
- 5.6 (Merge) - reads + creates LPs
- 5.14 (Move) - updates license_plates.location_id
- 5.19 (Pallets) - reads LPs
- 5.23 (Scanner) - scans LPs

**Depends on 5.4 (LP Numbering):**
- 5.5, 5.6 (Split/Merge) - new LPs need numbering
- 5.11 (GRN) - creates LPs with numbering
- 5.14 (Move) - might create LPs on partial move
- 5.23 (Scanner) - validates LP number format

**Depends on 5.5 (Split):**
- 5.6 (Merge) - uses genealogy table
- 5.7 (Genealogy) - visualizes split/merge tree
- 5.16 (Partial move) - uses split before move

**Depends on 5.11 (GRN):**
- 5.13 (Update PO/TO) - GRN triggers PO qty update
- 5.23 (Scanner receiving) - uses GRN API

**Depends on 5.14 (Stock Move):**
- 5.16 (Partial move) - extends basic move
- 5.21 (Pallet move) - uses stock_moves table

**Depends on 5.7 (Genealogy):**
- 5.32 (Scanner trace) - mobile genealogy view

---

## Conflict Detection

### ✅ NO CONFLICTS between tracks:

**Track A vs Track B:**
- Track A: Operates on `asn`, `grn`, `grn_items` tables
- Track B: Operates on `lp_genealogy`, `stock_moves`, `pallets` tables
- **Shared table:** `license_plates` (but different columns)
  - Track A: Reads/writes `status`, `location_id`, `warehouse_id`
  - Track B: Reads/writes `location_id` (stock moves), reads `quantity` (split/merge)
  - **Conflict risk:** LOW (different use cases, no simultaneous writes)

**Track A vs Track C:**
- Track C uses Track A APIs (GRN creation, LP creation)
- **Sequential dependency:** Track C MUST start after Track A Story 5.11

**Track B vs Track C:**
- Track C can use Track B features (split/merge via scanner) but NOT required for MVP
- **No conflict:** Independent workflows

---

## Integration Points (Cross-Track)

### Track A → Track B
- **5.11 (GRN) creates LPs** → **5.5/5.6 (Split/Merge)** operates on those LPs
- **5.4 (LP Numbering)** → **5.5/5.6** uses numbering for new split/merged LPs

### Track A → Track C
- **5.11 (GRN API)** → **5.23 (Scanner receiving)** calls GRN endpoint
- **5.4 (LP Numbering)** → **5.24 (Barcode validation)** validates LP number format

### Track B → Track C
- **5.5 (Split API)** → **5.23 (Scanner)** can trigger split from mobile (optional)
- **5.14 (Move API)** → **5.23 (Scanner)** uses move for receiving workflow

---

## Test Strategy per Track

### Track A Tests
- Unit: LP numbering sequence, ASN/GRN validation
- Integration: GRN + LP creation transaction (rollback on fail)
- E2E: Receive PO → create GRN → LPs created → auto-print label

### Track B Tests
- Unit: Split/merge qty calculations, genealogy tree traversal
- Integration: Split → genealogy record created, merge → source LPs merged status
- E2E: Split LP → new LP visible, merge 3 LPs → 1 combined LP

### Track C Tests
- Unit: Barcode validation regex, offline queue storage
- Integration: Scanner API calls (same as Track A/B APIs)
- E2E: Mobile browser tests (Playwright webkit), scan barcode → LP found → confirm → success

---

## Recommended Approach

### ✅ OPTION 2: 2 Developers Parallel

**Why:**
- Track A (LP Core + Receiving) is **critical foundation** - must go first
- Track B (Operations) can start early (after 5.4) on separate developer
- Track C (Scanner) reuses Track A APIs - low conflict risk
- 33% time saving vs sequential (6 weeks → 4 weeks)

**Execution:**

1. **Developer 1 (YOU):** Start Track A (5.1 → 5.4)
2. **After Story 5.4 done (LP numbering):**
   - Developer 1: Continue Track A (5.8 → 5.13)
   - Developer 2: Start Track B (5.5 → 5.22) **← PARALLEL**
3. **After Track A done:**
   - Developer 1: Start Track C (5.23 → 5.36)
   - Developer 2: Finish Track B

**Collision Prevention:**
- Use git branches: `epic-5-track-a`, `epic-5-track-b`
- Track A touches: `asn`, `grn`, `warehouse_settings` tables
- Track B touches: `lp_genealogy`, `stock_moves`, `pallets` tables
- Merge Track A first, then Track B (fewer conflicts)

---

**Sequential Order jeśli 1 Developer:**

```
Phase 1 (Foundation):
5.1 → 5.2 → 5.3 → 5.4 (LP Core - 28h)

Phase 2 (Receiving):
5.8 → 5.9 → 5.10 → 5.11 → 5.12 → 5.13 (Receiving - 32h)

Phase 3 (Operations):
5.5 → 5.6 → 5.7 → 5.14 → 5.15 → 5.16 → 5.17 → 5.18 (Stock Moves - 40h)

Phase 4 (Pallets):
5.19 → 5.20 → 5.21 → 5.22 (Pallets - 18h)

Phase 5 (Scanner):
5.23 → 5.24 → 5.25 → 5.26 → 5.27 → 5.32 → 5.36 (Scanner - 46h)
```

**Total:** 164 hours (~6 weeks sequential, ~4 weeks parallel)

---

_Prepared: 2025-11-29_
_Strategy: 2-track parallel execution recommended_
