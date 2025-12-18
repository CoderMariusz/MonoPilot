# Code Review Report: Story 01.3 - Onboarding Wizard Launcher

**Reviewer:** CODE-REVIEWER Agent
**Date:** 2025-12-18
**Story:** 01.3 - Onboarding Wizard Launcher
**Epic:** 01-settings

---

## DECISION: REQUEST_CHANGES

**Severity:** MAJOR
**Reason:** Missing tests, incomplete hook implementation, missing validation

---

## Executive Summary

Story 01.3 implements the onboarding wizard launcher with 7 components, 1 hook, 3 API routes, and 1 service layer. The implementation follows MonoPilot patterns and addresses all previously identified critical security issues. However, there are **MAJOR** quality issues that must be resolved before approval.

### Previous Blockers - RESOLVED ✅
- ✅ **Security:** `useOnboardingStatus` now uses API endpoint (not direct DB access)
- ✅ **Service Layer:** API routes properly use `OnboardingService`
- ✅ **Components:** All 7 frontend components created
- ✅ **Database Schema:** Onboarding fields exist in organizations table (migration 054)

### Current Blockers - MUST FIX 🚫
- ❌ **Tests:** No test files exist for any components or API routes (CRITICAL for TDD)
- ❌ **Hook Implementation:** `useOnboardingStatus` has mismatched response parsing
- ❌ **Type Safety:** Missing Zod validation schemas for API requests/responses
- ❌ **Error Messages:** Some error messages expose internal details

---

## Test Results

### Unit Tests
```
FAILED - 291 tests failing in 01.6.role-permissions.test.ts (unrelated to this story)
STATUS: Existing test failures in Story 01.6 - Does not block Story 01.3
```

### Story 01.3 Tests
```
MISSING - No test files found for:
- apps/frontend/__tests__/01-settings/01.3.onboarding.test.tsx
- apps/frontend/__tests__/components/onboarding/*.test.tsx
- apps/frontend/__tests__/api/v1/settings/onboarding/*.test.ts
```

**BLOCKER:** Story 01.3 claims to follow TDD but has ZERO tests. This violates MonoPilot's TDD requirement.

---

## Security Review ✅ PASSED

### 1. No Direct DB Access from Frontend ✅
**Status:** PASS
**File:** `apps/frontend/lib/hooks/useOnboardingStatus.ts:57`

```typescript
// SECURITY FIX: Use API endpoint instead of direct Supabase access
const response = await fetch('/api/v1/settings/onboarding/status')
```

**Analysis:** Hook correctly uses API endpoint. No direct Supabase client usage in frontend.

### 2. Admin Role Checks Present ✅
**Status:** PASS
**Files:**
- `apps/frontend/app/api/v1/settings/onboarding/skip/route.ts:70`
- `apps/frontend/app/api/v1/settings/onboarding/progress/route.ts:60`

```typescript
// Skip endpoint (line 70)
if (!hasAdminAccess(context.role_code)) {
  throw new ForbiddenError('Only administrators can skip onboarding wizard')
}

// Progress endpoint (line 60)
if (!hasAdminAccess(context.role_code)) {
  throw new ForbiddenError('Only administrators can update onboarding progress')
}
```

**Analysis:** Both mutation endpoints properly check admin access using `hasAdminAccess()`.

### 3. Org Context Validation (ADR-013) ✅
**Status:** PASS
**Files:** All 3 API routes follow pattern:

```typescript
// 1. Get authenticated user
const userId = await deriveUserIdFromSession()

// 2. Get org context (validates org_id, user_id, role)
const context = await getOrgContext(userId)

// 3. Use context.org_id for queries
const status = await OnboardingService.getStatus(context.org_id)
```

**Analysis:** Perfect ADR-013 compliance. All API routes:
1. Derive userId from session
2. Get org context (validates multi-tenancy)
3. Pass org_id to service layer

### 4. Input Validation ✅
**Status:** PASS (with MINOR issue)
**File:** `apps/frontend/lib/services/onboarding-service.ts:76`

```typescript
// UUID validation
if (!orgId || !isValidUUID(orgId)) {
  throw new Error('Invalid organization ID')
}

// Step range validation (route.ts:69)
if (typeof step !== 'number' || step < 1 || step > 6) {
  return NextResponse.json(
    { error: 'Invalid step number. Must be between 1 and 6' },
    { status: 400 }
  )
}
```

