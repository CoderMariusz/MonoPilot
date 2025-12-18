# HANDOFF: Story 01.3 Code Review - REQUEST_CHANGES

**From:** CODE-REVIEWER
**To:** BACKEND-DEV / FRONTEND-DEV
**Date:** 2025-12-18
**Story:** 01.3 - Onboarding Wizard Launcher

---

## Decision: REQUEST_CHANGES

**Severity:** MAJOR (3 blocking issues)
**Estimated Fix Time:** 5-7 hours

---

## Issues Summary

| Issue | Severity | File | Effort |
|-------|----------|------|--------|
| #1: Missing tests (BLOCKER) | MAJOR | N/A - tests don't exist | 4-6 hrs |
| #2: Hook response parsing | MAJOR | `useOnboardingStatus.ts:71-73` | 5 mins |
| #3: Missing Zod schemas | MAJOR | All API routes | 30 mins |

---

## Issue #1: Missing Test Coverage (BLOCKER)

**Status:** Zero test files exist for Story 01.3
**Impact:** Cannot verify acceptance criteria, violates TDD requirement

### Required Test Files (10 total):

#### API Route Tests (3 files):
```
apps/frontend/__tests__/api/v1/settings/onboarding/status.test.ts
apps/frontend/__tests__/api/v1/settings/onboarding/skip.test.ts
apps/frontend/__tests__/api/v1/settings/onboarding/progress.test.ts
```

#### Service Tests (1 file):
```
apps/frontend/__tests__/lib/services/onboarding-service.test.ts
```

#### Component Tests (5 files):
```
apps/frontend/__tests__/components/onboarding/OnboardingGuard.test.tsx
apps/frontend/__tests__/components/onboarding/OnboardingWizardModal.test.tsx
apps/frontend/__tests__/components/onboarding/OnboardingLauncher.test.tsx
apps/frontend/__tests__/components/onboarding/SkipConfirmationDialog.test.tsx
apps/frontend/__tests__/components/onboarding/SetupInProgressMessage.test.tsx
```

#### Hook Tests (1 file):
```
apps/frontend/__tests__/lib/hooks/useOnboardingStatus.test.ts
```

### Test Coverage Requirements:
- Admin vs non-admin role checks
- Demo data creation (warehouse, location, product)
- Step progression (0 → 1 → ... → 6)
- Error handling (401, 403, 404, 500)
- Component rendering states (loading, error, success)
- Minimum 80% code coverage

---

## Issue #2: Hook Response Parsing Mismatch

**File:** `apps/frontend/lib/hooks/useOnboardingStatus.ts`
**Lines:** 71-73

### Problem:
Hook expects different field names than API returns.

### Current Code (WRONG):
```typescript
// Line 71-73
const currentStep = data.onboarding_step ?? 0        // API returns 'step'
const completed = !!data.onboarding_completed_at     // API returns 'completed_at'
const skipped = data.onboarding_skipped ?? false     // This is correct
```

### Fix:
```typescript
// Line 71-73
const currentStep = data.step ?? 0                   // ✅ Use 'step'
const completed = !!data.completed_at                // ✅ Use 'completed_at'
const skipped = data.skipped ?? false                // ✅ Already correct
```

**Test After Fix:**
```bash
npm test -- useOnboardingStatus.test.ts
```

---

## Issue #3: Missing Zod Validation Schemas

**Impact:** No runtime type safety for API requests/responses

### Step 1: Create Validation File

**File:** `apps/frontend/lib/validation/onboarding-schemas.ts`

```typescript
import { z } from 'zod'

export const OnboardingStatusSchema = z.object({
  step: z.number().int().min(0).max(6),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  skipped: z.boolean(),
  is_complete: z.boolean(),
})

export const UpdateProgressSchema = z.object({
  step: z.number().int().min(1).max(6),
})

export const SkipResultSchema = z.object({
  success: z.boolean(),
  warehouse_id: z.string().uuid(),
  location_id: z.string().uuid(),
  product_id: z.string().uuid(),
})

export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>
export type UpdateProgress = z.infer<typeof UpdateProgressSchema>
export type SkipResult = z.infer<typeof SkipResultSchema>
```

### Step 2: Update API Routes

#### File: `apps/frontend/app/api/v1/settings/onboarding/progress/route.ts`

