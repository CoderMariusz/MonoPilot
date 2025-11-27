# Next Session Handoff - Epic 5 Documentation Reorganization

**Current Progress:** 2/8 batches complete (5A-1, 5A-2). 1 batch in progress (5A-3 tech-spec done).

**Date Started:** 2025-01-27
**Branch:** `claude/create-epic-5-stories-011a5cYqZULQ6KTY8mKScV8d`

---

## ✅ COMPLETED (3 Batches)

### Batch 5A-1: LP Core (Stories 5.1-5.4) - COMPLETE
- ✅ tech-spec.md
- ✅ 5.1-lp-creation.md + 5.1.context.xml
- ✅ 5.2-lp-status.md + 5.2.context.xml
- ✅ 5.3-lp-expiry.md + 5.3.context.xml
- ✅ 5.4-lp-numbering.md + 5.4.context.xml
- **Location:** `/home/user/MonoPilot/docs/batches/05A-1-lp-core/`

### Batch 5A-2: LP Operations (Stories 5.5-5.7) - COMPLETE
- ✅ tech-spec.md
- ✅ 5.5-lp-split.md + 5.5.context.xml
- ✅ 5.6-lp-merge.md + 5.6.context.xml
- ✅ 5.7-lp-genealogy.md + 5.7.context.xml (includes Sprint 0 Gap 2 atomicity)
- **Location:** `/home/user/MonoPilot/docs/batches/05A-2-lp-operations/`

---

## 🔄 IN PROGRESS (1 Batch)

### Batch 5A-3: Receiving (Stories 5.8-5.13) - TECH-SPEC DONE

**What's Done:**
- ✅ tech-spec.md: ASN, GRN, grn_items tables, APIs, Gap 6 atomicity flow
- ✅ Committed and pushed to remote

**What's Needed (6 files each):**

#### Story 5.8: ASN Creation
- **File:** `5.8-asn-creation.md` (~200 lines)
- **Key ACs:**
  - Create ASN from PO with pre-filled items
  - Store carrier, tracking, expected arrival
  - Link to PO
- **Context:** `5.8.context.xml`
- **Tables:** asn, asn_items
- **API:** POST /api/warehouse/asns

#### Story 5.9: ASN Item Management
- **File:** `5.9-asn-item-mgmt.md` (~200 lines)
- **Key ACs:**
  - Edit batch_number, expiry_date, manufacture_date
  - Adjust quantities
  - Pre-fill from supplier metadata
- **Context:** `5.9.context.xml`
- **API:** PUT /api/warehouse/asns/:id/items

#### Story 5.10: Over-Receipt Validation
- **File:** `5.10-over-receipt.md` (~150 lines)
- **Key ACs:**
  - Warn/block if received > ordered
  - Show: Ordered, Already Received, Receiving
  - Configurable via warehouse_settings.allow_over_receipt
- **Context:** `5.10.context.xml`
- **Logic:** Check PO line received_qty vs ordered_qty

#### Story 5.11: GRN and LP Creation ⭐ CRITICAL (Gap 6)
- **File:** `5.11-grn-lp-creation.md` (~400 lines - LONGEST)
- **Key ACs:**
  - AC 1-5: Standard GRN creation flow
  - AC 6: **Transaction Atomicity (Gap 6 - CRITICAL)**
    - START transaction
    - INSERT grn record
    - INSERT grn_items for each line
    - INSERT license_plates (auto-generate LP number)
    - UPDATE asn.status → 'completed'
    - UPDATE po_line.received_qty
    - COMMIT or ROLLBACK (all-or-nothing)
  - Specific error messages for each failure point
  - FK validation requirements
- **Context:** `5.11.context.xml` (detailed atomicity requirements)
- **API:** POST /api/warehouse/grns (complex atomic endpoint)

#### Story 5.12: Auto-Print Labels
- **File:** `5.12-auto-print-labels.md` (~180 lines)
- **Key ACs:**
  - When LP created during receiving, print ZPL label
  - Label includes: LP#, barcode, product, batch, expiry, qty, location
  - Configure printer IP and settings
  - Option: auto-print enabled/disabled
- **Context:** `5.12.context.xml`
- **ZPL Template:** In tech-spec.md (copy to context)

#### Story 5.13: Update PO/TO Received Qty
- **File:** `5.13-update-po-to-qty.md` (~150 lines)
- **Key ACs:**
  - When GRN created, update po_line.received_qty += grn_qty
  - When all lines received >= ordered, PO.status → 'closed'
  - Same logic for Transfer Orders (TO)
- **Context:** `5.13.context.xml`
- **Trigger/Logic:** Automatic on GRN creation

---

## 📋 TODO FOR NEXT SESSION

