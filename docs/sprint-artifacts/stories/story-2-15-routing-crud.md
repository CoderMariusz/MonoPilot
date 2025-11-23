# Story 2.15: Routing CRUD

**Epic:** 2 - Technical Core
**Batch:** 2C - Routing System
**Status:** Completed (Backend)
**Priority:** P1 (High)
**Story Points:** 5
**Created:** 2025-11-23

---

## Goal

Create the Routing master data management functionality with create, read, update, and delete operations, allowing Technical users to define reusable production processes.

## User Story

**As a** Technical user
**I want** to create and manage routings
**So that** we can define step-by-step production processes that can be assigned to products

---

## Problem Statement

The Technical module requires routing definitions as the foundation for:
- Work Orders - which routing (process) to follow when manufacturing a product
- Production tracking - tracking progress through routing operations
- Capacity planning - estimating production time based on routing durations
- Cost calculation - summing labor costs across routing operations

Without routings, production processes cannot be standardized or tracked systematically.

---

## Acceptance Criteria

### AC-2.15.1: Routing List View

**Given** the user has Technical role or higher
**When** they navigate to `/technical/routings`
**Then** they see a routing list page with:
- Page title: "Routings"
- Search bar (search by code or name)
- Filter controls (status: active/inactive)
- "Add Routing" button (top right, visible to Admin/Technical only)
- Data table with columns:
  - Code
  - Name
  - Status (Active, Inactive badge)
  - Reusable (Yes/No badge)
  - Products Count (number of assigned products)
  - Operations Count (number of operations)
  - Actions (View, Edit, Delete icons)

**And** the table supports:
- Sorting by code, name, status, created_at
- Pagination (50 items per page)
- Responsive layout (mobile, tablet, desktop)

**Success Criteria:**
- Table loads routings from GET /api/technical/routings
- Empty state message if no routings exist: "No routings found. Create your first routing to get started."
- Loading skeleton during fetch
- Error message if API fails

---

### AC-2.15.2: Routing Search and Filtering

**Given** I am on the Routings list page
**When** I type in the search box
**Then** the routing list filters in real-time matching code or name (case-insensitive)

**When** I select Status filter "Active"
**Then** only active routings are displayed

**When** I select Status filter "Inactive"
**Then** only inactive routings are displayed

**When** I select Status filter "All"
**Then** all routings are displayed regardless of status

**Success Criteria:**
- Search debounced (300ms delay)
- URL params updated with active filters (shareable links)
- Filter state persists on page refresh

---

### AC-2.15.3: Create Routing Modal

**Given** I am on the Routings list page
**And** I have Admin or Technical role
**When** I click "Add Routing" button
**Then** a modal dialog opens with the title "Create Routing"

**And** the form contains fields:
- **Code** (text input, required, placeholder: "e.g., RTG-BREAD-01")
  - Validation: 2-50 chars, uppercase alphanumeric + hyphens
  - Auto-uppercase on input
  - Helper text: "Routing code must be unique per organization"
- **Name** (text input, required, placeholder: "e.g., Standard Bread Production")
  - Validation: 1-100 chars
- **Description** (textarea, optional, placeholder: "Describe this routing...")
  - Validation: max 1000 chars
- **Status** (dropdown, default: "Active")
  - Options: Active, Inactive
- **Reusable** (checkbox, default: checked)
  - Label: "This routing can be assigned to multiple products"
  - Helper text: "If unchecked, routing can only be assigned to one product"

**And** form has buttons:
- "Cancel" (closes modal, no save)
- "Create Routing" (saves and closes)

**Success Criteria:**
- Form validation shows inline errors
- Code uniqueness validated on blur (API call)
- Code automatically uppercased as user types
- Created routing appears in table immediately after save
- Success toast: "Routing created successfully"

---

### AC-2.15.4: Routing Creation Validation

**Given** I am filling out the Create Routing form
**When** I enter a code that already exists in the organization
**Then** an error message appears: "Routing code 'X' already exists"
**And** the "Create Routing" button is disabled

**When** I enter an invalid code format (e.g., "rtg@bread!")
**Then** an error message appears: "Code must contain only uppercase letters, numbers, and hyphens"

**When** I leave required fields empty
**Then** field-level error messages appear: "This field is required"

**When** all validations pass
**Then** the "Create Routing" button is enabled

