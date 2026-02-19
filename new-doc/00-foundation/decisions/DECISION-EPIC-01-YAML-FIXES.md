# Epic 01 YAML Context Fixes - Architecture Decisions

Date: 2025-12-16
Author: architect-agent
Status: ACCEPTED

## Decision 1: Role Code Naming Convention

**Chosen:** Option A - Use ADR-012 lowercase snake_case codes

**Role codes to use:**
1. `owner` (not super_admin)
2. `admin`
3. `production_manager`
4. `quality_manager`
5. `warehouse_manager`
6. `production_operator`
7. `warehouse_operator`
8. `quality_inspector`
9. `planner`
10. `viewer`

**Rationale:**
ADR-012 is the source of truth for database schema with SQL seed data (lines 79-117) using lowercase snake_case. This is the PostgreSQL naming convention and matches the actual `roles` table that will be created. Using UPPER_SNAKE_CASE in YAMLs would create a disconnect between documentation and database reality, causing runtime failures when lookups expect `owner` but find `SUPER_ADMIN`. Database schema drives the codebase, not the reverse.

**Top-level role code:** `owner` (not `super_admin`)
- ADR-012 uses `owner` in seed data (line 79)
- Implies organizational ownership (correct for multi-tenant SaaS)
- `super_admin` is not present in ADR-012 seed data
- YAMLs using `SUPER_ADMIN` are incorrect

**Files to update:**
1. `docs/2-MANAGEMENT/epics/current/01-settings/context/01.1.context.yaml` (lines 381-410 seed_data section)
2. `docs/2-MANAGEMENT/epics/current/01-settings/context/01.6.context.yaml` (lines 222-400 seed_data section)
3. `docs/2-MANAGEMENT/epics/current/01-settings/01.1.org-context-base-rls.md` (lines 153, 168 RLS policy WHERE clauses)
4. `docs/2-MANAGEMENT/epics/current/01-settings/01.6.role-permissions.md` (lines 38-47 role table, 51-61 permission matrix)
5. Any frontend TypeScript constants files (when created) should use lowercase codes

---

## Decision 2: Onboarding Database Schema Fields

**Chosen:** Option B - Replace with story schema (onboarding_*)

**Schema specification:**
```sql
-- Organizations table columns
onboarding_step INTEGER DEFAULT 0,            -- 0=not started, 1-6=in progress, 7+=completed
onboarding_started_at TIMESTAMPTZ,            -- Timestamp when wizard first shown
onboarding_completed_at TIMESTAMPTZ,          -- Timestamp when wizard completed or skipped
onboarding_skipped BOOLEAN DEFAULT false      -- True if user skipped wizard
```

**Rationale:**
Migration 014 does NOT exist (verified via Glob search). Story 01.3 defines explicit tracking requirements (step number, timestamps, skip flag) that provide better auditability than a generic JSONB wizard_progress field. The `onboarding_*` naming is more explicit, self-documenting, and aligns with the story's state machine (NOT_STARTED -> IN_PROGRESS -> COMPLETED | SKIPPED). Since no conflicting migration exists, we can implement the story schema directly without breaking changes.

**Migration strategy:**
- Story 01.1 creates the `organizations` table base structure
- Story 01.1 should include these 4 onboarding columns in the initial organizations table creation (no separate migration needed)
- If migration 001_create_organizations_table.sql already exists without these fields, story 01.3 will create a new migration to ADD COLUMN for each field

**JSONB structure:** NOT USED - explicit columns chosen for clarity and queryability

**Step tracking:** Individual steps (0-7)
- 0 = Not started
- 1-6 = Current wizard step (in progress)
- 7+ = Completed (allows for future expansion if wizard grows)

---

## Decision 3: Permission Matrix Source of Truth

**Source of truth:** ADR-012 (with corrections applied)

**Rationale:**
ADR-012 (lines 79-117) is the definitive permission matrix because it contains the SQL seed data that will actually populate the database. Story 01.6 markdown and YAML are derived documentation. When conflicts exist, database seed data wins. However, ADR-012 has 12 modules (including NPD, Finance, OEE, Integrations) while story 01.6 only shows 8 modules - this is correct since the ADR is future-proof for all phases.

**Audit required:** YES - All discrepancies must be resolved by updating story 01.6 to match ADR-012

**Critical discrepancies to fix:**

1. **ADMIN role + Settings module:**
   - ADR-012: `"settings":"CRU"` (no Delete)
   - Story 01.6 markdown (line 53): CRUD (has Delete)
   - **FIX:** Change story to CRU (admin cannot delete org settings)

2. **PROD_OPERATOR role + Warehouse module:**
   - ADR-012 (line 100): `"warehouse":"R"` (read access)
   - Story 01.6 YAML (line 434): `-` (no access)
   - **FIX:** Change story to R (operator can view warehouse for production context)

3. **PROD_MANAGER role + Warehouse module:**
   - ADR-012 (line 88): `"warehouse":"RU"` (read + update)
   - Story 01.6 YAML (line 431): `R` (read only)
   - **FIX:** Change story to RU (production manager can adjust warehouse allocations)

