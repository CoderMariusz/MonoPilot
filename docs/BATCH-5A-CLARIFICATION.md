# 📌 BATCH 5A - FINAL CLARIFICATION & DECISIONS

**Status:** ✅ READY FOR IMPLEMENTATION

---

## ✅ ALL DECISIONS CONFIRMED

### 1️⃣ Deleted LP & Genealogy → Option B ✅

```
DECISION: Archive Parent Info (soft delete + text backup)

Implementation:
  [ ] Add to license_plates:
    - deleted_at TIMESTAMPTZ (NULL = not deleted)
    - archived_parent_lp_number VARCHAR (for orphans)

  [ ] When LP deleted:
    - Set deleted_at = now()
    - Genealogy.parent_lp_id still points to LP
    - FK constraint: still valid (deleted LP still exists)

  [ ] Orphan detection:
    - Query: parent LP where deleted_at IS NOT NULL
    - UI warning: "⚠️ Parent LP-001 (deleted on 2025-01-27)"

  [ ] Traceability preserved:
    - Genealogy immutable → genealogy.parent_lp_id always valid
    - Can trace back to deleted parent via genealogy
    - FDA compliance: full traceability maintained
```

---

### 2️⃣ LP Number Sequence Clarification 🎯

**Your comment:**
> "LP sequence możemy wziąć z czasów jak zostały LP zarezerwowane do pracy"

**I think there's a misunderstanding. Let me clarify:**

```
LP NUMBER SEQUENCE = Format for LP numbering
  NOT related to reservation/consumption timeline

CURRENT DESIGN:
  LP Number Format: LP-YYYYMMDD-NNNN
  Example: LP-20250127-0001, LP-20250127-0002

  YYYYMMDD = Date when LP was CREATED
  NNNN = Daily counter (resets at midnight)

  Sequence Table (lp_number_sequence):
    - Tracks: org_id, warehouse_id, sequence_date, next_sequence
    - Increments daily counter
    - Resets at midnight (new date = 0001)

WHEN LP IS CREATED (from receiving/GRN):
  1. Get current date (YYYYMMDD)
  2. Query lp_number_sequence for today
  3. Get next counter (NNNN)
  4. Format: "LP-20250127-0003"
  5. Increment counter for next LP

WHEN LP IS CONSUMED (work order):
  - LP number DOES NOT CHANGE
  - Already has LP-20250127-0003
  - Consumption creates genealogy record (not new LP)
```

**So the question I asked was:**

```
"Should sequence use reserved_at (when LP allocated to WO)
or created_at (when LP physically created in receiving)?"
```

**Your answer confirms:**
```
"ta sequence możemy wziąć z czasów jak zostały LP zarezerwowane"

I think you mean:
- LP created in receiving on 2025-01-20 at 10:00
- LP allocated to WO on 2025-01-27 at 14:00
- LP number format uses: 2025-01-20 (creation date)
- NOT 2025-01-27 (reservation date)
```

**CLARIFICATION NEEDED:**
```
So we're using:
  ✅ LP-YYYYMMDD-NNNN format (YYYYMMDD = LP creation date)
  ❓ Not related to reservation/consumption timeline
  ❓ Sequence resets daily at midnight

Is this correct? Or did I misunderstand what you meant?
```

**If you meant something different, please clarify:**
- Should LP number include reservation date?
- Or should LP track "created_at" vs "reserved_at" separately?

---

### 3️⃣ Batch Number (Merge Validation) → Option A ✅

```
DECISION: Cannot merge LPs from different suppliers

REASONING: Different prices + allergens = must stay separate

MERGE VALIDATION (Story 5.6):
  ✅ All source LPs must have SAME supplier
  ✅ All source LPs must have SAME product
  ✅ All source LPs must have SAME supplier_batch_number
  ✅ All source LPs must have SAME expiry_date

  If any mismatch → Error: "Cannot merge LPs from different suppliers"

IMPLEMENTATION:
  - Story 5.3: Remove batch_number field entirely
  - Keep ONLY supplier_batch_number
  - Story 5.6: Merge validation checks supplier match
```

