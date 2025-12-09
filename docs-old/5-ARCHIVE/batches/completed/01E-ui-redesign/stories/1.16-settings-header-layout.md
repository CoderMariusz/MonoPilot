# Story 1.16: Settings Header Layout

**Epic:** 1 - Foundation & Settings
**Batch:** 1E - Settings UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 0.5 days

---

## Goal

Create reusable header component with consistent navigation for all settings pages, matching Planning module design.

---

## User Story

**As an** Administrator
**I want** to see consistent header navigation across all settings pages
**So that** I can navigate easily between configuration options

---

## Problem Statement

Settings pages have inconsistent headers:
- Landing page has card grid layout
- Sub-pages lack unified header navigation
- No way to quickly switch between settings sections
- Inconsistent with Planning module design

---

## Acceptance Criteria

### AC-1.16.1: Reusable SettingsHeader Component
**Given** I view any settings page
**When** the page loads
**Then** I see:
- Logo/App name (left)
- Navigation tabs: "Settings | Org | Users | WH | Loc | Machines | Lines | Allergens | Tax | Modules | Wizard" (center)
- Header height: max 60px (compact)
- Consistent styling matching PlanningHeader
- Tabs wrap to second row if needed on smaller screens

### AC-1.16.2: Navigation Tab Styling
**Given** I'm on a settings page
**When** I check the navigation tabs
**Then**:
- Active tab highlighted (bottom border or bg color)
- All tabs use consistent font size (14px)
- Tabs are clickable links (all visible, no dropdown)

### AC-1.16.3: Breadcrumb Navigation
**Given** I'm on a settings sub-page (e.g., /settings/machines/[id])
**When** checking navigation
**Then**:
- Breadcrumb shows: Settings > Machines > Machine Name
- Back button available to return to list

### AC-1.16.4: Header Applied to All Pages
**Given** Settings module pages
**When** checking implementation
**Then** header is used on:
- `/settings` (dashboard)
- `/settings/organization`
- `/settings/users`
- `/settings/warehouses`
- `/settings/locations`
- `/settings/machines`
- `/settings/production-lines`
- `/settings/allergens`
- `/settings/tax-codes`
- `/settings/modules`
- `/settings/wizard`

---

## Implementation Tasks

- [ ] Create `SettingsHeader` component in `/components/settings/SettingsHeader.tsx`
  - Props: `currentPage: 'dashboard' | 'organization' | 'users' | 'warehouses' | 'locations' | 'machines' | 'lines' | 'allergens' | 'tax-codes' | 'modules' | 'wizard'`
  - Render all navigation tabs with active state (no dropdown)
  - Compact styling (60px max height)
  - Tabs wrap on smaller screens
- [ ] Update all settings pages to use new header
- [ ] Add consistent padding: `px-6 py-6`
- [ ] Test responsive behavior on mobile/tablet

---

## Design Notes

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ Logo   Settings│Org│Users│WH│Loc│Machines│Lines│Allergens│Tax│Modules│Wizard     │ (60px)
├───────────────────────────────────────────────────────────────────────────────────┤
│ [Breadcrumb: Settings > Current Page]                    [+ Create] btn           │ (40px)
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  [Main Content - Tables, Forms, etc]                                             │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/settings/
│   └── SettingsHeader.tsx (NEW)
└── app/(authenticated)/settings/
    ├── page.tsx (UPDATE)
    ├── organization/page.tsx (UPDATE)
    ├── users/page.tsx (UPDATE)
    ├── warehouses/page.tsx (UPDATE)
    ├── locations/page.tsx (UPDATE)
    ├── machines/page.tsx (UPDATE)
    ├── production-lines/page.tsx (UPDATE)
    ├── allergens/page.tsx (UPDATE)
    ├── tax-codes/page.tsx (UPDATE)
    ├── modules/page.tsx (UPDATE)
    └── wizard/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Implementation:** Cross-module with Story 2.25 (TechnicalHeader) - implement together
**Next:** Story 1.17
