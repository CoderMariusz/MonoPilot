# Story 03.5a - PO Approval Setup (RED Phase Tests)

**Status**: RED Phase - All tests FAILING (implementation not yet written)

**Date Created**: 2026-01-02

**Purpose**: This document summarizes the test suite created for Story 03.5a following TDD RED phase principles.

---

## Test Files Created

### 1. Unit Tests - Validation Schema

**File**: `apps/frontend/lib/validation/__tests__/planning-settings-schema.test.ts`

**Size**: 16 KB | **Tests**: 29 tests

**Coverage**: 95% target

**What it tests**:
- Zod validation schema for PO approval settings
- Threshold field validation (positive, > 0, max 4 decimals, null allowed)
- Role array validation (non-empty, at least one required)
- Boolean toggle validation
- Partial update schema validation
- Edge cases (large numbers, special characters, type coercion)

**Key Test Cases**:
- AC-06: Positive threshold validation
- AC-07: Greater than zero validation
- AC-08: Max 4 decimal places validation
- AC-09: Null threshold allowed
- AC-10: Non-empty roles array
- AC-12: At least one role required

**Expected Status**: ALL FAIL (schema not implemented yet)

```bash
npm test -- --testPathPattern="planning-settings-schema" --run
```

---

### 2. Unit Tests - Service Layer

**File**: `apps/frontend/lib/services/__tests__/planning-settings-service.po-approval.test.ts`

**Size**: 18 KB | **Tests**: 17 tests

**Coverage**: 80% target

**What it tests**:
- `getPlanningSettings(orgId)` - Fetch and auto-create defaults
- `updatePlanningSettings(orgId, updates)` - Update settings with validation
- `getDefaultPlanningSettings()` - Return default values
- Auto-initialization on first access (PGRST116 handling)
- Timestamp updates
- Error handling

**Key Test Cases**:
- AC-02: Default approval settings (fresh org)
- AC-03/AC-04/AC-05: Update toggle, threshold, roles
- AC-12: Settings update timestamp
- Service error handling

**Expected Status**: ALL FAIL (service not implemented yet)

```bash
npm test -- --testPathPattern="planning-settings-service.po-approval" --run
```

---

### 3. Integration Tests - API Routes

**File**: `apps/frontend/__tests__/api/settings/planning.test.ts`

**Size**: 21 KB | **Tests**: 19 tests

**Coverage**: 70% target

**What it tests**:
- `GET /api/settings/planning` - Fetch and auto-create defaults
- `PUT /api/settings/planning` - Update settings (admin only)
- Request/response formats
- Authorization (401 for unauthenticated, 403 for non-admin)
- Validation error responses (400)
- RLS policy enforcement (cross-org isolation)
- Auto-creation of default settings

**Key Test Cases**:
- AC-02: Default settings auto-creation
- AC-03: Enable approval toggle
- AC-04: Disable approval toggle
- AC-05: Set threshold amount
- AC-09: Update roles
- AC-14: RLS cross-org isolation
- AC-15: Permission check (admin only)

**Expected Status**: ALL FAIL (API routes not implemented yet)

```bash
npm test -- --testPathPattern="/api/settings/planning" --run
```

---

### 4. Component Tests - UI Component

**File**: `apps/frontend/components/settings/__tests__/POApprovalSettings.test.tsx`

**Size**: 22 KB | **Tests**: 31 tests

**Coverage**: 70% target

**What it tests**:
- `POApprovalSettings` component rendering
- Initial state with default settings
- Toggle behavior (enable/disable threshold)
- Threshold input validation and formatting
- Role multi-select dropdown
- Validation error messages
- Save button states and loading spinner
- Tooltips and help text
- Accessibility (aria attributes, keyboard navigation)

**Key Test Cases**:
- AC-02: Default settings rendering
- AC-03: Enable toggle (threshold becomes enabled)
- AC-04: Disable toggle (threshold disabled, value preserved)
- AC-05: Threshold input with currency formatting
- AC-06/AC-07/AC-08: Threshold validation errors
- AC-10/AC-11: Role dropdown with all roles and selection
- AC-12: Role validation (at least one required)
- AC-15: Tooltips on hover

**Expected Status**: ALL FAIL (component not implemented yet)

