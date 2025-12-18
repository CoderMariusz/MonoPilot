# Implementation Ready: TEC-010 expected_yield Removal

**Status**: Ready for immediate implementation
**Complexity**: Trivial (Find & Delete)
**Time**: 10-15 minutes
**Risk**: None (Design-only change)

---

## Quick Reference: What to Delete/Change

### File 1: TEC-010-routing-detail.md

| Line ~# | Action | Text |
|---------|--------|------|
| 646 | DELETE | `expected_yield: { min: {}, max: {} }` block (3 lines) |
| 713 | DELETE | `expected_yield: number // decimal, 0-100` |
| 746 | DELETE | `expected_yield?: number // default 100` |
| 987 | DELETE | Full `expected_yield: z.number()` validation block (4 lines) |
| 1026 | DELETE | `- ✅ expected_yield (Decimal input...)` line |
| 1131 | DELETE | `- ✅ expected_yield (Decimal input...)` line |
| ~1140 | ADD | New "Note on Yield Tracking" section (see below) |

### File 2: TEC-WIREFRAMES-SUMMARY.md

| Line ~# | Action | Text |
|---------|--------|------|
| 175 | DELETE | `\| expected_yield \| N/A \| N/A \| ✅ Decimal input \| Optional...` |

---

## Exact Text to Add

### New Section for TEC-010 (after line ~1140)

```markdown
---

## Note on Yield Tracking

Yield and scrap are tracked at different levels in MonoPilot:

### BOM Item Level
- `bom_items.scrap_percent` - Input waste percentage
  - Example: 2% loss in mixing process
  - Set at BOM design time (static)

- `bom_items.yield_percent` - Byproduct output percentage
  - Example: 5% oil yield from 100kg seeds
  - Set at BOM design time (static)

### Work Order Execution Level
- `work_order_operations.actual_yield_percent` - Measured after operation completion
  - Example: 98.5% actual vs 100% planned
  - Recorded during Production module execution (dynamic)
  - Found in `production_module`, not `technical_module`

### NOT at Operation Definition Level
- Routing operations describe **WHAT** work to do (static definition)
- Yield is measured **DURING** execution (dynamic measurement)
- Keep operations simple: sequence, time, machine, cost only

**Design Pattern**: Definition (routing) ≠ Execution (work order)

---
```

---

## Git Commit Message

```
docs(ux): Remove expected_yield from TEC-010 operation modal

Issue: TEC-010 wireframe referenced expected_yield field that doesn't
exist in routing_operations schema and has no PRD requirement.

Decision: Remove field from TEC-010 to align with:
- routing_operations schema (Migration 044: no expected_yield column)
- Technical PRD FR-2.43 (operation time tracking only: setup/run/cleanup)
- Design pattern (operations = definition, yield = execution)

Changes:
- Remove expected_yield validation rules
- Remove from API response/request examples
- Remove from Zod schema validation
- Remove from field validation checklists (2x)
- Add "Note on Yield Tracking" explaining BOM/WO yield model

Impact: Design-only, no code/DB changes. Aligns TEC-010 with actual schema.

Files changed:
  M docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md
  M docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md
```

---

## Search Patterns for Verification

After making changes, search these to verify all references removed:

```bash
# In TEC-010 file
grep -n "expected_yield" docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md
# Should return: (no matches)

# In SUMMARY file
grep -n "expected_yield" docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md
# Should return: (no matches)

# In entire wireframes directory (sanity check)
grep -r "expected_yield.*operation" docs/3-ARCHITECTURE/ux/wireframes/
# Should return: (no matches)
```

---

## Detailed Line-by-Line Changes

### Change 1: Validation Rules (Lines ~640-656)

**BEFORE** (in validation rules section):
```typescript
  expected_yield: {
    min: { value: 0, message: "Yield cannot be negative" },
    max: { value: 100, message: "Yield cannot exceed 100%" }
  },
  instructions: {
```

**AFTER**:
```typescript
  instructions: {
```

### Change 2: API Response (Lines ~700-720)

**BEFORE**:
```typescript
      expected_duration: number  // minutes
      setup_time: number  // minutes
      cleanup_time: number  // minutes (NEW)
      expected_yield: number  // decimal, 0-100
      instructions: string | null  // NEW
      labor_cost_per_hour: number  // decimal (UPDATED)
```

**AFTER**:
```typescript
      expected_duration: number  // minutes
      setup_time: number  // minutes
      cleanup_time: number  // minutes (NEW)
      instructions: string | null  // NEW
      labor_cost_per_hour: number  // decimal (UPDATED)
```

### Change 3: Request Body (Lines ~735-750)

**BEFORE**:
```typescript
  setup_time?: number  // minutes
  cleanup_time?: number  // minutes (NEW)
  expected_yield?: number  // default 100
  labor_cost_per_hour?: number  // decimal (UPDATED)
  instructions?: string  // (NEW)
}
```

**AFTER**:
```typescript
  setup_time?: number  // minutes
  cleanup_time?: number  // minutes (NEW)
  labor_cost_per_hour?: number  // decimal (UPDATED)
  instructions?: string  // (NEW)
}
```

