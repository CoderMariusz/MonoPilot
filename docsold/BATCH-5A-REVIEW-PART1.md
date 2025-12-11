# 🔍 BATCH 5A COMPREHENSIVE REVIEW - CZĘŚĆ 1

**Reviewer:** Claude Code | **Data:** 2025-11-28
**Batch:** 5A (License Plate + Receiving)
**Stories:** 5.1-5.13 (13 stories total)
**Status:** ⚠️ ISSUES FOUND - REQUIRES CLARIFICATIONS

---

## 🔴 CRITICAL ISSUES (7 Found)

### Issue #1: Inconsistent LP Number Override (5.1 vs 5.4)

**Problem:**
- Story 5.1 AC1: `"lp_number (auto-generated, read-only unless override)"` - brak szczegółów
- Story 5.4 AC4: `"Admin provides explicit lp_number"` - ale to osobna historia
- **Niejasność:** Czy override jest w 5.1 czy 5.4?

**Pytanie do Product Ownera:**
- Czy override powinien być w 5.1 czy przenieść do 5.4?

**Rekomendacja:**
```
- Story 5.1: Tylko auto-generacja (bez override)
- Story 5.4: Dodać override functionality w AC4
- Update: 5.1 AC1 "read-only" (override added in 5.4)
```

---

### Issue #2: Warehouse_id Brakuje w LP Creation Form (5.1)

**Problem:**
```
Tech Spec:
  - LP format per warehouse: "LP-{WH}-YYYYMMDD-NNNN"
  - warehouse_id jest FK w license_plates
  - warehouse_settings jest 1:1 z warehouses

Story 5.1 AC1 (Create Modal):
  - ❌ Brak warehouse selection
  - ❌ Nie wiadomo, który format stosować
```

**Pytanie:**
- Skąd system wie, którego warehouse użyć?
- Z kontekstu logowanego użytkownika?
- Z receiving workflow?

**Rekomendacja:**
```
AC 1.1 (NEW): "Warehouse Selection"
- Option A: Required dropdown (prosty, ale powtórzenie)
- Option B: Derived from user/context (recommended - mniej confusion)

Technical Tasks:
- Wyjaśnić, jak warehouse jest określany
```

---

### Issue #3: Batch Number vs Supplier Batch - Terminologia (5.3)

**Problem:**
```
Story 5.1 AC1:
  - batch_number (required)
  - supplier_batch_number (optional)

Story 5.3 AC1:
  - Oba pola wspominane, ale bez jasnej definicji
  - Merge validation: które pole musi się zgadzać?

Brak wyjaśnienia: Co to właściwie są?
```

**Przykład:**
- Supplier wysyła lot "LOT-2025-001" → które pole?
- Merge: czy oba pola muszą się zgadzać, czy tylko batch_number?

**Rekomendacja:**
```
Story 5.3 AC1 (UPDATE):
  - batch_number: Wewnętrzny identyfikator (warehouse)
    Przykład: "BATCH-20250120-001"

  - supplier_batch_number: Numer losu od dostawcy
    Przykład: "LOT-2025-001"

Story 5.6 (Merge) AC:
  - Wyraźnie: które pole musi się zgadzać dla merge?
```

---

### Issue #4: Over-Receipt Validation - Błędna Kolejność (5.10 vs 5.11)

**Problem:**
```
Obecna kolejność:
  Story 5.10: Over-Receipt Handling
  Story 5.11: GRN + LP Creation

Logicznie:
  Over-receipt validation MUSI się dziać PODCZAS GRN creation
  Nie PO utworzeniu GRN
```

**Tech Spec (GRN transaction flow):**
```
3. INSERT grn record
4. FOR each grn_item:
   - Validate qty
   - CHECK over-receipt ← TUTAJ, w 5.11
```

**Rekomendacja:**
```
OPTION A (Preferred):
  - Merge 5.10 logic do 5.11 (over-receipt check w atomic transaction)
  - Story 5.10 rename → "Warehouse Settings: Over-Receipt Config"
  - Przesunąć do Story 5.31 (Settings)

OPTION B:
  - Reorder: 5.11 (GRN) THEN 5.10 (Config)
  - Ale 5.10 musi być zrobione PRZED 5.11 production
```

---

### Issue #5: ASN Optionality - Design Question (5.8 vs Tech Spec)

**Problem:**
```
Tech Spec: "ASN is OPTIONAL pre-arrival notification"
           "Users can receive:
             1. Via ASN → GRN (pre-notified)
             2. Directly from PO → GRN (ad-hoc)"

Ale w Batch 5A-3:
  - Story 5.8: ASN Creation (mandatory?)
  - Story 5.9: ASN Item Management (mandatory?)
  - Story 5.11: GRN Creation (supports both ASN and direct PO)

Niejasność: Czy ASN jest core czy optional feature?
```

