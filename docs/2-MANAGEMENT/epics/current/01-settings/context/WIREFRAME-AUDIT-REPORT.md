# Epic 01 - Wireframe Assignment Audit

**Date:** 2025-12-17
**Purpose:** Audit wireframe assignments in frontend.yaml files and identify standardization issues
**Auditor:** Technical Writer (AI)

---

## Executive Summary

- **Total stories:** 16 (01.1 through 01.16)
- **Stories with frontend.yaml:** 16/16 (100%)
- **Stories with wireframes assigned:** 11/16 (69%)
- **Stories missing wireframes:** 5/16 (31%)
- **Format consistency:** MIXED (3 different formats found)
- **Action items:** 8 critical standardization tasks

---

## Wireframes Available in Repository

The following wireframes exist in `docs/3-ARCHITECTURE/ux/wireframes/`:

| Wireframe ID | File | Purpose |
|---|---|---|
| SET-001 | SET-001-onboarding-launcher.md | Onboarding wizard overview |
| SET-002 | SET-002-onboarding-organization.md | Wizard Step 1 - Organization Profile |
| SET-003 | SET-003-onboarding-warehouse.md | Wizard Step 2 - Warehouse (presumed) |
| SET-004 | SET-004-onboarding-location.md | Wizard Step 3 - Locations (presumed) |
| SET-005 | SET-005-onboarding-product-workorder.md | Wizard Step 4-5 - Product & Work Order |
| SET-006 | SET-006-onboarding-completion.md | Wizard Step 6 - Completion/Celebration |
| SET-007 | SET-007-organization-profile.md | Organization settings full page |
| SET-008 | SET-008-user-list.md | Users list/table |
| SET-009 | SET-009-user-create-edit-modal.md | User create/edit modal |
| SET-010 | SET-010-user-invitations.md | Invitations management (TBD) |
| SET-011 | SET-011-roles-permissions-view.md | Role-based permissions view |
| SET-012 | SET-012-warehouse-list.md | Warehouse list/table |
| SET-013 | SET-013-warehouse-create-edit-modal.md | Warehouse create/edit modal |
| SET-014 | SET-014-location-hierarchy-view.md | Location tree/hierarchy view |
| SET-015 | SET-015-location-create-edit-modal.md | Location create/edit modal |
| SET-016 | SET-016-machine-list.md | Machine list/table |
| SET-017 | SET-017-machine-create-edit-modal.md | Machine create/edit modal |
| SET-018 | SET-018-production-line-list.md | Production line list/table |
| SET-019 | SET-019-production-line-create-edit-modal.md | Production line create/edit modal |
| SET-020 | SET-020-allergen-list.md | Allergen list/table (read-only) |
| SET-021 | SET-021-tax-code-list.md | Tax code list/table |
| SET-021a | SET-021a-tax-code-create-modal.md | Tax code create modal |
| SET-021b | SET-021b-tax-code-edit-modal.md | Tax code edit modal |
| SET-022 | SET-022-module-toggles.md | Module toggles management |
| SET-023 | SET-023-api-keys-list.md | API keys management |
| SET-024 | SET-024-webhooks-list.md | Webhooks management |
| SET-025 | SET-025-audit-logs.md | Audit logs view |
| SET-026 | SET-026-security-settings.md | Security settings (TBD) |
| SET-027 | SET-027-notification-settings.md | Notification settings (TBD) |
| SET-028 | SET-028-subscription-billing.md | Subscription/billing (TBD) |
| SET-029 | SET-029-import-export.md | Import/export (TBD) |
| SET-030 | SET-030-session-management.md | Session management (TBD) |
| SET-031 | SET-031-password-security-settings.md | Password security settings (TBD) |

**Total wireframes available:** 33 (some partial/future)

---

## Detailed Findings

### Story 01.1 - Org Context + Base RLS

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes: [])
**Wireframes assigned:** None (empty array)
**Expected wireframes:** None (backend story only)
**Status:** ✅ CORRECT