**API Endpoint:**
```
POST /api/technical/routings
Body: {
  code: string,
  name: string,
  description?: string,
  status?: 'active' | 'inactive',
  is_reusable?: boolean
}
Response: {
  routing: Routing,
  message: string
}
```

**Success Criteria:**
- Validation errors appear in real-time
- API returns 409 for duplicate code
- API returns 400 for invalid format
- API returns 201 for successful creation

---

### AC-2.15.5: Routing Detail View

**Given** I am on the Routings list page
**When** I click the "View" icon for a routing
**Then** I navigate to `/technical/routings/:id`

**And** the routing detail page shows:
- **Header Section:**
  - Routing code (large text)
  - Routing name (subtitle)
  - Status badge (Active/Inactive)
  - Reusable badge (Yes/No)
  - Edit button (top right, Admin/Technical only)
  - Delete button (top right, Admin only)

- **Details Section:**
  - Description (if provided)
  - Created by, Created at
  - Updated by, Updated at

- **Operations Section:**
  - Heading: "Operations (X)" where X is count
  - Table with operations (from Story 2.16)
  - "Add Operation" button (Admin/Technical only)

- **Assigned Products Section:**
  - Heading: "Assigned Products (X)" where X is count
  - Table with assigned products
  - "Assign Products" button (Admin/Technical only)

**Success Criteria:**
- Page loads data from GET /api/technical/routings/:id
- Operations displayed in sequence order
- Products list shows product code, name, and default flag
- Loading state for each section
- Breadcrumbs: Technical > Routings > [Code]

---

### AC-2.15.6: Edit Routing Drawer

**Given** I am viewing a routing detail page
**And** I have Admin or Technical role
**When** I click the "Edit" button
**Then** a right-side drawer opens with the title "Edit Routing"

**And** the form contains the same fields as Create form EXCEPT:
- **Code field is disabled** (immutable)
- All other fields are pre-filled with current values

**And** form has buttons:
- "Cancel" (closes drawer, no save)
- "Save Changes" (saves and closes)

**When** I update any field and click "Save Changes"
**Then** routing is updated via PUT /api/technical/routings/:id
**And** the detail page refreshes with updated values
**And** success toast appears: "Routing updated successfully"

**API Endpoint:**
```
PUT /api/technical/routings/:id
Body: {
  name?: string,
  description?: string,
  status?: 'active' | 'inactive',
  is_reusable?: boolean
}
Response: {
  routing: Routing,
  message: string
}
```

**Success Criteria:**
- Code field is visually disabled and grayed out
- Validation same as Create form
- Changes reflected immediately after save
- Drawer closes on successful save

---

### AC-2.15.7: Delete Routing Confirmation

**Given** I am viewing a routing detail page
**And** I have Admin role
**When** I click the "Delete" button
**Then** a confirmation dialog appears

**And** the dialog shows:
- Title: "Delete Routing?"
- Message: "Are you sure you want to delete routing '[Code]'? This will also delete all operations and product assignments. This action cannot be undone."
- Warning icon (red)
- Buttons:
  - "Cancel" (closes dialog)
  - "Delete" (red, destructive action)

**When** I click "Delete"
**Then** routing is deleted via DELETE /api/technical/routings/:id
**And** I am redirected to `/technical/routings`
**And** success toast appears: "Routing deleted successfully"

**When** I click "Cancel"
**Then** the dialog closes and nothing is deleted

**API Endpoint:**
```
DELETE /api/technical/routings/:id
Response: {
  success: true,
  message: string
}
```

**Success Criteria:**
- Confirmation prevents accidental deletion
- Cascade delete removes operations and product_routings
- User redirected after successful delete
- Error handled gracefully if delete fails

---

### AC-2.15.8: Routing Code Uniqueness

**Given** an organization has existing routings
**When** a user creates a new routing with code "RTG-001"
**And** routing "RTG-001" already exists in the same organization
**Then** the API returns error 409: "Routing code already exists"

**When** another organization creates routing "RTG-001"
**Then** the creation succeeds (codes are unique per organization, not globally)

**Success Criteria:**
- Unique constraint enforced at database level: `UNIQUE (org_id, code)`
- Error message is user-friendly
- Frontend shows validation error immediately

---

### AC-2.15.9: Routing Status Management

**Given** a routing exists with status "Active"
**When** I edit the routing and change status to "Inactive"
**Then** the routing is marked as inactive
**And** it still appears in the list (with status filter = "All" or "Inactive")

