# Analysis: expected_yield Schema Gap in TEC-010 Operation Modal

**Date**: 2025-12-14
**Issue**: TEC-010 routing operation modal references `expected_yield` field, but `routing_operations` schema does NOT have this column

---

## Executive Summary

**DECISION**: REMOVE `expected_yield` from TEC-010 Operation Modal

**Rationale**: Yield tracking in MonoPilot is product-level, not operation-level. The BOM has `scrap_percent` at the item level, and Production module tracks `actual_yield_percent` at the work-order level. Operations do not need individual yield expectations.

**Impact**: Remove field from TEC-010 wireframe, no migration needed

---

## 1. Schema Analysis

### routing_operations Current Schema (Migration 044)
```sql
-- From: supabase/migrations/044_add_routing_fields.sql
CREATE TABLE routing_operations (
  id UUID PRIMARY KEY,
  routing_id UUID NOT NULL,
  sequence INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  machine_id UUID,
  duration INTEGER,          -- Run time in minutes
  setup_time INTEGER DEFAULT 0,
  cleanup_time INTEGER DEFAULT 0,  -- ADDED in 044
  labor_cost_per_hour DECIMAL(15,4),
  instructions TEXT,         -- ADDED in 044
  created_at TIMESTAMPTZ,

  UNIQUE(routing_id, sequence)
)
```

**Status**: `expected_yield` field does NOT exist in schema

---

## 2. PRD Requirements Analysis

### Technical Module PRD (technical.md)
Search for yield-related FRs in routing operations:

- **FR-2.40** through **FR-2.55**: Routing & Operation FRs
- **FR-2.43**: "Operation time tracking (setup, run, cleanup)" - ONLY time fields
- **FR-2.44**: "Machine/work center assignment"
- **FR-2.45**: "Operation instructions and attachments"
- **FR-2.54**: "Routing unique code identifier"
- **FR-2.55**: "Routing reusability flag"

**Result**: NO FR mentions expected_yield at operation level

### BOM Level Yield (Technical PRD)
- **FR-2.27**: "BOM byproducts (yield %)" - BYPRODUCT yield at BOM_items level
- **FR-2.34**: "BOM yield calculation" - Planned for Phase 2C-2

**Schema**: `bom_items.scrap_percent` and `bom_items.yield_percent` (byproducts)

### Production Level Yield (Production PRD)
- **FR-4.4**: "Complete operation with actual yield"
  - Tracks `actual_yield_percent` at OPERATION EXECUTION level
  - NOT at operation DEFINITION level (routing_operations)
  - From PRD: "GIVEN operation status = 'In Progress', WHEN user clicks 'Complete' with yield = 95%, THEN actual_yield_percent = 95"

**Schema**: `work_order_operations.actual_yield_percent` (in Production module, NOT Technical)

---

## 3. Architecture Context

### Yield Calculation Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│ PRODUCT LEVEL (Technical Module)                                │
├─────────────────────────────────────────────────────────────────┤
│ • BOM has scrap_percent at ITEM level (ingredient waste)        │
│ • BOM has yield_percent for BYPRODUCTS (expected output)        │
│ • Example: "15% yield = 15kg output from 100kg input"           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ OPERATION DEFINITION (Routing - Technical Module)               │
├─────────────────────────────────────────────────────────────────┤
│ • ONLY time fields (setup, duration, cleanup)                   │
│ • ONLY machine/work center assignment                           │
│ • ONLY labor cost per hour                                      │
│ • NO yield expectations (static definition)                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ OPERATION EXECUTION (Production - Production Module)            │
├─────────────────────────────────────────────────────────────────┤
│ • TRACKS actual_yield_percent (measured after operation)        │
│ • Recorded when operation is COMPLETED                          │
│ • Used for production analytics and yield variance              │
└─────────────────────────────────────────────────────────────────┘
```

### Key Insight: Why Not Operation Yield?

1. **Operations are static definitions** - They describe WHAT work to do, not HOW it performs
2. **Yield is dynamic/measured** - Determined at runtime based on actual production conditions
3. **BOM already tracks ingredient waste** - `scrap_percent` handles input loss
4. **Production module measures output** - `actual_yield_percent` is what we need

**Example**:
- Routing Op #1: "Mixing" (3 minutes, 2 workers) - No yield needed here
- BOM: Mix 100kg flour → 102kg dough (scrap_percent = 2% loss)
- Production WO: Measure actual output = 101kg (actual_yield = 98.5%)

---

## 4. TEC-010 Wireframe Error

### Current Reference (TEC-010-routing-detail.md, lines 646, 713)
```typescript
// INCORRECT - field doesn't exist in schema
expected_yield: {
  min: { value: 0, message: "Yield cannot be negative" },
  max: { value: 100, message: "Yield cannot exceed 100%" }
}

