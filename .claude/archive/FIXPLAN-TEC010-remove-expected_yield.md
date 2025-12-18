# Fix Plan: Remove expected_yield from TEC-010

**Issue**: TEC-010 Operation Modal references `expected_yield` field that doesn't exist in `routing_operations` schema
**Decision**: REMOVE field from wireframe
**Complexity**: Low (Design-only change, no code/DB changes)
**Time**: ~15 minutes

---

## Summary

```
CURRENT STATE (BROKEN):
┌─────────────────────────────┐
│ TEC-010 Operation Modal     │
├─────────────────────────────┤
│ ✅ sequence                 │
│ ✅ name                     │
│ ✅ machine_id               │
│ ✅ duration                 │
│ ✅ setup_time               │
│ ✅ cleanup_time             │
│ ✅ instructions             │
│ ✅ labor_cost_per_hour      │
│ ❌ expected_yield ← DOESN'T EXIST IN DB │
└─────────────────────────────┘

TARGET STATE (FIXED):
┌─────────────────────────────┐
│ TEC-010 Operation Modal     │
├─────────────────────────────┤
│ ✅ sequence                 │
│ ✅ name                     │
│ ✅ machine_id               │
│ ✅ duration                 │
│ ✅ setup_time               │
│ ✅ cleanup_time             │
│ ✅ instructions             │
│ ✅ labor_cost_per_hour      │
└─────────────────────────────┘
```

---

## File Changes

### 1. docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md

#### Change 1: Remove validation rules for expected_yield
**Location**: Lines ~646-649

**BEFORE**:
```typescript
expected_yield: {
  min: { value: 0, message: "Yield cannot be negative" },
  max: { value: 100, message: "Yield cannot exceed 100%" }
},
```

**AFTER**:
(DELETE entire block)

---

#### Change 2: Remove from API response object
**Location**: Lines ~710-720 (example response)

**BEFORE**:
```typescript
{
  id: string
  routing_id: string
  sequence: number
  operation_name: string
  machine_id: string | null
  machine_name: string | null
  production_line_id: string | null
  production_line_name: string | null
  expected_duration: number  // minutes
  setup_time: number  // minutes
  cleanup_time: number  // minutes (NEW)
  expected_yield: number  // decimal, 0-100      ← DELETE THIS LINE
  instructions: string | null  // NEW
  labor_cost_per_hour: number
  created_at: string
  updated_at: string
}
```

**AFTER**:
```typescript
{
  id: string
  routing_id: string
  sequence: number
  operation_name: string
  machine_id: string | null
  machine_name: string | null
  production_line_id: string | null
  production_line_name: string | null
  expected_duration: number  // minutes
  setup_time: number  // minutes
  cleanup_time: number  // minutes (NEW)
  instructions: string | null  // NEW
  labor_cost_per_hour: number
  created_at: string
  updated_at: string
}
```

---

#### Change 3: Remove from request body example
**Location**: Lines ~740-760 (POST body example)

**BEFORE**:
```typescript
{
  sequence: number
  operation_name: string
  machine_id?: string
  production_line_id?: string
  expected_duration?: number
  setup_time?: number
  cleanup_time?: number
  expected_yield?: number  // default 100    ← DELETE THIS LINE
  labor_cost_per_hour?: number
  instructions?: string
}
```

**AFTER**:
```typescript
{
  sequence: number
  operation_name: string
  machine_id?: string
  production_line_id?: string
  expected_duration?: number
  setup_time?: number
  cleanup_time?: number
  labor_cost_per_hour?: number
  instructions?: string
}
```

---

#### Change 4: Remove from Zod schema
**Location**: Lines ~980-1000 (Zod validation schema)

**BEFORE**:
```typescript
const createOperationSchema = z.object({
  sequence: z.number().int().positive("Sequence must be positive"),
  operation_name: z.string().min(1, "Operation name is required"),
  machine_id: z.string().uuid().optional(),
  production_line_id: z.string().uuid().optional(),
  expected_duration: z.number().int().min(0).optional(),
  setup_time: z.number().int().min(0).optional(),
  cleanup_time: z.number().int().min(0).optional(),
  expected_yield: z.number()              ← DELETE THIS BLOCK
    .min(0, "Yield cannot be negative")
    .max(100, "Yield cannot exceed 100%")
    .optional()
    .default(100),
  labor_cost_per_hour: z.number().min(0).optional(),
  instructions: z.string().max(2000).optional()
});
```

**AFTER**:
```typescript
const createOperationSchema = z.object({
  sequence: z.number().int().positive("Sequence must be positive"),
  operation_name: z.string().min(1, "Operation name is required"),
  machine_id: z.string().uuid().optional(),
  production_line_id: z.string().uuid().optional(),
  expected_duration: z.number().int().min(0).optional(),
  setup_time: z.number().int().min(0).optional(),
  cleanup_time: z.number().int().min(0).optional(),
  labor_cost_per_hour: z.number().min(0).optional(),
  instructions: z.string().max(2000).optional()
});
```