**Order of Creation:**
1. Create story files (5.8-5.13) in `/docs/batches/05A-3-receiving/stories/`
2. Create context XMLs (5.8-5.13) in `/docs/batches/05A-3-receiving/stories/context/`
3. Commit: `feat: Complete Batch 5A-3 story files (5.8-5.13)`
4. Then move to next batch

**⚠️ IMPORTANT NOTES:**
- **Story 5.11 is most complex** - has Sprint 0 Gap 6 atomicity AC requiring detailed transaction flow
- **Use REORGANIZATION-GUIDE.md** pattern for extraction
- **Extract from:** `/home/user/MonoPilot/docs/epics/05-warehouse.md` (already have file)
- **Each story ~200-400 lines** in .md format
- **Each context XML ~300-500 lines** with tables, APIs, validation rules

---

## 🔮 REMAINING BATCHES (After 5A-3)

### Batch 5B-1: Stock Moves (Stories 5.14-5.18) - NOT STARTED
- 5.14: LP Location Move
- 5.15: Movement Audit Trail
- 5.16: Partial Move (Split on Move)
- 5.17: Destination Validation
- 5.18: Movement Types
- **Key Table:** stock_moves
- **Estimate:** ~1200 lines total

### Batch 5B-2: Pallets (Stories 5.19-5.22) - NOT STARTED
- 5.19: Pallet Creation
- 5.20: Pallet LP Management
- 5.21: Pallet Move
- 5.22: Pallet Status
- **Key Tables:** pallets, pallet_items
- **Estimate:** ~1000 lines total

### Batch 5C-1: Scanner Core (Stories 5.23-5.27) - NOT STARTED
- 5.23: Scanner Guided Workflows
- 5.24: Scanner Barcode Validation
- 5.25: Scanner Feedback
- 5.26: Scanner Operations Menu
- 5.27: Scanner Session Timeout
- **Key Concept:** PWA state machines, touch-optimized UI
- **Estimate:** ~1200 lines total

### Batch 5C-2: Traceability & Workflows (Stories 5.28-5.35) - NOT STARTED
- 5.28: Forward/Backward Traceability
- 5.29: Genealogy Recording
- 5.30: Source Document Linking
- 5.31: Warehouse Settings Configuration
- 5.32: Receive from PO (Desktop)
- 5.33: Receive from TO (Desktop)
- 5.34: Scanner Receive Workflow
- 5.35: Inventory Count
- **Estimate:** ~2000 lines total

### Batch 5C-3: Offline Queue (Story 5.36) - NOT STARTED
- 5.36: Scanner Offline Queue Management (Gap 5)
- **10 ACs** with IndexedDB offline queue, auto-sync on reconnect
- **Estimate:** ~1500 lines total (very detailed)

---

## 🎯 Overall Progress

**Completed:** 2/8 batches (25%)
- 5A-1: LP Core ✅
- 5A-2: LP Operations ✅

**In Progress:** 1/8 batches (12%)
- 5A-3: Receiving (tech-spec done, need stories)

**Pending:** 5/8 batches (63%)
- 5B-1, 5B-2, 5C-1, 5C-2, 5C-3

**Total Effort Remaining:** ~8000 lines documentation (~7 batches × ~1200 lines avg)

---

## 💾 Git Status

**Branch:** `claude/create-epic-5-stories-011a5cYqZULQ6KTY8mKScV8d`

**Latest Commit:**
```
feat: Add Batch 5A-3 tech-spec (Receiving flow)
- ASN, GRN, grn_items tables
- Gap 6: Atomic GRN + LP creation transaction
- Over-receipt validation
- ZPL label printing integration
```

**Ready to Push:** Yes (all changes committed)

---

## 🚀 Quick Start for Next Session

1. Pull latest: `git pull origin claude/create-epic-5-stories-011a5cYqZULQ6KTY8mKScV8d`
2. Navigate: `cd /home/user/MonoPilot/docs/batches/05A-3-receiving/stories/`
3. Reference: `/home/user/MonoPilot/docs/epics/05-warehouse.md` (lines 342-491 for stories 5.8-5.13)
4. Create story files using REORGANIZATION-GUIDE.md pattern
5. Create context XMLs with tech details from tech-spec.md
6. Commit per batch (all 6 stories together for 5A-3)

---

## 📚 Reference Files

- **Batch Index:** `/home/user/MonoPilot/docs/batches/index.md`
- **Reorganization Guide:** `/home/user/MonoPilot/docs/batches/REORGANIZATION-GUIDE.md`
- **Epic 5 Source:** `/home/user/MonoPilot/docs/epics/05-warehouse.md`
- **Tech Patterns:** See completed batches (5A-1, 5A-2) for examples

---

**Last Updated:** 2025-01-27
**Next Action:** Continue with Batch 5A-3 story files (5.8-5.13)
