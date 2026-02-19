# Handoff: Story 01.3 → DEV (for fixes)

**From**: CODE-REVIEWER
**To**: BACKEND-DEV / FRONTEND-DEV
**Date**: 2025-12-19
**Decision**: REQUEST CHANGES

---

## Status

- **Implementation**: 85% complete
- **Tests**: 50/54 passing (92.6%)
- **Blockers**: 3 critical, 2 major
- **Estimated Fix Time**: 4-6 hours

---

## What's Working Well ✓

1. **Security**: All OWASP checks pass
   - Authentication/authorization properly implemented
   - UUID validation prevents SQL injection
   - Generic error messages (no info leakage)

2. **Code Quality**: TypeScript strict mode, excellent documentation
   - Service layer architecture is exemplary
   - Clean separation of concerns
   - Comprehensive JSDoc on all functions

3. **Test Coverage**: 92.6% pass rate
   - Tests linked to acceptance criteria
   - Proper mocking and isolation
   - Given/When/Then format

4. **Architecture**: Follows MonoPilot patterns
   - RESTful API routes
   - Service layer isolation
   - Zod validation schemas

---

## Critical Blockers (MUST FIX)

### 1. Missing Database Migration
**Priority**: P0 (blocks deployment)
**File**: `supabase/migrations/XXX_add_onboarding_columns.sql`

**Required**:
```sql
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_skipped BOOLEAN DEFAULT false;
```

**Verification**:
```bash
psql -c "\d organizations" | grep onboarding
```

---

### 2. Test Failures (4 tests)
**Priority**: P0 (quality gate)

#### 2a. Wizard shows when onboarding complete
**File**: `components/onboarding/OnboardingWizardLauncher.tsx:87`

**Issue**: Component doesn't check `onboarding_completed_at` before rendering wizard.

**Fix**:
```typescript
// After line 87: if (!context) return null
const isOnboardingComplete =
  context.organizations?.onboarding_completed_at ||
  context.organization?.onboarding_completed_at

if (isOnboardingComplete) {
  router.push('/dashboard')
  return null
}
```

**Tests affected**:
- ✗ should NOT display wizard when onboarding_completed_at is set
- ✗ should redirect to dashboard when onboarding completed

#### 2b. URL parsing error in tests
**File**: `components/onboarding/OnboardingWizardLauncher.tsx:29`

**Issue**: Fetch uses relative URL `/api/...` which fails in test environment.

**Fix Option 1** (prefer this):
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
const response = await fetch(`${apiUrl}/api/v1/settings/onboarding/progress`, {
  method: 'PUT',
  // ...
})
```

**Fix Option 2**: Update test mocks to handle relative URLs.

**Test affected**:
- ✗ should persist onboarding_step when step 1 completed

#### 2c. Multi-admin test expectations
**File**: `__tests__/01-settings/01.3.onboarding-wizard-launcher.test.tsx`

**Issue**: Test expects database fetch, but may need test adjustment vs code fix.

**Action**: Review test expectations - may be test issue, not code issue.

**Test affected**:
- ✗ should load shared progress from database

---

### 3. Type Mismatch: organization vs organizations
**Priority**: P0 (runtime safety)

**Issue**: Components use inconsistent property names:
- `OnboardingGuard` expects `context.organization` (singular)
- `OnboardingWizardLauncher` expects `context.organizations` (plural)
- Test mocks provide BOTH as workaround

**Fix**:
1. Define canonical type in `lib/types/org-context.ts`:
```typescript
export interface OrgContext {
  org_id: string
  user_id: string
  role_code: string
  role_name: string
  permissions: Record<string, unknown>
  organization: Organization  // SINGULAR - canonical
  user: User
}
```

2. Update all components to use `context.organization` (singular)

3. Remove test workarounds providing both properties

**Files to update**:
- `components/onboarding/OnboardingWizardLauncher.tsx`
- `components/onboarding/OnboardingGuard.tsx`
- `__tests__/01-settings/01.3.onboarding-wizard-launcher.test.tsx`

---

## Major Issues (SHOULD FIX)

### 4. Service Layer Uses Client Supabase
**Priority**: P1 (architecture)
**File**: `lib/services/onboarding-service.ts`

**Issue**:
```typescript
import { createClient } from '@/lib/supabase/client'  // CLIENT-SIDE
```

Service called from API routes (server-side) but imports client Supabase.

**Fix Options**:
1. Pass Supabase client to service methods:
```typescript
export class OnboardingService {
  static async getStatus(
    supabase: SupabaseClient,  // Add parameter
    orgId: string
  ): Promise<OnboardingStatus> {
    // Use passed parameter, not createClient()
  }
}
```

2. OR document that service is client-side only

---

### 5. Demo Data Not Transactional
**Priority**: P1 (data integrity)
**File**: `lib/services/onboarding-service.ts:247-339`

**Issue**: Sequential inserts (warehouse → location → product) can leave partial data if any step fails.

**Fix**: Create database RPC function with transaction:

```sql
-- supabase/migrations/XXX_create_demo_data_function.sql
CREATE OR REPLACE FUNCTION create_demo_data(p_org_id UUID)
RETURNS JSON AS $$
DECLARE
  v_warehouse_id UUID;
  v_location_id UUID;
  v_product_id UUID;
