# Story 2.27: Technical Tables Consistency

**Epic:** 2 - Technical Core
**Batch:** 2F - Technical UI Redesign
**Status:** ready-for-dev
**Priority:** P1 (High)
**Story Points:** 3
**Created:** 2025-11-27
**Updated:** 2025-11-27
**Effort Estimate:** 1 day
**UX Reference:** `docs/ux-design/ux-design-shared-system.md` (Section 1.3)

---

## Goal

Standardize all Technical tables (Products, BOMs, Routings) with consistent styling following Shared UI Design System.

---

## User Story

**As a** Technical User
**I want** consistent table layouts across all technical pages
**So that** I can efficiently manage products, BOMs, and routings

---

## Problem Statement

Technical tables have inconsistent implementations:
- Products table differs from BOMs table
- Different column layouts and widths
- Inconsistent action buttons
- No unified filter/search patterns
- Status badges use different colors

---

## Acceptance Criteria

### AC-2.27.1: Standard Table Structure (Shared System)
**Given** I view any technical table
**When** checking structure
**Then** I see:
```
[Search...] [Filter1 ▼] [Filter2 ▼]  [+ Create Button]
─────────────────────────────────────────────────────
[✓] Column1 ↕ | Column2 | Column3 ↕ | Status | Actions
─────────────────────────────────────────────────────
    Row data...
─────────────────────────────────────────────────────
              < 1 2 3 ... >  (20 per page)
```

### AC-2.27.2: Products Table Columns
**Given** I view products table (`/technical/products`)
**When** checking columns
**Then**:
- Columns: `[✓] SKU ↕ | Name | Type | Status | Allergens | Actions`
- Search: SKU or Name
- Filters: Type (RAW, WIP, FG, PACKAGING), Status (Active, Inactive)
- Sortable: SKU, Name, Type
- Pagination: 20 per page

### AC-2.27.3: BOMs Table Columns
**Given** I view BOMs table (`/technical/boms`)
**When** checking columns
**Then**:
- Columns: `[✓] BOM Code ↕ | Product | Version | Status | Items | Effective ↕ | Actions`
- Search: BOM code or Product name
- Filters: Status (Active, Draft, Archived), Version (Current, Expired, Future)
- Sortable: BOM Code, Effective Date
- Pagination: 20 per page
- **Clone action** available (copy icon 📋)

### AC-2.27.4: Routings Table Columns
**Given** I view routings table (`/technical/routings`)
**When** checking columns
**Then**:
- Columns: `[✓] Routing Code ↕ | Product | Operations | Status | Actions`
- Search: Routing code or Product name
- Filters: Status (Active, Inactive)
- Sortable: Routing Code, Operations count
- Pagination: 20 per page

### AC-2.27.5: Action Buttons (Shared System Colors)
**Given** I view table row actions
**When** checking buttons
**Then**:
- View: `gray-600` (👁️ eye icon)
- Edit: `gray-600` (✏️ pencil icon)
- Clone: `gray-600` (📋 copy icon) - BOMs only
- Delete: `red-600` (🗑️ trash icon)
- Order: View → Edit → Clone → Delete
- Tooltip on hover

### AC-2.27.6: Status Badge Colors (Shared System)
**Given** I view status columns
**When** checking badges
**Then**:
- Active/Current: `green-200 bg + green-800 text`
- Draft/Pending: `yellow-200 bg + yellow-800 text`
- Inactive/Archived: `gray-200 bg + gray-800 text`
- Expired/Error: `red-200 bg + red-800 text`

### AC-2.27.7: Row Interactions
**Given** I interact with table rows
**When** hovering/clicking
**Then**:
- Hover: subtle gray background highlight (150ms transition)
- Alternating row backgrounds (odd/even)
- Click row → navigate to detail page

---

## Implementation Tasks

- [ ] Create/update base `DataTable` component following Shared System
- [ ] Refactor `ProductsTable` component
  - Standard columns, search, filters
  - Use `app-colors.ts`
- [ ] Refactor `BOMsTable` component
  - Add Clone action button
  - Standard structure
- [ ] Refactor `RoutingsTable` component
  - Standard structure
- [ ] Rename `planning-colors.ts` → `app-colors.ts` (shared across modules)
- [ ] Add pagination controls (20 per page)
- [ ] Test sorting and filtering

---

## Files to Modify

```
apps/frontend/
├── components/technical/
│   ├── ProductsTable.tsx (REFACTOR)
│   ├── BOMsTable.tsx (REFACTOR)
│   └── RoutingsTable.tsx (REFACTOR)
├── lib/constants/
│   └── app-colors.ts (RENAME from planning-colors.ts)
└── app/(authenticated)/technical/
    ├── products/page.tsx (UPDATE)
    ├── boms/page.tsx (UPDATE)
    └── routings/page.tsx (UPDATE)
```

---

**Status:** Ready for Development
**Next:** Story 2.28
