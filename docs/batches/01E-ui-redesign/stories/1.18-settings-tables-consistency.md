# Story 1.18: Settings Tables Consistency

**Epic:** 1 - Foundation & Settings
**Batch:** 1E - Settings UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Effort Estimate:** 1 day

---

## Goal

Standardize all settings tables with consistent styling, filters, search, and actions matching Planning module design.

---

## User Story

**As an** Administrator
**I want** consistent table layouts across all settings pages
**So that** I can efficiently manage configuration data

---

## Problem Statement

Settings tables have inconsistent implementations:
- Different column layouts
- Inconsistent action buttons
- No unified filter/search patterns
- Missing pagination on some pages
- Color inconsistency in status badges

---

## Acceptance Criteria

### AC-1.18.1: Standardized Table Component
**Given** I view any settings table (Users, Warehouses, Locations, Machines, etc.)
**When** the page loads
**Then** I see consistent:
- Column headers with sort icons
- Search input (top-right)
- Filter dropdowns (by status, type, etc.)
- Pagination (20 items per page default)
- Row hover highlighting

### AC-1.18.2: Action Buttons Consistency
**Given** I view table rows
**When** checking action buttons
**Then**:
- View button: gray-600 (eye icon)
- Edit button: gray-600 (pencil icon)
- Delete button: red-600 (trash icon)
- Actions in consistent order: View | Edit | Delete
- Tooltip on hover

### AC-1.18.3: Status Badge Colors
**Given** I view status columns
**When** checking badge colors
**Then** colors match planning-colors.ts:
- Active/Enabled: green-600
- Inactive/Disabled: gray-400
- Pending: yellow-500
- Error/Deleted: red-600

### AC-1.18.4: Create Button Consistency
**Given** I'm on a settings list page
**When** checking Create button
**Then**:
- Button color: green-600 (matching Planning)
- Position: top-right, below header
- Icon: Plus icon
- Text: "Create [Resource]" or "Add [Resource]"

### AC-1.18.5: Empty State
**Given** a table has no data
**When** the page loads
**Then**:
- Friendly empty state message
- Icon illustration
- "Create first [resource]" CTA button

---

## Implementation Tasks

- [ ] Create `SettingsTable` base component with standard props
- [ ] Create `SettingsTableActions` component for row actions
- [ ] Update Users table (`/settings/users`)
- [ ] Update Warehouses table (`/settings/warehouses`)
- [ ] Update Locations table (`/settings/locations`)
- [ ] Update Machines table (`/settings/machines`)
- [ ] Update Production Lines table (`/settings/production-lines`)
- [ ] Update Allergens table (`/settings/allergens`)
- [ ] Update Tax Codes table (`/settings/tax-codes`)
- [ ] Add search/filter to all tables
- [ ] Use shared `app-colors.ts` (refactor planning-colors.ts → app-colors.ts)

---

## Design Notes

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Search: 🔍 Search users...]  [Filter: Status ▼]  [+ Create User]      │
├─────────────────────────────────────────────────────────────────────────┤
│ Name ↕     │ Email              │ Role      │ Status   │ Actions       │
├─────────────────────────────────────────────────────────────────────────┤
│ John Doe   │ john@example.com   │ Admin     │ 🟢Active │ 👁️ ✏️ 🗑️      │
│ Jane Smith │ jane@example.com   │ Planner   │ 🟡Pending│ 👁️ ✏️ 🗑️      │
│ Bob Wilson │ bob@example.com    │ Operator  │ ⚫Inactive│ 👁️ ✏️ 🗑️      │
├─────────────────────────────────────────────────────────────────────────┤
│                    < 1 2 3 ... 10 >  (20 per page)                     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

```
apps/frontend/
├── components/settings/
│   ├── SettingsTable.tsx (NEW - base component)
│   └── SettingsTableActions.tsx (NEW - row actions)
├── lib/constants/
│   └── app-colors.ts (REFACTOR from planning-colors.ts - shared across modules)
└── app/(authenticated)/settings/
    ├── users/page.tsx (UPDATE)
    ├── warehouses/page.tsx (UPDATE)
    ├── locations/page.tsx (UPDATE)
    ├── machines/page.tsx (UPDATE)
    ├── production-lines/page.tsx (UPDATE)
    ├── allergens/page.tsx (UPDATE)
    └── tax-codes/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Next:** Story 1.19
