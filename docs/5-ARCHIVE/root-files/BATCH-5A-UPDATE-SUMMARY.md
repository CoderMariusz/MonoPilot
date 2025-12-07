# ✅ BATCH 5A - UPDATES APPLIED SUMMARY

**Date:** 2025-11-28
**Status:** IN PROGRESS - Stories being updated with PO decisions

---

## ✅ COMPLETED UPDATES

### Story 5.1: License Plate Creation - UPDATED ✅

**Changes Applied:**
- ❌ Removed `batch_number` from form (LP number plays batch role)
- ✅ Changed `batch_number` → `supplier_batch_number` (required)
- ✅ Added `warehouse_id` context (derived from user default warehouse)
- ✅ Added LP Detail Modal (scrollable, 85% window, not separate page)
- ✅ Updated AC 1: removed batch_number, added warehouse_id
- ✅ Updated AC 4: changed table columns (supplier_batch instead of batch_number)
- ✅ Updated AC 5: validation errors for supplier_batch_number
- ✅ Updated Frontend tasks: warehouse context setup, detail modal
- ✅ Updated Database tasks: removed batch_number, added deleted_at, updated status CHECK
- ✅ Updated effort: 8-10h → **10-12h** (added detail page + warehouse context)
- ✅ Updated Notes: explained batch role, soft delete, warehouse context

**File:** `/docs/batches/05A-1-lp-core/stories/5.1-lp-creation.md`

---

### Story 5.3: LP Batch/Expiry Tracking - UPDATED ✅

**Changes Applied:**
- ✅ Changed AC 1: batch_number → supplier_batch_number (required)
- ✅ Updated Backend tasks: removed batch_number filtering
- ✅ Updated Backend tasks: added soft delete (deleted_at IS NULL)

**File:** `/docs/batches/05A-1-lp-core/stories/5.3-lp-expiry.md`

---

## ⏳ IN PROGRESS - TO BE COMPLETED

### Story 5.2: LP Status Tracking
- Need to add: 'merged' status transitions
- Need to add: 'deleted' status handling
- Need to verify soft delete logic

### Story 5.6: LP Merge
- Need to update merge validation: must have SAME supplier (not just same product)
- Validation: cannot merge LPs from different suppliers (different prices, allergens)
- Result LP inherits supplier_batch_number from sources

### Stories 5.7a/b/c (Split from 5.7)
- 5.7a: Genealogy Basic Recording (4-5h)
- 5.7b: Genealogy Validation & Atomicity (4-5h)
- 5.7c: Advanced Features & FDA (3-4h)
- Need to add: soft delete handling (orphan detection)
- Need to add: option B for archive parent info in genealogy

### Stories 5.11a/b/c (Split from 5.11)
- 5.11a: GRN & LP Creation (4-5h)
- 5.11b: GRN Integration (4-5h)
- 5.11c: Transaction Atomicity (3-4h)
- Need to include: over-receipt validation (merge from 5.10)

---

## 📋 PO DECISIONS APPLIED

| Decision | Applied | Status |
|----------|---------|--------|
| Issue #1: Warehouse context → User default + settings | 5.1 | ✅ |
| Issue #2: Remove batch_number, keep supplier_batch | 5.1, 5.3 | ✅ |
| Issue #3: Over-receipt → Merge to 5.11c | Pending | ⏳ |
| Issue #4: ASN → Move to later batch | Not applicable (5A-3 ref) | ✅ |
| Issue #5: Split 5.11 into 5.11a/b/c | In progress | ⏳ |
| Issue #6: Split 5.7 into 5.7a/b/c | In progress | ⏳ |
| Warning #1: Add 'merged' status transitions | 5.2 | ⏳ |
| Warning #4: LP Detail in modal | 5.1 | ✅ |
| Warning #5: Backfill existing LPs | 5.1 DB tasks | ✅ |
| Warning #6: Soft delete + genealogy orphan | Planned in 5.7b | ⏳ |
| Warning #7: Merged LP operations (can split again) | Planned | ⏳ |
| Warning #8: Concurrency SELECT FOR UPDATE | 5.4 | ⏳ |
| Warning #10: Printer retry + manual selection | 5.12 | ⏳ |
| Warning #11: 5.11 backend, 5.13 frontend | 5.11/5.13 split | ⏳ |