### Change 4: Zod Schema (Lines ~980-995)

**BEFORE**:
```typescript
  cleanup_time: z.number().int().min(0).optional(),
  expected_yield: z.number()
    .min(0, "Yield cannot be negative")
    .max(100, "Yield cannot exceed 100%")
    .optional()
    .default(100),
  labor_cost_per_hour: z.number().min(0).optional(),
  instructions: z.string().max(2000).optional()
```

**AFTER**:
```typescript
  cleanup_time: z.number().int().min(0).optional(),
  labor_cost_per_hour: z.number().min(0).optional(),
  instructions: z.string().max(2000).optional()
```

### Change 5: Field Validation Checklist (Lines ~1020-1035)

**BEFORE**:
```markdown
- ✅ cleanup_time (Integer, >=0 minutes)
- ✅ expected_yield (Decimal input, optional, default 100, 0-100%)
- ✅ labor_cost_per_hour (Decimal, >=0, optional override)
- ✅ instructions (String, optional, max 2000 chars)
```

**AFTER**:
```markdown
- ✅ cleanup_time (Integer, >=0 minutes)
- ✅ labor_cost_per_hour (Decimal, >=0, optional override)
- ✅ instructions (String, optional, max 2000 chars)
```

### Change 6: Final Validation Checklist (Lines ~1125-1135)

**BEFORE**:
```markdown
- ✅ expected_duration (Integer, >=0)
- ✅ expected_yield (Decimal input, optional, default 100, 0-100%)
- ✅ labor_cost_per_hour (Decimal, >=0, optional)
```

**AFTER**:
```markdown
- ✅ expected_duration (Integer, >=0)
- ✅ labor_cost_per_hour (Decimal, >=0, optional)
```

### Change 7: Add Note Section (New, after line ~1140)

**INSERT** (copy from "Exact Text to Add" section above)

---

## TEC-WIREFRAMES-SUMMARY.md Change

### Remove Field Matrix Row

**BEFORE** (in field compatibility matrix):
```markdown
| field_name | Form | List | Modal | Notes |
|------------|------|------|-------|-------|
| ... |
| expected_yield | N/A | N/A | ✅ Decimal input | Optional, default 100, 0-100% |
| ... |
```

**AFTER** (line deleted entirely):
```markdown
| field_name | Form | List | Modal | Notes |
|------------|------|------|-------|-------|
| ... |
| ... |
```

---

## Final Checklist

Before committing:

- [ ] Opened `TEC-010-routing-detail.md`
- [ ] Deleted validation rules block (expected_yield: {})
- [ ] Deleted response field line (expected_yield: number)
- [ ] Deleted request body field (expected_yield?: number)
- [ ] Deleted Zod schema block (full expected_yield: z.number() section)
- [ ] Deleted field checklist item #1 (line ~1026)
- [ ] Deleted field checklist item #2 (line ~1131)
- [ ] Added "Note on Yield Tracking" section
- [ ] Opened `TEC-WIREFRAMES-SUMMARY.md`
- [ ] Deleted expected_yield row from matrix
- [ ] Searched file for "expected_yield" → 0 results in TEC-010
- [ ] Searched file for "expected_yield" → 0 results in SUMMARY
- [ ] Commit with provided message
- [ ] Pushed to branch

---

## Expected Git Diff

```
 docs/3-ARCHITECTURE/ux/wireframes/TEC-010-routing-detail.md
 -  expected_yield: {
 -    min: { value: 0, message: "Yield cannot be negative" },
 -    max: { value: 100, message: "Yield cannot exceed 100%" }
 -  },

 -      expected_yield: number  // decimal, 0-100

 -  expected_yield?: number  // default 100

 -  expected_yield: z.number()
 -    .min(0, "Yield cannot be negative")
 -    .max(100, "Yield cannot exceed 100%")
 -    .optional()
 -    .default(100),

 -  - ✅ expected_yield (Decimal input, optional, default 100, 0-100%)
 -  - ✅ expected_yield (Decimal input, optional, default 100, 0-100%)

 +  ## Note on Yield Tracking
 +  Yield and scrap are tracked at different levels...

 docs/3-ARCHITECTURE/ux/wireframes/TEC-WIREFRAMES-SUMMARY.md
 -  | expected_yield | N/A | N/A | ✅ Decimal input | Optional, default 100, 0-100% |
```

**Summary**: ~25 lines deleted, ~15 lines added, net -10 lines

---

## Rollback (if needed)

```bash
git revert <commit-hash>
```

Would restore files to previous state. However, NOT recommended:
- No PRD backing for expected_yield on operations
- Would require schema migration (not justified)
- Would re-introduce the same schema mismatch

---

## Questions?

Refer to:
- **ANALYSIS**: `.claude/ANALYSIS-expected_yield-schema-gap.md` (detailed evidence)
- **DECISION**: `.claude/DECISION-expected_yield.md` (why this choice)
- **FIXPLAN**: `.claude/FIXPLAN-TEC010-remove-expected_yield.md` (detailed changes)
- **SUMMARY**: `.claude/SUMMARY-expected_yield-resolution.md` (overview)

---

**Ready to implement. No approval required (design-only change).**