4. **Role count mismatch:**
   - ADR-012: 10 roles (owner, admin, production_manager, quality_manager, warehouse_manager, production_operator, warehouse_operator, quality_inspector, planner, viewer)
   - Story 01.6: 10 roles but with different codes (SUPER_ADMIN vs owner, PROD_OPERATOR vs production_operator, etc.)
   - **FIX:** Align all role codes to ADR-012 snake_case

**Missing modules strategy:** Add now with default permissions

4 modules (NPD, Finance, OEE, Integrations) are missing from story 01.6 markdown permission matrix (line 51-61 only shows 8 modules). These should be:
- **Action:** Add to story 01.6 permission matrix NOW (even though modules are Phase 2+)
- **Rationale:** Permissions are seeded at org creation, so all 12 modules need permission defaults from Day 1
- **Default permissions (from ADR-012 lines 80-117):**
  - NPD: owner/admin=CRUD, prod_manager=R, quality_manager=RU, others=-
  - Finance: owner/admin=CRUD, prod_manager=R, planner=R, others=-
  - OEE: owner/admin=CRUD, prod_manager=CRUD, prod_operator=R, planner=R, others=-
  - Integrations: owner/admin=CRUD, prod_manager=R, planner=-, others=-

---

## Implementation Checklist

### Phase 1: Update ADR-012 (if needed)
- [x] Verify ADR-012 has all 12 modules (DONE - confirmed lines 80-117)
- [x] Verify ADR-012 uses lowercase snake_case role codes (DONE - confirmed)
- [ ] Add explicit note that role codes are lowercase for PostgreSQL convention

### Phase 2: Update Story 01.1
- [ ] Update 01.1.context.yaml lines 381-410 (seed_data section)
  - Change `SUPER_ADMIN` to `owner`
  - Change `PRODUCTION_MANAGER` to `production_manager`
  - Change `WAREHOUSE_MANAGER` to `warehouse_manager`
  - Change `QUALITY_MANAGER` to `quality_manager`
  - Change `OPERATOR` to `production_operator`
  - Change `WAREHOUSE_OPERATOR` to `warehouse_operator`
  - Change `VIEWER` to `viewer`
  - Change `EXTERNAL` to `viewer` (or remove if not in ADR-012)
- [ ] Update 01.1.org-context-base-rls.md lines 153, 168
  - Change RLS policy WHERE clauses from `('SUPER_ADMIN', 'ADMIN')` to `('owner', 'admin')`
- [ ] Verify organizations table schema includes 4 onboarding columns (lines 138-149)

### Phase 3: Update Story 01.3
- [ ] Update 01.3.context.yaml lines 76-92 (database section)
  - Confirm onboarding_step, onboarding_started_at, onboarding_completed_at, onboarding_skipped
- [ ] Update 01.3.onboarding-wizard-launcher.md lines 52-57
  - Confirm schema matches YAML (already correct)
- [ ] Remove any references to wizard_completed or wizard_progress (JSONB) if present

### Phase 4: Update Story 01.6
- [ ] Update 01.6.context.yaml lines 222-400 (seed_data section)
  - Change all role codes from UPPER_SNAKE_CASE to lowercase_snake_case
  - Fix ADMIN settings permission from CRUD to CRU (line 244)
  - Fix PROD_OPERATOR warehouse permission from `-` to `R` (line 321)
  - Fix PROD_MANAGER warehouse permission from `R` to `RU` (line 269)
  - Add 4 missing modules (NPD, Finance, OEE, Integrations) to all roles
- [ ] Update 01.6.role-permissions.md
  - Lines 38-47: Change role codes to lowercase_snake_case
  - Lines 51-61: Expand permission matrix from 8 to 12 modules
  - Add NPD column, Finance column, OEE column, Integrations column
  - Fix ADMIN settings from CRUD to CRU (line 53)
  - Fix PROD_OPERATOR warehouse from `-` to `R`
  - Fix PROD_MANAGER warehouse from `R` to `RU`
- [ ] Update 01.6.context.yaml lines 427-438 (permission_matrix section)
  - Already has 12 modules - verify against ADR-012 and fix discrepancies

### Phase 5: Create/Update Migrations
- [ ] If migration 001_create_organizations_table.sql exists, verify it includes onboarding_* columns
- [ ] If onboarding columns missing, create migration 014_add_onboarding_fields.sql (story 01.3)
- [ ] Verify migration 002_create_roles_table.sql uses lowercase role codes in seed INSERT

### Phase 6: Re-validate All YAMLs
- [ ] Run YAML validator on all 3 context files
- [ ] Verify no UPPER_SNAKE_CASE role codes remain
- [ ] Verify all 12 modules present in permission matrices
- [ ] Verify ADR-012 permissions match story YAMLs

---

## Files Changed

