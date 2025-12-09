# 📝 BATCH 5A - DECYZJE PRODUCT OWNERA

**Data:** 2025-11-28
**Status:** ✅ POTWIERDZONE

---

## ✅ CONFIRMED DECISIONS

### Issue #1: LP Number Override → Option B ✅

```
DECISION: User's default warehouse context
- LP creation inherits warehouse from user's default
- If user has 22+ warehouses: dropdown in menu to switch
- Scanner + PC settings: warehouse selection in settings
- Story 5.1: Use user's default warehouse_id

IMPLEMENTATION:
  [ ] User profile: add warehouse_id (FK to warehouses)
  [ ] Settings: allow change active warehouse
  [ ] Story 5.1: Use auth.user_warehouse_id
```

---

### Issue #2: Batch Number Semantics → REMOVE batch_number ✅

```
DECISION: Keep ONLY supplier_batch_number
PO INSIGHT: "LP itself plays the batch role"

CURRENT:
  - batch_number (internal)
  - supplier_batch_number (supplier)

REVISED:
  - ❌ REMOVE batch_number
  - ✅ KEEP supplier_batch_number

REASONING:
  - LP number = unique identifier per warehouse (batch role)
  - supplier_batch_number = FDA traceability link
  - Merge: all LPs with same supplier_batch_number can merge

IMPACT:
  - Story 5.1: Remove batch_number field from form
  - Story 5.3: Simplify (only supplier_batch_number)
  - Story 5.6: Merge validation: check supplier_batch_number match
```

---

### Issue #3: Over-Receipt Validation → Option A ✅

```
DECISION: MERGE over-receipt into Story 5.11c
- Story 5.10: Moved to later batch or settings
- Story 5.11c: Includes over-receipt check in atomic transaction
- If over-receipt detected → BLOCK GRN creation
```

---

### Issue #4: ASN Optionality → Move to Later Batch ✅

```
DECISION: ASN is OPTIONAL
- Move Story 5.8-5.9 to later batch (5B or 5C)
- Batch 5A-3 focus: Core receiving (GRN from PO)
- Story 5.11: Support direct PO receiving without ASN

NEW BATCH 5A-3 STRUCTURE:
  5.10: Over-Receipt Config → moved (or merged to 5.11)
  5.11: GRN + LP Creation (from PO directly)
  5.12: Auto-Print Labels
  5.13: Update PO/TO Received Qty

EFFORT: 5A-3 reduced from 41-51h to ~25-35h
```

---

### Issue #5: Story 5.11 → SPLIT ✅

```
APPROVED: Split into 5.11a/b/c as recommended
  5.11a: GRN & LP Creation (basic)
  5.11b: GRN Integration (ASN/PO updates)
  5.11c: Transaction Atomicity + Over-Receipt Validation
```

---

### Issue #6: Story 5.7 → SPLIT ✅

```
APPROVED: Split into 5.7a/b/c as recommended
  5.7a: Genealogy Basic Recording
  5.7b: Genealogy Validation & Atomicity (circular detection)
  5.7c: Advanced Features + FDA Compliance
```

---

## ⚠️ CRITICAL CLARIFICATIONS NEEDED

### Clarification #1: Warning #6 - Deleted LP & Genealogy Orphan

**PO Statement:**
```
"To jest poważny problem!!! bo nie mozemy stracic trace
po skasowaniu rodzic/consumpcji.
W tkim razie czy nie lepiej bedzie zapisywac to
w postacji text i LP rodzica??"
```

**Pytanie:**
- Czy proponujesz: **Archive (soft delete) zamiast hard delete**?
- Czy zapisywać tekst: "Deleted LP-001 (was parent)"?
- Czy genealogy record powinien mieć backup LP info?

**Opcje:**

```
OPTION A: Soft Delete (PREFERRED)
  - LP deleted → status='deleted'
  - Genealogy remains intact
  - Orphan detection: show "⚠️ Parent deleted"
  - Pro: Simple, maintains traceability
  - Con: Storage for deleted records

OPTION B: Archive Parent Info in Genealogy
  - When parent LP deleted: archive parent_lp_number + details to text field
  - genealogy record: parent_lp_id→NULL, parent_lp_backup_text filled
  - Pro: Traceability preserved even if LP deleted
  - Con: Complex, duplicate data

OPTION C: Forbid Delete (RESTRICT)
  - Cannot delete LP if children exist (FK RESTRICT)
  - Pro: Safety, maintains referential integrity
  - Con: User can't clean up database

RECOMMENDATION: Option A + Option C
  - Default: RESTRICT (cannot delete if children exist)
  - Admin cleanup: Soft delete after review
  - Genealogy: Always points to archived LP record
```

**Decision Needed:**
- ❓ Confirm Option A + C?
- ❓ Or do you prefer Option B (archive in text)?

---

### Clarification #2: Warning #3 - Number Sequences

**PO Statement:**
```
"LP jezeli chodzi o konsumpcje to tak juz wyjasnialem to
ta sequence mozemy wziac z czasow jak zostaly LP zarezerwowane do pracy"
```

**Question:**
- Do you mean: **Use the timestamp when LP was RESERVED (allocated to WO)**?
- So sequence is: reserved_at timestamp + counter?

**Current Understanding:**
```
LP numbering:
  Format: LP-YYYYMMDD-NNNN
  Sequence resets daily
  Example: LP-20250127-0001, LP-20250127-0002

PO suggests:
  Use reserved_at timestamp for sequence?
  reserved_at = when LP allocated to work order
  Not creation_at?
```

**Decision Needed:**
- ❓ Should LP number sequence use reserved_at or created_at?
- ❓ For GRN-created LPs, when is reserved_at set?

