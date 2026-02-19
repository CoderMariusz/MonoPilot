# Implementation Gateway - Story 01.7: Module Toggles

**Audit Date**: 2025-12-16
**Story**: 01.7 - Module Toggles
**Status**: ✅ APPROVED FOR DEVELOPMENT (with 1 critical gate)
**Quality**: 94/100 (Excellent)

---

## CRITICAL IMPLEMENTATION GATE

### ⚠️ GATE 1: Module Dependency Verification

**MUST-FIX Before Writing Code**

**Issue**: ADR-011 (migration seed data) contains a typo:
```sql
-- WRONG (from ADR-011 line 64):
('production', 'Production', 'Work order execution', '{planning}', true, 4),

-- CORRECT (must match YAML line 261):
('production', 'Production', 'Work order execution', '{technical,planning}', true, 4),
```

**Why This Matters**:
- Production module requires BOTH Technical AND Planning
- Story line 48 confirms: "Production requires Technical, Planning"
- SET-022 wireframe shows both dependencies
- Accepting wrong dependency breaks validation logic

**Action Required**:
1. Code reviewer must verify migration 053 template
2. YAML context file is authoritative (use it, not ADR-011)
3. Seed data must include: `'{technical,planning}'` for production

**Verification Checklist**:
- [ ] Migration 053 created with correct production dependencies
- [ ] Test: Enable Production without Technical → should warn
- [ ] Test: Enable Production without Planning → should warn
- [ ] Test: Enable both Technical+Planning → Production enables OK

---

## DEVELOPMENT READINESS MATRIX

### ✅ Ready to Start

| Layer | Component | Status | YAML Path | Spec Completeness |
|-------|-----------|--------|-----------|-------------------|
| **Database** | modules table | ✅ | database.tables[0] | 100% |
| **Database** | organization_modules table | ✅ | database.tables[1] | 100% |
| **Database** | RLS policies | ✅ | database.rls_policies | 100% |
| **Backend** | GET /api/v1/settings/modules | ✅ | api_endpoints[0] | 100% |
| **Backend** | PATCH /api/v1/settings/modules/:id/toggle | ✅ | api_endpoints[1] | 100% |
| **Backend** | module-settings-service.ts | ✅ | files_to_create.services[0] | 100% |
| **Backend** | module-toggle.ts (Zod schema) | ✅ | files_to_create.validation[0] | 100% |
| **Frontend** | /settings/modules page | ✅ | files_to_create.pages[0] | 100% |
| **Frontend** | ModuleCard component | ✅ | files_to_create.components[0] | 100% |
| **Frontend** | ModuleToggleList component | ✅ | files_to_create.components[1] | 100% |
| **Frontend** | DependencyWarningModal component | ✅ | files_to_create.components[2] | 100% |
| **Middleware** | module-guard.ts | ✅ | files_to_create.middleware[0] | 100% |
| **Hooks** | use-modules.ts | ✅ | files_to_create.hooks[0] | 100% |

**Readiness Score**: 13/13 components fully specified ✅

---

## IMPLEMENTATION SEQUENCE (Recommended)

### Phase 1: Backend Foundation (Days 1-1.5)

1. **Database Migration (Migration 053)**
   - Use YAML `database.tables[0]` and `database.tables[1]`
   - Seed 7 core modules (per YAML module_definitions)
   - ✅ YAML source: Lines 93-136 (database section)
   - ❌ DO NOT use ADR-011 seed data (typo exists)
   - Implement RLS policies from YAML (lines 137-156)

2. **Module Settings Service**
   - Path: `apps/frontend/lib/services/module-settings-service.ts`
   - ✅ YAML reference: lines 70-71
   - Implement:
     - `validateModuleToggle()` - YAML lines 383-403
     - `getAffectedModules()` - YAML lines 390-403
     - `canDisable()` - YAML line 395

3. **API Middleware (module-guard.ts)**
   - Path: `apps/frontend/middleware/module-guard.ts`
   - ✅ YAML reference: lines 85-87
   - Implement: `requireModule()` wrapper (YAML lines 461-477)

### Phase 2: API Implementation (Day 2)

4. **GET /api/v1/settings/modules**
   - File: `apps/frontend/app/api/v1/settings/modules/route.ts`
   - ✅ YAML spec: lines 159-175
   - Response schema documented exactly
   - Must return 7 core + 4 premium modules

5. **PATCH /api/v1/settings/modules/:id/toggle**
   - File: `apps/frontend/app/api/v1/settings/modules/[id]/toggle/route.ts`
   - ✅ YAML spec: lines 176-200
   - Must:
     - Check Admin+ role (YAML line 180)
     - Validate dependencies (YAML validation_rules)
     - Handle cascade (YAML lines 181-183)
     - Return affected_modules list (YAML line 186)