### ADR
- `docs/1-BASELINE/architecture/decisions/ADR-012-role-permission-storage.md`
  - Add note on line 76: "Role codes use lowercase_snake_case per PostgreSQL convention"

### Story Markdown
- `docs/2-MANAGEMENT/epics/current/01-settings/01.1.org-context-base-rls.md`
  - Lines 153, 168: Change `('SUPER_ADMIN', 'ADMIN')` to `('owner', 'admin')`
- `docs/2-MANAGEMENT/epics/current/01-settings/01.3.onboarding-wizard-launcher.md`
  - No changes needed (already uses onboarding_* fields)
- `docs/2-MANAGEMENT/epics/current/01-settings/01.6.role-permissions.md`
  - Lines 38-47: Role table with lowercase codes
  - Lines 51-61: Expand to 12 modules, fix permissions
  - Lines 183-191: Seed data with lowercase codes

### Story YAML Context
- `docs/2-MANAGEMENT/epics/current/01-settings/context/01.1.context.yaml`
  - Lines 381-410: Role codes to lowercase
  - Lines 326, 348: RLS policy role codes to lowercase
- `docs/2-MANAGEMENT/epics/current/01-settings/context/01.3.context.yaml`
  - Lines 76-92: Already correct (onboarding_* fields)
  - Line 111: Change `roles: ["admin", "super_admin"]` to `roles: ["admin", "owner"]`
- `docs/2-MANAGEMENT/epics/current/01-settings/context/01.6.context.yaml`
  - Lines 222-400: All role codes to lowercase
  - Lines 244, 269, 321: Fix permission discrepancies
  - Add NPD/Finance/OEE/Integrations to all roles

### Migrations (verify/create)
- `supabase/migrations/001_create_organizations_table.sql` - Verify onboarding columns present
- `supabase/migrations/002_create_roles_table.sql` - Verify lowercase role codes
- `supabase/migrations/014_add_onboarding_fields.sql` - Create if needed (story 01.3)

---

## Cross-Reference: ADR-012 Complete Role Matrix (Source of Truth)

```
Role: owner
  settings: CRUD, users: CRUD, technical: CRUD, planning: CRUD, production: CRUD,
  warehouse: CRUD, quality: CRUD, shipping: CRUD, npd: CRUD, finance: CRUD,
  oee: CRUD, integrations: CRUD

Role: admin
  settings: CRU, users: CRUD, technical: CRUD, planning: CRUD, production: CRUD,
  warehouse: CRUD, quality: CRUD, shipping: CRUD, npd: CRUD, finance: CRUD,
  oee: CRUD, integrations: CRUD

Role: production_manager
  settings: R, users: R, technical: RU, planning: CRUD, production: CRUD,
  warehouse: RU, quality: CRUD, shipping: R, npd: R, finance: R,
  oee: CRUD, integrations: R

Role: quality_manager
  settings: R, users: R, technical: R, planning: R, production: RU,
  warehouse: R, quality: CRUD, shipping: R, npd: RU, finance: -,
  oee: R, integrations: -

Role: warehouse_manager
  settings: R, users: R, technical: R, planning: R, production: R,
  warehouse: CRUD, quality: R, shipping: CRUD, npd: -, finance: -,
  oee: -, integrations: -

Role: production_operator
  settings: -, users: -, technical: R, planning: R, production: RU,
  warehouse: R, quality: CR, shipping: -, npd: -, finance: -,
  oee: R, integrations: -

Role: warehouse_operator
  settings: -, users: -, technical: R, planning: -, production: -,
  warehouse: CRU, quality: R, shipping: RU, npd: -, finance: -,
  oee: -, integrations: -

Role: quality_inspector
  settings: -, users: -, technical: R, planning: -, production: R,
  warehouse: R, quality: CRU, shipping: R, npd: -, finance: -,
  oee: -, integrations: -

Role: planner
  settings: R, users: R, technical: R, planning: CRUD, production: R,
  warehouse: R, quality: R, shipping: R, npd: R, finance: R,
  oee: R, integrations: -

Role: viewer
  settings: R, users: R, technical: R, planning: R, production: R,
  warehouse: R, quality: R, shipping: R, npd: R, finance: R,
  oee: R, integrations: R
```

---

## Impact Analysis

**Stories Affected:** 01.1, 01.3, 01.6
**Estimated Fix Time:** 2 hours
**Breaking Changes:** None (no migrations deployed yet)
**Risk Level:** Low (documentation-only changes, no code exists)

**Next Steps:**
1. Update all markdown and YAML files per checklist above
2. Re-validate YAML context files with schema validator
3. Create PR with title "fix(epic-01): Align role codes and permissions to ADR-012"
4. Assign to DEV agents with updated context files

---

## Validation

- [x] All 10 roles use lowercase_snake_case codes
- [x] ADR-012 declared as source of truth for permissions
- [x] Onboarding schema uses explicit columns (not JSONB)
- [x] All 12 modules present in permission matrix
- [x] No conflicting migration 014 exists
- [x] Role codes align: owner (not super_admin)
