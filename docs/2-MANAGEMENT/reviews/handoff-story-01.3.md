# Handoff: Story 01.3 - Onboarding Wizard Launcher

**Date:** 2025-12-18
**Status:** REQUEST_CHANGES (3 blocking issues)
**Blocking Issues:** MAJOR (Test coverage, Hook response parsing, Zod validation)

---

## Executive Summary

Story 01.3 implements the onboarding wizard launcher with comprehensive backend and frontend. Implementation is **70-80% complete** but requires manual fixes before QA:

- **Backend**: 100% complete (3 API endpoints + Service + Validation)
- **Frontend**: 90% complete (7 components + hook, but response parsing mismatch)
- **Tests**: Exist but need fixes (21-79% passing depending on mock structure)
- **Security**: ✅ PASSED (no direct DB access, admin checks, RLS compliant)

---

## Files Created (17 total)

### Backend (4 files) - COMPLETE
1. ✅ `apps/frontend/app/api/v1/settings/onboarding/status/route.ts` (69 lines)
2. ✅ `apps/frontend/app/api/v1/settings/onboarding/skip/route.ts` (93 lines)
3. ✅ `apps/frontend/app/api/v1/settings/onboarding/progress/route.ts` (90 lines)
4. ✅ `apps/frontend/lib/services/onboarding-service.ts` (341 lines)

### Frontend (7 files) - CREATED but needs fixes
5. ⚠️ `apps/frontend/lib/hooks/useOnboardingStatus.ts` (RESPONSE PARSING MISMATCH)
6. ✅ `apps/frontend/components/onboarding/OnboardingGuard.tsx`
7. ✅ `apps/frontend/components/onboarding/OnboardingWizardModal.tsx`
8. ✅ `apps/frontend/components/onboarding/OnboardingLauncher.tsx`
9. ✅ `apps/frontend/components/onboarding/OnboardingStepIndicator.tsx`
10. ✅ `apps/frontend/components/onboarding/SkipConfirmationDialog.tsx`
11. ✅ `apps/frontend/components/onboarding/SetupInProgressMessage.tsx`

### Tests (5 files) - CREATED
12-16. ✅ Test files created (status: 4-15 passing depending on mock structure)

### Missing (1 file) - REQUIRED
17. ❌ `apps/frontend/lib/validation/onboarding-schemas.ts` (Zod schemas - MUST CREATE)

---

## Blocking Issues - MUST FIX Before Approval

### Issue #1: Missing Zod Validation Schemas (MAJOR)
**Severity:** MAJOR
**Effort:** 30 minutes
**File:** `apps/frontend/lib/validation/onboarding-schemas.ts` (MISSING - create new)

**Required Content:**
```typescript
import { z } from 'zod'

export const OnboardingStatusSchema = z.object({
  step: z.number().int().min(0).max(6),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  skipped: z.boolean(),
  can_skip: z.boolean(),
})

export const UpdateProgressSchema = z.object({
  step: z.number().int().min(1).max(6),
})

export const SkipResultSchema = z.object({
  success: z.boolean(),
  demo_data: z.object({
    warehouse_id: z.string().uuid().optional(),
    location_id: z.string().uuid().optional(),
    product_id: z.string().uuid().optional(),
  }).optional(),
})

export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>
export type UpdateProgress = z.infer<typeof UpdateProgressSchema>
export type SkipResult = z.infer<typeof SkipResultSchema>
```

Then update API routes to use schemas:
```typescript
// In each route:
import { OnboardingStatusSchema } from '@/lib/validation/onboarding-schemas'

const validated = OnboardingStatusSchema.parse(response)
return NextResponse.json(validated)
```

---

### Issue #2: Hook Response Parsing Mismatch (MAJOR)
**Severity:** MAJOR
**Effort:** 2 minutes
**File:** `apps/frontend/lib/hooks/useOnboardingStatus.ts` lines 71-73

**Current (WRONG):**
```typescript
const currentStep = data.onboarding_step ?? 0
const completed = !!data.onboarding_completed_at
const skipped = data.onboarding_skipped ?? false
```

**Required Fix:**
```typescript
const currentStep = data.step ?? 0
const completed = !!data.completed_at
const skipped = data.skipped ?? false
```

**Reason:** API returns `step`, `completed_at`, `skipped`. Hook expects different field names.

---

### Issue #3: Missing Test Coverage (MAJOR)
**Severity:** MAJOR
**Effort:** 1-2 hours
**Status:** Tests exist but have mock structure mismatches

**Actions:**
1. Run `pnpm test -- --run` in `apps/frontend`
2. Fix failing tests - most failures due to mock structure mismatch
3. Ensure 80%+ test coverage on Story 01.3 files
4. All tests must pass before approval

**Mock Structure Issue:**
Tests expect: `mockUseOrgContext.mockReturnValue({ organization: {...} })`
Component expects: `mockUseOrgContext.mockReturnValue({ data: { organization: {...} }, refetch: vi.fn() })`

Update all test mocks to match actual hook return structure.

---

## Security Review - ✅ PASSED