### Phase 3: Frontend Implementation (Days 2.5-3)

6. **Module Toggles Page**
   - File: `apps/frontend/app/(authenticated)/settings/modules/page.tsx`
   - ✅ YAML spec: lines 76-77
   - Must:
     - Fetch modules from GET endpoint
     - Group by type (Core/Premium/New) - YAML line 220
     - Show 4 states (loading/success/empty/error) - YAML lines 221-226
     - Disable toggles for VIEWER role (YAML line 528)

7. **Components**
   - **ModuleCard.tsx** - YAML lines 79-80
   - **ModuleToggleList.tsx** - YAML lines 81-82
   - **DependencyWarningModal.tsx** - YAML lines 83-84
   - Reference SET-022 wireframe for visual design

8. **React Hook (use-modules.ts)**
   - Path: `apps/frontend/lib/hooks/use-modules.ts`
   - ✅ YAML reference: lines 89-90
   - Must:
     - Fetch enabled modules on mount
     - Cache per org (YAML implementation_notes line 593)
     - Invalidate on toggle (YAML line 593)
     - Update navigation after toggle (YAML line 418)

### Phase 4: Integration & Testing (Day 3)

9. **Navigation Integration**
   - Update sidebar to filter by enabledModules
   - ✅ YAML example code: lines 420-430
   - Settings module always visible (YAML line 426)

10. **Route Guard**
    - Add module check to layout (YAML lines 438-454)
    - Redirect disabled modules to /dashboard?error=module_disabled

11. **Testing**
    - Unit tests for ModuleSettingsService - YAML lines 545-552 (6 test cases)
    - Integration tests - YAML lines 553-560 (7 test cases)
    - Coverage target: >80% (YAML line 542)

---

## YAML SPECIFICATION SECTIONS BY IMPLEMENTATION PHASE

### For Backend Developer

| YAML Section | Line Range | When Needed | Priority |
|---|---|---|---|
| database.tables | 93-136 | Day 1 (migration) | CRITICAL |
| database.rls_policies | 137-156 | Day 1 (migration) | CRITICAL |
| api_endpoints | 159-200 | Day 2 (API routes) | CRITICAL |
| module_definitions | 228-354 | Day 2 (seed data) | CRITICAL |
| dependency_matrix | 327-353 | Day 2 (validation logic) | CRITICAL |
| validation_rules | 382-402 | Day 1-2 (service) | CRITICAL |
| implementation_notes.database | 584-588 | Day 1 (migration) | HIGH |
| implementation_notes.backend | 589-592 | Day 2 (service) | HIGH |

### For Frontend Developer

| YAML Section | Line Range | When Needed | Priority |
|---|---|---|---|
| ux | 202-226 | Day 2-3 (pages/components) | CRITICAL |
| module_definitions | 228-354 | Day 2-3 (grouping/display) | CRITICAL |
| permissions | 479-488 | Day 3 (access control) | CRITICAL |
| navigation_integration | 412-430 | Day 3 (sidebar filter) | HIGH |
| route_guard_integration | 432-454 | Day 3 (layout guard) | HIGH |
| api_guard_integration | 456-477 | Day 3 (middleware) | MEDIUM |
| implementation_notes.frontend | 594-598 | Day 2-3 (component patterns) | HIGH |

---

## ACCEPTANCE CRITERIA CHECKLIST

All 27 acceptance criteria from YAML (lines 490-529) must pass before PR:

### Module List Page ✅
```
□ GIVEN admin navigates to /settings/modules
  WHEN page loads
  THEN 6 toggleable modules display with current status

□ GIVEN Settings module
  WHEN toggle page loads
  THEN Settings has no toggle switch (always enabled, not toggleable)

□ GIVEN module list displayed
  WHEN toggle switch shown
  THEN enabled modules show ON (green), disabled show OFF (gray)
```

### Enable Module ✅
```
□ GIVEN admin enables Warehouse module
  WHEN toggle switched ON
  THEN "Warehouse" appears in navigation within 1 second

□ GIVEN Production requires Technical and Planning
  WHEN enabling Production while both ON
  THEN Production enables successfully
```

### Enable with Missing Dependencies ✅
```
□ GIVEN Technical is OFF
  WHEN admin tries to enable Planning
  THEN warning displays: "Planning requires Technical. Enable Technical first?"

□ GIVEN warning shown with "Enable Both" button
  WHEN clicked
  THEN both Technical and Planning enabled

□ GIVEN warning shown
  WHEN "Cancel" clicked
  THEN no changes made
```