**When** status is "Inactive"
**Then** the routing cannot be selected for new work orders (future Epic 3)
**But** existing work orders continue to use it

**Success Criteria:**
- Status change is immediate
- Inactive routings are visually distinguished (gray badge)
- Inactive filter works correctly

---

### AC-2.15.10: Reusable Flag Management

**Given** a routing exists with is_reusable = true
**When** I edit and uncheck "Reusable"
**Then** the routing is marked as non-reusable (is_reusable = false)

**When** a non-reusable routing is already assigned to a product
**And** I try to assign it to a second product
**Then** the API returns error: "This routing is not reusable and is already assigned to another product"

**Success Criteria:**
- Reusable flag can be toggled
- Validation enforced when assigning to products (Story 2.17)
- Clear error message for non-reusable violation

---

## Technical Requirements

### Database Schema

**Table: routings**
```sql
CREATE TABLE routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_reusable BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT routings_org_code_unique UNIQUE (org_id, code),
  CONSTRAINT routings_code_format CHECK (code ~ '^[A-Z0-9-]+$'),
  CONSTRAINT routings_status_check CHECK (status IN ('active', 'inactive'))
);
```

### API Endpoints

1. **GET /api/technical/routings**
   - Query params: status, search, sort_by, sort_direction
   - Returns: { routings: Routing[], total: number }

2. **POST /api/technical/routings**
   - Body: CreateRoutingInput
   - Returns: { routing: Routing, message: string }
   - Auth: Admin, Technical

3. **GET /api/technical/routings/:id**
   - Returns: { routing: Routing (with operations & products) }

4. **PUT /api/technical/routings/:id**
   - Body: UpdateRoutingInput
   - Returns: { routing: Routing, message: string }
   - Auth: Admin, Technical

5. **DELETE /api/technical/routings/:id**
   - Returns: { success: true, message: string }
   - Auth: Admin

### RLS Policies

- **SELECT:** org_id = auth.jwt()->>'org_id'
- **INSERT:** org_id = auth.jwt()->>'org_id' AND role IN ('admin', 'technical')
- **UPDATE:** org_id = auth.jwt()->>'org_id' AND role IN ('admin', 'technical')
- **DELETE:** org_id = auth.jwt()->>'org_id' AND role = 'admin'

---

## Implementation Status

### ✅ Completed (Backend)
- [x] Database migration (020_create_routings_table.sql)
- [x] Service layer (routing-service.ts)
- [x] Validation schemas (routing-schemas.ts)
- [x] API routes (GET, POST, PUT, DELETE)
- [x] RLS policies
- [x] Unique code constraint
- [x] Status validation
- [x] Role-based access control

### ⏳ Pending (Frontend)
- [ ] Routing list page UI
- [ ] Create routing modal
- [ ] Edit routing drawer
- [ ] Delete confirmation dialog
- [ ] Search and filter components
- [ ] Routing detail page

---

## Testing Checklist

### Unit Tests
- [ ] Routing code validation (format, length)
- [ ] Unique code constraint
- [ ] Status enum validation
- [ ] Reusable flag validation

### Integration Tests
- [ ] Create routing API
- [ ] Update routing API
- [ ] Delete routing API (cascade behavior)
- [ ] List routing with filters
- [ ] RLS policy enforcement

### E2E Tests
- [ ] Create routing flow
- [ ] Edit routing flow
- [ ] Delete routing flow
- [ ] Search and filter routings
- [ ] Duplicate code error handling

---

## Dependencies

### Requires (Epic 1 - Settings)
- ✅ Organizations table
- ✅ Users and roles
- ✅ RLS policies and functions

### Enables
- ✅ Story 2.16: Routing Operations
- ✅ Story 2.17: Routing-Product Assignment
- 🔄 Epic 3: Work Orders (routing selection)
- 🔄 Epic 4: Production (routing tracking)

---

## Notes

- Routing codes are immutable after creation (like product codes)
- Routing status changes don't affect existing work orders
- Non-reusable routings are enforced at application level during product assignment
- Cascade delete: routing → operations + product_routings

**Implementation Reference:**
- Tech Spec: `docs/sprint-artifacts/tech-spec-epic-2-batch-2c-routing.md`
- Migration: `apps/frontend/lib/supabase/migrations/020_create_routings_table.sql`
- Service: `apps/frontend/lib/services/routing-service.ts`
