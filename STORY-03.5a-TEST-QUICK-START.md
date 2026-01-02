# Story 03.5a - PO Approval Setup - Test Quick Start

## Phase: RED - Tests Created (All Failing)

---

## Test Files Created

```
apps/frontend/
  ├── lib/
  │   ├── validation/__tests__/
  │   │   └── planning-settings-schema.test.ts           [29 tests]
  │   └── services/__tests__/
  │       └── planning-settings-service.po-approval.test.ts [17 tests]
  ├── __tests__/api/settings/
  │   └── planning.test.ts                               [19 tests]
  └── components/settings/__tests__/
      └── POApprovalSettings.test.tsx                    [31 tests]
```

**Total: 4 test files | 96 tests | All RED (failing)**

---

## Quick Run Commands

### Run All 03.5a Tests
```bash
npm test -- --testPathPattern="(planning-settings|POApprovalSettings|planning\.test)" --run
```

### Run by Layer
```bash
# Unit Tests (Fastest)
npm test -- --testPathPattern="planning-settings-schema" --run
npm test -- --testPathPattern="planning-settings-service.po-approval" --run

# Integration Tests
npm test -- --testPathPattern="/api/settings/planning" --run

# Component Tests
npm test -- --testPathPattern="POApprovalSettings" --run
```

### Watch Mode (Development)
```bash
npm test -- --testPathPattern="planning-settings-schema"
npm test -- --testPathPattern="planning-settings-service.po-approval"
npm test -- --testPathPattern="/api/settings/planning"
npm test -- --testPathPattern="POApprovalSettings"
```

---

## Expected Test Results (RED Phase)

```
FAIL  lib/validation/__tests__/planning-settings-schema.test.ts
      Cannot find module '@/lib/validation/planning-settings-schema'

FAIL  lib/services/__tests__/planning-settings-service.po-approval.test.ts
      Cannot find module '@/lib/services/planning-settings-service'

FAIL  __tests__/api/settings/planning.test.ts
      Failed to fetch /api/settings/planning (404)

FAIL  components/settings/__tests__/POApprovalSettings.test.tsx
      Cannot find module '@/components/settings/POApprovalSettings'

Tests: 96 failed, 0 passed
Time: ~2-3 minutes
```

---

## What Each Test File Tests

### 1. Validation Schema Tests (29 tests)
File: `lib/validation/__tests__/planning-settings-schema.test.ts`

Tests Zod schemas for:
- Positive threshold validation (AC-06)
- Greater than zero validation (AC-07)
- Max 4 decimal places (AC-08)
- Null threshold allowed (AC-09)
- Non-empty roles array (AC-10/AC-12)
- Edge cases and type coercion

