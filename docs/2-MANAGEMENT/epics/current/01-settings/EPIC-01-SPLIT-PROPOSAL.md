# Epic 01 Settings - MVP/Phase Split Proposal

**Date:** 2025-12-16
**Author:** ARCHITECT-AGENT
**Pattern:** Phase-based substories (01.Xa MVP, 01.Xb Phase 1B)
**Status:** READY FOR IMPLEMENTATION

---

## Executive Summary

**Current:** 7 monolithic stories (01.1-01.7)
**Proposed:** 7 parent stories + 1 substory split (01.5a + 01.5b)

**Goals:**
- Clear MVP scope (ship Phase 1A fast)
- Defer Phase 1B features (FR-SET-018: Warehouse Access) without refactor
- Align with Epic 02 pattern (consistency across project)
- Enable parallel development after MVP ships

**Impact:**
- Stories to split: **1/7** (Story 01.5 only)
- New substories: **+2 files** (01.5a, 01.5b)
- No breaking changes (extension pattern)

---

## Pattern Validation

**Guardrails (same as Epic 02):**

| # | Guardrail | Description |
|---|-----------|-------------|
| 1 | Forward-compatible schema | Nullable columns for Phase 1B features |
| 2 | Extension pattern | Inherit, don't modify base service |
| 3 | Feature detection | Backward compatible API routes |
| 4 | Test isolation | Freeze parent tests after merge |
| 5 | Sequential development | .Xa merged before .Xb starts |

**Safe to use:** YES (proven in Epic 02 with 02.5a/02.5b and 02.10a/02.10b)

---

## Story Analysis & Split Recommendations

### Story 01.1: Org Context + Base RLS

**Current Scope:**
- Server-side org context resolution (`getOrgContext()`)
- RLS policies for: `organizations`, `users`, `roles`, `organization_modules`
- Cross-tenant access returns 404 (not 403)
- ADR-013 pattern: `(SELECT org_id FROM users WHERE id = auth.uid())`

**Analysis:**
- 100% MVP features (Phase 1A)
- Foundation for all other stories
- No Phase 1B/1C/1D dependencies

**Split Needed:** NO

**Action:** Keep as is (01.1)

---

### Story 01.2: Settings Shell + Navigation

**Current Scope:**
- Settings layout component (`SettingsLayout.tsx`)
- Navigation sidebar with section groupings:
  - Organization (profile, localization)
  - Users & Roles (users, roles, invitations)
  - Infrastructure (warehouses, locations, machines, lines)
  - Master Data (allergens, tax codes)
  - Integrations (API keys, webhooks)
  - System (audit logs, security, modules)
- Route guards with RBAC
- 4 UI states (loading, error, empty, success)

**Analysis:**
- Shell/layout: MVP
- Navigation items: Shows ALL sections (progressive disclosure pattern)
- Phase 1B sections (Infrastructure): Disabled/hidden until Epic 01b

**Split Needed:** NO

**Rationale:**
- Navigation shows all modules with disabled state for Phase 1B
- No code split needed - progressive disclosure handles phasing
- AC already covers: "GIVEN an unimplemented route, WHEN clicked, THEN 'coming soon' state shown"

**Action:** Keep as is (01.2), add "Out of Scope" clarification for Phase 1B sections

---

### Story 01.3: Onboarding Wizard Launcher

**Current Scope:**
- Check `onboarding_step` on login/page load
- Display wizard modal for incomplete onboarding
- Store and resume progress via `onboarding_step`
- Skip wizard creates demo data:
  - Warehouse "DEMO-WH" + Location "DEFAULT"
  - Product "SAMPLE-001"
  - Module toggles: Technical=ON

**Analysis:**
- Wizard launcher framework: MVP
- Steps 2-6 content: Deferred (separate stories)
- Demo data auto-creation: MVP (per FR-SET-187)

**Split Needed:** NO

**Rationale:**
- MVP scope is wizard LAUNCHER, not full step implementation
- Skip wizard creates demo warehouse (no manual warehouse config in MVP)
- Full warehouse config is Epic 01b.1, NOT a substory of 01.3

**Action:** Keep as is (01.3)

---

### Story 01.4: Organization Profile Step (Wizard Step 1)

**Current Scope:**
- Fields: organization name, timezone, language, currency
- Pre-populate from registration data
- Browser-detected defaults (timezone, language)
- Validation (name: 2-100 chars, 4 currencies, 4 languages)
- Save to organizations table, advance to step 2