### Disable Module ✅
```
□ GIVEN Production module is ON
  WHEN admin toggles OFF
  THEN Production hidden from navigation within 1 second

□ GIVEN admin disables Planning module with active work orders
  WHEN toggle switched OFF
  THEN warning "Module has active data. Disable anyway?" displays
```

### Disable with Dependents ✅
```
□ GIVEN Quality depends on Production
  WHEN admin disables Production while Quality is ON
  THEN warning displays: "Quality depends on Production. Disable Quality also?"

□ GIVEN warning shown with "Disable Both"
  WHEN clicked
  THEN both Production and Quality disabled

□ GIVEN cascade warning shown
  WHEN "Cancel" clicked
  THEN no changes made
```

### Navigation Enforcement ✅
```
□ GIVEN Production module disabled
  WHEN user views navigation sidebar
  THEN "Production" menu item hidden

□ GIVEN all modules disabled except Settings
  WHEN user logs in
  THEN only Settings accessible in navigation
```

### Direct URL Enforcement ✅
```
□ GIVEN Production module disabled
  WHEN user navigates to /production/dashboard directly
  THEN redirect to dashboard with toast "Module not enabled for this organization"

□ GIVEN Warehouse module disabled
  WHEN user bookmarks /warehouse/inventory
  THEN accessing bookmark shows redirect message
```

### API Enforcement ✅
```
□ GIVEN Quality module disabled
  WHEN API call to /api/v1/quality/inspections made
  THEN 403 "Module not enabled for this organization" returns

□ GIVEN Technical module enabled
  WHEN API call to /api/v1/technical/products made
  THEN request proceeds normally
```

### Permission Enforcement ✅
```
□ GIVEN user with VIEWER role
  WHEN accessing /settings/modules
  THEN page loads read-only (toggles disabled)

□ GIVEN user with ADMIN role
  WHEN accessing /settings/modules
  THEN toggles are interactive
```

---

## DEFINITION OF DONE CHECKLIST

All 13 Definition of Done items must be complete (YAML lines 530-543):

- [ ] modules table created with 7 core modules seeded (1 non-toggleable + 6 toggleable)
- [ ] organization_modules table created with RLS policies (ADR-013)
- [ ] GET /api/v1/settings/modules returns all modules with org-specific status
- [ ] PATCH /api/v1/settings/modules/:id/toggle works with dependency validation
- [ ] Module toggles page displays 6 toggleable modules with correct status
- [ ] Settings module always enabled, no toggle switch displayed
- [ ] Enable/disable updates navigation within 1 second (no page reload)
- [ ] Dependency validation shows warning before cascade
- [ ] Direct URL to disabled module redirects with message
- [ ] API returns 403 for disabled module endpoints
- [ ] Admin+ required to toggle modules (VIEWER sees read-only)
- [ ] Unit tests for module-settings-service (>80% coverage)
- [ ] Integration tests for dependency scenarios

---

## CODE REFERENCE QUICK LINKS

| Component | File Path | YAML Lines | Key Methods |
|-----------|-----------|-----------|-------------|
| Service | lib/services/module-settings-service.ts | 70 | validateModuleToggle, getAffectedModules, canDisable |
| Validation | lib/validation/module-toggle.ts | 73 | ToggleModuleRequest schema |
| API GET | app/api/v1/settings/modules/route.ts | 63 | List all modules with org context |
| API PATCH | app/api/v1/settings/modules/[id]/toggle/route.ts | 66 | Toggle with dependency validation |
| Page | app/(authenticated)/settings/modules/page.tsx | 76 | Main UI, fetch + display modules |
| Card Component | components/settings/modules/ModuleCard.tsx | 79 | Individual module card |
| List Component | components/settings/modules/ModuleToggleList.tsx | 81 | Grouped module list |
| Modal Component | components/settings/modules/DependencyWarningModal.tsx | 83 | Dependency warning dialog |
| Hook | lib/hooks/use-modules.ts | 89 | Module state management |
| Middleware | middleware/module-guard.ts | 86 | 403 handler for disabled modules |

---

## TESTING STRATEGY

### Unit Tests (YAML lines 545-552, target >80% coverage)

**Test Cases for ModuleSettingsService**:

1. `validateModuleToggle correctly identifies missing dependencies`
   - YAML: line 547
   - Scenario: Enable Planning without Technical enabled
   - Expected: Returns warning + missingDeps list

2. `validateModuleToggle correctly identifies active dependents`
   - YAML: line 548
   - Scenario: Disable Production with Quality enabled
   - Expected: Returns warning + activeDependents list