---

### 4️⃣ Merged LP Status → Can do operations ✅

```
DECISION: Merged result LP can be split/merged again

FLOW:
  LP-001 (30kg) + LP-002 (70kg) → MERGE → LP-003 (100kg)

  Source LPs:
    LP-001 → status='merged' (immutable, archived)
    LP-002 → status='merged' (immutable, archived)

  Result LP:
    LP-003 → status='available' (normal operations allowed)
    Can SPLIT: LP-003 → LP-004 + LP-005 ✅
    Can MERGE: LP-003 + LP-006 ✅
    Can CONSUME: LP-003 in work order ✅

GENEALOGY:
  LP-001 → (merge) → LP-003
  LP-002 → (merge) → LP-003
  LP-003 → (split) → LP-004, LP-005
  LP-003 + LP-006 → (merge) → LP-007

TRACEABILITY:
  Forward trace from LP-001: LP-001 → LP-003 → LP-004/LP-005/LP-007
  Backward trace from LP-004: LP-004 → LP-003 → LP-001/LP-002/LP-006
```

---

### 5️⃣ LP Detail Modal → Scrollable ✅

```
DECISION: Modal design

SPECIFICATIONS:
  - Max size: 85% of window (height + width)
  - Scrollable: Yes (both X and Y if needed)
  - Resizable: Optional (keep fixed for consistency)
  - Responsive: Adapt to mobile (full screen on <768px)

CONTENT IN MODAL:
  Tab 1: LP Overview
    - LP Number, Product, Quantity, UoM
    - Batch info, Expiry, Status
    - Location, Created/Updated dates
    - Action buttons: Edit, Move, Split, Merge, Change Status

  Tab 2: Genealogy
    - Parent LP (if exists)
    - Child LPs (if exist)
    - Trace Forward button (expand tree)
    - Trace Backward button (expand tree)

  Tab 3: History
    - Status changes
    - Movements
    - Operations timeline

TRIGGER:
  - Click LP in list/search → Open modal
  - Click LP in genealogy tree → Open modal
  - Consistent behavior across app
```

---

### 6️⃣ Soft Delete & Genealogy → Option C ✅

```
DECISION: Archive + keep LP record (never truly delete)

IMPLEMENTATION:
  [ ] Add to license_plates:
    - deleted_at TIMESTAMPTZ (NULL = active)
    - archived_info JSON (optional backup data)

  [ ] Delete behavior:
    - UPDATE license_plates SET deleted_at = now()
    - Do NOT physically delete
    - FK constraint always valid

  [ ] Genealogy impact:
    - genealogy.parent_lp_id always points to valid LP
    - Even if LP is deleted (deleted_at IS NOT NULL)
    - No orphans, no broken references

  [ ] Orphan detection:
    - Query: WHERE deleted_at IS NOT NULL
    - UI shows: "⚠️ Parent deleted on 2025-01-27"
    - Still fully traceable (genealogy intact)

  [ ] FDA Compliance:
    - Genealogy immutable and complete
    - No broken traces
    - Full backward/forward traceability preserved
    - Audit trail: when LP was deleted
```

---

## 📋 FINAL DECISIONS TABLE

| Issue | Decision | Impact |
|-------|----------|--------|
| **Issue 1** | LP Override | From user default warehouse |
| **Issue 2** | Batch Number | REMOVE batch_number, keep supplier_batch_number |
| **Issue 3** | Over-Receipt | Merge to Story 5.11c |
| **Issue 4** | ASN | Move to later batch (5B/5C) |
| **Issue 5** | Story 5.11 | Split to 5.11a/b/c (11-14h total) |
| **Issue 6** | Story 5.7 | Split to 5.7a/b/c (11-14h total) |
| **Warn 1** | Status 'available' | Add 'merged' transitions to Story 5.2 |
| **Warn 2** | RLS Validation | Add to testing all stories |
| **Warn 3** | Sequences | Use LP creation date (YYYYMMDD) |
| **Warn 4** | LP Detail | Modal (not page), scrollable, 85% size |
| **Warn 5** | Backfill | Add to Story 5.1 tasks |
| **Warn 6** | Deleted LP | Soft delete (deleted_at), keep genealogy |
| **Warn 7** | Merged Status | Can split/merge again (normal operations) |
| **Warn 8** | Concurrency | SELECT FOR UPDATE on lp_number_sequence |
| **Warn 10** | Printer Retry | Queue + manual selection option |
| **Warn 11** | PO Updates | 5.11 = backend, 5.13 = frontend |