**Analysis:**
- All fields: MVP (Phase 1A)
- No tax code field in wizard step 1
- No address/contact fields (explicitly out of scope)
- Logo upload: Deferred to full Epic 01

**Split Needed:** NO

**Rationale:**
- Wizard step 1 is minimal profile data
- Tax codes are master data (Epic 01c), not wizard step 1
- No Phase 1B features in scope

**Action:** Keep as is (01.4)

---

### Story 01.5: Users CRUD

**Current Scope (from story file):**
- GET/POST/PUT user endpoints
- PATCH deactivate/activate endpoints
- User list page with search/pagination
- Create/Edit modal with role assignment (10 roles)
- User status management (active/inactive)
- Self-protection (cannot delete self, last Super Admin)

**Mixed Scope Identified:**
- FR-SET-010, FR-SET-012, FR-SET-017: MVP
- FR-SET-018 (Warehouse Access): **Phase 1B**

**PRD Reference (FR-SET-018):**
> "Restrict user access to specific warehouses. Users can only view and modify inventory in warehouses they have been granted access to."
> **Priority:** P1 (Phase 1B - Infrastructure)
> **Dependencies:** FR-SET-040 (Warehouses CRUD)

**UX Reference (SET-009 wireframe):**
```
| Warehouse Access (FR-SET-018)                    |
|  PRD Reference: FR-SET-018                       |
|  [All Warehouses] checkbox                       |
|  [Multi-select dropdown: WH-001, WH-002, ...]    |
```

**Split Needed:** YES (confirmed - mixed MVP/Phase 1B scope)

**Proposed Split:**

#### 01.5a: User Management CRUD (MVP - Phase 1A)
**Scope:**
- User CRUD (create, read, update, delete)
- Email field (no invitation flow - deferred)
- Role assignment (`role_id` FK per ADR-012)
- User status (active/inactive, deactivation)
- Self-protection rules
- Search, filter, pagination

**Excludes:**
- FR-SET-018: Warehouse access restrictions
- Email invitations (requires email integration)
- MFA/2FA configuration
- Session management UI

**Database:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  -- Phase 1B column (present but NULL in MVP)
  warehouse_access_ids UUID[],  -- NULL = all warehouses (admin/super_admin default)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);
```

**Wireframe:** SET-009 - HIDE warehouse access section (lines 49-117)

**Estimate:** 3-4 days

#### 01.5b: User Warehouse Access Restrictions (Phase 1B)
**Scope:**
- FR-SET-018 implementation
- Warehouse access multi-select UI (SET-009, lines 49-117)
- RLS enforcement on warehouse-level operations
- "All Warehouses" checkbox (default ON for admin/super_admin)
- API endpoints:
  - `GET /api/settings/users/:id/warehouse-access`
  - `PUT /api/settings/users/:id/warehouse-access`

**Database:** NO CHANGES (column exists from 01.5a, nullable)

**Service:**
```typescript
// Extend UserService, don't modify
export class UserWarehouseService extends UserService {
  async assignWarehouses(userId: string, warehouseIds: string[]) {
    await db.users.update(userId, { warehouse_access_ids: warehouseIds });
  }