**Expected**: 29 FAIL (schema file doesn't exist)

### 2. Service Layer Tests (17 tests)
File: `lib/services/__tests__/planning-settings-service.po-approval.test.ts`

Tests functions:
- `getPlanningSettings(orgId)` - Fetch with auto-create
- `updatePlanningSettings(orgId, updates)` - Update with validation
- `getDefaultPlanningSettings()` - Default values
- Auto-initialization (PGRST116 handling)
- Timestamp updates
- Error handling

**Expected**: 17 FAIL (service file doesn't exist)

### 3. API Route Tests (19 tests)
File: `__tests__/api/settings/planning.test.ts`

Tests endpoints:
- GET /api/settings/planning (fetch + auto-create)
- PUT /api/settings/planning (update, admin only)
- Authorization (401, 403 errors)
- Validation errors (400)
- RLS cross-org isolation
- Response format and timestamps

**Expected**: 19 FAIL (API route doesn't exist)

### 4. Component Tests (31 tests)
File: `components/settings/__tests__/POApprovalSettings.test.tsx`

Tests component:
- Initial rendering with defaults
- Toggle enable/disable
- Threshold input validation
- Currency formatting
- Role multi-select dropdown
- Validation error messages
- Loading state and save button
- Tooltips and help text

**Expected**: 31 FAIL (component doesn't exist)

---

## Coverage by Acceptance Criteria

All 16 acceptance criteria have at least 1 test:

| AC | Description | Tests |
|----|-------------|-------|
| AC-02 | Default settings (fresh org) | 4 |
| AC-03 | Enable toggle | 2 |
| AC-04 | Disable toggle | 2 |
| AC-05 | Set threshold | 3 |
| AC-06 | Threshold positive | 2 |
| AC-07 | Threshold > 0 | 2 |
| AC-08 | Threshold max 4 decimals | 3 |
| AC-09 | Threshold null allowed | 3 |
| AC-10 | Role dropdown | 2 |
| AC-11 | Role selection | 2 |
| AC-12 | Role validation | 3 |
| AC-14 | RLS enforcement | 2 |
| AC-15 | Admin permission | 2 |
| AC-16 | Tooltips | 3 |

---

## Test Quality Metrics

- **Total Tests**: 96
- **Total Assertions**: 200+
- **Coverage Target**: 79% average
- **Isolation**: All tests independent
- **Clarity**: Clear test names (Given/When/Then)

---

## Implementation Checklist (GREEN Phase)

After tests are created, DEV agent must implement:

### Files to Create

- [ ] `lib/types/planning-settings.ts` - Type definitions
- [ ] `lib/validation/planning-settings-schema.ts` - Zod schemas
- [ ] `lib/services/planning-settings-service.ts` - Service functions
- [ ] `lib/hooks/use-planning-settings.ts` - React Query hook
- [ ] `lib/hooks/use-roles.ts` - Roles hook
- [ ] `app/api/settings/planning/route.ts` - API routes
- [ ] `components/settings/POApprovalSettings.tsx` - UI component
- [ ] `components/settings/PlanningSettingsForm.tsx` - Form container
- [ ] `app/(authenticated)/settings/planning/page.tsx` - Page

### Files to Update

- [ ] Database migration for planning_settings table columns
- [ ] RLS policies for planning_settings table

### Success Criteria for GREEN Phase

- All 96 tests PASS
- Code coverage >= 79% average
- No console errors or warnings
- All ACs covered with passing tests

---

## Test File Locations (Absolute Paths)

```
/workspaces/MonoPilot/apps/frontend/lib/validation/__tests__/planning-settings-schema.test.ts
/workspaces/MonoPilot/apps/frontend/lib/services/__tests__/planning-settings-service.po-approval.test.ts
/workspaces/MonoPilot/apps/frontend/__tests__/api/settings/planning.test.ts
/workspaces/MonoPilot/apps/frontend/components/settings/__tests__/POApprovalSettings.test.tsx
```

---

## Notes

- Tests follow TDD RED phase principles - they all FAIL
- Each test has GIVEN/WHEN/THEN structure for clarity
- Tests map to specific acceptance criteria
- No implementation code has been written
- Tests use project's standard patterns (vitest, React Testing Library)
- Mocking strategy matches project conventions

---

## Next Phase: GREEN (Implementation)

Once DEV agent implements the code, run tests again:

```bash
npm test -- --testPathPattern="(planning-settings|POApprovalSettings|planning\.test)" --run
```

Expected output:
```
PASS  lib/validation/__tests__/planning-settings-schema.test.ts (29 passed)
PASS  lib/services/__tests__/planning-settings-service.po-approval.test.ts (17 passed)
PASS  __tests__/api/settings/planning.test.ts (19 passed)
PASS  components/settings/__tests__/POApprovalSettings.test.tsx (31 passed)

Tests: 96 passed, 0 failed
Coverage: 79%+ (all files)
```

---

**Story**: 03.5a - PO Approval Setup
**Phase**: RED (Tests Created)
**Status**: Ready for DEV Agent (GREEN Phase)
**Created**: 2026-01-02
