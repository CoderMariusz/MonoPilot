# Decision: Remove expected_yield from TEC-010

**Status**: APPROVED FOR IMPLEMENTATION
**Decision Date**: 2025-12-14
**Severity**: Medium (Design alignment)

---

## Decision

**REMOVE** `expected_yield` field from TEC-010 Operation Modal wireframe.

---

## Why

### Schema Reality
- `routing_operations` table (Migration 044) does NOT have `expected_yield` column
- Only has: `duration`, `setup_time`, `cleanup_time`, `labor_cost_per_hour`, `instructions`

### PRD Alignment
- Technical module PRD (FR-2.40 to FR-2.55) has NO requirement for operation-level yield
- Yield is tracked at:
  - **BOM level**: `scrap_percent` (input loss), `yield_percent` (byproducts)
  - **Production level**: `actual_yield_percent` (measured at operation completion)

### Design Pattern
- Routing operations = STATIC DEFINITIONS (what work to do)
- Yield = DYNAMIC/MEASURED (how it performs in reality)
- Separation of concerns: Design ≠ Execution

---

## Changes Required

### 1. TEC-010 Wireframe (docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md)

**DELETE**:
- Validation rules for expected_yield (line ~646)
- Response field: `expected_yield: number` (line ~713)
- Request body field (line ~746)
- Zod schema validation (line ~987)
- Validation checklist items (lines ~1026, ~1131)

**ADD NOTE**:
```markdown
## Note on Yield Tracking

Yield/scrap tracked at:
- BOM level: scrap_percent (input waste), yield_percent (byproducts)
- WO level: actual_yield_percent (measured output after operation)
- NOT at operation definition level
```

### 2. TEC-WIREFRAMES-SUMMARY (docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md)

**DELETE LINE 175**:
```markdown
| expected_yield | N/A | N/A | ✅ Decimal input | Optional, default 100, 0-100% |
```

### 3. Database/Migrations

**NO CHANGES** - Schema already correct

---

## What This Fixes

| Aspect | Before | After |
|--------|--------|-------|
| **Schema Match** | ❌ Field in UI but not DB | ✅ UI matches schema |
| **PRD Compliance** | ❌ Field not in PRD | ✅ Only PRD-required fields |
| **Logic Clarity** | ❌ Confused operation definition with execution | ✅ Clean separation: routing = definition, WO = execution |

---

## Next Steps

1. Update TEC-010 wireframe (remove field references)
2. Update TEC-WIREFRAMES-SUMMARY (remove row)
3. Confirm no frontend code exists referencing operation.expected_yield
4. Confirm no API validation references expected_yield
5. Proceed to implementation

---

## Files Changed

- `docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md` - EDIT
- `docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md` - EDIT
- No database/migration changes

**Total Changes**: 2 files, ~20 line deletions

---

**Decision Maker**: UX-DESIGNER (based on PRD analysis + schema audit)
**Reviewed By**: ARCHITECT-AGENT (pending)