  async getUserWarehouses(userId: string): Promise<string[] | 'all'> {
    const user = await db.users.findById(userId);
    return user.warehouse_access_ids || 'all';
  }
}
```

**Wireframe:** SET-009 - ENABLE warehouse access section

**Dependencies:**
- 01.5a merged to main
- Epic 01b.1 (Warehouse CRUD) - warehouses must exist

**Estimate:** 2-3 days

---

### Story 01.6: Role & Permission Management

**Current Scope:**
- 10 predefined roles (seeded, immutable)
- Permission matrix (module x CRUD)
- `hasPermission()` helper function
- `usePermissions()` React hook
- Role enforcement middleware
- Role dropdown in user modal
- ADR-012 JSONB permissions pattern

**Analysis:**
- 100% MVP features (Phase 1A)
- ADR-012 defines full RBAC as MVP requirement
- No Phase 1B/1C features identified
- Custom role creation is NOT in scope (enterprise feature)

**Split Needed:** NO

**Action:** Keep as is (01.6)

---

### Story 01.7: Module Toggles

**Current Scope:**
- 7 modules defined (1 non-toggleable + 6 toggleable)
- Enable/disable with dependency validation
- Navigation hiding for disabled modules
- Direct URL redirect for disabled modules
- API 403 for disabled module endpoints
- ADR-011 storage pattern (`modules` + `organization_modules`)

**Analysis:**
- All 7 modules defined: MVP (progressive disclosure)
- Toggle logic: MVP
- Premium module badges: MVP (disabled with "Phase 1B" or "Premium" badge)
- Enabling Phase 1B modules: Happens when Epic 01b ships

**Split Needed:** NO

**Rationale:**
- Module toggles SHOW all modules (including Phase 1B)
- Phase 1B modules are disabled by default with badge
- No code split needed - configuration-driven

**Action:** Keep as is (01.7)

---

## Recommended Split Summary

| Story | Split? | Substories | Rationale |
|-------|--------|------------|-----------|
| 01.1 | NO | - | 100% MVP (foundation) |
| 01.2 | NO | - | Progressive disclosure handles phasing |
| 01.3 | NO | - | Demo data auto-create is MVP |
| 01.4 | NO | - | Wizard step 1 is minimal, no Phase 1B fields |
| **01.5** | **YES** | **01.5a (MVP), 01.5b (Phase 1B)** | **FR-SET-018 is Phase 1B** |
| 01.6 | NO | - | 100% MVP (ADR-012) |
| 01.7 | NO | - | All modules shown, Phase 1B disabled |

**Total Splits Needed:** 1 (Story 01.5 only)

---

## Implementation Plan

### Step 1: Create Substory 01.5a (MVP)

**File:** `docs/2-MANAGEMENT/epics/current/01-settings/01.5a.user-management-crud-mvp.md`

**Content:**
- Copy scope from 01.5 (user CRUD, role assignment, status management)
- REMOVE FR-SET-018 references
- Add "Out of Scope: FR-SET-018 deferred to 01.5b"
- Update wireframe: SET-009 (hide warehouse access section)
- Update database: document `warehouse_access_ids` as nullable, unused
- Update tests: exclude warehouse access tests

### Step 2: Create Substory 01.5b (Phase 1B)

**File:** `docs/2-MANAGEMENT/epics/current/01-settings/01.5b.user-warehouse-access-phase1b.md`

**Content:**
- FR-SET-018 scope only
- Service extension pattern
- Wireframe: SET-009 (enable warehouse access section)
- Dependencies: 01.5a merged, Epic 01b.1 (Warehouse CRUD)
- Tests: warehouse assignment, RLS enforcement

### Step 3: Update Parent Story 01.5

**Action:** Convert 01.5 to index/overview referencing 01.5a and 01.5b

**Updated 01.5 content:**
```markdown
# Story 01.5: User Management (SPLIT)

## NOTICE: This story has been split

**Split Date:** 2025-12-16
**Reason:** FR-SET-018 (Warehouse Access) is Phase 1B, main user CRUD is MVP

## Replacement Stories

### 01.5a - User Management CRUD (MVP)
**Priority:** P0 (MVP - Phase 1A)
**File:** `01.5a.user-management-crud-mvp.md`
**Scope:** User CRUD, role assignment, status management

### 01.5b - User Warehouse Access (Phase 1B)
**Priority:** P1 (Phase 1B)
**File:** `01.5b.user-warehouse-access-phase1b.md`
**Scope:** FR-SET-018 only

## Original Story

The original story content is preserved in:
`01.5.users-crud-ORIGINAL-BEFORE-SPLIT.md`
```

### Step 4: Update Epic 01.0 Overview

**Add to Story Index:**
```markdown
| Story | Name | PRD FRs | Phase | Dependencies |
|------:|------|---------|-------|--------------|
| 01.5a | Users: CRUD (MVP) | FR-SET-010, FR-SET-012, FR-SET-017 | 1A | 01.6 |
| 01.5b | Users: Warehouse Access | FR-SET-018 | 1B | 01.5a, 01b.1 |
```

### Step 5: Add "Out of Scope" to Stories 01.2, 01.3

**01.2 - Add section:**
```markdown
## Out of Scope (Phase 1B)

The following navigation sections are shown but disabled until Phase 1B:
- Infrastructure (warehouses, locations, machines, lines)
- Master Data (allergens, tax codes)
- Integrations (API keys, webhooks)

These sections display "Coming in Phase 1B" badge until Epic 01b ships.
```

**01.3 - Clarify:**
```markdown
## Out of Scope (Deferred)

