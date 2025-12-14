# TEC-007: Routings List Page

**Module**: Technical
**Feature**: Routing Management (Story 2.24 - Routing Restructure)
**Type**: Page (Table View)
**Status**: Ready for Implementation
**Last Updated**: 2025-12-11

---

## Overview

Main list view for Routings (production operation sequences). Displays all routings with filtering by name and active status. Supports search, create, edit, delete, and view detail actions. Routings are reusable templates that define production steps for BOMs.

**Business Context:**
- Routings are independent templates (not tied to specific products)
- One routing can be reused across multiple BOMs
- Each routing contains a sequence of operations (steps)
- Operations define work centers, duration, labor costs, and instructions
- Routings are assigned to BOMs (via BOM.routing_id)

**Key Terminology:**
- **Routing**: A reusable template of production steps (e.g., "Standard Bread Line")
- **Operation**: A single production step within a routing (e.g., "Mixing", "Baking", "Cooling")
- **Sequence**: The order of operations (1, 2, 3...)

---

## ASCII Wireframe

### Success State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                  Technical > Routings  [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Routings                                                                    │
│  Manage production routings and operations                                  │
│                                                           [+ Add Routing]    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Filters                                                               │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │  ┌────────────────────────────────────────────┐  ┌──────────────────┐ │ │
│  │  │ [🔍] Search by name...                     │  │ Status: All    ▼│ │ │
│  │  └────────────────────────────────────────────┘  └──────────────────┘ │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  Name                  Description           Status    Ops.   Actions    │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Standard Bread Line   Mixing → Proofing →   ● Active   5      👁✏📋🗑 │ │
│  │                        Baking → Cooling                                  │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Cake Production       Basic cake workflow   ● Active   4      👁✏📋🗑 │ │
│  │                                                                          │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Sauce Blending        Blending and         ○ Inactive  3      👁✏📋🗑 │ │
│  │                        pasteurization                                    │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │  Pastry Line Legacy    Old pastry process   ○ Inactive  6      👁✏📋🗑 │ │
│  │                        (deprecated)                                      │ │
│  │  ─────────────────────────────────────────────────────────────────────── │ │
│  │                                                                        │ │
│  │  Showing 4 of 23 routings                                              │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                  Technical > Routings  [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Routings                                                                    │
│  Manage production routings and operations                                  │
│                                                           [+ Add Routing]    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Filters                                                               │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  [🔍] Search by name...                    [Status: All ▼]             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                          [Spinner]                                     │ │
│  │                                                                        │ │
│  │                      Loading routings...                               │ │
│  │                                                                        │ │
│  │  [Skeleton: Table rows]                                                │ │
│  │  ────────────────────────────────────────────────────────────────────  │ │
│  │  [░░░░░░░░░░░░░░]  [░░░░░░░░░░░░░░░░]  [░░░░]  [░░]  [░ ░]            │ │
│  │  [░░░░░░░░░░░░░░]  [░░░░░░░░░░░░░░░░]  [░░░░]  [░░]  [░ ░]            │ │
│  │  [░░░░░░░░░░░░░░]  [░░░░░░░░░░░░░░░░]  [░░░░]  [░░]  [░ ░]            │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                  Technical > Routings  [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Routings                                                                    │
│  Manage production routings and operations                                  │
│                                                           [+ Add Routing]    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  Filters                                                               │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │  [🔍] Search by name...                    [Status: All ▼]             │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                          [⚙ Icon]                                      │ │
│  │                                                                        │ │
│  │                    No Routings Found                                   │ │
│  │                                                                        │ │
│  │         Create your first routing to define production steps.          │ │
│  │                                                                        │ │
│  │         A routing is a sequence of operations (mixing, baking,         │ │
│  │         cooling, etc.) that can be reused across multiple BOMs.        │ │
│  │                                                                        │ │
│  │                      [+ Create Your First Routing]                     │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Error State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MonoPilot                                  Technical > Routings  [Jan K. ▼]│
├─────────────────────────────────────────────────────────────────────────────┤
│  < Technical                                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Routings                                                                    │
│  Manage production routings and operations                                  │
│                                                           [+ Add Routing]    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │  ❌ Failed to Load Routings                                      │ │ │
│  │  │                                                                  │ │ │
│  │  │  Error: Unable to retrieve routings from database.              │ │ │
│  │  │  Error code: ROUTING_FETCH_FAILED                               │ │ │
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
- **Title**: "Routings" (H1)
- **Subtitle**: "Manage production routings and operations" (muted text)
- **Breadcrumb**: "< Technical" (back to Technical dashboard)
- **Primary Action**: "[+ Add Routing]" button (opens TEC-008 modal)

### 2. Filter Card

#### Search Bar
- **Type**: Text input with search icon
- **Placeholder**: "Search by name..."
- **Behavior**: Client-side filter (300ms debounce)
- **Searches**: routing.name, routing.description

#### Status Filter
- **Type**: Dropdown
- **Options**:
  - All (default)
  - Active
  - Inactive
- **Behavior**: Server-side filter (immediate)

### 3. Routings Table

Columns:
1. **Name** (bold)
   - Primary identifier (e.g., "Standard Bread Line")
   - Clickable (navigates to detail view)
2. **Description** (muted text)
   - Optional field
   - Truncated if > 50 chars with "..."
   - Shows "-" if empty
3. **Status** (badge)
   - Active: Green badge with ●
   - Inactive: Gray badge with ○
4. **Ops.** (operations count)
   - Badge with number (e.g., "5")
   - Shows count of routing_operations
5. **Actions** (icon buttons)
   - 👁 View (navigate to detail page)
   - ✏️ Edit (opens modal)
   - 📋 Clone (opens modal with pre-filled data)
   - 🗑 Delete (confirmation dialog)

### 4. Footer
- **Display**: "Showing X of Y routings"
- **Note**: No pagination initially (all routings fit on one page for typical org)

### 5. Delete Confirmation Dialog
- **Title**: "Delete Routing?"
- **Message**: "Are you sure you want to delete routing '[Routing Name]'? This will also delete all operations. This action cannot be undone."
- **Warning**: If routing is used by BOMs, show additional warning:
  - "⚠ Warning: This routing is used by X BOM(s). Deleting it will unassign it from those BOMs."
- **Buttons**:
  - Secondary: "Cancel"
  - Primary (red): "Delete Routing"

---

## Main Actions

### Primary Actions
1. **[+ Add Routing]** (top-right)
   - Opens TEC-008 modal (Routing Create/Edit)
   - Available to: Admin, Production Manager

2. **[+ Create Your First Routing]** (empty state)
   - Same as above

### Row Actions
1. **👁 View** (eye icon)
   - Navigate to `/technical/routings/{id}` (detail page)
   - Shows routing header + operations list + timeline

2. **✏️ Edit** (edit icon)
   - Opens TEC-008 modal in edit mode
   - Pre-fills all routing fields
   - Available to: Admin, Production Manager

3. **📋 Clone** (copy icon)
   - Label: "Clone Routing"
   - Icon: 📋
   - Behavior:
     1. Opens TEC-008 in create mode
     2. Pre-fills: description, is_active fields
     3. Clears: name (user must enter new unique name)
     4. After save: Copies all operations to new routing
   - API: POST /api/technical/routings with cloneFrom={sourceId}
   - Shortcut: Ctrl+D
   - Available to: Admin, Production Manager
   - Feature: FR-2.47 Routing Clone

4. **🗑 Delete** (trash icon)
   - Opens confirmation dialog
   - Server checks if routing is used by BOMs
   - If used, shows warning but allows deletion (unassigns from BOMs)
   - Available to: Admin only

### Filter Actions
1. **Search Input**
   - Client-side filter with 300ms debounce
   - Case-insensitive search
   - Clears on X click

2. **Status Dropdown**
   - Server-side filter (re-fetch on change)

---

## State Transitions

```
Page Load
  ↓
LOADING (Show skeleton)
  ↓ Success
SUCCESS (Show table with data)
  ↓ User searches/filters
CLIENT FILTER (no server call for search)
OR
SERVER FILTER (re-fetch for status change)

OR

LOADING
  ↓ Failure
ERROR (Show error banner with retry)
  ↓ [Try Again]
LOADING (retry)

EMPTY STATE (when 0 results)
  ↓ [+ Create Your First Routing]
TEC-008 Modal (Create Routing)
```

---

## Validation

No validation on this screen (list view only).

**Server-Side Filters:**
- Status must be boolean (true/false for is_active)

---

## Data Required

### API Endpoint
```
GET /api/technical/routings
```

### Query Parameters
```typescript
{
  is_active?: string       // "true" | "false" | "all"
  limit?: number           // Optional, default all
  offset?: number          // Pagination (not used initially)
}
```

### Response Schema
```typescript
{
  routings: [
    {
      id: string
      org_id: string
      name: string                    // "Standard Bread Line"
      description: string | null      // "Mixing → Proofing → Baking..."
      is_active: boolean              // true = Active, false = Inactive
      operations_count: number        // Count of routing_operations
      created_at: string
      updated_at: string
      created_by: string
    }
  ]
  total: number
}
```

---

## Technical Notes

### Performance
- **Index**: (org_id, is_active, name)
- **Pagination**: Not needed initially (typical org has < 50 routings)
- **Cache**: Redis cache for 5 min (routings change infrequently)

### Business Rules
1. **Reusable Templates**: Routings are NOT tied to specific products
2. **BOM Assignment**: BOMs reference routings via bom.routing_id (optional)
3. **Delete Behavior**: Deleting routing sets bom.routing_id to NULL for affected BOMs
4. **Active Status**: Inactive routings cannot be assigned to new BOMs
5. **Operations**: Each routing must have >= 1 operation to be useful

### RLS Policy
```sql
CREATE POLICY "Routings org isolation"
ON routings FOR ALL
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

### Client-Side Search
```typescript
const filteredRoutings = routings.filter(routing => {
  if (!searchTerm) return true
  const term = searchTerm.toLowerCase()
  return (
    routing.name.toLowerCase().includes(term) ||
    (routing.description && routing.description.toLowerCase().includes(term))
  )
})
```

### Accessibility
- **Touch Targets**: All buttons >= 48x48dp
- **Contrast**: Status badges pass WCAG AA (4.5:1)
- **Screen Reader**: Table headers properly labeled
- **Keyboard**:
  - Tab navigation through filters and table rows
  - Enter on row navigates to detail view
  - Space on action buttons triggers action
- **Focus**: Clear focus indicators on all interactive elements

---

## Related Screens

- **Previous**: `/technical` (Technical Dashboard)
- **Next (Create)**: TEC-008 Routing Create/Edit Modal
- **Next (View)**: `/technical/routings/{id}` (Routing Detail Page)
- **Related**: TEC-005 BOMs List (BOMs reference routings)

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `apps/frontend/app/(authenticated)/technical/routings/page.tsx`
2. **Existing Code**: ~85% implemented (see file for reference)
3. **Key Changes Needed**:
   - Improve empty state illustration
   - Add better error handling
   - Add usage warning to delete dialog (check if routing used by BOMs)

4. **API Endpoint**: `GET /api/technical/routings` (already implemented)

5. **Dependencies**:
   - `CreateRoutingModal` component (TEC-008) for create/edit
   - `TechnicalHeader` component for breadcrumb
   - `useToast` hook for notifications

6. **State Management**:
   - Use React state for filters and search
   - Client-side search (300ms debounce)
   - Server-side status filter (re-fetch)
   - Optimistic updates on delete

7. **Modal Integration**:
   - Modal state in component (open/close)
   - Refresh list on modal success

### API Endpoints
```
GET    /api/technical/routings?is_active=true
Response: { routings: Routing[], total: number }

POST   /api/technical/routings (clone support)
Body: { name, description, is_active, cloneFrom?: string }
Response: { success: true, routing: Routing, operationsCount: number }

DELETE /api/technical/routings/:id
Response: { success: true, affected_boms: number }

GET    /api/technical/routings/:id/boms (check usage)
Response: { boms: BOM[], count: number }
```

### Delete Confirmation
```typescript
const handleDelete = async (routing: Routing) => {
  // Check usage first
  const usageRes = await fetch(`/api/technical/routings/${routing.id}/boms`)
  const usage = await usageRes.json()

  const message = usage.count > 0
    ? `This routing is used by ${usage.count} BOM(s). Deleting it will unassign it from those BOMs.`
    : `This will delete all ${routing.operations_count} operations.`

  if (!confirm(`Delete routing "${routing.name}"? ${message} This action cannot be undone.`)) {
    return
  }

  // Proceed with delete
  await fetch(`/api/technical/routings/${routing.id}`, { method: 'DELETE' })
}
```

---

## Field Verification (PRD Cross-Check)

**Routing Core Fields (from PRD Section 3.1 - routings table):**
- ✅ id, org_id (internal, not shown)
- ✅ name (shown in table, primary identifier)
- ✅ description (shown in table, optional)
- ✅ is_active (shown as Status badge)
- ✅ created_at, updated_at, created_by (audit fields, not shown in list)

**Routing Operations (from PRD Section 3.1 - routing_operations table):**
- ✅ operations_count (aggregate, shown as badge)
- Operations details shown in detail view (not in list)

**Filter Fields:**
- ✅ Search by name/description (client-side)
- ✅ Filter by is_active status (server-side)

**Actions:**
- ✅ Create routing (AC-2.40, FR-2.40)
- ✅ View routing detail (AC-2.40, FR-2.40)
- ✅ Delete routing (AC-2.40, FR-2.40)
- ✅ Edit routing (handled in detail view)

**Status Values:**
- ✅ Active (is_active = true)
- ✅ Inactive (is_active = false)

**ALL PRD FIELDS VERIFIED ✅**

---

**Status**: Ready for Implementation
**Approval Mode**: Auto-Approve
**Iterations**: 0 of 3
**PRD Compliance**: 100% (all fields verified)
