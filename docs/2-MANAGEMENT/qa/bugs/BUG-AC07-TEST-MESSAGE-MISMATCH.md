# Bug Report: BUG-AC07-TEST-MESSAGE-MISMATCH

**Bug ID**: BUG-AC07-TEST-MESSAGE-MISMATCH
**Severity**: HIGH
**Type**: Test Code Issue (not functionality issue)
**Status**: OPEN
**Priority**: CRITICAL - BLOCKING MERGE
**Story**: 03.5a - PO Approval Setup
**Component**: Validation Schema (planning-settings-schema.ts)

---

## Summary

Test assertion fails on AC-07 (Threshold Greater Than Zero Validation) due to error message string mismatch between the Zod schema and the test expectation. The validation logic is correct (zero threshold IS rejected), but the error message text differs from what the test expects.

---

## Impact

- **Blocks**: Cannot merge Story 03.5a until fixed
- **Tests Failing**: 1 test case
- **Pass Rate**: 113 of 114 tests passing (99.1%)
- **Functionality**: NOT broken - validation works correctly
- **User-Facing**: NOT user-facing - test code issue only

---

## Details

### Failing Test

**File**: `/workspaces/MonoPilot/apps/frontend/lib/validation/__tests__/planning-settings-schema.test.ts`
**Line**: 79
**Test Case**: "should reject zero threshold (0)"
**Category**: AC-07: Greater Than Zero Validation

### Test Expectation

```typescript
expect(result.error.issues.some((issue) =>
  issue.message.includes('Threshold must be greater than zero')
)).toBe(true)
```

**Line 79** - Test looks for this exact substring in the error message.

### Current Schema Message

**File**: `/workspaces/MonoPilot/apps/frontend/lib/validation/planning-settings-schema.ts`
**Line**: 41

```typescript
.refine((val) => val > 0, {
  message: 'Threshold must be a positive number and must be greater than zero',
})
```

The actual message is: `'Threshold must be a positive number and must be greater than zero'`

### String Comparison

```
Expected substring: 'Threshold must be greater than zero'
Actual message:    'Threshold must be a positive number and must be greater than zero'

String includes? includes('Threshold must be greater than zero')
Result: FALSE (string not found)
```

The expected substring exists in the actual message as part of a longer phrase, but NOT as a continuous substring in that exact order.

---

## Root Cause Analysis

During implementation, the validation schema message was consolidated/updated to include both AC-06 (positive) and AC-07 (greater than zero) requirements in a single message. However, the test was not updated to match the new message format.

**Timeline**:
1. Schema implemented with combined message
2. Test written expecting AC-07 specific message
3. No synchronization between schema and test

---

## Validation Logic Correctness

**The underlying logic IS CORRECT:**

```typescript
const data = { po_approval_threshold: 0 };
const result = poApprovalSettingsSchema.safeParse(data);
// result.success = false ✓ CORRECT - zero is rejected
```

Zero threshold is properly rejected by the validation refinement `(val) => val > 0`.

**Evidence**: The test fails on line 80 (message assertion) not on line 76 (success assertion).

---

## Required Fix

### Option A: Update Test to Match Schema Message (RECOMMENDED)

**File**: `/workspaces/MonoPilot/apps/frontend/lib/validation/__tests__/planning-settings-schema.test.ts`
**Line**: 79

**Current**:
```typescript
expect(result.error.issues.some((issue) =>
  issue.message.includes('Threshold must be greater than zero')
)).toBe(true)
```

**Fixed**:
```typescript
expect(result.error.issues.some((issue) =>
  issue.message.includes('Threshold must be a positive number and must be greater than zero')
)).toBe(true)
```

**Rationale**: Schema message is correct and comprehensive. Test should match actual implementation.

---

### Option B: Split Schema Validations (ALTERNATIVE)

Keep AC-06 and AC-07 as separate validation steps with distinct messages.

**File**: `/workspaces/MonoPilot/apps/frontend/lib/validation/planning-settings-schema.ts`
**Lines**: 38-47

**Current**:
```typescript
const thresholdSchema = z
  .number()
  .refine((val) => val > 0, {
    message: 'Threshold must be a positive number and must be greater than zero',
  })
  .refine(hasMaxFourDecimalPlaces, {
    message: 'Threshold can have at most 4 decimal places',
  })
  .nullable()
  .optional();
```

**Fixed** (split into two):
```typescript
const thresholdSchema = z
  .number()
  .refine((val) => val > 0, {
    message: 'Threshold must be a positive number greater than zero',
  })
  .refine(hasMaxFourDecimalPlaces, {
    message: 'Threshold can have at most 4 decimal places',
  })
  .nullable()
  .optional();
```

Then update test to match.

---

## Reproduction Steps

1. Run test suite:
   ```bash
   pnpm vitest run planning-settings
   ```

2. Observe failure in: `lib/validation/__tests__/planning-settings-schema.test.ts`

3. Test case: "should reject zero threshold (0)"

4. Error: AssertionError: expected false to be true

---

## Testing After Fix

After applying the fix, all 127 tests should pass:

```bash
pnpm vitest run planning-settings
# Expected: 127 passing, 0 failing
```

---

## Files Involved

### Schema File
- `/workspaces/MonoPilot/apps/frontend/lib/validation/planning-settings-schema.ts`
  - Lines: 38-47 (thresholdSchema definition)
  - Line: 41 (error message)

### Test File
- `/workspaces/MonoPilot/apps/frontend/lib/validation/__tests__/planning-settings-schema.test.ts`
  - Lines: 63-82 (AC-07 test describe block)
  - Line: 79 (failing assertion)

---

## Acceptance Criteria Impact

**AC-07**: Threshold Greater Than Zero Validation
- **Requirement**: Threshold must be > 0
- **Status**: IMPLEMENTED CORRECTLY
- **Test Status**: FAILING (message mismatch)
- **Functionality Impact**: NONE - validation works correctly

---

## Checklist for Fix Verification

- [ ] Fix applied to schema or test
- [ ] Tests run: `pnpm vitest run planning-settings`
- [ ] All 127 tests passing
- [ ] No other tests broken
- [ ] Code review approved
- [ ] Commit message clear and linked to story

---

## Related Information

- **Story**: 03.5a - PO Approval Setup
- **Epic**: 03-planning (Planning Module)
- **Code Review**: Passed (8.5/10, APPROVED)
- **QA Report**: `/workspaces/MonoPilot/docs/2-MANAGEMENT/qa/qa-report-story-03.5a.md`

---

**Bug Reported**: 2026-01-02
**Reported By**: QA Agent
**Status**: AWAITING DEV FIX
**Block**: Cannot merge until fixed
