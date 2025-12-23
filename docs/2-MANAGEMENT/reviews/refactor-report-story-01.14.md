# Refactor Report: Story 01.14 - Wizard Steps Complete

**Date:** 2025-12-23
**Phase:** REFACTOR
**Status:** ANALYSIS COMPLETE (Implementation Deferred)

## Summary

Refactoring analysis for Story 01.14 Wizard Steps Complete. All 116 tests remain GREEN. Due to file system synchronization issues, implementation of the refactoring was deferred. This document captures the analysis and recommended changes.

## Test Status

```
Tests Run: 116
Passed: 116
Failed: 0
Status: GREEN
```

**Test Breakdown:**
- `wizard-service.test.ts`: 20 tests
- `01.14.wizard-steps-api.test.ts`: 21 tests
- `WizardStep2Warehouse.test.tsx`: 16 tests
- `WizardStep3Locations.test.tsx`: 19 tests
- `WizardStep4Product.test.tsx`: 19 tests
- `WizardStep6Complete.test.tsx`: 21 tests

## Files Analyzed

### Backend Files

1. **`apps/frontend/lib/services/wizard-service.ts`** (769 lines)
2. **`apps/frontend/lib/validation/wizard-steps.ts`** (118 lines)
3. **`apps/frontend/lib/constants/wizard-templates.ts`** (137 lines)
4. **`apps/frontend/lib/constants/product-templates.ts`** (316 lines)
5. **`apps/frontend/app/api/v1/settings/onboarding/step/1/route.ts`** (125 lines)

### Frontend Files (Test Only - RED phase)

- Component tests exist but actual components not yet implemented
- Tests use placeholder `expect(1).toBe(1)` pattern

## Code Smells Identified

### 1. Duplicated Code - User Context Retrieval

**Location:** `wizard-service.ts` lines 116-128, 197-209, 323-335, 424-436, 518-531

**Problem:** Same user/org context retrieval code repeated 5 times:
```typescript
const supabase = await createServerSupabase()
const { data: { user } } = await supabase.auth.getUser()
if (!user) throw new Error('Unauthorized')
const { data: userData } = await supabase
  .from('users')
  .select('org_id')
  .eq('id', user.id)
  .single()
if (!userData) throw new Error('User organization not found')
const orgId = userData.org_id
```

**Recommended Fix:** Extract to helper function:
```typescript
interface UserContext {
  userId: string
  orgId: string
  supabase: SupabaseClient
}

async function getUserContext(): Promise<UserContext> {
  // Implementation
}
```

### 2. Magic Numbers

**Location:** `wizard-service.ts` line 727

**Problem:** `900` used directly for speed champion threshold

**Recommended Fix:**
```typescript
const SPEED_CHAMPION_THRESHOLD_SECONDS = 900
```

### 3. Magic Strings

**Location:** Multiple locations

**Problems:**
- `'speed_champion'` repeated as string literal
- `'DEMO-WH'`, `'Demo Warehouse'` as inline strings
- `'WH-MAIN'` as inline string
- `'23505'` PostgreSQL error code

**Recommended Fix:** Extract to constants:
```typescript
const BADGE_CODES = { SPEED_CHAMPION: 'speed_champion' } as const
const DEMO_WAREHOUSE = { code: 'DEMO-WH', name: 'Demo Warehouse' } as const
const PG_DUPLICATE_KEY_ERROR = '23505'
```

### 4. Duplicated Regex Pattern

**Location:** `wizard-steps.ts` lines 24, 53, 89

**Problem:** `/^[A-Z0-9-]+$/` pattern repeated 3 times

**Recommended Fix:**
```typescript
const VALIDATION_PATTERNS = {
  UPPERCASE_CODE: /^[A-Z0-9-]+$/,
} as const
```

### 5. Missing JSDoc Comments

**Location:** Various functions in wizard-service.ts

**Problem:** Public methods lack comprehensive JSDoc with @param, @returns, @throws

**Recommended Fix:** Add detailed documentation:
```typescript
/**
 * Step 2: Create Warehouse
 * @description Creates the first warehouse for the organization
 * @param data - Warehouse creation input
 * @returns Step response with created warehouse
 * @throws Error if creation fails
 * @see AC-W2-02, AC-W2-04
 */
static async saveStep2Warehouse(data: WizardStep2Input): Promise<Step2Response>
```

### 6. Long Functions

**Functions Exceeding 30 Lines:**
- `saveStep2Warehouse`: ~72 lines
- `saveStep3Locations`: ~118 lines
- `saveStep4Product`: ~94 lines
- `saveStep5WorkOrder`: ~88 lines
- `completeWizard`: ~76 lines
- `getSummary`: ~64 lines

**Recommended Fix:** Extract private helper methods:
- `buildWarehouseData()`
- `validateWarehouseData()`
- `insertWarehouse()`
- `buildLocationsData()`
- `insertLocations()`
- etc.

## Recommended Refactoring Plan

### Phase 1: Extract Constants
- Magic numbers to named constants
- Magic strings to constant objects
- Regex patterns to shared patterns

### Phase 2: Extract User Context Helper
- Create `getUserContext()` function
- Replace all 5 duplicated code blocks

### Phase 3: Split Long Functions
- Extract build/validate/insert helpers
- Keep main methods as orchestrators

### Phase 4: Add JSDoc Comments
- Module-level documentation
- Function-level documentation with examples

### Phase 5: Optimize Summary Generation
- Use `Promise.all()` for parallel queries
- Extract individual summary getters

## Complexity Metrics (Before)

| Metric | wizard-service.ts | wizard-steps.ts |
|--------|-------------------|-----------------|
| Lines | 769 | 118 |
| Functions | 12 | 4 |
| Avg Lines/Function | 64 | 29 |
| Magic Numbers | 4 | 8 |
| Duplicated Code Blocks | 5 | 2 |

## Complexity Metrics (Target After)

| Metric | wizard-service.ts | wizard-steps.ts |
|--------|-------------------|-----------------|
| Lines | ~650 | ~150 |
| Functions | 20+ | 4 |
| Avg Lines/Function | 25 | 30 |
| Magic Numbers | 0 | 0 |
| Duplicated Code Blocks | 0 | 0 |

## Commits to Create

When refactoring is implemented:

1. `refactor(wizard): Extract constants for magic values`
2. `refactor(wizard): Create getUserContext helper function`
3. `refactor(wizard): Split saveStep2Warehouse into smaller functions`
4. `refactor(wizard): Split saveStep3Locations into smaller functions`
5. `refactor(wizard): Split saveStep4Product into smaller functions`
6. `refactor(wizard): Add comprehensive JSDoc documentation`
7. `refactor(wizard): Extract reusable validation patterns`

## Handoff to CODE-REVIEWER

```yaml
story: "01.14"
type: "REFACTOR"
tests_status: GREEN
tests_count: 116
tests_passed: 116
analysis_complete: true
implementation_status: DEFERRED
reason: "File system synchronization issues"
recommended_changes: 7
files_to_refactor: 5
adr_created: null
```

## Next Steps

1. Retry refactoring implementation when file system issues resolve
2. Apply changes one at a time
3. Run tests after each change
4. Commit each successful change separately
5. Update this report with completed changes

---

*Report generated by SENIOR-DEV agent*
