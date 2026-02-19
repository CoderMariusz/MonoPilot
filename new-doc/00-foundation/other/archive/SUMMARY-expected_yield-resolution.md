# Summary: expected_yield Schema Gap Resolution

**Issue ID**: TEC-010 expected_yield mismatch
**Status**: ANALYZED & DECISION MADE
**Date**: 2025-12-14

---

## Problem Statement

TEC-010 (Operation Modal) wireframe references `expected_yield` field in routing operations, but:
- Field does NOT exist in `routing_operations` schema (Migration 044)
- No PRD requirement for operation-level yield
- Creates schema mismatch between UI and database

---

## Root Cause Analysis

### Where Did expected_yield Come From?

Designer incorrectly assumed operations need yield expectations. But:

**Confusion**:
- Production module tracks `actual_yield_percent` at operation execution
- Designer thought: "If we measure actual yield, we need expected yield"

**Reality**:
- Expected vs actual yields belong at BOM level (ingredient scrap) or WO level (measured)
- Operations are static definitions (sequence, time, machine, cost)
- Yield is measured/tracked at execution, not defined at operation level

### Evidence from 3 Modules

| Module | Yield Field | Purpose | Schema Status |
|--------|------------|---------|---------------|
| **Technical** | `bom_items.scrap_percent` | Input ingredient waste | ✅ EXISTS |
| **Technical** | `bom_items.yield_percent` | Byproduct output % | ✅ EXISTS |
| **Technical** | `routing_operations.expected_yield` | ??? | ❌ MISSING |
| **Production** | `work_order_operations.actual_yield_percent` | Measured output | ✅ EXISTS |

**Pattern**: Yield is input-level OR output-level, never definition-level

---

## Decision

**OPTION A: Remove from TEC-010** (CHOSEN)
- ✅ Aligns with schema (no field to add)
- ✅ Aligns with PRD (no requirement)
- ✅ Aligns with design pattern (yield ≠ operation definition)
- ❌ Requires wireframe edit

**OPTION B: Add to schema** (REJECTED)
- ❌ No PRD backing (FR-2.43 only mentions setup/duration/cleanup)
- ❌ Breaks separation of concerns
- ❌ Creates confusion: expected at definition, actual at execution
- ❌ Adds migration overhead
- ✅ Would match current wireframe

**DECISION**: REMOVE from TEC-010

---

## Evidence Supporting Decision

### 1. PRD Analysis
**Technical Module (technical.md)**
- FR-2.43: "Operation time tracking (setup, run, cleanup)" - ONLY time fields mentioned
- No FR for operation-level yield expectations
- Yield FRs are: FR-2.27 (BOM byproducts), FR-2.34 (BOM yield calculation)

**Production Module (production.md)**
- FR-4.4: "Complete operation with actual yield" - Measured AFTER, not before
- Quote: "GIVEN operation status = 'In Progress', WHEN user clicks 'Complete' with yield = 95%, THEN status changes to 'Completed'"
- This is work order execution, not operation definition

### 2. Schema Reality
**Migration 044 (current state)**
```sql
ALTER TABLE routing_operations
ADD COLUMN cleanup_time INTEGER DEFAULT 0;      -- ✅ Added
ADD COLUMN instructions TEXT;                    -- ✅ Added
-- NO expected_yield column
```

**What Exists**:
- sequence, name, description, machine_id, duration, setup_time, cleanup_time, labor_cost_per_hour, instructions

**What's Missing**:
- expected_yield (and rightfully so)

### 3. Design Pattern Analysis

```
CORRECT ARCHITECTURE:
┌──────────────────────────────────────┐
│ Routing Operation (Definition)        │
├──────────────────────────────────────┤
│ sequence, name, machine, time, cost   │
│ "Here's what to do, takes 10 mins"    │
└──────────────────────────────────────┘
           ↓ (when executed)
┌──────────────────────────────────────┐
│ WO Operation (Execution)              │
├──────────────────────────────────────┤
│ actual_yield_percent, start_time, ... │
│ "Measured output: 98.5%, took 11 min" │
└──────────────────────────────────────┘
```

**NOT**:
```
INCORRECT (what TEC-010 tries to do):
┌──────────────────────────────────────┐
│ Routing Operation (Definition)        │
├──────────────────────────────────────┤
│ ...expected_yield = 100%              │ ← Confused with execution
│ "We expect 100% yield here"           │   (but we measure actual)
└──────────────────────────────────────┘
```

---

## Impact Assessment

### What Breaks If We Do Nothing
- ❌ TEC-010 references field that doesn't exist
- ❌ UI form will render input user can't save
- ❌ Frontend validation for non-existent field
- ❌ Confusion about yield tracking model

### What Fixes With Removal
- ✅ TEC-010 matches schema
- ✅ No non-existent fields in forms
- ✅ Clean model: BOM yields ≠ Operation yields ≠ Measured yields
- ✅ Simpler implementation

### Scope of Changes
- **Files Changed**: 2
- **Lines Deleted**: ~25
- **Lines Added**: ~15 (clarification note)
- **Net Change**: -10 lines
- **Code Changes**: 0
- **DB Changes**: 0
- **Risk**: VERY LOW

---

## Files to Update

### 1. TEC-010 Routing Detail Wireframe
**File**: `docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md`

**Deletions**:
- Validation rules object (expected_yield block)
- Response field (expected_yield line)
- Request body field
- Zod schema validation
- 2x checklist items

**Additions**:
- Clarification note: "Note on Yield Tracking" explaining BOM vs WO vs operation levels

### 2. Wireframes Summary
**File**: `docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md`

**Deletions**:
- One row from field matrix (expected_yield)

### 3. No Database Changes
Migration 044 is already correct.

---

## Verification Steps

After editing:

1. Search for "expected_yield" in TEC-010 file → Should find 0 results
2. Search for "expected_yield" in TEC-WIREFRAMES-SUMMARY → Should find 0 results
3. Verify TEC-010 matches routing_operations schema fields
4. Verify clarification note explains yield tracking model

---

## Next Actions

### If Approved:
1. Edit TEC-010 (remove expected_yield references)
2. Edit TEC-WIREFRAMES-SUMMARY (remove row)
3. Add to git
4. Commit with message: "docs(ux): Remove expected_yield from TEC-010 - yield tracked at BOM/WO level, not operation level"
5. Ready for FRONTEND-DEV handoff

### If Questioned:
Use this evidence:
- Schema doesn't have it (Migration 044)
- PRD doesn't require it (FR-2.43 only mentions setup/run/cleanup)
- Production module handles yield (actual_yield_percent)
- Design pattern: definition ≠ execution

---

## Conclusion

**expected_yield in operation modal is a wireframe design error**, not a missing schema feature.

Removing it:
- Aligns UI with schema ✅
- Aligns UI with PRD ✅
- Clarifies yield model (BOM/WO level, not operation level) ✅
- Simplifies implementation ✅
- Has zero risk ✅

**READY TO IMPLEMENT**

---

## Reference Documents

- **Detailed Analysis**: `.claude/ANALYSIS-expected_yield-schema-gap.md`
- **Decision Record**: `.claude/DECISION-expected_yield.md`
- **Fix Plan**: `.claude/FIXPLAN-TEC010-remove-expected_yield.md`
- **PRD**: `docs/1-BASELINE/product/modules/technical.md`
- **Architecture**: `docs/1-BASELINE/architecture/modules/technical.md`
- **Migration 044**: `supabase/migrations/044_add_routing_fields.sql`
- **TEC-010 Wireframe**: `docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md`

---

**Analysis Complete** ✅
**Decision Made** ✅
**Ready for Implementation** ✅