**Analysis:** Good input validation. MINOR: Should use Zod schemas instead of manual checks (see Issue #3).

### 5. Error Messages ⚠️
**Status:** MINOR ISSUE
**File:** `apps/frontend/lib/services/onboarding-service.ts:90`

```typescript
// MINOR ISSUE: Exposes database error details
throw new Error(`Failed to fetch onboarding status: ${error?.message || 'Organization not found'}`)
```

**Recommendation:** Sanitize error messages to avoid leaking database structure. Use generic messages in production.

---

## Code Quality Review

### 1. TypeScript Strict Mode ✅
**Status:** PASS
**Analysis:** All files use proper TypeScript types with interfaces. No `any` types found.

### 2. JSDoc Comments ✅
**Status:** PASS
**Analysis:** Excellent JSDoc coverage on all service methods, components, and hooks.

Example from `onboarding-service.ts:51-73`:
```typescript
/**
 * Get onboarding status for an organization
 *
 * Retrieves current wizard state including step number, timestamps,
 * and completion status.
 *
 * **Security:** Validates org_id format to prevent SQL injection.
 * Uses RLS policies for tenant isolation.
 *
 * @param orgId - Organization UUID
 * @returns {Promise<OnboardingStatus>} Current onboarding status
 * @throws {Error} If org_id is invalid or organization not found
 *
 * @example
 * ```typescript
 * const status = await OnboardingService.getStatus(orgId);
 * if (status.is_complete) {
 *   // Skip wizard
 * }
 * ```
 */
```

### 3. Code Duplication ✅
**Status:** PASS
**Analysis:** No significant duplication. Service layer properly abstracts database logic from API routes.

### 4. MonoPilot Patterns ✅
**Status:** PASS
**Analysis:** Follows all documented patterns:
- ✅ API routes in `app/api/v1/[module]/[resource]/`
- ✅ Service layer in `lib/services/*-service.ts`
- ✅ Hooks in `lib/hooks/use-*.ts`
- ✅ Components in `components/[module]/*.tsx`
- ✅ RLS-first security model

---

## Issues Found

### CRITICAL Issues: 0
No blocking security vulnerabilities or data loss risks.

### MAJOR Issues: 3

#### Issue #1: Missing Test Coverage (BLOCKER)
**Severity:** MAJOR
**File:** N/A - Tests don't exist
**Impact:** Cannot verify acceptance criteria, violates TDD requirement

**Required Tests:**
1. **API Route Tests:**
   - `apps/frontend/__tests__/api/v1/settings/onboarding/status.test.ts`
   - `apps/frontend/__tests__/api/v1/settings/onboarding/skip.test.ts`
   - `apps/frontend/__tests__/api/v1/settings/onboarding/progress.test.ts`

2. **Service Tests:**
   - `apps/frontend/__tests__/lib/services/onboarding-service.test.ts`

3. **Component Tests:**
   - `apps/frontend/__tests__/components/onboarding/OnboardingGuard.test.tsx`
   - `apps/frontend/__tests__/components/onboarding/OnboardingWizardModal.test.tsx`
   - `apps/frontend/__tests__/components/onboarding/OnboardingLauncher.test.tsx`
   - `apps/frontend/__tests__/components/onboarding/SkipConfirmationDialog.test.tsx`

4. **Hook Tests:**
   - `apps/frontend/__tests__/lib/hooks/useOnboardingStatus.test.ts`

**Test Coverage Required:**
- Admin role checks (admin can skip, non-admin cannot)
- Org context validation (userId → orgId mapping)
- Demo data creation (warehouse, location, product)
- Step progression (0 → 1 → ... → 6)
- Error handling (401, 403, 404, 500)
- Component rendering (launcher, wizard, guard states)

**Recommendation:** BLOCK merge until minimum 80% test coverage achieved.

---

#### Issue #2: Hook Response Parsing Mismatch
**Severity:** MAJOR
**File:** `apps/frontend/lib/hooks/useOnboardingStatus.ts:71-73`

**Problem:**
```typescript
// Hook expects these fields from API:
const currentStep = data.onboarding_step ?? 0
const completed = !!data.onboarding_completed_at
const skipped = data.onboarding_skipped ?? false
```

**But API returns different field names:**
```typescript
// API route returns (route.ts:56-62):
const response = {
  step: status.step,               // NOT onboarding_step
  started_at: status.started_at,   // NOT onboarding_started_at
  completed_at: status.completed_at, // NOT onboarding_completed_at
  skipped: status.skipped,
  can_skip: hasAdminAccess(context.role_code),
}
```

**Impact:** Hook will fail to parse API response correctly. `step` will always be `null`.

**Fix Required:**
```typescript
// apps/frontend/lib/hooks/useOnboardingStatus.ts:71-73
const currentStep = data.step ?? 0           // Use 'step', not 'onboarding_step'
const completed = !!data.completed_at        // Use 'completed_at', not 'onboarding_completed_at'
const skipped = data.skipped ?? false        // This is correct
```

---

#### Issue #3: Missing Zod Validation Schemas
**Severity:** MAJOR
**File:** All API routes
**Impact:** No runtime type safety for API requests/responses

**Current State:**
```typescript
// Manual validation in route.ts:65-74
const body = await request.json()
const { step } = body

if (typeof step !== 'number' || step < 1 || step > 6) {
  return NextResponse.json(
    { error: 'Invalid step number. Must be between 1 and 6' },
    { status: 400 }
  )
}
```

**MonoPilot Pattern:**
All API routes should use Zod schemas from `lib/validation/`.

**Required:**
Create `apps/frontend/lib/validation/onboarding-schemas.ts`:

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

**Update API routes to use schemas:**
```typescript
// apps/frontend/app/api/v1/settings/onboarding/progress/route.ts
const body = await request.json()
const validated = UpdateProgressSchema.parse(body) // Throws on invalid input
```

---

### MINOR Issues: 2

#### Issue #4: Inconsistent Loading Indicators
**Severity:** MINOR
**Files:**
- `apps/frontend/components/onboarding/OnboardingGuard.tsx:56-64`
- `apps/frontend/components/onboarding/SetupInProgressMessage.tsx:38`

**Analysis:**
- OnboardingGuard uses `<Loader2>` spinner
- SetupInProgressMessage uses `<Loader2>` spinner with `<Settings>` icon
- Inconsistent animation styles

**Recommendation:** Standardize loading indicators across components for better UX consistency.

---

#### Issue #5: TODO Comments in Production Code
**Severity:** MINOR
**File:** `apps/frontend/components/onboarding/OnboardingWizardModal.tsx:54,108,113`

```typescript
const handleStart = async () => {
  // TODO: Update onboarding_step to 1 via API
  // For now, this will be implemented in subsequent stories
  toast({
    title: 'Coming Soon',
    description: 'Step 1 will be implemented in Story 01.4',
  })
}
```

**Analysis:** TODOs are acceptable for Story 01.3 scope (launcher only). These are properly documented as deferred to Story 01.4.

**Recommendation:** Track these TODOs in Story 01.4 acceptance criteria.

---

## Acceptance Criteria Verification

### From `frontend.yaml` (Story 01.3 Spec)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| **Pages:** Onboarding page created | ⚠️ PARTIAL | Component exists but not tested |
| **Components:** OnboardingWizardModal | ✅ PASS | File: `OnboardingWizardModal.tsx` |
| **Components:** OnboardingGuard | ✅ PASS | File: `OnboardingGuard.tsx` |
| **Components:** SkipConfirmationDialog | ✅ PASS | File: `SkipConfirmationDialog.tsx` |
| **Components:** SetupInProgressMessage | ✅ PASS | File: `SetupInProgressMessage.tsx` |
| **Components:** OnboardingLauncher | ✅ PASS | File: `OnboardingLauncher.tsx` |
| **Components:** OnboardingStepIndicator | ✅ PASS | File: `OnboardingStepIndicator.tsx` |
| **Hooks:** useOnboardingStatus | ❌ FAIL | Response parsing mismatch (Issue #2) |
| **API:** GET /onboarding/status | ✅ PASS | File: `status/route.ts` |
| **API:** POST /onboarding/skip | ✅ PASS | File: `skip/route.ts` |
| **API:** PUT /onboarding/progress | ✅ PASS | File: `progress/route.ts` |
| **Service:** OnboardingService | ✅ PASS | File: `onboarding-service.ts` |
| **Security:** Admin role checks | ✅ PASS | All mutation endpoints check admin access |
| **Security:** RLS enforcement | ✅ PASS | Uses getOrgContext() for isolation |
| **UX:** Wireframe SET-001 | ✅ PASS | OnboardingLauncher matches spec |
| **Tests:** Unit tests present | ❌ FAIL | Zero tests exist (Issue #1) |

**Acceptance Score:** 13/16 (81%) - **REQUEST_CHANGES**

---

## Positive Feedback ⭐

1. **Excellent Security Architecture:**
   - Proper separation of concerns (frontend → API → service → DB)
   - Correct admin role checks on all mutation endpoints
   - Perfect ADR-013 compliance for multi-tenancy

2. **Clean Service Layer:**
   - Well-documented methods with JSDoc
   - Comprehensive error handling
   - UUID validation prevents injection attacks

3. **Component Quality:**
   - All 7 components follow ShadCN UI patterns
   - Proper loading/error states
   - Accessible (Loader2, AlertDialog, Button components)

4. **Database Schema:**
   - Onboarding fields properly defined in migration 054
   - Indexed for performance (slug, is_active)
   - RLS enabled for security

---

## Required Fixes (MUST before approval)

### Fix #1: Add Test Coverage (BLOCKER)
**Priority:** CRITICAL
**Effort:** 4-6 hours

Create test files with minimum 80% coverage:
1. API route tests (3 files)
2. Service tests (1 file)
3. Component tests (5 files)
4. Hook tests (1 file)

**Test Requirements:**
- All happy paths
- Admin vs non-admin access
- Error cases (401, 403, 404, 500)
- Step progression logic
- Demo data creation

---

### Fix #2: Correct Hook Response Parsing
**Priority:** HIGH
**Effort:** 5 minutes
**File:** `apps/frontend/lib/hooks/useOnboardingStatus.ts:71-73`

```diff
// Set state from fetched data
- const currentStep = data.onboarding_step ?? 0
- const completed = !!data.onboarding_completed_at
+ const currentStep = data.step ?? 0
+ const completed = !!data.completed_at
  const skipped = data.skipped ?? false
```

---

### Fix #3: Add Zod Validation Schemas
**Priority:** HIGH
**Effort:** 30 minutes

1. Create `apps/frontend/lib/validation/onboarding-schemas.ts`
2. Define schemas for all API request/response types
3. Update API routes to use `schema.parse(body)`
4. Export types using `z.infer<typeof Schema>`

---

## Optional Improvements (Nice to have)

### Improvement #1: Sanitize Error Messages
**File:** `apps/frontend/lib/services/onboarding-service.ts:90`

```diff
- throw new Error(`Failed to fetch onboarding status: ${error?.message || 'Organization not found'}`)
+ throw new Error('Failed to load organization settings. Please try again.')
```

### Improvement #2: Add Request Timeout
**File:** `apps/frontend/lib/hooks/useOnboardingStatus.ts:57`

```typescript
const response = await fetch('/api/v1/settings/onboarding/status', {
  signal: AbortSignal.timeout(5000) // 5 second timeout
})
```

---

## Handoff to DEV

### Story: 01.3
**Decision:** REQUEST_CHANGES
**Blocking Issues:** 3 MAJOR

### Required Fixes:
1. **Add test coverage** - 10 test files minimum (BLOCKER)
   - API routes: status, skip, progress
   - Service: OnboardingService
   - Components: All 5 onboarding components
   - Hook: useOnboardingStatus

2. **Fix hook response parsing** - `useOnboardingStatus.ts:71-73`
   - Change `data.onboarding_step` → `data.step`
   - Change `data.onboarding_completed_at` → `data.completed_at`

3. **Add Zod validation** - Create `onboarding-schemas.ts`
   - Define OnboardingStatusSchema
   - Define UpdateProgressSchema
   - Define SkipResultSchema
   - Update API routes to use schemas

### Estimated Fix Time: 5-7 hours

### Next Steps:
1. DEV fixes issues #1-3
2. DEV runs `npm test` to verify 80%+ coverage
3. DEV creates new commit with fixes
4. CODE-REVIEWER re-reviews Story 01.3

---

## Coverage Summary

| Category | Status | Notes |
|----------|--------|-------|
| **Security** | ✅ PASS | No critical vulnerabilities |
| **Code Quality** | ✅ PASS | Follows MonoPilot patterns |
| **Tests** | ❌ FAIL | Zero tests exist (BLOCKER) |
| **Acceptance Criteria** | ⚠️ PARTIAL | 13/16 criteria met (81%) |
| **Documentation** | ✅ PASS | Excellent JSDoc coverage |

---

## Final Recommendation

**DO NOT MERGE** until:
1. ✅ All 10 test files created with 80%+ coverage
2. ✅ Hook response parsing fixed
3. ✅ Zod schemas added
4. ✅ Tests pass with `npm test`

**Estimated Timeline:** 1 day for fixes + re-review

---

**Reviewed by:** CODE-REVIEWER Agent
**Review Date:** 2025-12-18
**Next Action:** Return to DEV for fixes
