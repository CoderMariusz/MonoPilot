# Code Review: Story 01.7 - Module Toggles

**Story**: 01.7 - Module Toggles
**Epic**: 01-settings
**Reviewer**: CODE-REVIEWER
**Date**: 2025-12-20
**Status**: REQUEST_CHANGES

---

## Executive Summary

**Decision**: REQUEST_CHANGES

Story 01.7 implements module activation/deactivation with **CRITICAL architectural misalignment**. The implementation uses a deprecated pattern (`modules_enabled` array in `organizations` table) instead of the specified ADR-011 junction table pattern (`organization_modules`). This violates the story requirements and creates technical debt.

**Test Status**: 53/73 tests passing (73% pass rate)
- 37/37 API tests PASS
- 16/16 integration tests PASS
- 0/20 UI tests PASS (mock/integration issues)

**Security Assessment**: MAJOR issues found
- Admin-only enforcement present but uses wrong role check (`role !== 'admin'` vs `role_id IN (owner, admin)`)
- Dependency validation MISSING (critical security gap)
- Settings module CAN be disabled (violates story requirement)
- No cascade validation for dependent modules

---

## Critical Issues (BLOCKING)

### 1. ARCHITECTURE VIOLATION - Wrong Table Pattern

**Severity**: CRITICAL
**File**: `apps/frontend/lib/services/module-service.ts`
**Lines**: 47-127

**Issue**: Implementation uses deprecated `organizations.modules_enabled` array instead of ADR-011 specified `organization_modules` junction table.

**Story Requirement (line 142-164)**:
```sql
-- organization_modules table (org-specific state)
CREATE TABLE organization_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  module_id UUID NOT NULL REFERENCES modules(id),
  enabled BOOLEAN DEFAULT false,
  enabled_at TIMESTAMPTZ,
  enabled_by UUID REFERENCES users(id),
  UNIQUE(org_id, module_id)
);
```

**Actual Implementation**:
```typescript
// module-service.ts:47-50
const { data, error } = await supabaseAdmin
  .from('organizations')
  .select('modules_enabled')  // ❌ Wrong - should use organization_modules
  .eq('id', orgId)
```

**Impact**:
- No audit trail (enabled_at, enabled_by)
- No foreign key constraint to modules table
- Cannot enforce dependencies via SQL
- Migration path to ADR-011 pattern requires data migration

**Required Fix**:
```typescript
// Should use junction table per ADR-011
const { data, error } = await supabaseAdmin
  .from('organization_modules')
  .select('*, modules(*)')
  .eq('org_id', orgId)
  .eq('enabled', true)
```

---

### 2. MISSING DEPENDENCY VALIDATION

**Severity**: CRITICAL
**File**: `apps/frontend/lib/services/module-service.ts`
**Lines**: 74-131

**Issue**: No validation of module dependencies before enable/disable.

**Story Requirements**:
- AC Line 82-83: "Planning requires Technical. Enable Technical first?"
- AC Line 91-92: "Quality depends on Production. Disable Quality also?"
- Story line 257-296: Full dependency validation logic specified

**Current Implementation**:
```typescript
// module-service.ts:100-113
if (enabled) {
  // Add module if not already present
  if (!newModules.includes(moduleCode)) {
    newModules.push(moduleCode)  // ❌ No dependency check
  }
} else {
  // Remove module
  newModules = newModules.filter(m => m !== moduleCode)  // ❌ No dependent check
}
```

**Missing Logic**:
1. Enable module: Check all dependencies are enabled
2. Disable module: Check no dependents are enabled
3. Cascade operations: Auto-enable dependencies or disable dependents with confirmation

**Security Risk**: User can enable Quality without Production, breaking application assumptions.

**Required Fix**: Implement validation function from story line 257-296:
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

---

### 3. SETTINGS MODULE CAN BE DISABLED

**Severity**: CRITICAL
**File**: Migration `057_create_modules_tables.sql`, Service layer
**Lines**: Migration:46-47, Service:109-111

**Issue**: Settings module can be disabled, violating security requirement.

**Story Requirement (line 52)**:
```
Settings | settings | ON (always) | None (cannot disable)
```