### Positive Findings
1. ✅ **No Direct DB Access**: Hook uses `/api/v1/settings/onboarding/status` endpoint (not direct Supabase)
2. ✅ **Admin Role Checks**: All mutation endpoints check `hasAdminAccess(context.role_code)`
3. ✅ **ADR-013 Compliance**: Perfect multi-tenancy validation (userId → orgId mapping)
4. ✅ **Input Validation**: UUID and step range validation present
5. ✅ **Error Handling**: Comprehensive error handling with proper HTTP status codes

### Security Issues Found
0 critical vulnerabilities. Minor issue: Error messages should sanitize database details (nice-to-have).

---

## Code Quality - ✅ EXCELLENT

### Positive Findings
1. ✅ **TypeScript Strict Mode**: No `any` types, all properly typed
2. ✅ **JSDoc Comments**: Excellent documentation on all methods
3. ✅ **Service Layer**: Clean separation of concerns
4. ✅ **MonoPilot Patterns**: Follows all documented conventions
5. ✅ **Component Design**: All 7 components follow ShadCN UI patterns

### Code Style
- Follows MonoPilot patterns (API routes, service layer, hooks, components)
- Proper file organization
- Consistent naming conventions

---

## Test Status

### Current Status
- **Tests Created**: 5 files, 26+ test cases
- **Passing Rate**: 4-15/19 passing (21-79% depending on mock fixes)
- **Coverage Target**: 80%+
- **Blockers**: Mock structure mismatches, missing validation imports

### Test Files
1. `apps/frontend/lib/hooks/__tests__/useOnboardingStatus.test.ts`
2. `apps/frontend/components/onboarding/__tests__/OnboardingGuard.test.tsx`
3. `apps/frontend/components/onboarding/__tests__/OnboardingWizardModal.test.tsx`
4. `apps/frontend/__tests__/integration/onboarding-flow.test.ts`
5. `apps/frontend/__tests__/e2e/onboarding.spec.ts`

---

## Acceptance Criteria Verification

| Criterion | Status | Notes |
|-----------|--------|-------|
| Onboarding page created | ⚠️ PARTIAL | Component exists but not tested |
| OnboardingWizardModal | ✅ PASS | File: `OnboardingWizardModal.tsx` |
| OnboardingGuard | ✅ PASS | File: `OnboardingGuard.tsx` |
| SkipConfirmationDialog | ✅ PASS | File: `SkipConfirmationDialog.tsx` |
| SetupInProgressMessage | ✅ PASS | File: `SetupInProgressMessage.tsx` |
| OnboardingLauncher | ✅ PASS | File: `OnboardingLauncher.tsx` |
| OnboardingStepIndicator | ✅ PASS | File: `OnboardingStepIndicator.tsx` |
| useOnboardingStatus hook | ❌ FAIL | Response parsing mismatch (Issue #2) |
| GET /onboarding/status | ✅ PASS | File: `status/route.ts` |
| POST /onboarding/skip | ✅ PASS | File: `skip/route.ts` |
| PUT /onboarding/progress | ✅ PASS | File: `progress/route.ts` |
| OnboardingService | ✅ PASS | File: `onboarding-service.ts` |
| Admin role checks | ✅ PASS | All mutation endpoints check admin access |
| RLS enforcement | ✅ PASS | Uses getOrgContext() for isolation |
| Wireframe SET-001 | ✅ PASS | OnboardingLauncher matches spec |
| Unit tests present | ⚠️ PARTIAL | Tests exist but need mock fixes (Issue #3) |

**Acceptance Score:** 13/16 (81%) - **REQUEST_CHANGES**

---

## Required Actions Before QA

### Action 1: Create Zod Validation (30 min)
```bash
# Create new file:
apps/frontend/lib/validation/onboarding-schemas.ts
# Add schemas per Issue #1 above
```

### Action 2: Fix Hook Response Parsing (2 min)
```bash
# Edit existing file:
apps/frontend/lib/hooks/useOnboardingStatus.ts
# Lines 71-73: Change field names per Issue #2 above
```

### Action 3: Fix Tests (1-2 hours)
```bash
cd apps/frontend

# Run tests to identify failures
pnpm test -- --run

# Fix mock structures in all test files
# Update field names to match actual API response structure

# Run again to verify 80%+ passing
pnpm test -- --run --coverage
```

### Action 4: Get CODE-REVIEWER Approval
After fixes:
1. Commit changes
2. Request fresh code review
3. Verify APPROVED decision
4. Proceed to QA

---

## Next Steps

1. **Developer**: Apply 3 fixes (30 min + 1-2 hours testing)
2. **CODE-REVIEWER**: Re-review fixes, confirm APPROVED
3. **QA**: Validate 8 acceptance criteria
4. **DOCS**: Generate documentation
5. **Release**: Commit and create PR to main

---

## Handoff Checklist

**For Next Developer:**
- [ ] Create `onboarding-schemas.ts` with Zod validation
- [ ] Fix hook response parsing (2 field name changes)
- [ ] Fix test mock structures (all test files)
- [ ] Run full test suite: `pnpm test -- --run --coverage`
- [ ] Verify 80%+ coverage and all tests passing
- [ ] Request CODE-REVIEWER approval
- [ ] Proceed to QA

**Estimated Time:** 2-3 hours

---

**Generated:** 2025-12-18
**From:** CODE-REVIEWER + Implementation Reports
**Status:** REQUEST_CHANGES (3 issues must fix)
**Quality:** HIGH (70-80% complete, fixes are straightforward)
