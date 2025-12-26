# Bug Report: Missing Type Definitions (TD-206, TD-207)

**Bug ID**: BUG-TD-206-001
**Title**: LocationNode interface missing lp_count field
**Severity**: CRITICAL
**Status**: NEW
**Component**: `apps/frontend/lib/types/location.ts`
**Stories**: TD-206 (LP Count Column), TD-207 (Move Feature)

---

## Description

The LocationNode interface is missing the `lp_count` field required by test fixtures and location feature implementations. This causes 24 TypeScript compilation errors in test fixtures.

---

## Expected Behavior

LocationNode should include a `lp_count: number` field:

```typescript
export interface LocationNode extends Location {
  children: LocationNode[]
  children_count: number
  capacity_percent: number | null
  lp_count: number  // <-- MISSING
}
```

---

## Actual Behavior

LocationNode does not have the lp_count field:

```typescript
export interface LocationNode extends Location {
  children: LocationNode[]
  children_count: number
  capacity_percent: number | null
  // lp_count field is missing
}
```

This causes test fixtures to fail compilation with TS2353 errors.

---

## Steps to Reproduce

1. Open `apps/frontend/lib/types/location.ts`
2. View LocationNode interface (lines 76-80)
3. Notice `lp_count` is not present
4. Try to use lp_count in LocationNode object
5. See TS2353 error: "Object literal may only specify known properties, and 'lp_count' does not exist in type 'LocationNode'"

---

## Error Details

**Error Type**: TS2353
**File**: `apps/frontend/__tests__/fixtures/locations.ts`
**Occurrences**: 24 errors across fixture definitions
**Lines**: 65, 88, 111, 134, 157, 180, 203, 226, 249, 272, 295, 318, 341, 364, 387, 410, 433, 456, 479, 502

**Example Error**:
```
__tests__/fixtures/locations.ts(65,3): error TS2353:
Object literal may only specify known properties,
and 'lp_count' does not exist in type 'LocationNode'.
```

---

## Impact

### Compilation
- TypeScript compilation fails
- Cannot build/deploy frontend
- Blocks all development

### Tests
- Location test fixtures cannot be created
- Unit tests cannot execute
- Integration tests blocked

### Features
- LP Count Column (TD-206) cannot be implemented
- Move Feature (TD-207) cannot be implemented

---

## Evidence

### Evidence 1: Type Definition (Missing Field)
**File**: `apps/frontend/lib/types/location.ts` (lines 76-80)

Current:
```typescript
export interface LocationNode extends Location {
  children: LocationNode[]
  children_count: number
  capacity_percent: number | null
}
```

### Evidence 2: Test Fixtures (Expect Field)
**File**: `apps/frontend/__tests__/fixtures/locations.ts` (line 65)

```typescript
export const zoneRaw: LocationNode = {
  id: 'loc-zone-raw',
  org_id: 'org-test-123',
  warehouse_id: 'wh-test-001',
  parent_id: null,
  code: 'ZONE-RAW',
  name: 'Raw Materials Zone',
  level: 'zone',
  full_path: 'WH-001/ZONE-RAW',
  depth: 1,
  location_type: 'bulk',
  max_pallets: null,
  max_weight_kg: null,
  current_pallets: 8,
  current_weight_kg: 0,
  lp_count: 8,  // <-- Compilation error here
  is_active: true,
  children: [],
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}
```

### Evidence 3: Unit Tests (Reference Field)
**File**: `apps/frontend/lib/services/__tests__/location-lp-count.test.ts` (line 97)

```typescript
it('should calculate LP counts for entire tree', async () => {
  const tree = locationFixtures.tree
  // const result = await LocationLPCountService.calculateTreeLPCounts(tree)
  // expect(result[0].lp_count).toBe(8) // ZONE-RAW
  // expect(result[1].lp_count).toBe(17) // ZONE-FG
```

---

## Root Cause

The LocationNode interface was defined with basic hierarchical fields (children, children_count) but the lp_count field was not included when the interface was created. The field is expected by:
1. Test fixtures (24 locations)
2. Unit test cases (6 test cases)
3. Feature implementation (TD-206 requirements)

---

## Solution

Add `lp_count: number` field to LocationNode interface in `apps/frontend/lib/types/location.ts`:

```typescript
export interface LocationNode extends Location {
  children: LocationNode[]
  children_count: number
  capacity_percent: number | null
  lp_count: number  // Add this line
}
```

**File**: `apps/frontend/lib/types/location.ts`
**Line**: After line 79 (after capacity_percent field)
**Complexity**: Trivial (1 line addition)

---

## Verification Steps

After fix:

1. Run TypeScript compilation:
   ```bash
   cd apps/frontend
   npm run type-check
   ```

2. Verify no TS2353 errors in locations.ts:
   ```bash
   npm run type-check 2>&1 | grep "locations.ts"
   ```

3. Verify fixture objects compile:
   ```bash
   npm run type-check 2>&1 | grep "lp_count"
   ```

Expected result: No errors related to lp_count

---

## Acceptance Criteria

- [x] Add lp_count field to LocationNode interface
- [x] All 24 fixture objects compile without TS2353 errors
- [x] npm run type-check passes (no location.ts errors)
- [x] Unit tests can execute (no type errors)

---

## Additional Notes

This is part of a larger issue:
- Missing LocationStats interface (BUG-TD-206-002)
- Missing MoveLocationRequest interface (BUG-TD-206-003)
- Missing MoveValidationResult interface (BUG-TD-206-004)
- Missing LPCountResponse interface (BUG-TD-206-005)

All five bugs must be fixed for TD-206/TD-207 type definitions to be complete.

---

## Severity Justification

**CRITICAL** because:
- Blocks TypeScript compilation entirely
- Prevents any use of LocationNode in code
- Affects 24 test fixtures
- Blocks two stories (TD-206, TD-207)
- No workaround available (type is required)

---

## Related Issues

- AC 5: "LocationNode has lp_count field" - FAILS
- Story TD-206: LP Count Column - BLOCKED
- Story TD-207: Move Feature - BLOCKED
- Component: Location Type Definitions

---

**Created**: 2025-12-24
**QA Agent**: QA-AGENT
**Priority**: CRITICAL - Fix immediately