---

#### Change 5: Remove from validation checklist
**Location**: Lines ~1020-1035 (checklist section)

**BEFORE**:
```markdown
### Field Validation
- ✅ sequence (Positive integer, unique within routing)
- ✅ operation_name (String, 1-255 chars, auto-trim)
- ✅ machine_id (Optional UUID reference)
- ✅ production_line_id (Optional UUID reference)
- ✅ expected_duration (Integer, >=0 minutes)
- ✅ setup_time (Integer, >=0 minutes)
- ✅ cleanup_time (Integer, >=0 minutes)
- ✅ expected_yield (Decimal input, optional, default 100, 0-100%)    ← DELETE THIS LINE
- ✅ labor_cost_per_hour (Decimal, >=0, optional override)
- ✅ instructions (String, optional, max 2000 chars)
```

**AFTER**:
```markdown
### Field Validation
- ✅ sequence (Positive integer, unique within routing)
- ✅ operation_name (String, 1-255 chars, auto-trim)
- ✅ machine_id (Optional UUID reference)
- ✅ production_line_id (Optional UUID reference)
- ✅ expected_duration (Integer, >=0 minutes)
- ✅ setup_time (Integer, >=0 minutes)
- ✅ cleanup_time (Integer, >=0 minutes)
- ✅ labor_cost_per_hour (Decimal, >=0, optional override)
- ✅ instructions (String, optional, max 2000 chars)
```

---

#### Change 6: Remove from final validation checklist
**Location**: Lines ~1125-1135 (final status)

**BEFORE**:
```markdown
- ✅ sequence (Positive integer, unique within routing)
- ✅ operation_name (String, required)
- ✅ machine_id (Optional UUID)
- ✅ setup_time (Integer, >=0)
- ✅ cleanup_time (Integer, >=0)
- ✅ expected_duration (Integer, >=0)
- ✅ expected_yield (Decimal input, optional, default 100, 0-100%)    ← DELETE THIS LINE
- ✅ labor_cost_per_hour (Decimal, >=0, optional)
- ✅ instructions (String, optional, max 2000)
```

**AFTER**:
```markdown
- ✅ sequence (Positive integer, unique within routing)
- ✅ operation_name (String, required)
- ✅ machine_id (Optional UUID)
- ✅ setup_time (Integer, >=0)
- ✅ cleanup_time (Integer, >=0)
- ✅ expected_duration (Integer, >=0)
- ✅ labor_cost_per_hour (Decimal, >=0, optional)
- ✅ instructions (String, optional, max 2000)
```

---

#### Change 7: Add clarification note
**Location**: After "Data Required" section (new section)

**ADD**:
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

---

### 2. docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md

#### Change: Remove expected_yield row from field matrix
**Location**: Line 175

**BEFORE**:
```markdown
| Field | Form | List | Modal | Notes |
|-------|------|------|-------|-------|
| ... |
| expected_yield | N/A | N/A | ✅ Decimal input | Optional, default 100, 0-100% |
| ... |
```

**AFTER**:
```markdown
| Field | Form | List | Modal | Notes |
|-------|------|------|-------|-------|
| ... |
| (expected_yield row deleted) |
| ... |
```

---

## Verification Checklist

After making changes, verify:

- [ ] TEC-010 file has NO references to `expected_yield` in operation section
- [ ] TEC-WIREFRAMES-SUMMARY file has NO `expected_yield` row
- [ ] Zod schema examples don't include `expected_yield`
- [ ] API response examples don't include `expected_yield`
- [ ] No broken cross-references (search codebase for "expected_yield" in operations context)
- [ ] Git diff shows only deletions (no additions needed)

---

## Testing

### Frontend (if applicable)
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

### Backend (if applicable)
```typescript
// Routing operations should not have expected_yield column
SELECT column_name FROM information_schema.columns
WHERE table_name = 'routing_operations'
AND column_name = 'expected_yield';
// Should return: (no rows)

// Verify these columns exist:
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

## Related Issues Resolved

- TEC-010 Operation Modal now matches `routing_operations` schema
- No field mismatch between UI and database
- Wireframe aligns with Technical PRD (no FR for operation-level yield)
- Clear separation: BOM yields (design) ≠ WO yields (execution)

---

## Rollback Plan

If needed, this can be reverted by adding the field back to:
1. TEC-010 wireframe (use git history)
2. TEC-WIREFRAMES-SUMMARY (use git history)

**However**: Would also require adding `expected_yield_percent` column to `routing_operations` table via migration, which is NOT recommended (no PRD backing).

---

## Sign-Off

**Changes**: Design-only, no code/DB impact
**Risk Level**: LOW
**Effort**: 15 minutes
**Testing**: Documentation review only

**Ready to implement after approval.**