---

## 🎯 NEXT ACTIONS

### IMMEDIATE (Before coding):

1. ✅ **Confirm Sequence Clarification** - above
   - Are we using LP creation date (YYYYMMDD)?
   - Or something else?

2. ✅ **Update Database Schema:**
   ```sql
   ALTER TABLE license_plates
     DROP COLUMN batch_number,
     ADD COLUMN deleted_at TIMESTAMPTZ,
     ADD COLUMN reserved_at TIMESTAMPTZ,
     ADD COLUMN warehouse_id UUID NOT NULL;

   ALTER TABLE users
     ADD COLUMN warehouse_id UUID;

   ALTER TABLE warehouse_settings
     ADD COLUMN allow_merge BOOLEAN DEFAULT true;
   ```

3. ✅ **Create Updated Stories:**
   - Story 5.1: Remove batch_number, add warehouse context, add modal detail view
   - Story 5.2: Add 'merged' status transitions
   - Story 5.3: Simplify (only supplier_batch_number)
   - Story 5.6: Update merge validation (supplier match required)
   - Story 5.7: Split to 5.7a/b/c
   - Story 5.11: Split to 5.11a/b/c

4. ✅ **Create Context XMLs:**
   - For each split story (5.7a/b/c, 5.11a/b/c)
   - Include updated ACs and technical tasks

5. ✅ **Update Tech Spec:**
   - Remove batch_number schema
   - Add deleted_at / soft delete strategy
   - Update genealogy FK constraints
   - Add warehouse_settings changes

---

## ⚠️ REMAINING CLARIFICATION

**ONE QUESTION LEFT:**

```
LP Number Sequence Timing:

Current understanding:
  LP-20250127-0001 = LP created on 2025-01-27
  Sequence counter resets at midnight

Your statement:
  "LP sequence możemy wziąć z czasów jak zostały LP zarezerwowane"

Are these the same thing?
  A) YES - Use LP creation date (YYYYMMDD in number)
  B) NO - Use reservation date instead
  C) Something else entirely
```

**Please confirm** - this affects Story 5.4 implementation!

---

## 📊 REVISED BATCH 5A STRUCTURE

```
BATCH 5A-1: License Plate Core (5.1-5.4)
  5.1: LP Creation CRUD (with warehouse context, no batch_number)
  5.2: LP Status Tracking (with 'merged' transitions)
  5.3: Batch/Expiry Tracking (supplier_batch_number only)
  5.4: LP Number Generation (YYYYMMDD-NNNN format)
  Effort: 10-14h

BATCH 5A-2: LP Operations (5.5-5.7)
  5.5: LP Split
  5.6: LP Merge (supplier match validation)
  5.7a: Genealogy Basic Recording (4-5h)
  5.7b: Genealogy Validation & Atomicity (4-5h)
  5.7c: Advanced Genealogy & FDA (3-4h)
  Effort: 17-22h

BATCH 5A-3: Receiving (5.8-5.13)
  5.10: Over-Receipt (moved or merged to 5.11c)
  5.11a: GRN & LP Creation (4-5h)
  5.11b: GRN Integration (4-5h)
  5.11c: Transaction Atomicity (3-4h)
  5.12: Auto-Print Labels
  5.13: PO/TO Status Updates (frontend)
  Effort: 25-35h (ASN moved to later batch)

TOTAL BATCH 5A: 52-71h (vs original 57-70h, but more realistic)
```

---

**Status:** ⏳ Awaiting sequence clarification
**Then:** All stories updated + ready for development

