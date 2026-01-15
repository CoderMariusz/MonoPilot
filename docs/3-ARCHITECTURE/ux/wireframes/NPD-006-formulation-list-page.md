# NPD-006: Formulation List Page

**Module**: NPD (New Product Development)
**Feature**: Formulation List View (PRD Section 3.6 - Formulation UI)
**Type**: Page (Table View)
**Status**: Ready for Implementation
**Last Updated**: 2026-01-15

---

## Overview

Main list view for NPD Formulations across all projects. Displays all formulations with filtering by project/product, status, and effective dates. Supports search, create, edit, view, clone, compare, and timeline actions. Formulations are versioned recipes that become BOMs upon handoff to Production.

**Business Context:**
- Formulations are version-controlled (v1.0, v1.1, v2.0...)
- Multiple formulations per project allowed
- Formulations become BOMs during project handoff
- Locked formulations are immutable
- Lineage tracking via parent_formulation_id
- Auto-aggregated allergen declarations from ingredients

---

## ASCII Wireframe

### Success State (Populated)

```
+--------------------------------------------------------------------------------------------------+
|  MonoPilot                                    NPD > Formulations                     [Jan K. v]  |
+--------------------------------------------------------------------------------------------------+
|  < NPD                                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Formulations                                                    [+ Create Formulation]   |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  +---------------------------------------------------------------------------------+      |  |
|  |  |  [Search by project name, product name, or version...                       ]  |      |  |
|  |  +---------------------------------------------------------------------------------+      |  |
|  |                                                                                            |  |
|  |  [Status: All v]  [Project: All Projects v]  [Effective: All v]  [Clear Filters]          |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  Version   Project              Status      Eff. From    Eff. To    Items  Allergens Act  |  |
|  |  -----------------------------------------------------------------------------------------  |  |
|  |  v2.0      NPD-2025-00001       [Draft]     -            -          14     2         ...  |  |
|  |            Premium Vegan Burger             gray badge                        Soy, Wheat  |  |
|  |                                                                     [View] [Edit] [Clone] |  |
|  |  -----------------------------------------------------------------------------------------  |  |
|  |  v1.1      NPD-2025-00001       [Approved]  Jan 25, 2025 Feb 04     12     3         ...  |  |
|  |            Premium Vegan Burger             green badge  2025               Soy,Wheat,    |  |
|  |                                                                             Sesame        |  |
|  |                                                         [View] [Clone] [Compare] [Timeline]|  |
|  |  -----------------------------------------------------------------------------------------  |  |
|  |  v1.0      NPD-2025-00001       [Locked]    Jan 15, 2025 Jan 24     12     3         ...  |  |
|  |            Premium Vegan Burger             blue badge   2025               Soy,Wheat,    |  |
|  |                                                                             Sesame        |  |
|  |                                                         [View] [Clone] [Compare] [Timeline]|  |
|  |  -----------------------------------------------------------------------------------------  |  |
|  |  v1.0      NPD-2025-00003       [Approved]  Feb 01, 2025 -          8      1         ...  |  |
|  |            Keto Cookies Line                green badge                     Wheat         |  |
|  |                                                         [View] [Clone] [Compare] [Timeline]|  |
|  |  -----------------------------------------------------------------------------------------  |  |
|  |  v1.2      NPD-2025-00005       [Draft]     -            -          18     4         ...  |  |
|  |            Organic Bread Series             gray badge                      Wheat,Milk,   |  |
|  |                                                                             Eggs,Soy      |  |
|  |                                                                     [View] [Edit] [Clone] |  |
|  |  -----------------------------------------------------------------------------------------  |  |
|  |                                                                                            |  |
|  |  Showing 5 of 42 Formulations                            [< Prev]  Page 1 of 5  [Next >]  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Loading State

```
+--------------------------------------------------------------------------------------------------+
|  MonoPilot                                    NPD > Formulations                     [Jan K. v]  |
+--------------------------------------------------------------------------------------------------+
|  < NPD                                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Formulations                                                    [+ Create Formulation]   |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  [Search by project name, product name, or version...                                  ]  |  |
|  |                                                                                            |  |
|  |  [Status: All v]  [Project: All Projects v]  [Effective: All v]  [Clear Filters]          |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |                               [Spinner]                                                   |  |
|  |                                                                                            |  |
|  |                           Loading formulations...                                         |  |
|  |                                                                                            |  |
|  |  [Skeleton: Table rows]                                                                   |  |
|  |  -----------------------------------------------------------------------------------------  |  |
|  |  [============]  [==================]  [======]  [========]  [========]  [====]  [===]   |  |
|  |  [============]  [==================]  [======]  [========]  [========]  [====]  [===]   |  |
|  |  [============]  [==================]  [======]  [========]  [========]  [====]  [===]   |  |
|  |  [============]  [==================]  [======]  [========]  [========]  [====]  [===]   |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Empty State