3. `getAffectedModules returns correct cascade list (enable)`
   - YAML: line 549
   - Scenario: Enable Production, cascade=true
   - Expected: Returns [Technical, Planning, Production]

4. `getAffectedModules returns correct cascade list (disable)`
   - YAML: line 550
   - Scenario: Disable Technical, cascade=true
   - Expected: Returns [Technical, Planning, Production, Quality, Warehouse, Shipping, NPD]

5. `canDisable returns false for Settings module`
   - YAML: line 551
   - Scenario: Try to disable Settings
   - Expected: Returns false

6. `Toggle switch disabled for non-admin roles`
   - YAML: line 552
   - Scenario: VIEWER role tries to access toggle
   - Expected: Switch is disabled (read-only)

### Integration Tests (YAML lines 553-560)

1. `Enable module updates organization_modules table`
   - YAML: line 554
   - Verify DB insert with enabled=true

2. `Enable with cascade enables all dependencies`
   - YAML: line 555
   - Verify multiple rows inserted

3. `Disable module updates organization_modules table`
   - YAML: line 556
   - Verify DB update with enabled=false

4. `Disable with cascade disables all dependents`
   - YAML: line 557
   - Verify multiple rows updated

5. `API returns 403 for disabled module endpoints`
   - YAML: line 558
   - Verify module-guard middleware

6. `Navigation hides disabled modules`
   - YAML: line 559
   - Verify sidebar filtering

7. `Direct URL redirect works for disabled modules`
   - YAML: line 560
   - Verify layout guard redirect

---

## COMMON PITFALLS TO AVOID

### ❌ Don't

1. **Use ADR-011 seed data directly** - has typo in production dependencies
   - Use YAML `module_definitions` instead (line 228)

2. **Allow Settings module to be toggled** - can_disable=false
   - Verify in all toggle endpoints

3. **Forget to cache module list per org** - performance impact
   - YAML line 593: "Cache module list per org (invalidate on toggle)"

4. **Show premium modules without UPGRADE button** - confused UX
   - YAML line 137: "Premium Badge"

5. **Disable toggles for all non-admin** - should show read-only
   - YAML line 598: "Disable toggles for non-admin roles"

6. **Update organization_modules without tracking enabled_by/enabled_at** - missing audit trail
   - YAML line 126-127: Required fields

7. **Skip dependency validation on cascade=true** - still need to validate
   - YAML line 388: All dependencies must be enabled

### ✅ Do

1. **Use YAML as single source of truth** - it's been audited (94/100)
2. **Implement all 13 test cases** - ensure comprehensive coverage
3. **Apply ADR-013 RLS pattern** - users lookup, not JWT claims
4. **Update navigation within 1 second** - critical AC requirement
5. **Test cross-tenant isolation** - RLS policies working
6. **Verify all 27 acceptance criteria pass** - before PR
7. **Document module dependencies clearly** - help future maintenance

---

## HANDOFF READINESS CHECKLIST

Before marking story ready for development:

- [x] YAML context file audited (94/100 quality)
- [x] All acceptance criteria understood
- [x] All 13 DoD items clear
- [x] No ambiguous specifications
- [x] UX wireframe (SET-022) available
- [x] Architecture decisions (ADR-011, ADR-013) documented
- [x] 13 test cases specified
- [x] Cross-team dependencies identified (01.1, 01.2, 01.6)
- [x] Database schema complete
- [x] API contracts defined
- [x] Permission model clear
- [x] No blocking issues
- ⚠️ **ACTION REQUIRED**: Verify migration 053 uses YAML dependencies (Production: {technical,planning})

---

## QUESTIONS FOR PRODUCT OWNER (if unclear)

None identified. YAML specification is comprehensive and clear.

---

## SUCCESS CRITERIA

Story is **DONE** when:

1. ✅ All 27 acceptance criteria pass
2. ✅ All 13 DoD items complete
3. ✅ 13/13 test cases pass
4. ✅ >80% code coverage (module-settings-service)
5. ✅ Code review passes (ADR-011 dependency gate checked)
6. ✅ Navigation updates without page reload (<1 sec)
7. ✅ API returns correct error codes (403 for disabled)
8. ✅ RLS policies enforce org isolation
9. ✅ Settings module cannot be disabled
10. ✅ E2E tests pass (navigation, URL redirect, API access)

---

**Implementation Gateway Status**: ✅ APPROVED

**Critical Gate**: ⚠️ Migration 053 module dependency verification

**Ready to Assign**: Backend Dev (Day 1), Frontend Dev (Day 2)

**Estimated Delivery**: 3 days (M complexity)