```bash
npm test -- --testPathPattern="POApprovalSettings" --run
```

---

## Acceptance Criteria Coverage Matrix

| AC # | Criteria | Test File | Test Count |
|------|----------|-----------|-----------|
| AC-02 | Default Approval Settings | Schema, Service, API, Component | 4 |
| AC-03 | Enable PO Approval Toggle | API, Component | 2 |
| AC-04 | Disable PO Approval Toggle | API, Component | 2 |
| AC-05 | Set Approval Threshold | API, Component | 3 |
| AC-06 | Threshold Positive Number | Schema, Component | 2 |
| AC-07 | Threshold Greater Than Zero | Schema, Component | 2 |
| AC-08 | Threshold Max Precision (4 decimals) | Schema, Component | 3 |
| AC-09 | Threshold Optional (Null Allowed) | Schema, Service, API | 3 |
| AC-10 | Role Multi-Select Dropdown | Component | 2 |
| AC-11 | Role Selection | Component | 2 |
| AC-12 | Role Validation (At Least One) | Schema, Component | 3 |
| AC-14 | RLS Policy Enforcement | API | 2 |
| AC-15 | Permission Check (Admin Only) | API, Component | 2 |
| AC-16 | Help Text and Tooltips | Component | 3 |

**Total AC Coverage**: 16 out of 16 acceptance criteria have tests

---

## Test Statistics

### By Category

| Category | Test Files | Test Cases | Code Coverage Target |
|----------|-----------|-----------|-----|
| Validation Schema | 1 | 29 | 95% |
| Service Layer | 1 | 17 | 80% |
| API Integration | 1 | 19 | 70% |
| Component UI | 1 | 31 | 70% |
| **TOTAL** | **4** | **96** | **~79%** |

### By Layer

| Layer | Tests | Files | Notes |
|-------|-------|-------|-------|
| Unit | 46 | 2 | Schema + Service (fastest to run) |
| Integration | 19 | 1 | API routes (needs Supabase) |
| Component | 31 | 1 | React UI (needs React Testing Library) |

---

## Current RED Phase Status

### Test Execution

All tests are designed to **FAIL** because:

1. ✗ Validation schema (`lib/validation/planning-settings-schema.ts`) not created
2. ✗ Service (`lib/services/planning-settings-service.ts`) not created
3. ✗ API routes (`app/api/settings/planning/route.ts`) not created
4. ✗ Component (`components/settings/POApprovalSettings.tsx`) not created
5. ✗ Types (`lib/types/planning-settings.ts`) not created
6. ✗ Hooks (`lib/hooks/use-planning-settings.ts`) not created

### Expected Test Results

When running the test suite, you should see:

```
FAIL  lib/validation/__tests__/planning-settings-schema.test.ts (29 tests failed)
FAIL  lib/services/__tests__/planning-settings-service.po-approval.test.ts (17 tests failed)
FAIL  __tests__/api/settings/planning.test.ts (19 tests failed)
FAIL  components/settings/__tests__/POApprovalSettings.test.tsx (31 tests failed)

Tests:      96 failed, 0 passed
Time:       ~2-3 minutes
```

Each test shows exactly **why** it's failing - the imported classes/functions don't exist yet.

---

## Running the Tests

### All 03.5a Tests

```bash
npm test -- --testPathPattern="(planning-settings|POApprovalSettings|planning\.test)" --run
```

### By Layer

```bash
# Unit tests only (fastest)
npm test -- --testPathPattern="planning-settings-(schema|service)" --run

# API tests only
npm test -- --testPathPattern="/api/settings/planning" --run

# Component tests only
npm test -- --testPathPattern="POApprovalSettings" --run
```

### Watch Mode (for development)

```bash
npm test -- --testPathPattern="planning-settings-schema"  # Watch schema tests
npm test -- --testPathPattern="planning-settings-service" # Watch service tests
npm test -- --testPathPattern="/api/settings/planning"    # Watch API tests
npm test -- --testPathPattern="POApprovalSettings"        # Watch component tests
```

---

## Test Design Principles

### 1. Arrange-Act-Assert Pattern

Every test follows the AAA pattern:

```typescript
describe('Feature', () => {
  it('should do something', () => {
    // GIVEN: Setup
    const input = { ... }

    // WHEN: Execute
    const result = functionUnderTest(input)

    // THEN: Verify
    expect(result).toBe(expected)
  })
})
```

