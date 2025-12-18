# Resolution: expected_yield Field Removal from TEC-010

**Status**: CONSOLIDATED ARCHIVE
**Date**: 2025-12-14 (Analysis) | 2025-12-18 (Consolidated)
**Issue**: TEC-010 Operation Modal references `expected_yield` field that doesn't exist in `routing_operations` schema
**Decision**: REMOVE field from wireframe (design-only change)

---

## Executive Summary

The `expected_yield` field in TEC-010 (Operation Modal) is a **wireframe design error**. It does NOT exist in the database schema and has NO PRD requirement.

### Decision
**REMOVE** `expected_yield` from TEC-010 Operation Modal wireframe

### Why
- Field does NOT exist in `routing_operations` schema (Migration 044)
- NO PRD requirement for operation-level yield expectations
- Yield is tracked at BOM level (scrap_percent) and WO execution level (actual_yield_percent)
- Operations = static definitions (what work to do), NOT yield tracking

### Impact
- Design-only change (no code/DB changes needed)
- Effort: ~15 minutes
- Risk: LOW

---

## Architecture Context

### Yield Tracking Hierarchy in MonoPilot

```
PRODUCT LEVEL (Technical Module)
├─ BOM.scrap_percent (input waste at item level)
└─ BOM.yield_percent (byproduct output %)
        ↓
OPERATION DEFINITION (Routing - Technical Module)
├─ sequence, name, duration, setup_time, cleanup_time
├─ machine_id, labor_cost_per_hour
└─ instructions
├─ ❌ NO expected_yield (static definition, not measured)
        ↓
OPERATION EXECUTION (Production Module)
├─ work_order_operations.actual_yield_percent
└─ Measured AFTER operation completion
```

### Key Insight

1. **Operations are static definitions** - Describe WHAT work to do
2. **Yield is dynamic/measured** - Determined at runtime (actual output)
3. **BOM already tracks ingredient waste** - `scrap_percent` covers input loss
4. **Production module measures output** - `actual_yield_percent` when operation completes

**Example**:
- Routing Op #1: "Mixing" (3 mins, 2 workers) → No yield field needed
- BOM: Mix 100kg flour → 102kg dough (scrap = 2% loss)
- Production WO: Actual output = 101kg (actual_yield = 98.5%)

---

## Schema Analysis

### routing_operations Current Schema (Migration 044)

```sql
CREATE TABLE routing_operations (
  id UUID PRIMARY KEY,
  routing_id UUID NOT NULL,
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  machine_id UUID,
  duration INTEGER,              -- Run time in minutes
  setup_time INTEGER DEFAULT 0,
  cleanup_time INTEGER DEFAULT 0,
  labor_cost_per_hour DECIMAL(15,4),
  instructions TEXT,
  created_at TIMESTAMPTZ,

  UNIQUE(routing_id, sequence)
)
```

**Status**: ✅ All fields present and correct | ❌ NO `expected_yield` field (by design)

---

## PRD Requirements Analysis

### Technical Module PRD (technical.md)

**Routing & Operation FRs (FR-2.40 to FR-2.55)**:
- FR-2.43: "Operation time tracking (setup, run, cleanup)" - ONLY time fields
- FR-2.44: "Machine/work center assignment"
- FR-2.45: "Operation instructions and attachments"
- FR-2.54: "Routing unique code identifier"
- FR-2.55: "Routing reusability flag"

**Result**: ❌ NO FR mentions expected_yield at operation level

### BOM Level Yield
- FR-2.27: "BOM byproducts (yield %)" - At `bom_items` level
- FR-2.34: "BOM yield calculation" - Planned for Phase 2C-2
- **Schema**: `bom_items.scrap_percent` and `bom_items.yield_percent`

### Production Level Yield
- FR-4.4: "Complete operation with actual yield"
- Tracks `actual_yield_percent` at operation EXECUTION (not definition)
- **Schema**: `work_order_operations.actual_yield_percent`

---

## Files to Modify

### 1. docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md

**Remove 6 occurrences**:

1. **Lines ~646-649**: Validation rules object
   ```diff
   - expected_yield: {
   -   min: { value: 0, message: "Yield cannot be negative" },
   -   max: { value: 100, message: "Yield cannot exceed 100%" }
   - },
   ```

2. **Lines ~710-720**: API response object
   ```diff
   - expected_yield: number  // decimal, 0-100
   ```

3. **Lines ~740-760**: Request body example
   ```diff
   - expected_yield?: number  // default 100
   ```

4. **Lines ~980-1000**: Zod schema
   ```diff
   - expected_yield: z.number()
   -   .min(0, "Yield cannot be negative")
   -   .max(100, "Yield cannot exceed 100%")
   -   .optional()
   -   .default(100),
   ```