// In response object
expected_yield: number  // decimal, 0-100
```

### Impact
- Frontend will try to render a field that doesn't exist in DB
- API will not return this field
- Validation rules are not applicable

---

## 5. Comparison with Related Modules

| Aspect | BOM Items | Routing Operations | Work Orders (Prod) |
|--------|-----------|-------------------|-------------------|
| **Yield Field** | `scrap_percent` (input loss) | ❌ NONE | `actual_yield_percent` |
| **Byproduct Yield** | `yield_percent` | ❌ N/A | N/A |
| **Purpose** | Define ingredient waste | Define work sequence | Track actual output |
| **When Set** | At design time | At design time | At completion |
| **Status** | ✅ In Schema | ❌ NOT in Schema | ✅ In Schema |

---

## 6. Decision Matrix

| Decision | Pros | Cons |
|----------|------|------|
| **REMOVE from TEC-010** | Aligns with PRD (no FR), aligns with schema, clearer separation of concerns | Need wireframe update |
| **ADD to schema** | Would match wireframe UI | No PRD requirement, breaks design pattern, introduces expected vs actual confusion |

**CHOSEN**: REMOVE from TEC-010

---

## 7. Action Items

### 1. Remove from TEC-010 Wireframe
**File**: `docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md`

**Changes**:
- Line 646: Delete `expected_yield` validation object
- Line 713: Delete `expected_yield: number` from response
- Lines 742-746: Delete from request body example
- Line 987: Delete from Zod schema
- Line 1026: Delete from validation checklist
- Line 1131: Delete from validation checklist

**New Note to Add**:
```markdown
## Note on Yield Tracking

Yield/scrap is tracked at these levels:
- **BOM Item Level**: `bom_items.scrap_percent` (input waste) and `yield_percent` (byproducts)
- **Work Order Level**: `work_order_operations.actual_yield_percent` (measured output)
- **NOT at Operation Definition Level**: Routing operations only define work, not yield expectations
```

### 2. No Migration Needed
- Migration 044 already deployed without `expected_yield`
- No database changes required

### 3. Update TEC-WIREFRAMES-SUMMARY
**File**: `docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md`

**Change Line 175**:
```markdown
# OLD
| expected_yield | N/A | N/A | ✅ Decimal input | Optional, default 100, 0-100% |

# NEW (DELETE THIS ROW - field not applicable to operations)
```

---

## 8. Files to Modify

1. **docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md** (DELETE field refs)
   - Validation rules object (lines ~646)
   - Response object (lines ~713)
   - Request body (lines ~746)
   - Zod schema (lines ~987)
   - Validation checklist (lines ~1026, ~1131)

2. **docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md** (DELETE field row)
   - Line 175

3. **NO migration changes needed** - Schema is already correct

---

## 9. Testing Impact

### Unit Tests (if any reference expected_yield in routing_operations)
- Remove from validation tests
- Remove from API response tests
- Add test: "Routing operation SHOULD NOT have expected_yield field"

### E2E Tests
- Update operation creation/update tests to not include expected_yield

---

## 10. Handoff Implications

### For FRONTEND-DEV
- Do NOT build expected_yield input field for operation modal
- Build yield tracking in **Production** module instead (for actual_yield_percent)
- Refer to Production module for WO operation completion with yield entry

### For BACKEND-DEV
- No API changes needed for operation creation/update
- Yield handling belongs in Production module (actual_yield_percent)

---

## Conclusion

The `expected_yield` field in TEC-010 is a wireframe design error. MonoPilot's yield model is:
- **Input-level**: Ingredient scrap at BOM item level
- **Output-level**: Measured yield at operation execution (Production module)

Operations in the routing definition should remain stateless regarding yield expectations. This aligns with production best practices where routing operations describe work methods, and yield is measured at execution.

**REMOVE expected_yield from TEC-010 routing operation modal.**

---

## Approval

Awaiting approval to proceed with TEC-010 wireframe updates.
