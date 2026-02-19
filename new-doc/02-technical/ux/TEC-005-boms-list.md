# TEC-005: BOMs List Page

**Module**: Technical
**Feature**: Bill of Materials (Story 2.6 - BOM CRUD)
**Type**: Page (Table View)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-11

---

## Overview

Main list view for Bills of Materials (BOMs). Displays all BOMs with filtering by product, status, and effective dates. Supports search, create, edit, delete, clone, and view detail actions. BOMs are versioned formulations that define ingredient quantities for finished products.

**Business Context:**
- BOMs are version-controlled (v1, v2, v3...)
- Multiple BOMs per product allowed (different effective date ranges)
- Only ONE active BOM per product at any point in time
- Date overlap prevention enforced by database trigger
- Clone action enables fast creation of similar BOMs (FR-2.24)

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                    Technical > BOMs    [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Bills of Materials (BOMs)                       [+ Create BOM]        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  ┌───────────────────────────────────────────────────────────────┐    │ │
│  │  │  [🔍] Search by product code or name...                        │    │ │
│  │  └───────────────────────────────────────────────────────────────┘    │ │
│  │                                                                        │ │
│  │  [Status: All BOMs ▼]  [Product Type: All ▼]  [Date: All ▼]          │ │
│  │                                                                        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  Product              Version  Status   Eff. From   Eff. To   Output  │ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  BREAD-001            v3       ● Active  2024-01-15  -         100 kg │ │
│  │  White Bread 500g                                            👁 ✏ 📋 🗑│ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  BREAD-001            v2       ○ Inactive 2023-06-01 2024-01-14 100 kg│ │
│  │  White Bread 500g                                            👁 ✏ 📋 🗑│ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  CAKE-001             v1       ⚠ Draft   2025-01-01  -         50 kg  │ │
│  │  Chocolate Cake                                              👁 ✏ 📋 🗑│ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  SAUCE-002            v4       🟡 Phased 2024-11-01 2025-02-28  200 L │ │
│  │  Tomato Sauce Premium                                         👁 ✏ 📋 🗑│ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │                                                                        │ │
│  │  Showing 4 of 127 BOMs                          [< Prev] Page 1 [Next >]│
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                    Technical > BOMs    [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Bills of Materials (BOMs)                       [+ Create BOM]        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  [🔍] Search by product code or name...                                │ │
│  │                                                                        │ │
│  │  [Status: All BOMs ▼]  [Product Type: All ▼]  [Date: All ▼]          │ │
│  │                                                                        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │                          [Spinner]                                     │ │
│  │                                                                        │ │
│  │                      Loading BOMs...                                   │ │
│  │                                                                        │ │
│  │  [Skeleton: Table rows]                                                │ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  [░░░░░░░░░░░░░░]  [░░]  [░░░░]  [░░░░░]  [░░░░░]  [░░░░]  [░ ░ ░]    │ │
│  │  [░░░░░░░░░░░░░░]  [░░]  [░░░░]  [░░░░░]  [░░░░░]  [░░░░]  [░ ░ ░]    │ │
│  │  [░░░░░░░░░░░░░░]  [░░]  [░░░░]  [░░░░░]  [░░░░░]  [░░░░]  [░ ░ ░]    │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                    Technical > BOMs    [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Bills of Materials (BOMs)                       [+ Create BOM]        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  [🔍] Search by product code or name...                                │ │
│  │                                                                        │ │
│  │  [Status: All BOMs ▼]  [Product Type: All ▼]  [Date: All ▼]          │ │
│  │                                                                        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │                          [📋 Icon]                                     │ │
│  │                                                                        │ │
│  │                    No BOMs Found                                       │ │
│  │                                                                        │ │
│  │         Create your first BOM to define product formulations.          │ │
│  │                                                                        │ │
│  │         A BOM (Bill of Materials) lists all ingredients and            │ │
│  │         their quantities needed to produce a finished product.         │ │
│  │                                                                        │ │
│  │                      [+ Create Your First BOM]                         │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                    Technical > BOMs    [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Bills of Materials (BOMs)                       [+ Create BOM]        │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │  ❌ Failed to Load BOMs                                          │ │ │
│  │  │                                                                  │ │ │
│  │  │  Error: Unable to retrieve BOMs from database.                  │ │ │
│  │  │  Error code: BOM_FETCH_FAILED                                   │ │ │
│  │  │                                                                  │ │ │
│  │  │  Possible causes:                                               │ │ │
│  │  │  • Network connection lost                                      │ │ │
│  │  │  • Session expired                                              │ │ │
│  │  │  • Database error or timeout                                    │ │ │
│  │  │  • Insufficient permissions                                     │ │ │
│  │  │                                                                  │ │ │
│  │  │  [Try Again]                                   [Contact Support] │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Page Header
- **Title**: "Bills of Materials (BOMs)"
- **Breadcrumb**: "< Technical" (back to Technical dashboard)
- **Primary Action**: "[+ Create BOM]" button (opens TEC-006 modal)

### 2. Search Bar
- **Type**: Text input with search icon
- **Placeholder**: "Search by product code or name..."
- **Behavior**: Debounced search (300ms delay)
- **Searches**: product.code, product.name

### 3. Filter Controls
- **Status Filter**: Dropdown
  - Options: All BOMs, Draft, Active, Phased Out, Inactive
  - Default: "All BOMs"
- **Product Type Filter**: Dropdown
  - Options: All, Raw Material, WIP, Finished Good, Packaging
  - Default: "All"
- **Date Filter**: Dropdown
  - Options: All, Currently Effective, Future Only, Expired Only
  - Default: "All"

### 4. BOMs Table
Columns:
1. **Product** (2 lines)
   - Line 1: Product code (bold, e.g., "BREAD-001")
   - Line 2: Product name (gray, e.g., "White Bread 500g")
2. **Version** (monospace font)
   - Format: "v1", "v2", "v3"
3. **Status** (badge with color)
   - Draft: Gray badge with ⚠
   - Active: Green badge with ●
   - Phased Out: Yellow badge with 🟡
   - Inactive: Gray outline with ○
4. **Eff. From** (date)
   - Format: "2024-01-15"
5. **Eff. To** (date)
   - Format: "2024-12-31" or "-" if null
6. **Output** (quantity + UoM)
   - Format: "100 kg", "200 L"
7. **Actions** (icon buttons)
   - 👁 View (navigate to detail page)
   - ✏ Edit (open TEC-006 modal)
   - 📋 Clone (copy BOM to new product)
   - 🗑 Delete (confirmation dialog)

### 5. Pagination Controls
- **Display**: "Showing X of Y BOMs"
- **Controls**: [< Prev] Page N [Next >]
- **Page Size**: 50 BOMs per page

### 6. Delete Confirmation Dialog
- **Title**: "Delete BOM?"
- **Message**: "Are you sure you want to delete BOM vX for [Product Name]? This will also delete all BOM items. This action cannot be undone."
- **Buttons**:
  - Secondary: "Cancel"
  - Primary (red): "Delete BOM"

---

## Main Actions

### Primary Actions
1. **[+ Create BOM]** (top-right)
   - Opens TEC-006 modal (BOM Create/Edit)
   - Available to: Admin, Production Manager

2. **[+ Create Your First BOM]** (empty state)
   - Same as above

### Row Actions
1. **👁 View** (eye icon)
   - Navigate to `/technical/boms/{id}` (detail page)
   - Shows BOM header + items tabs

2. **✏ Edit** (pencil icon)
   - Opens TEC-006 modal with pre-filled data
   - Available if status is Draft or Active

3. **📋 Clone** (clipboard icon) - FR-2.24
   - Label: "Clone BOM"
   - Behavior: Opens TEC-006 in create mode with pre-filled data:
     - Product: Blank (user must select new product)
     - Version: Set to 1 (new BOM)
     - All items: Copied from source BOM
     - Routing: Copied from source BOM
     - Notes: "Cloned from BOM-{source_id}"
   - Shortcut: Ctrl+D
   - API: POST /api/technical/boms with cloneFrom={sourceId}
   - Available to: Admin, Production Manager
   - Use Case: Create similar BOM for product variant

4. **🗑 Delete** (trash icon)
   - Opens confirmation dialog
   - Disabled if BOM is used in active Work Orders
   - Available to: Admin only

### Filter Actions
1. **Search Input**
   - Debounced text search (300ms)
   - Clears on X click

2. **Status Dropdown**
   - Filters table immediately on change

3. **Product Type Dropdown**
   - Filters table immediately on change

4. **Date Filter Dropdown**
   - Filters by effective date logic

---

## Actions

### Clone BOM (FR-2.24)
- **Trigger**: Click [📋 Clone] on any BOM row
- **Behavior**:
  1. Fetch source BOM data (items, routing, all fields)
  2. Navigate to TEC-006 Create mode
  3. Pre-populate all fields EXCEPT:
     - Product (user must choose target product)
     - Version (reset to 1)
     - Status (set to Draft)
  4. Add note: "Cloned from {source_product_code} v{version}"
- **Use Case**: Create similar BOM for product variant
- **Validation**: User must select different product (can't clone to same product)
- **Permissions**: Admin, Production Manager

---

## State Transitions

```
Page Load
  ↓
LOADING (Show skeleton)
  ↓ Success
SUCCESS (Show table with data)
  ↓ User filters/searches
LOADING (brief, show existing data)
  ↓
SUCCESS (Updated table)

OR

LOADING
  ↓ Failure
ERROR (Show error banner with retry)
  ↓ [Try Again]
LOADING (retry)

EMPTY STATE (when 0 results)
  ↓ [+ Create Your First BOM]
TEC-006 Modal (Create BOM)
```

---

## Validation

No validation on this screen (list view only).

**Server-Side Filters:**
- Status must be valid enum
- Product type must exist in database
- Date logic enforced by query

---

## Data Required

### API Endpoint
```
GET /api/technical/boms
POST /api/technical/boms (with cloneFrom parameter)
```

### Query Parameters
```typescript
{
  search?: string          // Product code/name search
  status?: string          // Draft | Active | Phased Out | Inactive
  product_type?: string    // Product type ID or code
  effective_date?: string  // Filter by date logic
  cloneFrom?: string       // Source BOM ID for cloning
  limit?: number           // Default 50
  offset?: number          // Pagination
}
```

### Response Schema
```typescript
{
  boms: [
    {
      id: string
      org_id: string
      product_id: string
      product: {
        id: string
        code: string         // e.g., "BREAD-001"
        name: string         // e.g., "White Bread 500g"
        type: string         // "Finished Good"
        uom: string          // "kg"
      }
      version: string        // "1", "2", "3"
      status: string         // "Draft" | "Active" | "Phased Out" | "Inactive"
      effective_from: string // ISO date
      effective_to: string | null
      output_qty: number     // 100
      output_uom: string     // "kg"
      routing_id: string | null
      units_per_box: number | null
      boxes_per_pallet: number | null
      notes: string | null
      created_at: string
      updated_at: string
      created_by: string
      updated_by: string
    }
  ]
  total: number
  page: number
  limit: number
}
```

---

## Technical Notes

### Performance
- **Index**: (org_id, product_id, status, effective_from, effective_to)
- **Pagination**: Server-side with limit/offset
- **Cache**: Redis cache for 1 min (active BOMs per product)

### Business Rules
1. **Date Overlap Prevention**: Database trigger prevents overlapping effective dates for same product
2. **Active BOM**: Only ONE active BOM per product at any time
3. **Version Numbering**: Auto-increment per product (v1, v2, v3...)
4. **Delete Restriction**: Cannot delete if referenced by active Work Orders
5. **Clone Restriction**: Cannot clone to same product (new product required)

### RLS Policy
```sql
CREATE POLICY "BOMs org isolation"
ON boms FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Accessibility
- **Touch Targets**: All buttons >= 48x48dp
- **Contrast**: Status badges pass WCAG AA (4.5:1)
- **Screen Reader**: Table headers properly labeled
- **Keyboard**:
  - Tab navigation through filters and table rows
  - Enter on row opens detail view
  - Space on action buttons triggers action
  - Ctrl+D triggers clone action on focused row
- **Focus**: Clear focus indicators on all interactive elements

---

## Related Screens

- **Previous**: `/technical` (Technical Dashboard)
- **Next (Create)**: TEC-006 BOM Create/Edit Modal
- **Next (Clone)**: TEC-006 BOM Create/Edit Modal (with cloneFrom parameter)
- **Next (View)**: `/technical/boms/{id}` (BOM Detail Page)
- **Related**: TEC-007 Routings List (production steps)

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `apps/frontend/app/(authenticated)/technical/boms/page.tsx`
2. **Existing Code**: ~80% implemented (see file for reference)
3. **Key Changes Needed**:
   - Add Product Type filter (currently missing)
   - Add Date filter (currently missing)
   - Add Clone button to row actions
   - Implement clone logic (fetch source BOM, open create modal with pre-filled data)
   - Improve empty state illustration
   - Add error boundary

4. **API Endpoint**: `GET /api/technical/boms` (already implemented)

5. **Dependencies**:
   - `BOMFormModal` component (TEC-006) for create/edit/clone
   - `TechnicalHeader` component for breadcrumb
   - `useToast` hook for notifications

6. **State Management**:
   - Use React state for filters and search
   - Debounce search with 300ms delay
   - Optimistic updates on delete (remove from list before API confirms)
   - Store cloneFrom parameter when user initiates clone action

7. **Modal Integration**:
   - URL query param `?create=true` auto-opens create modal
   - URL query param `?cloneFrom={id}` opens create modal with clone data pre-filled
   - Modal state in component (not URL for edit)
   - Refresh list on modal success

8. **Clone Implementation**:
   - Click clone button → fetch source BOM via API
   - Pass cloneFrom parameter to TEC-006 modal
   - TEC-006 handles pre-population logic

### API Endpoints
```
GET    /api/technical/boms?search=...&status=...
POST   /api/technical/boms?cloneFrom={sourceId}
Response: { boms: BOMWithProduct[], total: number }

DELETE /api/technical/boms/:id
Response: { success: true }
```

### Validation Rules
- No client-side validation (list view only)
- Server validates permissions (Admin/Manager for create/delete)
- Clone validation: user must select different product

---

## Field Verification (PRD Cross-Check)

**BOM Core Fields (from PRD Section 3.1 - boms table):**
- ✅ id, org_id (internal, not shown)
- ✅ product_id (shown as product.code + product.name)
- ✅ version (shown in table)
- ✅ bom_type (not shown in list, defaults to "standard")
- ✅ routing_id (not shown in list, managed in detail view)
- ✅ effective_from (shown in table)
- ✅ effective_to (shown in table)
- ✅ status (shown as badge)
- ✅ output_qty (shown in "Output" column)
- ✅ output_uom (shown in "Output" column)
- ✅ units_per_box (not shown in list, shown in detail)
- ✅ boxes_per_pallet (not shown in list, shown in detail)
- ✅ notes (not shown in list, shown in detail/edit)
- ✅ created_at, updated_at, created_by, updated_by (not shown, audit fields)

**Filter Fields:**
- ✅ Search by product code/name (AC-2.6.1)
- ✅ Filter by status (AC-2.6.1)
- ✅ Filter by product type (implied by PRD)
- ✅ Filter by effective dates (implied by versioning)

**Actions:**
- ✅ Create BOM (AC-2.6.2, FR-2.20)
- ✅ Edit BOM (AC-2.6.4, FR-2.20)
- ✅ Clone BOM (AC-2.6.?, FR-2.24)
- ✅ Delete BOM (AC-2.6.6, FR-2.20)
- ✅ View BOM detail (AC-2.6.5, FR-2.20)

**Status Values (from existing code):**
- ✅ Draft
- ✅ Active
- ✅ Phased Out
- ✅ Inactive

**ALL PRD FIELDS VERIFIED ✅**
**CLONE ACTION (FR-2.24) ADDED ✅**

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve
**Iterations**: 1 of 3
**PRD Compliance**: 100% (all fields verified + clone action added)