---

### Clarification #3: Issue #7 - Merged LP Operations

**PO Statement:**
```
"jezeli co poloczylismy to dale powinnismy moc na tym robic operacje
przykla mam 2 box miesa rm-123 30 i 70 kg robimy marge
teraz z tych 2 powstaje 1 ktory ma 100kg i dostaje status avaiable"
```

**Understanding:**
- LP-001 (30kg) + LP-002 (70kg) → merge → LP-003 (100kg)
- LP-003 status = 'available' ✅
- LP-001 + LP-002 status = 'merged' (immutable)
- LP-003: Can be split, moved, consumed ✅

**Confirmation:**
- ❓ Merged LP is immediately usable (available status)?
- ❓ Source LPs become immutable (merged status = no more operations)?
- ❓ Genealogy shows: LP-001 + LP-002 → LP-003?

---

### Clarification #4: Batch Number - Keep or Remove?

**PO Statement:**
```
"jezeli zostawienie batch pomoze w trace w merge i split to mozesz zostawic.
wtedy twoj pomysl mi pasuje"
```

**Understanding:**
- If batch_number is needed for tracing → keep it
- If not needed (LP plays that role) → remove it

**Question:**
- ❓ In Story 5.6 (Merge): Do ALL source LPs need **same supplier_batch_number** to merge?
- ❓ Or can LPs with different supplier_batch_number merge (if they're same product)?
- ❓ What about same product, different supplier batches?

**Example:**
```
Scenario: Merge LPs from different suppliers
  LP-001: Product="Flour", supplier="Acme", supplier_batch="LOT-001"
  LP-002: Product="Flour", supplier="Bob's", supplier_batch="LOT-002"

  Can these merge?
  A) NO - different suppliers → separate merged LPs
  B) YES - same product → merge into one LP (but which supplier_batch?)
```

**Decision Needed:**
- ❓ Merge rule: same supplier_batch_number required?
- ❓ Or: same product + warehouse enough?

---

### Clarification #5: LP Detail Page - Modal vs Page

**PO Statement:**
```
"ja bym LP detail dal w modalu nie stronie, bedzie wywolywane
w roznych miejscach. po kliknieciu na LP"
```

**Understanding:**
- ✅ LP detail = MODAL (not separate page)
- Modal triggered from LP list/search/genealogy views
- Modal shows: LP details, status, genealogy, actions

**Implementation Impact:**
- Story 5.1: Remove `/warehouse/license-plates/:id` page
- Story 5.2: Status change modal (inside LP detail modal)
- Story 5.7: Genealogy tree modal (inside LP detail)
- Story 5.5: Split modal (inside LP detail)
- Story 5.6: Merge modal (multi-select, then LP detail)

**Confirmation:**
- ❓ All LP operations (status, split, merge) via modal, not separate pages?

---

### Clarification #6: Warning #7 - Merged LP Status

**PO Statement:**
```
"jezeli co poloczylismy to dale powinnismy moc na tym robic operacje"
```

**Question:**
- ❓ After merge: LP-003 has status='available'?
- ❓ Can LP-003 be split again (creating children)?
- ❓ Can LP-003 be moved, consumed, merged again?
- ❓ Or is 'merged' source LPs, but result LP is normal?

**Current Understanding:**
```
Source LPs:  LP-001, LP-002 → status becomes 'merged'
Result LP:   LP-003 → status is 'available' (can do anything)

Genealogy:
  LP-001 → (merge) → LP-003
  LP-002 → (merge) → LP-003

LP-003 → (split) → LP-004, LP-005 (allowed?)
```

**Decision Needed:**
- ❓ Are merged source LPs permanently immutable?
- ❓ Can result LP be split/merged again?

---

## 🎯 ACTION ITEMS

### Immediate (Before Story Breakdown):

1. **Clarify Clarifications #1-6 above**
   - Soft delete vs archive vs restrict
   - LP number sequence timing
   - Merged LP operations
   - Batch number merge rules
   - Modal vs page
   - Merged LP status transitions

2. **Confirm Database Schema Changes:**
   - Remove batch_number field from license_plates?
   - Add warehouse_id to users table?
   - Add reserved_at timestamp to license_plates?
   - Add deleted_at (soft delete) to license_plates?

3. **Update Story Templates:**
   - Remove batch_number from 5.1 form
   - Add warehouse selection logic to 5.1
   - Update 5.6 (Merge) validation rules
   - Update 5.7 (Genealogy) for soft delete handling

### After Clarifications:

1. Create updated stories with all decisions
2. Update tech specs with schema changes
3. Create context XMLs for split stories (5.7a/b/c, 5.11a/b/c)
4. Update effort estimates
5. Prepare for development kickoff

---

## 📊 SUMMARY OF CHANGES

### Stories Being Split:
- ✅ Story 5.7 → 5.7a/b/c
- ✅ Story 5.11 → 5.11a/b/c
- ✅ Story 5.8-5.9 → Move to later batch
- ✅ Story 5.10 → Merge to 5.11c (or move to settings)

### Stories Being Modified:
- ✅ Story 5.1: Add warehouse context + remove batch_number
- ✅ Story 5.2: Confirm 'merged' transitions
- ✅ Story 5.3: Simplify (only supplier_batch_number)
- ✅ Story 5.6: Update merge validation rules

### New Requirements:
- ⚠️ User → Warehouse assignment
- ⚠️ Soft delete + orphan handling
- ⚠️ Modal-based LP detail view
- ⚠️ Over-receipt validation in 5.11c

---

**Status:** ⏳ Awaiting Clarifications #1-6
**Next Review:** After clarifications, all stories will be updated