5. **Lines ~1020-1035**: Field validation checklist
   ```diff
   - ✅ expected_yield (Decimal input, optional, default 100, 0-100%)
   ```

6. **Lines ~1125-1135**: Final validation checklist
   ```diff
   - ✅ expected_yield (Decimal input, optional, default 100, 0-100%)
   ```

**Add clarification note** (new section):
```markdown
## Note on Yield Tracking

Yield and scrap are tracked at different levels in MonoPilot:

- **BOM Item Level** (`bom_items.scrap_percent`, `bom_items.yield_percent`)
  - `scrap_percent`: Input waste percentage (e.g., 2% loss in mixing)
  - `yield_percent`: Output for byproducts (e.g., 5% oil from 100kg seeds)

- **Work Order Execution Level** (`work_order_operations.actual_yield_percent`)
  - Measured AFTER operation completion in Production module
  - Tracks actual output vs planned (e.g., 98.5% vs 100% expected)

- **NOT at Operation Definition Level**
  - Routing operations describe WHAT work to do (static)
  - Yield is measured DURING execution (dynamic)
```

### 2. docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md

**Delete row 175**:
```diff
- | expected_yield | N/A | N/A | ✅ Decimal input | Optional, default 100, 0-100% |
```

### 3. No Migration Changes Needed
- Migration 044 already deployed without `expected_yield`
- Schema is correct as-is

---

## Comparison with Related Modules

| Aspect | BOM Items | Routing Operations | Work Orders (Prod) |
|--------|-----------|-------------------|-------------------|
| **Yield Field** | `scrap_percent` (input) | ❌ NONE | `actual_yield_percent` |
| **Byproduct Yield** | `yield_percent` | ❌ N/A | N/A |
| **Purpose** | Define ingredient waste | Define work sequence | Track actual output |
| **When Set** | At design time | At design time | At completion |
| **Status** | ✅ In Schema | ✅ Correct (no field) | ✅ In Schema |

---

## Verification Checklist

After changes, verify:
- [ ] TEC-010 file has NO references to `expected_yield` in operation section
- [ ] TEC-WIREFRAMES-SUMMARY file has NO `expected_yield` row
- [ ] Zod schema examples don't include `expected_yield`
- [ ] API response examples don't include `expected_yield`
- [ ] No broken cross-references
- [ ] Git diff shows only deletions (no additions)

---

## Testing Impact

### Frontend
```typescript
// SHOULD NOT exist in operation form
❌ expected_yield input field
❌ expected_yield validation

// Verify only these fields present:
✅ sequence
✅ operation_name (or name)
✅ machine_id
✅ setup_time
✅ cleanup_time
✅ expected_duration (or duration)
✅ labor_cost_per_hour
✅ instructions
```

### Backend
```sql
-- Should return: (no rows)
SELECT column_name FROM information_schema.columns
WHERE table_name = 'routing_operations'
AND column_name = 'expected_yield';

-- Verify these columns exist:
✅ sequence
✅ name
✅ machine_id
✅ setup_time
✅ cleanup_time
✅ duration
✅ labor_cost_per_hour
✅ instructions
```

---

## Handoff Implications

### For FRONTEND-DEV
- Do NOT build `expected_yield` input field for operation modal
- Build yield tracking in Production module instead (for `actual_yield_percent`)
- Refer to Production module for WO operation completion with yield entry

### For BACKEND-DEV
- No API changes needed for operation creation/update
- Yield handling belongs in Production module (`actual_yield_percent`)

---

## Consolidated Files

This document consolidates 5 temporary analysis files created during investigation:

1. `DECISION-expected_yield.md` - Initial decision
2. `EXEC-SUMMARY-expected_yield.md` - Executive overview
3. `SUMMARY-expected_yield-resolution.md` - Resolution summary
4. `ANALYSIS-expected_yield-schema-gap.md` - Detailed analysis
5. `FIXPLAN-TEC010-remove-expected_yield.md` - Implementation plan
6. `INDEX-expected_yield-resolution.md` - Navigation index

**Archive date**: 2025-12-18 (cleanup consolidation)

---

## Implementation Status

- [ ] Remove from TEC-010 wireframe (6 locations)
- [ ] Remove from TEC-WIREFRAMES-SUMMARY (1 location)
- [ ] Add clarification note to TEC-010
- [ ] Verify with search: `grep -r "expected_yield" docs/3-ARCHITECTURE/ux/`
- [ ] Commit changes with message: `fix(tec): Remove expected_yield from operation modal (design alignment)`

---

**Next**: Proceed with TEC-010 wireframe updates when approved.