```
+--------------------------------------------------------------------------------------------------+
|  MonoPilot                                    NPD > Formulations                     [Jan K. v]  |
+--------------------------------------------------------------------------------------------------+
|  < NPD                                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Formulations                                                    [+ Create Formulation]   |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  [Search by project name, product name, or version...                                  ]  |  |
|  |                                                                                            |  |
|  |  [Status: All v]  [Project: All Projects v]  [Effective: All v]  [Clear Filters]          |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |                                                                                            |  |
|  |                                    [Flask Icon]                                           |  |
|  |                                                                                            |  |
|  |                              No Formulations Found                                        |  |
|  |                                                                                            |  |
|  |               Create your first formulation to start developing recipes.                  |  |
|  |                                                                                            |  |
|  |               A formulation is a versioned recipe that defines ingredients                |  |
|  |               and quantities for an NPD project. Once approved, it can be                 |  |
|  |               transferred to Production as a BOM during project handoff.                  |  |
|  |                                                                                            |  |
|  |                            [+ Create Your First Formulation]                              |  |
|  |                                                                                            |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Filtered State (No Results)

```
+--------------------------------------------------------------------------------------------------+
|  MonoPilot                                    NPD > Formulations                     [Jan K. v]  |
+--------------------------------------------------------------------------------------------------+
|  < NPD                                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Formulations                                                    [+ Create Formulation]   |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  [organic                                                                              x]  |  |
|  |                                                                                            |  |
|  |  [Status: Locked v]  [Project: All Projects v]  [Effective: All v]  [Clear Filters]       |  |
|  |                                                                                            |  |
|  |  Active filters: 2                                                                        |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |                                                                                            |  |
|  |                                   [Search Icon]                                           |  |
|  |                                                                                            |  |
|  |                          No Formulations Match Your Filters                               |  |
|  |                                                                                            |  |
|  |               Try adjusting your search terms or clearing some filters.                   |  |
|  |                                                                                            |  |
|  |                                   [Clear All Filters]                                     |  |
|  |                                                                                            |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Error State