**Pytanie do Product Ownera:**
```
1. Czy ASN jest REQUIRED dla receivingu?
   - TAK → ASN is core, stories 5.8-5.9 are necessary
   - NIE → ASN is optional, move to later batch

2. Czy klient może receive bez ASN?
   - TAK → GRN from PO directly (story 5.11 alone)
   - NIE → All receives must have ASN first
```

**Rekomendacja:**
```
IF ASN is truly optional:
  - Move 5.8-5.9 to later batch (5B or 5C)
  - Focus 5A-3 on core: GRN + LP from PO
  - Effort: 5A-3 becomes 5.10-5.13 only (4 stories)

IF ASN is required:
  - Update tech spec: "Required" not "Optional"
  - Keep 5A-3 as-is
  - Current assessment: Appears optional based on 5.11 AC
```

---

### Issue #6: Story 5.11 - Over-Complex (60+ linii AC)

**Problem:**
```
Story 5.11 effort estimate: 8-10 hours
AC6 includes:
  1. GRN creation (basic CRUD)
  2. LP auto-creation (with lp_number_sequence)
  3. Transaction atomicity (complex rollback)
  4. ASN status updates
  5. PO line received_qty updates
  6. PO status completion check
  7. Error handling (specific messages)
  + Testing: unit, integration, E2E, concurrency

To jest 3-4 kompleksowe features w jednej story!
```

**Rekomendacja (CRITICAL):**
```
BREAK Story 5.11 into 3 substories:

5.11a: GRN & LP Creation (Basic) - 3 points, 4-5h
  ✓ GRN CRUD operations
  ✓ Auto-generate GRN number
  ✓ Auto-create LPs from grn_items
  ✓ Link grn_items.lp_id
  ✓ Simple happy path

5.11b: GRN Integration - 3 points, 4-5h
  ✓ ASN status updates (if from ASN)
  ✓ PO received_qty updates
  ✓ PO completion logic
  ✓ TO status updates (if from TO)

5.11c: Transaction Atomicity & Error Handling - 2 points, 3-4h
  ✓ Atomic transaction wrapper
  ✓ Rollback scenarios (FK, validation)
  ✓ Specific error messages
  ✓ Idempotency handling
  ✓ Concurrent receiving tests

Total revised: 8 points, 11-14h (vs current 8h estimate - +40%)
```

---

### Issue #7: Story 5.7 - Over-Complex (100+ linii AC)

**Problem:**
```
Story 5.7 effort estimate: 8-10 hours
ACs 4-8 include:
  - Genealogy recording (100+ lines!)
  - Forward/backward trace (recursive CTE)
  - Circular dependency detection (complex)
  - Atomicity guarantees + FK validation
  - Trace verification + orphan detection
  - Operation type semantics
  - FDA compliance guarantees
  - Recall simulation

To jest 15-20 godzin pracy, nie 8-10!
Circular dependency detection alone = 3-4 godziny
```

**Rekomendacja (CRITICAL):**
```
BREAK Story 5.7 into 3 substories:

5.7a: Genealogy Basic Recording - 3 points, 4-5h
  ✓ Record genealogy during split/merge
  ✓ Forward trace (basic recursive CTE)
  ✓ Backward trace (basic recursive CTE)
  ✓ Operation type recording

5.7b: Genealogy Validation & Atomicity - 3 points, 4-5h
  ✓ Circular dependency detection
  ✓ FK validation (all IDs)
  ✓ Duplicate link detection
  ✓ Transaction wrapper for atomicity
  ✓ Rollback on error

5.7c: Advanced Genealogy & FDA - 2 points, 3-4h
  ✓ Orphan detection + warnings
  ✓ Trace verification post-insert
  ✓ FDA compliance checks
  ✓ Recall simulation (forward+backward)

Total revised: 8 points, 11-14h (vs current 8h - +40%)
```

---

## ⚠️ WARNINGS (12 Found)

### Warning #1: Status Transitions Incomplete (5.2)

**Problem:**
- Story 5.2 AC1: Valid transitions listed
- Tech Spec: Mentions 'merged' status
- **Brakuje:** Transitions dla/z 'merged' status

**Pytanie:**
```
available → merged? (gdy LP jest merged?)
merged → ?? (jest immutable?)
```

**Action:**
- Add AC 1.1: Transitions for 'merged' status

---

### Warning #2: RLS Policies Not Validated (All DB Stories)

**Problem:**
- Tech specs have RLS SQL
- Story ACs don't mention RLS validation
- **Brakuje:** "Verify RLS prevents cross-org access"