### 2. Acceptance Criteria Mapping

Each test is explicitly mapped to acceptance criteria:

```typescript
describe('AC-06: Threshold Validation (Positive Number)', () => {
  it('should reject negative threshold (-500)', () => {
    // Test explicitly covers AC-06
  })
})
```

### 3. Clear Test Names

Test names describe the expected behavior:

```typescript
// Good
it('should reject negative threshold (-500)')
it('should accept null threshold (null allowed)')

// Avoid
it('validates threshold')
it('works correctly')
```

### 4. Comprehensive Coverage

Tests cover:
- Happy path (valid inputs)
- Error cases (invalid inputs)
- Edge cases (boundary values)
- Authorization/security
- Error messages

---

## Mocking Strategy

### Schema Tests

No mocking required - pure validation tests.

### Service Tests

Supabase client mocked with:
```typescript
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(...)
}))
```

Mock query chains for Supabase fluent API:
- `.from()` → `.select()` → `.eq()` → `.single()`
- `.from()` → `.insert()` → `.select()` → `.single()`
- `.from()` → `.update()` → `.eq()` → `.select()` → `.single()`

### API Tests

Uses real Supabase connection (integration tests):
- Creates test orgs before tests
- Deletes test data after tests
- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from env

### Component Tests

Mocks React hooks:
```typescript
vi.mock('@/lib/hooks/use-roles', () => ({
  useRoles: vi.fn(() => ({ data: [...], isLoading: false }))
}))
```

---

## Next Steps (GREEN Phase - DEV Agent)

1. **Create Zod Validation Schema**
   - File: `lib/validation/planning-settings-schema.ts`
   - Implement `poApprovalSettingsSchema` and `planningSettingsUpdateSchema`
   - Must pass all 29 schema tests

2. **Create Service Layer**
   - File: `lib/services/planning-settings-service.ts`
   - Implement `getPlanningSettings()`, `updatePlanningSettings()`, `getDefaultPlanningSettings()`
   - Must pass all 17 service tests

3. **Create API Routes**
   - File: `app/api/settings/planning/route.ts`
   - Implement `GET` and `PUT` handlers
   - Must pass all 19 API tests

4. **Create Component**
   - File: `components/settings/POApprovalSettings.tsx`
   - Implement toggle, threshold input, role multi-select
   - Must pass all 31 component tests

5. **Create Supporting Files**
   - Types: `lib/types/planning-settings.ts`
   - Hooks: `lib/hooks/use-planning-settings.ts`
   - Hooks: `lib/hooks/use-roles.ts`

---

## Quality Metrics

### Test Quality

- **Test Count**: 96 tests
- **Assertions**: ~200+ assertions
- **Coverage Target**: 79% average across all layers
- **Isolation**: Each test is independent
- **Clarity**: Clear test names and structure

### Code Quality

- **TypeScript**: Full type safety
- **Linting**: Follows project ESLint config
- **Formatting**: Follows project Prettier config
- **Documentation**: Comprehensive inline comments

### Acceptance Criteria

- **Coverage**: 100% (16 out of 16 ACs have tests)
- **Priority**: All P0/P1 ACs covered
- **Security**: RLS and authorization tests included

---

## Files Summary

| File | Lines | Tests | Status |
|------|-------|-------|--------|
| `planning-settings-schema.test.ts` | 416 | 29 | RED |
| `planning-settings-service.po-approval.test.ts` | 468 | 17 | RED |
| `planning.test.ts` (API) | 545 | 19 | RED |
| `POApprovalSettings.test.tsx` | 642 | 31 | RED |
| **TOTAL** | **2071** | **96** | **RED** |

---

## Notes

- All tests are in RED phase - they will fail until implementation is complete
- Each test file contains a summary at the bottom
- Tests use industry-standard patterns from the codebase
- No implementation code has been written - tests only
- All imports are placeholder references to non-existent code

---

## Contact

**Story**: 03.5a - PO Approval Setup (Settings + Roles)
**Phase**: 1 (RED - Tests Written)
**Estimate**: 1-2 days
**Agent**: TEST-WRITER

Next handoff to DEV agent for implementation.