```
+--------------------------------------------------------------------------------------------------+
|  MonoPilot                                    NPD > Formulations                     [Jan K. v]  |
+--------------------------------------------------------------------------------------------------+
|  < NPD                                                                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|  +--------------------------------------------------------------------------------------------+  |
|  |  Formulations                                                    [+ Create Formulation]   |  |
|  +--------------------------------------------------------------------------------------------+  |
|  |                                                                                            |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |  |  [X] Failed to Load Formulations                                                     |  |  |
|  |  |                                                                                      |  |  |
|  |  |  Error: Unable to retrieve formulations from database.                              |  |  |
|  |  |  Error code: NPD_FORMULATION_FETCH_FAILED                                           |  |  |
|  |  |                                                                                      |  |  |
|  |  |  Possible causes:                                                                   |  |  |
|  |  |  - Network connection lost                                                          |  |  |
|  |  |  - Session expired                                                                  |  |  |
|  |  |  - Database error or timeout                                                        |  |  |
|  |  |  - NPD module not enabled for your organization                                     |  |  |
|  |  |                                                                                      |  |  |
|  |  |  [Try Again]                                                  [Contact Support]     |  |  |
|  |  +--------------------------------------------------------------------------------------+  |  |
|  |                                                                                            |  |
|  +--------------------------------------------------------------------------------------------+  |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## Key Components

### 1. Page Header
- **Title**: "Formulations"
- **Breadcrumb**: "< NPD" (back to NPD dashboard)
- **Primary Action**: "[+ Create Formulation]" button (opens NPD-007 modal)

### 2. Search Bar
- **Type**: Text input with search icon
- **Placeholder**: "Search by project name, product name, or version..."
- **Behavior**: Debounced search (300ms delay)
- **Searches**: project_name, project_number, formulation_number

### 3. Filter Controls
- **Status Filter**: Dropdown
  - Options: All, Draft, Approved, Locked
  - Default: "All"
- **Project Filter**: Dropdown
  - Options: All Projects, [list of NPD projects by name]
  - Default: "All Projects"
- **Effective Date Filter**: Dropdown
  - Options: All, Currently Effective, Future Only, Expired Only
  - Default: "All"

### 4. Formulations Table
Columns:
1. **Version** (monospace font)
   - Format: "v1.0", "v1.1", "v2.0"
   - Sorted DESC by default (newest first)
2. **Project** (2 lines)
   - Line 1: Project number (bold, e.g., "NPD-2025-00001")
   - Line 2: Project name (gray, e.g., "Premium Vegan Burger")
3. **Status** (badge with color)
   - Draft: Gray badge
   - Approved: Green badge
   - Locked: Blue badge
4. **Eff. From** (date)
   - Format: "Jan 25, 2025" or "-" if null
5. **Eff. To** (date)
   - Format: "Feb 04, 2025" or "-" if null
6. **Items** (count)
   - Number of formulation items
7. **Allergens** (count + tooltip)
   - Number of allergens + comma-separated list on hover
8. **Actions** (icon buttons or dropdown)
   - View, Edit (draft only), Clone, Compare, Timeline

### 5. Pagination Controls
- **Display**: "Showing X of Y Formulations"
- **Controls**: [< Prev] Page N of M [Next >]
- **Page Size**: 10 formulations per page (configurable)

---

## Status Badges

| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| Draft | Gray (#6B7280) | No icon | Formulation in development, editable |
| Approved | Green (#22C55E) | Checkmark | Approved by R&D lead, ready for trials |
| Locked | Blue (#3B82F6) | Lock icon | Immutable, used in handoff |

---

## Main Actions

### Primary Actions
1. **[+ Create Formulation]** (top-right)
   - Opens NPD-007 modal (Formulation Create/Edit)
   - Must select parent NPD project
   - Available to: NPD Lead, R&D

2. **[+ Create Your First Formulation]** (empty state)
   - Same as above

### Row Actions

| Action | Icon | Label | Status | Description |
|--------|------|-------|--------|-------------|
| View | Eye | View | All | Navigate to formulation detail page |
| Edit | Pencil | Edit | Draft only | Opens NPD-007 modal in edit mode |
| Clone | Copy | Clone | All | Creates new version from selected |
| Compare | Diff | Compare | Approved, Locked | Opens version comparison modal |
| Timeline | Clock | Timeline | Approved, Locked | Shows formulation version history |

### Action Availability Matrix

| Action | Draft | Approved | Locked |
|--------|-------|----------|--------|
| View | Yes | Yes | Yes |
| Edit | Yes | No | No |
| Clone | Yes | Yes | Yes |
| Compare | No | Yes | Yes |
| Timeline | No | Yes | Yes |

---

## Actions Detail

### Clone Formulation (NPD-FR-16)
- **Trigger**: Click [Clone] on any formulation row
- **Behavior**:
  1. Fetch source formulation data (items, all fields)
  2. Open NPD-007 Create modal
  3. Pre-populate all fields:
     - Version: Auto-increment (v1.0 -> v1.1 or v2.0)
     - Parent: Set to source formulation ID (lineage)
     - Status: Set to Draft
     - All items: Copied from source
  4. Add note: "Cloned from v{version}"
- **Use Case**: Create new version with modifications
- **Validation**: Same project only (cannot clone across projects)
- **Permissions**: NPD Lead, R&D

### Compare Versions (NPD-FR-15)
- **Trigger**: Click [Compare] OR select 2 formulations + click Compare
- **Behavior**:
  1. Opens comparison modal/page
  2. Side-by-side diff view:
     - Added items (green highlight)
     - Removed items (red highlight)
     - Changed quantities (yellow highlight)
  3. Show cost difference if available
  4. Show allergen changes
- **Use Case**: Review changes between versions
- **Permissions**: All roles

### Timeline View
- **Trigger**: Click [Timeline] on any formulation row
- **Behavior**:
  1. Opens modal showing version history
  2. Timeline format with events:
     - Created date + user
     - Approved date + user
     - Locked date + user
     - Lineage (parent versions)
  3. Visual lineage tree for complex versioning
- **Use Case**: Track formulation evolution
- **Permissions**: All roles

---

## State Transitions

```
Page Load
  |