**Change lines 64-74 from:**
```typescript
const body = await request.json()
const { step } = body

// Manual validation
if (typeof step !== 'number' || step < 1 || step > 6) {
  return NextResponse.json(
    { error: 'Invalid step number. Must be between 1 and 6' },
    { status: 400 }
  )
}
```

**To:**
```typescript
import { UpdateProgressSchema } from '@/lib/validation/onboarding-schemas'

const body = await request.json()
const validated = UpdateProgressSchema.parse(body) // Throws ZodError on invalid

await OnboardingService.updateProgress(context.org_id, validated.step)
```

#### File: `apps/frontend/app/api/v1/settings/onboarding/status/route.ts`

**Add validation to response:**
```typescript
import { OnboardingStatusSchema } from '@/lib/validation/onboarding-schemas'

// After building response (line 56-62)
const response = OnboardingStatusSchema.parse({
  step: status.step,
  started_at: status.started_at,
  completed_at: status.completed_at,
  skipped: status.skipped,
  is_complete: status.is_complete,
})
```

---

## Testing Checklist

After making fixes, run:

```bash
# 1. Fix hook response parsing
# Edit: apps/frontend/lib/hooks/useOnboardingStatus.ts:71-73

# 2. Create Zod schemas
# Create: apps/frontend/lib/validation/onboarding-schemas.ts
# Update: All 3 API routes to use schemas

# 3. Create all test files (10 files)

# 4. Run tests
npm test -- --run

# 5. Verify coverage >= 80%
npm test -- --coverage

# 6. Commit fixes
git add .
git commit -m "fix(story-01.3): Add test coverage, fix hook parsing, add Zod validation"
```

---

## Acceptance Criteria - Current Status

| Criterion | Status | Blocker? |
|-----------|--------|----------|
| All components created | ✅ PASS | No |
| API routes functional | ✅ PASS | No |
| Service layer implemented | ✅ PASS | No |
| Hook implemented | ❌ FAIL | Yes (Issue #2) |
| Security checks (admin roles) | ✅ PASS | No |
| RLS enforcement | ✅ PASS | No |
| Test coverage >= 80% | ❌ FAIL | Yes (Issue #1) |
| Zod validation | ❌ FAIL | Yes (Issue #3) |

**Current Score:** 13/16 (81%) - **BELOW THRESHOLD**

---

## Files to Modify

### Fix Issue #2 (5 minutes):
1. `apps/frontend/lib/hooks/useOnboardingStatus.ts` - Lines 71-73

### Fix Issue #3 (30 minutes):
1. **CREATE:** `apps/frontend/lib/validation/onboarding-schemas.ts`
2. **UPDATE:** `apps/frontend/app/api/v1/settings/onboarding/status/route.ts`
3. **UPDATE:** `apps/frontend/app/api/v1/settings/onboarding/skip/route.ts`
4. **UPDATE:** `apps/frontend/app/api/v1/settings/onboarding/progress/route.ts`

### Fix Issue #1 (4-6 hours):
1. **CREATE:** 3 API route test files
2. **CREATE:** 1 service test file
3. **CREATE:** 5 component test files
4. **CREATE:** 1 hook test file

---

## What's Working Well ⭐

- ✅ Security architecture is excellent (no direct DB access)
- ✅ Admin role checks on all mutation endpoints
- ✅ Perfect ADR-013 compliance (multi-tenancy)
- ✅ All 7 components follow ShadCN UI patterns
- ✅ Comprehensive JSDoc documentation
- ✅ Database schema properly defined (migration 054)

---

## Next Steps

1. **DEV** fixes Issues #1, #2, #3
2. **DEV** runs `npm test -- --coverage` to verify 80%+ coverage
3. **DEV** commits fixes with message: `fix(story-01.3): Add test coverage, fix hook parsing, add Zod validation`
4. **DEV** requests re-review from CODE-REVIEWER
5. **CODE-REVIEWER** re-reviews Story 01.3
6. If APPROVED → Handoff to QA-AGENT

---

## Reference

**Full Review:** `docs/2-MANAGEMENT/reviews/code-review-story-01-3.md`
**Story Spec:** `docs/2-MANAGEMENT/epics/current/01-settings/context/01.3/frontend.yaml`

---

**End of Handoff**
