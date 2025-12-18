# Executive Summary: expected_yield Schema Gap

**Timestamp**: 2025-12-14
**Issue**: TEC-010 Operation Modal has `expected_yield` field that doesn't exist in database
**Resolution**: Remove field from wireframe
**Status**: READY TO IMPLEMENT

---

## The Problem (2-Minute Summary)

```
ISSUE: Schema Mismatch
┌────────────────────────────────┐
│ TEC-010 Wireframe (UI Design)  │
├────────────────────────────────┤
│ ...                            │
│ expected_yield: 0-100%  ← DOESN'T EXIST
│ ...                            │
└────────────────────────────────┘
                ❌
┌────────────────────────────────┐
│ routing_operations table (DB)   │
├────────────────────────────────┤
│ sequence, name, machine_id,    │
│ duration, setup_time,          │
│ cleanup_time, labor_cost,      │
│ instructions                   │
│ (NO expected_yield)            │
└────────────────────────────────┘
```

---

## Why This Happened

Designer assumed: "If Production measures yield, operations need to expect yield"

Reality: Yield belongs to:
- **BOM level**: `scrap_percent` (ingredient waste), `yield_percent` (byproducts)
- **Work Order level**: `actual_yield_percent` (measured after operation)
- **NOT operations**: Operations define work, not expectations

---

## The Solution

**REMOVE** `expected_yield` from TEC-010 wireframe

```
┌────────────────────────────────┐
│ TEC-010 Wireframe (Fixed)      │
├────────────────────────────────┤
│ sequence                       │
│ operation_name                 │
│ machine_id                     │
│ setup_time / cleanup_time      │
│ duration                       │
│ labor_cost_per_hour            │
│ instructions                   │
└────────────────────────────────┘
                ✅
┌────────────────────────────────┐
│ routing_operations table       │
├────────────────────────────────┤
│ (matches exactly)              │
│                                │
└────────────────────────────────┘
```

---

## Three Lines of Evidence

### 1. Database Reality
**Migration 044** (current): Adds `cleanup_time` and `instructions`, but NO `expected_yield`

```sql
ALTER TABLE routing_operations
  ADD COLUMN cleanup_time INTEGER DEFAULT 0;  -- ✅
  ADD COLUMN instructions TEXT;                -- ✅
  -- NO expected_yield
```

### 2. PRD Compliance
**Technical PRD FR-2.43**: "Operation time tracking (setup, run, cleanup)"
- Mentions: time fields only
- Silent on: yield expectations

**No FR backing**: No requirement for operation-level yield

### 3. Design Pattern
- **Operations** = static definitions (what to do)
- **Yield** = dynamic measurements (how it performs)
- Keep separated: routing (definition) ≠ work order (execution)

---

## Impact

| Aspect | Cost | Risk | Benefit |
|--------|------|------|---------|
| **Complexity** | 15 mins | None | Clarity |
| **Files Changed** | 2 | None | Alignment |
| **Lines Changed** | ~40 | None | Correctness |
| **Code Changes** | 0 | None | Simplicity |
| **DB Changes** | 0 | None | Consistency |

---

## What Changes

### File 1: TEC-010-routing-detail.md
- DELETE: `expected_yield` from validation rules (3 lines)
- DELETE: `expected_yield` from API response (1 line)
- DELETE: `expected_yield` from request body (1 line)
- DELETE: `expected_yield` from Zod schema (4 lines)
- DELETE: `expected_yield` from field checklist (2 lines)
- ADD: "Note on Yield Tracking" section (explaining yield model)

### File 2: TEC-WIREFRAMES-SUMMARY.md
- DELETE: One row from field matrix

**Net**: -10 lines (all deletions)

---

## Why This is the Right Call

### Evidence Chain
```
❌ TEC-010 says: "expected_yield in operation"
    ↓
❌ Database doesn't have: "expected_yield column in routing_operations"
    ↓
❌ PRD doesn't require: "FR for operation yield"
    ↓
❌ Design pattern breaks: "operations as definitions should not have yield"
    ↓
✅ Solution: Remove from TEC-010
```

### Alternative Considered
**Option: Add `expected_yield` to schema**
- Would require new migration (overhead)
- Would require PRD backing (doesn't exist)
- Would break design pattern (operations shouldn't expect yield)
- **NOT recommended**

---

## Next Steps

### Immediate (10-15 mins)
1. Open TEC-010-routing-detail.md
2. Delete 6 references to expected_yield
3. Add "Note on Yield Tracking" section
4. Open TEC-WIREFRAMES-SUMMARY.md
5. Delete 1 row from field matrix
6. Commit and push

### Verification (2 mins)
```bash
grep -n "expected_yield" docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md
# Should return: (no matches)

grep -n "expected_yield" docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md
# Should return: (no matches)
```

### Ready for Handoff
- ✅ TEC-010 matches actual schema
- ✅ No non-existent fields in forms
- ✅ Clear yield tracking model documented
- ✅ Ready for FRONTEND-DEV implementation

---

## Supporting Documents

For deeper analysis, see:

1. **ANALYSIS-expected_yield-schema-gap.md** (detailed evidence)
2. **DECISION-expected_yield.md** (decision record)
3. **FIXPLAN-TEC010-remove-expected_yield.md** (line-by-line changes)
4. **IMPLEMENTATION-READY-TEC010-fix.md** (ready-to-copy text)
5. **SUMMARY-expected_yield-resolution.md** (comprehensive overview)

---

## Risk Assessment

| Area | Risk | Mitigation |
|------|------|-----------|
| **Implementation** | None | Design-only change |
| **Rollback** | None | Simple git revert |
| **Frontend** | None | Field never existed in schema |
| **Backend** | None | No API changes needed |
| **Database** | None | No migrations needed |

**Overall Risk**: VERY LOW

---

## Sign-Off

**Analysis**: Complete ✅
**Decision**: Made ✅
**Implementation Plan**: Ready ✅
**Risk Assessment**: Acceptable ✅
**Ready to Execute**: YES ✅

---

## TL;DR

**Problem**: TEC-010 has a field that doesn't exist in the database

**Why**: Designer confused operation definition with operation execution

**Solution**: Remove field from TEC-010 (it matches how yield actually works)

**Impact**: 2 files, ~10 minute fix, zero risk

**Status**: Ready to implement

---

**For questions, refer to supporting analysis documents.**