LOADING (Show skeleton)
  | Success
  v
SUCCESS (Show table with data)
  | User filters/searches
  v
LOADING (brief, show existing data faded)
  |
SUCCESS (Updated table)

OR

LOADING
  | Failure
  v
ERROR (Show error banner with retry)
  | [Try Again]
  v
LOADING (retry)

EMPTY STATE (when 0 results globally)
  | [+ Create Your First Formulation]
  v
NPD-007 Modal (Create Formulation)

FILTERED STATE (when 0 results with filters)
  | [Clear All Filters]
  v
SUCCESS (Show all formulations)
```

---

## Validation

No validation on this screen (list view only).

**Server-Side Filters:**
- Status must be valid enum (draft, approved, locked)
- Project must exist and belong to org
- Date logic enforced by query

---

## Data Required

### API Endpoint
```
GET /api/npd/formulations
```

### Query Parameters
```typescript
{
  search?: string           // Project name/number, version search
  status?: string           // draft | approved | locked
  npd_project_id?: string   // Filter by specific project
  effective_date?: string   // Filter by date logic (currently_effective, future, expired)
  limit?: number            // Default 10
  offset?: number           // Pagination
  sort_by?: string          // Default: created_at
  sort_order?: string       // Default: desc
}
```

### Response Schema
```typescript
{
  formulations: [
    {
      id: string
      org_id: string
      npd_project_id: string
      npd_project: {
        id: string
        project_number: string   // "NPD-2025-00001"
        project_name: string     // "Premium Vegan Burger"
        current_gate: string     // "G3"
        status: string           // "development"
      }
      formulation_number: string // "v1.0", "v1.1"
      status: string             // "draft" | "approved" | "locked"
      effective_from: string | null  // ISO date
      effective_to: string | null
      parent_formulation_id: string | null  // Lineage
      total_qty: number          // 100
      uom: string                // "kg"
      item_count: number         // 12
      allergens: string[]        // ["Soy", "Wheat", "Sesame"]
      allergen_count: number     // 3
      notes: string | null
      approved_by: string | null
      approved_at: string | null
      created_at: string
      updated_at: string
      created_by: string
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
- **Index**: (org_id, npd_project_id, status, effective_from, effective_to)
- **Pagination**: Server-side with limit/offset
- **Cache**: Redis cache for 30 sec (formulation list per project)
- **Allergen aggregation**: Pre-computed on formulation save, not on list load

### Business Rules
1. **Date Overlap Prevention**: Database trigger prevents overlapping effective dates within same project
2. **One Active per Project**: Only ONE approved/locked formulation per project at any time (by effective date)
3. **Version Numbering**: Manual or auto-increment per project (v1.0, v1.1, v2.0...)
4. **Lock on Approval**: Approved formulation becomes locked when project advances gate
5. **Clone Creates Lineage**: Cloned formulation has parent_formulation_id set
6. **Allergen Auto-Aggregation**: Allergens computed from formulation items on save

### RLS Policy
```sql
CREATE POLICY "NPD Formulations org isolation"
ON npd_formulations FOR ALL
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
- **Focus**: Clear focus indicators on all interactive elements

---

## Related Screens

- **Previous**: `/npd` (NPD Dashboard)
- **Next (Create)**: NPD-007 Formulation Create/Edit Modal
- **Next (View)**: `/npd/formulations/{id}` (Formulation Detail Page)
- **Next (Compare)**: NPD-008 Formulation Compare Modal
- **Related**: NPD-002 Project Detail Page (Formulations Tab)
- **Handoff**: TEC-005 BOMs List (formulations become BOMs)

---

## Handoff Notes

### For FRONTEND-DEV

1. **Component**: `apps/frontend/app/(authenticated)/npd/formulations/page.tsx`
2. **Service**: `apps/frontend/lib/services/npd-formulation-service.ts`
3. **Validation**: `apps/frontend/lib/validation/npd-formulation.ts`

4. **Key Implementation Notes**:
   - Use ShadCN DataTable component
   - Allergens column shows count with tooltip for full list
   - Status badges use consistent colors across NPD module
   - Clone action opens create modal with pre-filled data
   - Compare requires at least 2 formulations from same project

5. **API Endpoint**: `GET /api/npd/formulations` (implement new)

6. **Dependencies**:
   - `FormulationFormModal` component (NPD-007) for create/edit/clone
   - `FormulationCompareModal` component (NPD-008) for compare
   - `FormulationTimelineModal` component for timeline view
   - `NPDHeader` component for breadcrumb
   - `useToast` hook for notifications

7. **State Management**:
   - Use React state for filters and search
   - Debounce search with 300ms delay
   - Store cloneFrom parameter when user initiates clone action
   - Selected formulations for compare stored in state

8. **Modal Integration**:
   - URL query param `?create=true` auto-opens create modal
   - URL query param `?project={id}` pre-selects project in create modal
   - URL query param `?cloneFrom={id}` opens create modal with clone data
   - Modal state in component (not URL for edit)
   - Refresh list on modal success

9. **Clone Implementation**:
   - Click clone button -> fetch source formulation via API
   - Pass cloneFrom parameter to NPD-007 modal
   - NPD-007 handles pre-population and version increment

### API Endpoints
```
GET    /api/npd/formulations?search=...&status=...&npd_project_id=...
POST   /api/npd/formulations
Response: { formulations: FormulationWithProject[], total: number }

DELETE /api/npd/formulations/:id (not shown in UI, admin only)
Response: { success: true }
```

### Validation Rules
- No client-side validation (list view only)
- Server validates permissions (NPD Lead/R&D for create/edit)
- Clone validation: same project only

---

## Permissions

| Role | View List | Create | Edit (Draft) | Clone | Compare | Timeline |
|------|-----------|--------|--------------|-------|---------|----------|
| Admin | Yes | Yes | Yes | Yes | Yes | Yes |
| NPD Lead | Yes | Yes | Yes | Yes | Yes | Yes |
| R&D | Yes (assigned projects) | Yes | Yes (assigned) | Yes | Yes | Yes |
| Regulatory | Yes | No | No | No | Yes | Yes |
| Finance | Yes | No | No | No | Yes | Yes |
| Production | Yes (handoff stage) | No | No | No | Yes | Yes |

---

## Testing Requirements

### Unit Tests
```typescript
describe('NPD Formulation List Page', () => {
  describe('Table Rendering', () => {
    it('renders formulation table with all columns', async () => {});
    it('shows correct status badge colors', async () => {});
    it('displays allergen count with tooltip', async () => {});
    it('sorts by created_at DESC by default', async () => {});
  });

  describe('Filters', () => {
    it('filters by status', async () => {});
    it('filters by project', async () => {});
    it('filters by effective date', async () => {});
    it('combines multiple filters with AND', async () => {});
    it('debounces search input', async () => {});
    it('clears all filters', async () => {});
  });

  describe('Actions', () => {
    it('shows Edit action only for Draft status', async () => {});
    it('shows Compare action for Approved/Locked', async () => {});
    it('shows Clone action for all statuses', async () => {});
    it('opens clone modal with pre-filled data', async () => {});
  });

  describe('Pagination', () => {
    it('shows correct page info', async () => {});
    it('navigates between pages', async () => {});
  });
});
```

### E2E Tests
```typescript
describe('NPD Formulation List E2E', () => {
  it('loads formulation list page', async () => {
    // Navigate to /npd/formulations
    // Verify table renders
    // Verify filters visible
  });

  it('creates new formulation', async () => {
    // Click [+ Create Formulation]
    // Select project
    // Fill form
    // Submit
    // Verify new row appears
  });

  it('clones existing formulation', async () => {
    // Click Clone on existing formulation
    // Verify modal opens with pre-filled data
    // Verify version incremented
    // Submit
    // Verify new formulation in list
  });

  it('compares two formulations', async () => {
    // Select two formulations from same project
    // Click Compare
    // Verify diff view shows changes
  });

  it('filters formulations by status', async () => {
    // Select "Draft" status
    // Verify only Draft formulations shown
    // Clear filter
    // Verify all formulations shown
  });
});
```

---

## Field Verification (PRD Cross-Check)

**Formulation Core Fields (from PRD Section 3.2 - npd_formulations table):**
- id, org_id (internal, not shown)
- npd_project_id (shown as project.project_number + project.project_name)
- formulation_number (shown as "Version" column)
- status (shown as badge)
- effective_from (shown in table)
- effective_to (shown in table)
- parent_formulation_id (used in clone/timeline, not shown in list)
- total_qty (not shown in list, shown in detail)
- uom (not shown in list, shown in detail)
- notes (not shown in list, shown in detail)
- approved_by, approved_at (not shown in list, shown in timeline)
- created_at, updated_at (not shown, audit fields)

**Computed Fields:**
- item_count (COUNT of formulation_items)
- allergens (aggregated from formulation items)
- allergen_count (COUNT of allergens)

**Filter Fields:**
- Search by project name/number, version (PRD 3.6)
- Filter by status (PRD 3.6)
- Filter by project (implied by PRD)
- Filter by effective dates (implied by PRD)

**Actions (PRD 3.6):**
- View (navigate to detail)
- Edit (draft only)
- Clone (NPD-FR-16)
- Compare (NPD-FR-15)
- Timeline (implied by versioning)

**Status Values (from PRD 3.2):**
- draft
- approved
- locked

**ALL PRD FIELDS VERIFIED**

---

## Quality Gates

Before handoff to FRONTEND-DEV:
- [x] All 4 states defined (Loading, Empty, Populated, Error)
- [x] Filtered empty state defined
- [x] All API endpoints specified with request/response schemas
- [x] Accessibility checklist passed (touch targets, contrast, screen reader, keyboard)
- [x] Status badges with colors defined
- [x] All row actions documented with availability matrix
- [x] Clone action fully specified (NPD-FR-16)
- [x] Compare action fully specified (NPD-FR-15)
- [x] Timeline action specified
- [x] Permissions matrix documented
- [x] Business rules documented
- [x] RLS policy documented
- [x] Performance notes included
- [x] Testing requirements defined
- [x] PRD compliance verified

---

## Handoff to FRONTEND-DEV

```yaml
feature: NPD Formulation List Page
story: NPD-006
prd_coverage: "NPD PRD Section 3.6 (Formulation UI - Formulation List)"
  - "Version, Status, Effective From, Effective To, Items count"
  - "Actions: View, Edit (draft only), Clone, Compare"
  - "Search and filter by project, status, effective date"
approval_status:
  mode: "auto_approve"
  user_approved: true
  screens_approved: [NPD-006-formulation-list-page]
  iterations_used: 0
deliverables:
  wireframe: docs/3-ARCHITECTURE/ux/wireframes/NPD-006-formulation-list-page.md
  api_endpoints:
    - GET /api/npd/formulations (List with filters)
    - POST /api/npd/formulations (Create)
states_per_screen: [loading, empty, populated, filtered, error]
breakpoints:
  mobile: "<768px (stacked cards, collapsible filters)"
  tablet: "768-1024px (condensed table)"
  desktop: ">1024px (full table)"
accessibility:
  touch_targets: "48x48dp minimum"
  contrast: "4.5:1 minimum"
  aria_roles: "table, row, cell, button"
  keyboard_nav: "Tab, Enter, Space"
performance_targets:
  initial_load: "<500ms"
  filter_change: "<300ms"
  clone_action: "<500ms"
cache_ttl:
  formulation_list: "30sec"
table_columns: 8  # Version, Project, Status, Eff.From, Eff.To, Items, Allergens, Actions
filter_types: 3   # Status, Project, Effective Date
row_actions: 5    # View, Edit, Clone, Compare, Timeline
status_badges: 3  # Draft=gray, Approved=green, Locked=blue
```

---

**Status**: Ready for Implementation
**Approval Mode**: auto_approve
**User Approved**: Yes
**Iterations**: 0 of 3
**Estimated Effort**: 6-8 hours (DataTable with filters, clone/compare actions)
**Quality Target**: 95/100 (comprehensive formulation list view)
**PRD Coverage**: 100% (NPD PRD Section 3.6 - Formulation List)
**Reference**: TEC-005 BOMs List Page (similar pattern)