**Details:**
- Correctly marks `is_backend_focused: true`
- Sets `ux.wireframes: []` with note "No wireframes - backend story"
- No components defined (correct)
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.1/frontend.yaml`

---

### Story 01.2 - Settings Shell Navigation + Role Guards

**Frontend.yaml exists:** YES
**Current format:** Option B (wireframes embedded in navigation_sections)
**Wireframes assigned:** Yes, but MIXED FORMAT
**Expected wireframes:** SET-001, SET-002, SET-003
**Status:** ⚠️ NEEDS UPDATE

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.2/frontend.yaml`
- Current format: Wireframe IDs embedded in `navigation_sections` under each menu item:
  ```yaml
  navigation_sections:
    - section: "Organization"
      items:
        - { name: "Organization Profile", path: "/settings/organization", roles: [...], wireframe: "SET-007" }
  ```
- **Issue:** Uses embedded format instead of standard `ux.wireframes` section
- **Action:** Extract all wireframe IDs to `ux.wireframes` section with `Option A` format

**Wireframes in navigation (extracted):**
- SET-007 (Organization)
- SET-008, SET-011, SET-010 (Users & Roles)
- SET-012, SET-016, SET-018 (Infrastructure)
- SET-020, SET-021 (Master Data)
- SET-023, SET-024 (Integrations)
- SET-022, SET-026, SET-025 (System)

**Problem:** This story is about the SHELL navigation, not the individual pages. Should reference:
- SET-001, SET-002, SET-003 (Onboarding steps with navigation visible)
- No individual module wireframes needed at this level

---

### Story 01.3 - Onboarding Wizard Launcher

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, components)
**Wireframes assigned:** SET-001
**Expected wireframes:** SET-001
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.3/frontend.yaml`
- Properly references SET-001 with path and components
- Sets `wizard_steps` section showing all 6 steps
- Path is correct: `docs/3-ARCHITECTURE/ux/wireframes/SET-001-onboarding-launcher.md`

---

### Story 01.4 - Organization Profile Wizard Step

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, description, components)
**Wireframes assigned:** SET-002, SET-007
**Expected wireframes:** SET-002, SET-007 (reference)
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.4/frontend.yaml`
- Two wireframes referenced correctly:
  - SET-002: Onboarding Organization Step (PRIMARY)
  - SET-007: Full Organization Profile page (REFERENCE for field patterns)
- Well-documented with description for each

---

### Story 01.5a - User Management CRUD

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, components)
**Wireframes assigned:** SET-008, SET-009
**Expected wireframes:** SET-008, SET-009
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.5a/frontend.yaml`
- SET-008: User list table
- SET-009: User create/edit modal (with MVP scope note about warehouse access)
- Path references correct: `docs/2-MANAGEMENT/epics/current/01-settings/context/wireframes/SET-008-user-list.md`

**Issue:** Paths point to local context wireframes directory, not the main wireframes directory!
- Expected: `docs/3-ARCHITECTURE/ux/wireframes/`
- Actual: `docs/2-MANAGEMENT/epics/current/01-settings/context/wireframes/`

---

### Story 01.5b - User Warehouse Access

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, lines, section, components)
**Wireframes assigned:** SET-009 (section reference)
**Expected wireframes:** SET-009 (warehouse section, lines 49-117)
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.5b/frontend.yaml`
- References SET-009 with specific line range: 49-117 (warehouse access section)
- Includes section: "Warehouse Access"
- Properly extends SET-009 for Phase 1B work

---

### Story 01.6 - Role-Based Permissions

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, components)
**Wireframes assigned:** SET-011
**Expected wireframes:** SET-011
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.6/frontend.yaml`
- SET-011: Roles and Permissions view
- Includes usage examples and scenarios
- Well-documented implementation notes

---

### Story 01.7 - Module Toggles

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, description, components)
**Wireframes assigned:** SET-022
**Expected wireframes:** SET-022
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.7/frontend.yaml`
- SET-022: Module Toggles management page
- Comprehensive components list: Page header, cards, toggles, dependencies, premium badge, summary

---

### Story 01.8 - Warehouses CRUD

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, description, components)
**Wireframes assigned:** SET-012, SET-013
**Expected wireframes:** SET-012, SET-013
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.8/frontend.yaml`
- SET-012: Warehouse list page with table and filters
- SET-013: Warehouse create/edit modal
- Detailed component specifications for each wireframe

---

### Story 01.9 - Production Lines CRUD

**Frontend.yaml exists:** YES
**Current format:** Option C (ux.wireframes: [] EMPTY)
**Wireframes assigned:** None
**Expected wireframes:** SET-014, SET-015 (Location hierarchy)
**Status:** ❌ MISSING

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.9/frontend.yaml`
- **Issue:** Story is about Location Hierarchy (not production lines!)
- Story 01.9 should reference locations, not machines or production lines
- Should have wireframes: SET-014, SET-015