**Action:**
- Add to testing: "RLS isolation test per story"

---

### Warning #3: Number Sequence Tables Scattered (5.4, 5.8, 5.11)

**Problem:**
```
Story 5.4: lp_number_sequence
Story 5.8: asn_number_sequence ← gdzie to się tworzy?
Story 5.11: grn_number_sequence ← gdzie to się tworzy?
```

**Action:**
- Story 5.4: Create all 3 sequence tables
- OR: Document pattern w tech spec

---

### Warning #4: LP Detail Page Missing (5.1 & 5.2)

**Problem:**
- Story 5.2 AC2: "LP detail view" exists
- Story 5.1: Nie wspomina creation
- **Brakuje:** Who creates `/warehouse/license-plates/:id` page?

**Action:**
- Add to Story 5.1 frontend tasks: Create detail page

---

### Warning #5: Warehouse_id Backfill (5.1)

**Problem:**
```
Tech Spec: "STUB exists in database"
Nowe kolumny: warehouse_id, qa_status

Pytanie: Co z existing LPs?
```

**Action:**
- Add AC: Backfill existing LPs with default warehouse_id, qa_status

---

### Warning #6: Deleted LP Orphan Handling (5.7)

**Problem:**
```
AC5: "If parent LP deleted → children become orphans"

Pytanie: Co zapobiega deletion?
- RESTRICT (forbid)?
- CASCADE DELETE (dangerous)?
- SOFT DELETE + orphan flag?
```

**Action:**
- Clarify: FK constraint type + deletion policy

---

### Warning #7: Merged Status Immutability (5.6)

**Problem:**
- Tech Spec: "source LPs status → 'merged' (immutable)"
- Pytanie: Czy 'merged' status można zmienić?
- Czy jest constraint uniemożliwiający operations na merged LPs?

**Action:**
- Story 5.6: Add AC - merged LPs cannot be moved/consumed

---

### Warning #8: Concurrent LP Generation (5.4)

**Problem:**
```
Technical Tasks: "Sequence must be atomic"

Ale brakuje:
- SELECT FOR UPDATE strategy?
- PostgreSQL SEQUENCES (native)?
- Application-level locking?
```

**Action:**
- Add technical task: Specify concurrency strategy

---

### Warning #9: GRN Idempotency (5.11)

**Problem:**
```
If user retries GRN creation:
- Same request twice → ?
- Is it idempotent?
- Error message if duplicate?
```

**Action:**
- Add AC: "Idempotent GRN: retry → same result"

---

### Warning #10: Error Recovery Flow (5.11)

**Problem:**
- Atomic transaction described
- **Brakuje:** How does user recover from failed receiving?
- Can they retry? Partial receive?

**Action:**
- Add AC: Error recovery + retry instructions

---

### Warning #11: PO Ownership Question (5.11 vs 5.13)

**Problem:**
```
Story 5.11 AC6: "UPDATE po_line.received_qty"
Story 5.13: "Update PO/TO Qty" ← co to robi?

Czy 5.13 to UI czy backend?
```

**Action:**
- Clarify: 5.11 owns logic, 5.13 owns dashboard?

---

### Warning #12: Label Printing Failure Handling (5.12)

**Problem:**
- Tech Spec: ZPL template + printer_ip
- **Brakuje:** What if printer unavailable?
- Retry? Queue? Manual?

**Action:**
- Add AC: Graceful failure + retry logic

---

## 📊 SUMMARY TABLE

| Story | Issue | Severity | Type |
|-------|-------|----------|------|
| 5.1 | LP override inconsistency | 🔴 High | Inconsistency |
| 5.1 | Warehouse_id missing form | 🔴 High | Missing spec |
| 5.1 | Detail page not mentioned | 🟡 Med | Missing task |
| 5.1 | Backfill existing LPs | 🟡 Med | Missing AC |
| 5.2 | 'merged' status transitions | 🟡 Med | Incomplete |
| 5.3 | Batch terminology unclear | 🟡 Med | Unclear |
| 5.4 | Concurrency strategy missing | 🟡 Med | Incomplete |
| 5.6 | (need to read) | ? | ? |
| 5.7 | **OVER-COMPLEX** | 🔴 High | Too large |
| 5.8 | ASN optionality unclear | 🟡 Med | Design Q |
| 5.10 | Over-receipt after GRN | 🔴 High | Wrong order |
| 5.11 | **OVER-COMPLEX** | 🔴 High | Too large |
| 5.12 | Printer failure handling | 🟡 Med | Incomplete |
| 5.13 | Unclear ownership | 🟡 Med | Overlap |