BEGIN
  -- All in one transaction (automatic rollback on error)

  INSERT INTO warehouses (org_id, code, name, type, is_default, is_active)
  VALUES (p_org_id, 'DEMO-WH', 'Main Warehouse', 'general', true, true)
  RETURNING id INTO v_warehouse_id;

  INSERT INTO locations (org_id, warehouse_id, code, name, type, is_active)
  VALUES (p_org_id, v_warehouse_id, 'DEFAULT', 'Default Location', 'zone', true)
  RETURNING id INTO v_location_id;

  INSERT INTO products (org_id, code, name, uom, status, is_active)
  VALUES (p_org_id, 'SAMPLE-001', 'Sample Product', 'EA', 'active', true)
  RETURNING id INTO v_product_id;

  RETURN json_build_object(
    'warehouse_id', v_warehouse_id,
    'location_id', v_location_id,
    'product_id', v_product_id
  );
END;
$$ LANGUAGE plpgsql;
```

Then call from service:
```typescript
static async createDemoData(orgId: string): Promise<DemoDataResult> {
  const { data, error } = await supabase
    .rpc('create_demo_data', { p_org_id: orgId })

  if (error) throw new Error(`Failed: ${error.message}`)

  return {
    success: true,
    warehouse_id: data.warehouse_id,
    location_id: data.location_id,
    product_id: data.product_id,
  }
}
```

---

## Files Modified (for reference)

### Backend
- `app/api/v1/settings/onboarding/status/route.ts` - GET status
- `app/api/v1/settings/onboarding/skip/route.ts` - POST skip wizard
- `app/api/v1/settings/onboarding/progress/route.ts` - PUT update progress
- `lib/services/onboarding-service.ts` - Business logic (341 lines)
- `lib/validation/onboarding-schemas.ts` - Zod schemas

### Frontend
- `components/onboarding/OnboardingWizardModal.tsx` - Wizard UI (273 lines)
- `components/onboarding/OnboardingGuard.tsx` - Route guard (127 lines)
- `components/onboarding/OnboardingWizardLauncher.tsx` - Launcher page (163 lines)
- `lib/hooks/useOnboardingStatus.ts` - Status hook (102 lines)

### Tests
- `__tests__/01-settings/01.3.onboarding-wizard-launcher.test.tsx` - Integration
- `components/onboarding/__tests__/OnboardingWizardModal.test.tsx` - Unit
- `components/onboarding/__tests__/OnboardingGuard.test.tsx` - Unit
- `lib/hooks/__tests__/useOnboardingStatus.test.tsx` - Unit

---

## Fix Checklist

### Critical (MUST DO)
- [ ] Create database migration (`XXX_add_onboarding_columns.sql`)
- [ ] Run migration locally and verify columns exist
- [ ] Add completion check to `OnboardingWizardLauncher` (line 87)
- [ ] Fix URL parsing in fetch calls OR update test mocks
- [ ] Review multi-admin test expectations
- [ ] Define canonical `OrgContext` type
- [ ] Update all components to use singular `organization`
- [ ] Remove test workarounds providing both properties
- [ ] Run all tests - target 100% pass rate

### Major (SHOULD DO)
- [ ] Pass Supabase client to service methods OR document client-side usage
- [ ] Create `create_demo_data` RPC function
- [ ] Update `OnboardingService.createDemoData()` to use RPC

### Minor (NICE TO HAVE)
- [ ] Add missing ARIA attributes (`aria-modal`, `role="alertdialog"`)
- [ ] Add manual keyboard navigation testing
- [ ] Add audit logging for skip action
- [ ] Add rate limiting to skip endpoint

---

## Testing Instructions (After Fixes)

### 1. Database Migration
```bash
# Run migration
psql -f supabase/migrations/XXX_add_onboarding_columns.sql

# Verify columns exist
psql -c "\d organizations" | grep onboarding

# Expected output:
# onboarding_step          | integer | default 0
# onboarding_started_at    | timestamp with time zone |
# onboarding_completed_at  | timestamp with time zone |
# onboarding_skipped       | boolean | default false
```

### 2. Run Tests
```bash
cd apps/frontend
npm test onboarding

# Expected: 54/54 tests passing (100%)
```

### 3. Manual Testing
```bash
# Start dev server
npm run dev

# Test scenarios:
1. Create new org (onboarding_step=0) → should show wizard
2. Set onboarding_completed_at → should redirect to dashboard
3. Click "Skip Wizard" → should create demo data
4. Log out, log in → should resume at saved step
5. Login as non-admin → should show "Setup in progress" message
```

---

## Re-Review Criteria

Once fixes are complete, request re-review. CODE-REVIEWER will check:

1. All 54 tests passing (100%)
2. Database migration exists and runs successfully
3. Type consistency (`organization` singular throughout)
4. No runtime errors in manual testing
5. Demo data creation is atomic (all or nothing)

**Target**: APPROVED status → QA-AGENT handoff

---

## Questions?

If any blockers are unclear or need clarification:
1. Review full code review: `code-review-story-01.3.md`
2. Check story spec: `01.3.onboarding-wizard-launcher.md`
3. Reference similar patterns: Story 01.4 (approved)

---

**Handoff Created**: 2025-12-19
**Next Review**: After dev completes fixes