**Current status:** Sets `ux.wireframes: []` with comment "No wireframes specified in story"

**Action Item:** Add SET-014 and SET-015 to this story's wireframes section

---

### Story 01.10 - Machines CRUD

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, description, components)
**Wireframes assigned:** SET-016, SET-017
**Expected wireframes:** SET-016, SET-017
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.10/frontend.yaml`
- SET-016: Machine list page with table and filters
- SET-017: Machine create/edit modal
- Comprehensive component and UX specifications

---

### Story 01.11 - Production Lines CRUD

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, path, description, components)
**Wireframes assigned:** SET-018, SET-019
**Expected wireframes:** SET-018, SET-019
**Status:** ✅ CORRECT

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.11/frontend.yaml`
- SET-018: Production line list with machine flow preview
- SET-019: Production line create/edit modal
- Includes drag-drop ordering and product compatibility components

---

### Story 01.12 - Allergens Management

**Frontend.yaml exists:** YES
**Current format:** Option A (ux.wireframes with id, description, components)
**Wireframes assigned:** SET-020 (implied), but marked SET-TBD
**Expected wireframes:** SET-020
**Status:** ⚠️ PLACEHOLDER

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.12/frontend.yaml`
- Currently references:
  ```yaml
  wireframes:
    - id: "SET-TBD"
      description: "Allergen List page (pending wireframe)"
  ```
- **Issue:** Uses SET-TBD placeholder instead of actual SET-020
- SET-020 exists in repository: `SET-020-allergen-list.md`

**Action Item:** Update wireframe reference from SET-TBD to SET-020

---

### Story 01.13 - Tax Codes CRUD

**Frontend.yaml exists:** YES
**Current format:** Option C (NO ux.wireframes section at all!)
**Wireframes assigned:** None (section missing)
**Expected wireframes:** SET-021, SET-021a, SET-021b
**Status:** ❌ MISSING

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.13/frontend.yaml`
- **Issue:** Entire `ux` section missing from frontend.yaml!
- Story clearly describes UI (pages, components, modals)
- Three wireframes exist: SET-021, SET-021a, SET-021b

**Action Item:** Add complete `ux` section with wireframe references

---

### Story 01.14 - Onboarding Wizard Steps 2-6

**Frontend.yaml exists:** YES
**Current format:** Option C (NO ux.wireframes section)
**Wireframes assigned:** None (section missing)
**Expected wireframes:** SET-002, SET-003, SET-004, SET-005, SET-006
**Status:** ❌ MISSING

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.14/frontend.yaml`
- **Issue:** Entire `ux` section missing
- Story defines 5 wizard steps with detailed components
- Wireframes SET-002 through SET-006 exist but not referenced

**Action Item:** Add `ux` section with wireframe references for all 5 steps

---

### Story 01.15 - Webhooks & API Keys

**Frontend.yaml exists:** YES
**Current format:** Option C (NO ux.wireframes section)
**Wireframes assigned:** None (section missing)
**Expected wireframes:** SET-024 (Webhooks), SET-023 (API Keys - should be from 01.2 nav)
**Status:** ❌ MISSING

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.15/frontend.yaml`
- **Issue:** No `ux` section defined
- Story is about security settings (Sessions, Password)
- Should reference SET-030 (Session Management) and SET-031 (Password Security)

**Action Item:** Add `ux` section with security-related wireframes

---

### Story 01.16 - Audit Logs & Invitations

**Frontend.yaml exists:** YES
**Current format:** Option C (NO ux.wireframes section)
**Wireframes assigned:** None (section missing)
**Expected wireframes:** SET-025 (Audit Logs), SET-010 (Invitations)
**Status:** ❌ MISSING

**Details:**
- File location: `C:/Users/Mariusz K/Documents/Programowanie/MonoPilot/docs/2-MANAGEMENT/epics/current/01-settings/context/01.16/frontend.yaml`
- **Issue:** No `ux` section
- Story combines user invitations and audit logs
- Wireframes exist but not referenced