**Database Seed (Migration 059_seed_system_data.sql:57)**:
```sql
('settings', 'Settings', '{}', false, 1),  -- can_disable = false ✓
```

**Service Implementation (module-service.ts:109-111)**:
```typescript
// Ensure at least one module remains
if (newModules.length === 0) {
  return { success: false, error: 'At least one module must be enabled' }
}
```

**Gap**: Code prevents disabling ALL modules but doesn't check if Settings is being disabled specifically.

**Attack Vector**:
```json
POST /api/settings/modules
{ "module": "settings", "enabled": false }
// If other modules exist, this bypasses the check
```

**Required Fix**:
```typescript
// Check if Settings is being disabled
if (!enabled && moduleCode === 'settings') {
  return { success: false, error: 'Settings module cannot be disabled' }
}
```

---

## Major Issues (SHOULD FIX)

### 4. INCORRECT ROLE PERMISSION CHECK

**Severity**: MAJOR
**File**: `apps/frontend/app/api/settings/modules/route.ts`
**Lines**: 48-60

**Issue**: Uses deprecated string role check instead of role_id lookup.

**Current Implementation**:
```typescript
// route.ts:49-55
const { data: userData } = await supabase
  .from('users')
  .select('role')  // ❌ role column doesn't exist
  .eq('id', user.id)
  .single()

if (!userData || userData.role !== 'admin') {  // ❌ Wrong check
```

**Story Requirement (line 109)**:
"GIVEN user with ADMIN role, WHEN accessing `/settings/modules`, THEN toggles are interactive."

**Correct Pattern (per ADR-013, migration 058_rls_policies.sql:108-119)**:
```typescript
const { data: userData } = await supabase
  .from('users')
  .select('role_id, roles(code)')
  .eq('id', user.id)
  .single()

if (!userData || !['owner', 'admin'].includes(userData.roles.code)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Impact**: Auth check will fail because `role` column doesn't exist on users table.

---

### 5. MISSING RLS POLICY FOR MODULE UPDATES

**Severity**: MAJOR
**File**: `supabase/migrations/058_rls_policies.sql`
**Lines**: 103-145

**Issue**: RLS policies exist but module toggle endpoint doesn't use them (uses supabaseAdmin bypass).

**Current RLS Policies** (058_rls_policies.sql):
```sql
-- org_modules_admin_update (line 121-132)
CREATE POLICY "org_modules_admin_update" ON organization_modules
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('owner', 'admin')
);
```

**Service Implementation** (module-service.ts:116-119):
```typescript
const { error: updateError } = await supabaseAdmin  // ❌ Bypasses RLS
  .from('organizations')
  .update({ modules_enabled: newModules })
  .eq('id', orgId)
```

**Impact**:
- RLS policies are defined but unused
- Permission checks happen in API route instead of database layer
- Inconsistent with ADR-013 pattern

**Fix**: Use regular supabase client (not Admin) to enforce RLS:
```typescript
const { error } = await supabase  // ✓ Enforces RLS
  .from('organization_modules')
  .update({ enabled: newState, enabled_at: now(), enabled_by: userId })
  .eq('module_id', moduleId)
