# Handoff: Story 01.7 - Module Toggles → DEV-AGENT

**From**: CODE-REVIEWER
**To**: DEV-AGENT (Backend/Frontend)
**Date**: 2025-12-20
**Decision**: REQUEST_CHANGES

---

## Status Summary

- **Implementation**: 60% complete
- **Tests**: 53/73 passing (73%)
- **Blockers**: 4 critical issues
- **Estimated Fix Time**: 2-3 days

---

## Critical Blockers (P0)

### 1. Wrong Database Pattern (ARCHITECTURAL)

**Current**: Uses `organizations.modules_enabled` array
**Required**: Use `organization_modules` junction table per ADR-011

**Impact**: No audit trail, no FK constraints, violates story spec

**Files to Fix**:
- `apps/frontend/lib/services/module-service.ts` (lines 47-127)
- `apps/frontend/app/api/settings/modules/route.ts` (entire file)
- Create migration to move data

**Estimated**: 4-6 hours

---

### 2. Missing Dependency Validation

**Issue**: Can enable Quality without Production (breaks app logic)

**Required Implementation** (from story line 257-296):
```typescript
function validateModuleToggle(
  moduleCode: string,
  newState: boolean,
  currentStates: Record<string, boolean>
): {
  valid: boolean;
  warning?: string;
  requiredChanges?: { module: string; enable: boolean }[];
}
```

**Files to Create**:
- Add to `module-service.ts`
- Wire into toggle API route
- Add tests

**Estimated**: 3-4 hours

---

### 3. Settings Module Can Be Disabled

**Issue**: No explicit check preventing Settings disable

**Fix** (module-service.ts):
```typescript
if (!enabled && moduleCode === 'settings') {
  return { success: false, error: 'Settings module cannot be disabled' }
}
```

**Estimated**: 30 minutes

---

### 4. Wrong Permission Check

**Current**: `userData.role !== 'admin'` (column doesn't exist)
**Required**: `userData.roles.code IN ('owner', 'admin')`

**Files to Fix**:
- `apps/frontend/app/api/settings/modules/route.ts` (lines 48-60)

**Estimated**: 1 hour

---

## Major Issues (P1)

### 5. No Cascade Operations

**Missing**: Cascade enable dependencies, cascade disable dependents
**Required**: Add `cascade?: boolean` parameter to toggleModule

**Estimated**: 2-3 hours

---

### 6. Using supabaseAdmin Instead of RLS

**Issue**: Bypasses RLS policies (security concern)
**Fix**: Use regular supabase client to enforce RLS

**Estimated**: 1-2 hours

---

## What's Working Well

1. ✅ **UI Components**: Module toggles page renders correctly
2. ✅ **Navigation Filtering**: useEnabledModules hook works
3. ✅ **RLS Policies**: Excellent policies in migration 058
4. ✅ **Test Coverage**: 37 API tests + 16 integration tests passing
5. ✅ **Migration Structure**: Clean, well-documented migrations

---

## Files to Modify

### Backend
1. `supabase/migrations/0XX_migrate_to_organization_modules.sql` (NEW - create)
2. `apps/frontend/lib/services/module-service.ts` (REWRITE - use junction table)
3. `apps/frontend/app/api/settings/modules/route.ts` (FIX - role check, table)

### Frontend
4. `apps/frontend/app/(authenticated)/settings/modules/page.tsx` (UPDATE - validation modal)

### Tests
5. `lib/services/__tests__/module-settings-service.test.ts` (UPDATE - new patterns)

---

## Recommended Approach

### Option A: Incremental Fix (Recommended)
1. Create migration to organization_modules table
2. Update service layer to use junction table
3. Add dependency validation logic
4. Fix Settings disable check
5. Fix role permission check
6. Add cascade operations

**Timeline**: 2-3 days
**Pros**: Reuse existing UI and tests
**Cons**: Some rework needed

### Option B: Rewrite
1. Start fresh with ADR-011 pattern
2. Build service layer correctly
3. Reuse UI components
4. Update tests

**Timeline**: 3-4 days
**Pros**: Clean implementation
**Cons**: More time

---

## Implementation Checklist

### Phase 1: Database Migration (P0-1)
- [ ] Create migration `0XX_migrate_to_organization_modules.sql`
- [ ] Copy data from organizations.modules_enabled to organization_modules
- [ ] Test migration on dev database
- [ ] Verify RLS policies work

### Phase 2: Service Layer (P0-1, P0-2)
- [ ] Rewrite `getEnabledModules()` to use organization_modules
- [ ] Rewrite `toggleModule()` to use organization_modules
- [ ] Add `validateModuleToggle()` function
- [ ] Add dependency checking logic
- [ ] Add Settings disable prevention
- [ ] Update return types to include affected_modules

### Phase 3: API Routes (P0-4)
- [ ] Fix role permission check (use role_id lookup)
- [ ] Update to use organization_modules table
- [ ] Add validation before toggle
- [ ] Return validation errors

### Phase 4: Cascade (P1-5)
- [ ] Add cascade parameter to toggleModule
- [ ] Implement recursive dependency enable
- [ ] Implement recursive dependent disable
- [ ] Update UI to show cascade confirmation

### Phase 5: Testing
- [ ] Update service tests for new pattern
- [ ] Add dependency validation tests
- [ ] Add cascade operation tests
- [ ] Fix UI test mocking (MSW)
- [ ] Verify all 73 tests pass

---

## Key Files for Reference

### Story Documentation
- Story spec: `docs/2-MANAGEMENT/epics/current/01-settings/01.7.module-toggles.md`
- Code review: `docs/2-MANAGEMENT/reviews/code-review-story-01.7.md`

### Architecture
- ADR-011: `docs/3-ARCHITECTURE/decisions/ADR-011-module-toggle-storage.md`
- ADR-013: `docs/3-ARCHITECTURE/decisions/ADR-013-rls-org-isolation-pattern.md`

### Existing Migrations
- 057: Create tables (correct structure)
- 058: RLS policies (excellent, keep as-is)
- 059: Seed data (11 modules seeded)

---

## Testing Strategy After Fix

1. Run service layer tests: `npm test lib/services/__tests__/module-settings-service.test.ts`
2. Run API tests: `npm test __tests__/01-settings/01.7.module-toggles-api.test.tsx`
3. Run integration tests: `npm test __tests__/01-settings/01.7.module-toggles-integration.test.tsx`
4. Fix UI test mocking, then run: `npm test __tests__/01-settings/01.7.module-toggles.test.tsx`

**Target**: 73/73 tests passing

---

## Questions for DEV-AGENT

1. Do you prefer Option A (incremental) or Option B (rewrite)?
2. Should we keep `modules.ts` config or fetch from DB?
3. Cascade operations: show modal or auto-execute with notification?

---

## Notes

- RLS policies are **excellent** - don't change them
- UI components are **good** - reuse as-is
- Migration structure is **clean** - follow same pattern
- Tests are **comprehensive** - just need pattern updates

The core issue is **architectural** (wrong table), not quality. Once fixed, this will be a solid implementation.

---

**Action Required**: Choose fix approach and start with P0-1 (database migration)

**Re-review Trigger**: When all P0 issues fixed (expect 2-3 days)