**Action Item:** Add `ux` section with invitation and audit log wireframes

---

## Format Analysis

### Current Formats Found:

**Option A: Standard (PREFERRED)**
```yaml
ux:
  wireframes:
    - id: "SET-007"
      path: "docs/3-ARCHITECTURE/ux/wireframes/SET-007-organization-profile.md"
      description: "Organization Profile page"
      components:
        - "Component1"
        - "Component2"
```

**Option B: Embedded in sections**
```yaml
navigation_sections:
  - section: "Organization"
    items:
      - { name: "...", path: "...", wireframe: "SET-007" }
```

**Option C: Missing**
- No `ux` section at all
- Wireframes not referenced

### Format Distribution:

| Format | Stories | Count |
|--------|---------|-------|
| Option A | 01.1, 01.3, 01.4, 01.5a, 01.5b, 01.6, 01.7, 01.8, 01.10, 01.11, 01.12 | 11 |
| Option B | 01.2 | 1 |
| Option C | 01.13, 01.14, 01.15, 01.16 | 4 |

---

## Critical Path Issues

### Story 01.2 Navigation Issue

Story 01.2 embeds wireframe references in the navigation section, which works locally but:
- Prevents automated wireframe extraction
- Mixes navigation data with UX documentation
- Should reference the SHELL wireframes (navigation layout), not individual page wireframes

**Recommendation:** Convert to standard format and clarify which wireframes show the navigation shell (likely SET-001 or SET-003).

---

### Story 01.9 Content Mismatch

Frontend.yaml for 01.9 shows Location Hierarchy code (LocationTree, CapacityIndicator) but:
- The story name says "Production Lines" (should be "Locations Hierarchy")
- No wireframes referenced
- Should reference SET-014 and SET-015

**Recommendation:** Verify story assignment and add correct wireframes.

---

### Path Consistency Issue

Story 01.5a references wireframes at:
- `docs/2-MANAGEMENT/epics/current/01-settings/context/wireframes/`

Instead of centralized location:
- `docs/3-ARCHITECTURE/ux/wireframes/`

**Recommendation:** Update all paths to use central wireframes directory.

---

## Action Items

### Priority 1: Standardize Format (Blocking)

1. **Convert Story 01.2** from embedded format to standard `ux.wireframes` section
   - Extract wireframe IDs from navigation_sections
   - Create proper `ux.wireframes` array
   - Clarify which wireframes are SHELL vs FEATURE

2. **Add Story 01.13** - Missing `ux` section entirely
   - Create `ux.wireframes` section
   - Reference SET-021, SET-021a, SET-021b

3. **Add Story 01.14** - Missing `ux` section entirely
   - Create `ux.wireframes` section
   - Reference SET-002 through SET-006 (all wizard steps)

4. **Add Story 01.15** - Missing `ux` section entirely
   - Create `ux.wireframes` section
   - Reference SET-024, SET-023 (or verify correct wireframes)

5. **Add Story 01.16** - Missing `ux` section entirely
   - Create `ux.wireframes` section
   - Reference SET-025, SET-010

### Priority 2: Fix Content Issues

6. **Update Story 01.9** - Add missing wireframes
   - Verify story name/content
   - Add SET-014 and SET-015 to wireframes section

7. **Update Story 01.12** - Replace placeholder
   - Change SET-TBD to SET-020
   - Add proper path reference

8. **Standardize paths** - All wireframes should reference
   - `docs/3-ARCHITECTURE/ux/wireframes/SET-XXX.md`
   - Not: `docs/2-MANAGEMENT/epics/...context/wireframes/`

---

## Wireframe Coverage Summary

### By Module:

| Module | Stories | Wireframes | Coverage |
|--------|---------|-----------|----------|
| Onboarding | 01.1, 01.3, 01.4, 01.14 | SET-001,002,003,004,005,006 | ✅ 100% |
| Organization | 01.1, 01.2, 01.4 | SET-007 | ✅ 100% |
| Users | 01.5a, 01.5b, 01.6, 01.16 | SET-008,009,010,011 | ⚠️ 75% (01.16 missing) |
| Warehouses | 01.8 | SET-012, SET-013 | ✅ 100% |
| Locations | 01.9 | SET-014, SET-015 | ❌ 0% (missing) |
| Machines | 01.10 | SET-016, SET-017 | ✅ 100% |
| Production Lines | 01.11 | SET-018, SET-019 | ✅ 100% |
| Allergens | 01.12 | SET-020 | ⚠️ 50% (placeholder) |
| Tax Codes | 01.13 | SET-021, 021a, 021b | ❌ 0% (missing) |
| Modules | 01.7 | SET-022 | ✅ 100% |
| API/Webhooks | 01.2, 01.16 | SET-023, SET-024 | ⚠️ 50% (embedded in nav) |
| Audit Logs | 01.16 | SET-025 | ❌ 0% (missing) |
| Security | 01.15 | SET-026, SET-030, SET-031 | ❌ 0% (missing) |
| Invitations | 01.16 | SET-010 | ❌ 0% (missing) |

---

## Recommendations

### Short Term (Sprint)

1. ✅ All 16 frontend.yaml files exist - good baseline
2. ⚠️ Standardize all wireframe references to Option A format
3. ⚠️ Ensure all paths point to `docs/3-ARCHITECTURE/ux/wireframes/`
4. ⚠️ Add missing `ux` sections to 01.13, 01.14, 01.15, 01.16

### Medium Term (Phase)

1. Create wireframes for placeholder stories (SET-TBD items)
2. Verify story 01.9 content matches story name
3. Consider creating wireframes for stories with detailed UI specs but no wireframes yet

### Long Term (Backlog)

1. Add wireframe validation to CI/CD pipeline
2. Create template for frontend.yaml with UX section pre-filled
3. Document wireframe naming conventions and directory structure

---

## Validation Checklist

Use this to verify fixes:

- [ ] All 16 stories have `ux.wireframes` section (not embedded elsewhere)
- [ ] All wireframe paths use: `docs/3-ARCHITECTURE/ux/wireframes/SET-XXX.md`
- [ ] No SET-TBD placeholders remain
- [ ] Each wireframe reference includes:
  - [ ] `id` field (SET-XXX format)
  - [ ] `path` field (absolute path)
  - [ ] `description` field (brief purpose)
  - [ ] `components` array (list of UI components)
- [ ] Story 01.2 navigation wireframes documented separately from feature wireframes
- [ ] Story 01.9 content verified and wireframes added
- [ ] All stories with UI specs have wireframe references

---

## File References

| Story | File Path | Status |
|-------|-----------|--------|
| 01.1 | `01-settings/context/01.1/frontend.yaml` | ✅ OK |
| 01.2 | `01-settings/context/01.2/frontend.yaml` | ⚠️ MIXED FORMAT |
| 01.3 | `01-settings/context/01.3/frontend.yaml` | ✅ OK |
| 01.4 | `01-settings/context/01.4/frontend.yaml` | ✅ OK |
| 01.5a | `01-settings/context/01.5a/frontend.yaml` | ⚠️ PATH ISSUE |
| 01.5b | `01-settings/context/01.5b/frontend.yaml` | ✅ OK |
| 01.6 | `01-settings/context/01.6/frontend.yaml` | ✅ OK |
| 01.7 | `01-settings/context/01.7/frontend.yaml` | ✅ OK |
| 01.8 | `01-settings/context/01.8/frontend.yaml` | ✅ OK |
| 01.9 | `01-settings/context/01.9/frontend.yaml` | ❌ MISSING |
| 01.10 | `01-settings/context/01.10/frontend.yaml` | ✅ OK |
| 01.11 | `01-settings/context/01.11/frontend.yaml` | ✅ OK |
| 01.12 | `01-settings/context/01.12/frontend.yaml` | ⚠️ PLACEHOLDER |
| 01.13 | `01-settings/context/01.13/frontend.yaml` | ❌ MISSING UX |
| 01.14 | `01-settings/context/01.14/frontend.yaml` | ❌ MISSING UX |
| 01.15 | `01-settings/context/01.15/frontend.yaml` | ❌ MISSING UX |
| 01.16 | `01-settings/context/01.16/frontend.yaml` | ❌ MISSING UX |

---

**End of Report**