- Onboarding wizard steps 2-6 (separate stories, not Phase 1A)
- Full warehouse configuration (Epic 01b.1)
- Skip wizard creates DEMO warehouse only - manual config is Epic 01b
```

---

## Testing Strategy

### 01.5a Tests (MVP - freeze after merge)

**File:** `__tests__/01-settings/01.5a.user-crud.test.ts`

**Coverage:**
- User CRUD operations (create, read, update, delete)
- Role assignment (role_id FK)
- User status (active/inactive, deactivation)
- Self-protection (cannot delete self)
- Last Super Admin protection
- Search, filter, pagination
- Permission enforcement

**NO warehouse access tests in this file**

### 01.5b Tests (Phase 1B - new file)

**File:** `__tests__/01-settings/01.5b.warehouse-access.test.ts`

**Coverage:**
- Warehouse assignment (single, multiple)
- "All Warehouses" checkbox behavior
- Admin/Super Admin bypass
- RLS enforcement on warehouse operations
- Warehouse access removal
- Cascading delete (if warehouse deleted)

### Integration Suite

**File:** `__tests__/01-settings/01.5.integration.test.ts`

**Runs both suites:**
```typescript
import './01.5a.user-crud.test';
import './01.5b.warehouse-access.test';

describe('User Management Integration', () => {
  // Full flow: create user -> assign role -> assign warehouses -> verify RLS
});
```

---

## Database Schema Strategy

### Forward-Compatible Schema (01.5a)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  org_id UUID NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id),
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,

  -- Phase 1B column (present in schema, NULL in MVP)
  -- NULL = all warehouses access (admin/super_admin default)
  warehouse_access_ids UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- RLS policy (ADR-013)
CREATE POLICY "users_org_isolation" ON users
FOR SELECT USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### No Migration in 01.5b

Phase 1B does NOT need ALTER TABLE:
- Column `warehouse_access_ids` already exists (nullable)
- 01.5b enables the column in UI and adds validation
- Business logic interprets NULL as "all warehouses"

---

## Wireframe Updates

### SET-009 User Create/Edit Modal

**MVP (01.5a) - Hide warehouse access section:**

Hide lines 49-117 in SET-009 wireframe:
```
// Phase 1B section - HIDDEN in MVP
│  ┌─ Warehouse Access (FR-SET-018) ─────────┐    │
│  │  PRD Reference: FR-SET-018              │    │  <-- HIDDEN
│  │  [x] All Warehouses (default)           │    │  <-- HIDDEN
│  │  [ ] Specific Warehouses:               │    │  <-- HIDDEN
│  │      [Multi-select dropdown]            │    │  <-- HIDDEN
│  └─────────────────────────────────────────┘    │
```

**Phase 1B (01.5b) - Enable warehouse access section:**

Show lines 49-117 when Epic 01b.1 (Warehouse CRUD) is merged.

---

## Deliverables Checklist

### Phase 1A (MVP) - Q4 2025

- [x] Create `01.5a.user-management-crud-mvp.md`
- [x] Create `01.5b.user-warehouse-access-phase1b.md`
- [x] Update parent `01.5.users-crud.md` to SPLIT marker
- [x] Backup original `01.5.users-crud-ORIGINAL-BEFORE-SPLIT.md`
- [ ] Update `01.0.epic-overview.md` story index
- [ ] Add "Out of Scope" to 01.2, 01.3
- [ ] Create test file structure

### Phase 1B - Q1 2026

- [ ] Implement 01.5b after 01.5a merged AND Epic 01b.1 merged
- [ ] Enable SET-009 warehouse access section
- [ ] Add warehouse access tests

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 01.5b developed before 01b.1 | LOW | HIGH | Explicit dependency in story |
| Warehouse column used in MVP | LOW | MEDIUM | Code review, hidden UI section |
| Schema conflict in Phase 1B | LOW | LOW | Column exists, no ALTER needed |
| Test regression | LOW | MEDIUM | Frozen 01.5a tests, CI enforcement |

---

## Conclusion

**Recommended Action:** Split story 01.5 only

**Other stories:** Add "Out of Scope" sections where needed, keep as is

**Pattern:** Follows Epic 02 guardrails (proven safe)

**Timeline:**
1. Implement 01.5a (MVP) -> merge -> ship Phase 1A
2. Implement Epic 01b.1 (Warehouse CRUD) -> merge
3. Implement 01.5b (Warehouse Access) -> merge (Q1 2026)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-16 | Initial split proposal | ARCHITECT-AGENT |