---

## 📊 EFFORT ESTIMATES UPDATED

| Story | Original | Updated | Change | Notes |
|-------|----------|---------|--------|-------|
| 5.1 | 8-10h | **10-12h** | +2h | Detail page, warehouse context |
| 5.3 | 5-6h | 5-6h | — | Supplier_batch only |
| 5.7 | 8-10h | **15-20h SPLIT** | +5h | Into 5.7a/b/c |
| 5.11 | 8-10h | **15-20h SPLIT** | +5h | Into 5.11a/b/c |

---

## 🎯 NEXT ACTIONS

### Immediate (Today):

1. ✅ Update Story 5.2 (add 'merged' transitions)
2. ✅ Update Story 5.6 (merge validation: supplier match)
3. ✅ Create Story 5.7a (Genealogy Recording)
4. ✅ Create Story 5.7b (Genealogy Validation & Atomicity)
5. ✅ Create Story 5.7c (Advanced Features)
6. ✅ Create Story 5.11a (GRN & LP Creation)
7. ✅ Create Story 5.11b (GRN Integration)
8. ✅ Create Story 5.11c (Transaction Atomicity + Over-Receipt)
9. ✅ Create context XMLs for all split stories

### Follow-up:

1. Update tech spec with schema changes (remove batch_number, add deleted_at, etc.)
2. Create migration SQL files
3. Update other stories (5.4, 5.5, 5.8-5.13) as needed
4. Prepare for development kickoff

---

## 📁 FILES MODIFIED

```
docs/batches/05A-1-lp-core/stories/
  ✅ 5.1-lp-creation.md (UPDATED)
  ⏳ 5.2-lp-status.md (PENDING)
  ✅ 5.3-lp-expiry.md (UPDATED)
  ⏳ 5.4-lp-numbering.md (PENDING - concurrency strategy)

docs/batches/05A-2-lp-operations/stories/
  ⏳ 5.5-lp-split.md (PENDING)
  ⏳ 5.6-lp-merge.md (PENDING - supplier validation)
  ⏳ 5.7-lp-genealogy.md (SPLIT INTO 5.7a/b/c)

docs/batches/05A-3-receiving/stories/
  ⏳ 5.8-asn-creation.md (NO CHANGE - moved to later batch)
  ⏳ 5.10-over-receipt.md (MERGE TO 5.11c)
  ⏳ 5.11-grn-lp-creation.md (SPLIT INTO 5.11a/b/c)
  ⏳ 5.12-auto-print-labels.md (PENDING)
  ⏳ 5.13-update-po-to-qty.md (PENDING)
```

---

## 📝 KEY SCHEMA CHANGES

```sql
-- license_plates table changes:

-- REMOVE:
ALTER TABLE license_plates DROP COLUMN batch_number;

-- ADD/UPDATE:
ALTER TABLE license_plates
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN created_by UUID REFERENCES users(id),
  MODIFY COLUMN warehouse_id UUID NOT NULL,
  MODIFY COLUMN supplier_batch_number VARCHAR(50) NOT NULL;

-- UPDATE constraint:
ALTER TABLE license_plates
  DROP CONSTRAINT license_plates_status_check,
  ADD CONSTRAINT license_plates_status_check
    CHECK (status IN (
      'available', 'reserved', 'consumed', 'quarantine',
      'shipped', 'recalled', 'merged', 'deleted'
    ));

-- ADD INDEX for soft delete queries:
CREATE INDEX idx_license_plates_active
  ON license_plates(org_id, deleted_at)
  WHERE deleted_at IS NULL;

-- users table:
ALTER TABLE users ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);
```

---

## 🔍 VALIDATION CHECKLIST

Before moving to implementation:

- [ ] Confirm all Story 5.1-5.6 updated files
- [ ] Create all split story files (5.7a/b/c, 5.11a/b/c)
- [ ] Create context XMLs for all stories
- [ ] Update tech spec with schema changes
- [ ] Create migration SQL
- [ ] Run review meeting with team
- [ ] Get sign-off from Architecture
- [ ] Schedule implementation kickoff

---

**Status:** 🟡 IN PROGRESS (50% complete)
**Next Update:** After split stories created + context XMLs