```

---

### 6. NO CASCADE OPERATIONS

**Severity**: MAJOR
**File**: Service layer, API route
**Lines**: module-service.ts:74-131

**Issue**: No implementation of cascade enable/disable as specified in story.

**Story Requirements**:
- Line 82-84: "Enable Both" button auto-enables dependencies
- Line 91-93: "Disable Both" button auto-disables dependents
- Line 135-139: `cascade?: boolean` parameter in API

**Current Implementation**:
```typescript
// No cascade parameter
export async function toggleModule(
  moduleCode: string,
  enabled: boolean
): Promise<ModuleServiceResult>
```

**Missing Features**:
1. Cascade parameter acceptance
2. Recursive dependency resolution
3. affected_modules return value

**Required Addition**:
```typescript
export async function toggleModule(
  moduleCode: string,
  enabled: boolean,
  cascade: boolean = false
): Promise<ModuleServiceResult> {
  // ... existing code ...

  if (cascade && enabled) {
    // Auto-enable all dependencies
    const deps = await getDependencies(moduleCode)
    for (const dep of deps) {
      await toggleModule(dep, true, true)
    }
  }

  return {
    success: true,
    data: { modules: newModules },
    affected_modules: affectedList  // ❌ Missing
  }
}
```

---

## Minor Issues (OPTIONAL)

### 7. INCONSISTENT MODULE DEFINITIONS

**Severity**: MINOR
**File**: `apps/frontend/lib/config/modules.ts` vs migration seed
**Lines**: modules.ts:15-79, migration 059:56-68

**Issue**: Frontend modules config doesn't match database seed.

**Frontend (modules.ts)**:
- 9 modules defined (missing OEE, Integrations)
- Includes 'scanner' module (not in story)
- No `dependencies` field (only in DB)

**Database Seed (059_seed_system_data.sql)**:
- 11 modules defined (includes OEE, Integrations)
- No 'scanner' module
- Has `dependencies` array

**Impact**: Frontend cannot display full dependency graph from database.

**Recommendation**: Remove `modules.ts` and fetch from database via API.

---

### 8. UNUSED NAVIGATION FILTERING

**Severity**: MINOR
**File**: `apps/frontend/components/navigation/NavigationSidebar.tsx`
**Lines**: 50-61

**Issue**: NavigationSidebar wrapper doesn't pass navItems to Sidebar.

**Current**:
```typescript
export function NavigationSidebar({ navItems }: NavigationSidebarProps) {
  const { enabledModules, loading } = useEnabledModules()

  if (loading) {
    return <Sidebar enabledModules={['settings']} />  // ❌ navItems not passed
  }

  return <Sidebar enabledModules={enabledModules} />  // ❌ navItems not passed
}
```

**Expected**: Pass navItems prop to Sidebar for filtering.

---

### 9. MISSING API ENDPOINT

**Severity**: MINOR
**File**: Story requirement vs implementation
**Lines**: Story:129-139

**Issue**: Story specifies `PATCH /api/v1/settings/modules/:id/toggle` but implementation uses `POST /api/settings/modules`.

**Story Requirement (line 23)**:
```
PATCH /api/v1/settings/modules/:id/toggle (enable/disable)
```

**Actual Implementation**:
```
POST /api/settings/modules (toggle in request body)
```

**Impact**: URL structure doesn't match REST conventions.

**Recommendation**: Keep current implementation (simpler) but update story docs.

---

## Positive Findings

1. **Test Coverage**: Excellent API and integration test coverage (53 tests, well-structured)
2. **RLS Policies**: Comprehensive RLS policies defined following ADR-013 pattern
3. **Migration Structure**: Clean migration files with proper comments and idempotency
4. **TypeScript Types**: Good type definitions in hooks and components
5. **UI Components**: Well-structured React components with proper state management
6. **Error Handling**: Good try-catch blocks and error messages

---

## Test Analysis

### Passing Tests (53/73)

**API Tests (37/37 PASS)**:
- `__tests__/01-settings/01.7.module-toggles-api.test.tsx`
- GET /api/settings/modules list
- POST toggle operations
- Permission checks
- Error handling

**Integration Tests (16/16 PASS)**:
- `__tests__/01-settings/01.7.module-toggles-integration.test.tsx`
- Service layer operations
- Dependency validation (test exists but implementation missing)
- Cascade operations (test exists but implementation missing)

### Failing Tests (20/73)

**UI Tests (0/20 PASS)**:
- `__tests__/01-settings/01.7.module-toggles.test.tsx`
- All failing due to fetch mocking issues (not implementation bugs)
- Tests expect real API, need MSW setup

**Reason**: Integration tests use proper mocks, UI tests try to fetch from localhost.

**Recommendation**: Fix test setup, not production code. Tests are well-written.

---

## Acceptance Criteria Status

| AC | Requirement | Status | Notes |
|----|-------------|--------|-------|
| Line 73-75 | Display 6 toggleable modules | ❌ FAIL | Uses wrong table (organizations.modules_enabled) |
| Line 74 | Settings has no toggle | ❌ FAIL | Can be disabled in code |
| Line 75 | ON/OFF visual state | ✅ PASS | UI shows correctly |
| Line 78-79 | Navigation updates <1s | ✅ PASS | useEnabledModules hook works |
| Line 79-80 | Enable with dependencies OK | ❌ FAIL | No dependency validation |
| Line 82-84 | Warn on missing dependencies | ❌ FAIL | Not implemented |
| Line 87-88 | Disable shows warning | ⚠️ PARTIAL | Modal shows but no data check |
| Line 91-93 | Prevent disable with dependents | ❌ FAIL | Not implemented |
| Line 96-97 | Navigation hides disabled | ✅ PASS | NavigationSidebar filters correctly |
| Line 100-101 | Direct URL redirect | ❌ FAIL | No route guard implemented |
| Line 104-105 | API 403 for disabled module | ❌ FAIL | No middleware implemented |
| Line 108-109 | Permission enforcement | ⚠️ PARTIAL | Wrong role check pattern |

**Summary**: 3/12 PASS, 2/12 PARTIAL, 7/12 FAIL

---

## Security Checklist

| Check | Status | Details |
|-------|--------|---------|
| Module toggle admin-only | ⚠️ PARTIAL | Wrong role check (uses `role` instead of `role_id`) |
| RLS org isolation | ✅ PASS | RLS policies follow ADR-013 |
| Settings cannot disable | ❌ FAIL | Can be disabled if other modules exist |
| Dependency validation | ❌ FAIL | Not implemented |
| SQL injection prevention | ✅ PASS | Uses parameterized queries |
| ON DELETE CASCADE | ✅ PASS | Proper FK constraints |

---

## Architecture Compliance

| ADR | Requirement | Status | Notes |
|-----|-------------|--------|-------|
| ADR-011 | Use organization_modules junction table | ❌ FAIL | Uses organizations.modules_enabled array |
| ADR-013 | RLS users lookup pattern | ✅ PASS | Policies use correct pattern |
| ADR-013 | Permission check via role_id | ❌ FAIL | Uses deprecated role string |

---

## Code Quality Assessment

### TypeScript Quality: B+
- Good type definitions
- Some `any` types in error handlers (acceptable)
- Proper interfaces defined

### Pattern Compliance: C
- Service layer pattern followed
- But uses wrong table (organizations vs organization_modules)
- RLS pattern correct but bypassed with supabaseAdmin

### Documentation: B
- Good JSDoc comments
- Migration files well-documented
- Missing inline comments for complex logic

### Error Handling: B+
- Try-catch blocks present
- User-friendly error messages
- Missing specific error types for validation failures

---

## Performance Considerations

1. **RLS Overhead**: Uses supabaseAdmin bypass, so no RLS performance impact (but security issue)
2. **Navigation Hook**: Calls API on every mount (should use React Query cache)
3. **Page Reload**: Uses `window.location.reload()` instead of state update (poor UX)

---

## Required Changes

### P0 - CRITICAL (Must fix before approval)

1. **Migrate to ADR-011 pattern**
   - Create migration to move from organizations.modules_enabled to organization_modules
   - Update service layer to use junction table
   - Update API routes
   - Estimated: 4-6 hours

2. **Implement dependency validation**
   - Add validateModuleToggle function per story line 257-296
   - Check dependencies on enable
   - Check dependents on disable
   - Return validation errors
   - Estimated: 3-4 hours

3. **Prevent Settings disable**
   - Add explicit check for Settings module
   - Return error if Settings disable attempted
   - Update tests
   - Estimated: 30 minutes

4. **Fix role permission check**
   - Change from `role` string to `role_id` lookup
   - Use roles table JOIN
   - Match ADR-013 pattern
   - Estimated: 1 hour

### P1 - MAJOR (Should fix)

5. **Implement cascade operations**
   - Add cascade parameter to toggleModule
   - Implement recursive dependency enable
   - Implement recursive dependent disable
   - Return affected_modules list
   - Estimated: 2-3 hours

6. **Use RLS instead of supabaseAdmin**
   - Switch to regular supabase client
   - Let RLS enforce permissions
   - Remove permission checks from API route
   - Estimated: 1-2 hours

### P2 - MINOR (Nice to have)

7. **Remove modules.ts config**
   - Fetch modules from database
   - Remove hardcoded module list
   - Estimated: 1 hour

8. **Fix UI tests**
   - Add MSW for API mocking
   - Fix fetch mocks
   - Estimated: 2 hours

---

## Estimated Fix Time

- **P0 (Critical)**: 9-11.5 hours
- **P1 (Major)**: 3-5 hours
- **P2 (Minor)**: 3 hours

**Total**: 15-19.5 hours (approximately 2-3 days)

---

## Recommendations

### Immediate Actions

1. **STOP**: Do not merge this code in current state
2. **BLOCK**: Story 01.7 is BLOCKED until P0 issues fixed
3. **REVERT**: Consider reverting to story start and re-implementing with correct pattern

### Architectural Decision

**Option A: Fix incrementally** (Recommended)
- Keep current UI and tests
- Create migration to ADR-011 pattern
- Update service layer
- Add validation logic
- **Timeline**: 2-3 days

**Option B: Rewrite from scratch**
- Start with ADR-011 migration
- Rebuild service layer correctly
- Reuse UI components
- **Timeline**: 3-4 days (cleaner result)

### Testing Strategy

1. Fix P0 issues first
2. Run existing tests (should start passing)
3. Add validation tests
4. Add cascade operation tests
5. Fix UI test mocking

---

## Files Reviewed

### Backend (4 files)
1. ✅ `supabase/migrations/057_create_modules_tables.sql` - Tables OK, pattern wrong
2. ✅ `supabase/migrations/058_rls_policies.sql` - RLS policies excellent
3. ✅ `supabase/migrations/059_seed_system_data.sql` - Seed data complete
4. ❌ `apps/frontend/lib/services/module-service.ts` - Wrong pattern, missing logic

### Frontend (4 files)
5. ✅ `apps/frontend/lib/hooks/use-enabled-modules.ts` - Hook works well
6. ✅ `apps/frontend/components/navigation/NavigationSidebar.tsx` - Filter works
7. ⚠️ `apps/frontend/app/(authenticated)/settings/modules/page.tsx` - UI good, modal incomplete
8. ⚠️ `apps/frontend/app/api/settings/modules/route.ts` - Wrong role check, wrong table

### Tests (6 files)
9. ✅ `__tests__/01-settings/01.7.module-toggles-api.test.tsx` - 37/37 PASS
10. ✅ `__tests__/01-settings/01.7.module-toggles-integration.test.tsx` - 16/16 PASS
11. ❌ `__tests__/01-settings/01.7.module-toggles.test.tsx` - 0/20 PASS (mock issues)
12. ✅ `lib/services/__tests__/module-settings-service.test.ts` - Tests expect wrong pattern
13. ✅ `components/navigation/__tests__/module-nav-filter.test.tsx` - Tests need MSW
14. ✅ `__tests__/api/settings/modules.test.ts` - Comprehensive coverage

---

## Conclusion

Story 01.7 has **solid test coverage** and **good UI work**, but suffers from **critical architectural violations**:

1. Uses deprecated `organizations.modules_enabled` array instead of ADR-011 `organization_modules` junction table
2. Missing dependency validation (core feature)
3. Settings module can be disabled (security issue)
4. Wrong permission check pattern

**Recommendation**: REQUEST_CHANGES with 2-3 day fix timeline for P0 issues.

---

## Next Steps

**For DEV-AGENT**:
1. Review this report
2. Choose Option A (incremental fix) or Option B (rewrite)
3. Start with P0-1: Create migration to ADR-011 pattern
4. Implement P0-2: Dependency validation
5. Fix P0-3: Settings disable prevention
6. Fix P0-4: Role permission check
7. Request re-review

**For QA-AGENT** (After fixes):
- Do NOT test until P0 issues resolved
- Focus on dependency validation scenarios
- Test cascade operations
- Verify Settings cannot be disabled

---

**Review Complete**
**Decision**: REQUEST_CHANGES
**Severity**: CRITICAL issues blocking approval
**Estimated Fix Time**: 2-3 days
