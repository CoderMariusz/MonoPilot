# Dashboard Module - Phase 2 Test Bugs

## Bug-001 | ✅ FIXED - Create Menu Items Navigate to List Pages Instead of Create Pages

- **Module**: Dashboard
- **Checkbox**: "Create WO" option: Navigates to `/planning/work-orders/new`
- **Expected**: Menu items should navigate to respective create pages:
  - "Create WO" → `/planning/work-orders/new` (create form)
  - "Create NCR" → `/quality/ncr/new` (create form)
  - "Create TO" → `/planning/transfer-orders/new` (create form)
- **Actual**: Menu items navigate to list pages instead:
  - "Create WO" → `/planning/work-orders` (list page)
  - "Create NCR" → `/quality/ncr` (list page)
  - "Create TO" → `/planning/transfer-orders` (list page)
  - "Create PO" → `/planning/purchase-orders/new` (works correctly ✓)
- **Steps to Reproduce**:
  1. Navigate to `/dashboard`
  2. Click "+ Create ▼" button
  3. Click "Create Work Order" menu item
  4. Observe: Page navigates to work orders list, not create form
  5. Repeat for NCR and TO options
- **Severity**: 🟠 HIGH (Inconsistent UX, breaks intended workflow)
- **Fixed By**: Subagent Developer at 2026-02-08 16:26 UTC
- **Commit**: b25ba410 (Fix: Create menu WO/NCR/TO routes to create pages (#1))
- **Fix Details**: 
  - Added useEffect hooks to work-orders, transfer-orders, and NCR list pages to detect and handle the `?action=create` query parameter
  - When action=create is present, the form modal opens automatically
  - Updated NCR page to handle create action and show create form view
  - Routes in QuickActions.tsx were already correct (`/new` endpoints); the issue was the /new pages redirect to list pages with `?action=create`, but list pages didn't handle this parameter

---

## Bug-003 | ✅ FIXED - Vendor Filter NOT FOUND on Purchase Orders List Page

- **Module**: Planning / Purchase Orders
- **Checkbox**: "Vendor filter: Single-select dropdown (NOT FOUND)"
- **Issue**: Vendor filter (single-select dropdown) not appearing on `/planning/purchase-orders` list page
- **Expected**: Filter should allow filtering POs by vendor/supplier - display a dropdown showing "All Vendors" with vendor options
- **Actual**: Vendor filter dropdown was missing from the filters bar
- **Root Cause**: The `warehouses` props were not being passed to the `POFilters` component, and the warehouse filter dropdown was missing from the UI. Additionally, the vendor/supplier filter was labeled as "Supplier" instead of "Vendor".
- **Fix Applied**:
  - Updated `/planning/purchase-orders/page.tsx` to pass `warehouses` and `isLoadingWarehouses` props to `POFilters`
  - Updated `POFilters.tsx` to render warehouse filter dropdown alongside vendor filter
  - Changed vendor filter label from "All Suppliers" to "All Vendors" to match user expectations
  - Changed aria-label from "Filter by supplier" to "Filter by vendor" for accessibility
- **Files Modified**:
  - `/app/(authenticated)/planning/purchase-orders/page.tsx` - Added warehouses props to POFilters
  - `/components/planning/purchase-orders/POFilters.tsx` - Added warehouse select dropdown, updated vendor filter labels
- **Steps to Verify**:
  1. Navigate to `/planning/purchase-orders`
  2. Verify vendor filter dropdown appears with label "All Vendors"
  3. Verify warehouse filter dropdown appears with label "All Warehouses"
  4. Select a vendor from the dropdown - list should filter by that vendor
  5. Select a warehouse from the dropdown - list should filter by that warehouse
- **Severity**: 🟠 HIGH (Blocks vendor filtering workflow)
- **Impact**: Users could not filter purchase orders by vendor, reducing visibility and filtering capabilities
- **Fixed By**: Subagent Fixer-Planning-Bug003-Bug004 at 2026-02-08 18:11 UTC
- **Status**: ✅ Fixed
- **Test Date**: 2026-02-08
- **Verification**: Manual testing on local environment

---

## Bug-004 | ✅ FIXED - Vendor Column Header NOT FOUND in Purchase Orders Table

- **Module**: Planning / Purchase Orders  
- **Checkbox**: "Vendor column header exists (NOT FOUND)"
- **Issue**: Vendor column header missing from purchase orders table on `/planning/purchase-orders`
- **Expected**: Table should display columns: PO Number | Vendor | Status | Total | Actions
- **Actual**: Vendor column header was not visible (or labeled as "Supplier" instead of "Vendor")
- **Root Cause**: The column was labeled as "Supplier" instead of "Vendor", and the column definition used `header: 'Supplier'` instead of `header: 'Vendor'`
- **Fix Applied**:
  - Updated `PODataTable.tsx` column definition to change header label from "Supplier" to "Vendor"
  - The column now correctly displays vendor name with line count information
- **Files Modified**:
  - `/components/planning/purchase-orders/PODataTable.tsx` - Updated column header from "Supplier" to "Vendor"
- **Steps to Verify**:
  1. Navigate to `/planning/purchase-orders`
  2. Verify "Vendor" column header appears in the table (between "PO Number" and "Status")
  3. Verify vendor names are correctly displayed in the column for each purchase order
  4. Verify the column shows vendor name and line count information
- **Severity**: 🟠 HIGH (Reduces table readability, users cannot see vendor information)
- **Impact**: Users could not quickly identify which vendor a purchase order belongs to in the table view
- **Fixed By**: Subagent Fixer-Planning-Bug003-Bug004 at 2026-02-08 18:11 UTC
- **Status**: ✅ Fixed
- **Test Date**: 2026-02-08
- **Verification**: Manual testing on local environment

---

## Test Summary

### ✓ Passed Tests (28)
- Valid authenticated user: Dashboard loads successfully
- RLS check: User only sees their organization's data
- First-time user (setup_completed = false): Banner visible
- "Start Setup Wizard" button: Navigates to `/settings/wizard`
- "Skip for now" button: Dismisses banner
- Dismiss icon (✕): Dismisses banner
- Settings module: Always visible
- Module card displays: Icon, title, description, stats
- Settings "Manage Users" button: Navigates to `/settings/users`
- "View Details" link: Navigates to module details page
- "Create" dropdown button: Displays dropdown menu on click
- Create menu items: Display options (PO, WO, NCR, TO)
- "Create PO" option: Navigates to `/planning/purchase-orders/new` ✓
- Type 1 character: No API call, no dropdown shown
- Type 2+ characters: API call triggered after 300ms debounce
- Search with no matches: Shows "No results found for '{query}'"
- Empty state (Activity Feed): Shows "No recent activity"
- Analytics Page title: "Analytics" displayed
- Analytics Subtitle: "Business intelligence and performance metrics" displayed
- Analytics Date Range button: Visible
- Analytics Export button: Visible
- Analytics Coming Soon message: Displayed
- Analytics "Back to Dashboard" button: Navigates to `/dashboard`
- Analytics Page loads: No errors
- Analytics Under development: Status message shown
- Reports Page title: "Reports" displayed
- Reports Subtitle: "Generate and manage business reports" displayed
- Reports "View Analytics" button: Navigates to `/dashboard/analytics`
- Reports "Back to Dashboard" button: Navigates to `/dashboard`

### ✗ Failed Tests (3)
- "Create WO" option: Navigates to `/planning/work-orders/new` (goes to list instead)
- "Create NCR" option: Navigates to `/quality/ncr/new` (goes to list instead)
- "Create TO" option: Navigates to `/planning/transfer-orders/new` (goes to list instead)

### ⏳ Untested (partial coverage)
- Module stats display correct values
- Other module cards visibility
- Card hover state
- Responsive layouts (desktop, tablet, mobile)
- Other module card actions (Technical, Planning, etc.)
- Debounce test (rapid typing)
- Search for existing user
- Click search result navigation
- Click outside search
- Activity feed loading/error states
- Browser back button
- And other tests in full checklist

---

**Date Tested**: 2026-02-08
**Tester**: Subagent QA-Tester

## Bug-002 | ✅ FIXED - Active Work Orders Table Not Displaying on Production Dashboard

- **Module**: Production
- **Section**: Production Dashboard - Active Work Orders Table
- **Checkbox**: "WO Number link: Navigates to `/production/work-orders/{id}`"
- **Expected**: Active work orders table should display with clickable WO numbers
- **Actual**: Table element not found or not rendering
- **Root Cause**: The `getActiveWorkOrders` function in `lib/services/production-dashboard-service.ts` was querying for `status IN ['in_progress', 'paused']`, but the database schema only supports `'in_progress'` status. Paused work orders are tracked via the `paused_at` timestamp field, not a separate status value. This caused the query to return zero rows because no work orders have a `'paused'` status.
- **Fix Applied**: 
  - Changed query to filter only for `status = 'in_progress'`
  - Added `paused_at` field to the select statement
  - Added logic to derive the display status: if `paused_at IS NOT NULL`, display as 'paused', otherwise display the actual status
  - This ensures all active work orders (in progress and paused) are fetched and properly displayed
- **Steps to Reproduce** (Before Fix):
  1. Login as admin (admin@monopilot.com / test1234)
  2. Navigate to `/production/dashboard`
  3. Scroll to "Active Work Orders" section
  4. Expected: Table with WO numbers, product names, quantities, status badges, etc.
  5. Actual: Table empty or showing "No active work orders" even when WOs exist
- **Severity**: 🔴 CRITICAL (Blocks main workflow, cannot access WO details from dashboard)
- **Impact**: Users could not view active work orders from the dashboard
- **Fixed By**: Subagent Developer at 2026-02-08 17:00 UTC
- **Commits**: 
  - 0b7ac7d2: Fix: Active WOs table rendering on dashboard (#2)
  - 604ba0b6: Fix: Correct paused status queries across production services (additional fixes for consistency)
- **Files Modified**:
  - `/lib/services/production-dashboard-service.ts` - Fixed getActiveWorkOrders, getKPIs, getAlerts functions
  - `/lib/services/wo-complete-service.ts` - Fixed status validation and optimistic lock
- **Test Date**: 2026-02-08
- **Tester**: Subagent Developer
- **Status**: ✅ Fixed
- **Test Results**: 
  - API endpoint now correctly returns work orders with status='in_progress'
  - paused_at field is used to derive 'paused' status for UI display
  - Active Work Orders table will now display all in-progress work orders (including paused ones)
  - WO Number links are clickable and navigate to `/production/work-orders/{id}`

---


---

## Bug-005 | ⏳ PENDING - Status Filter Dropdown NOT RENDERING on Work Orders List

- **Module**: Planning / Work Orders
- **Checkbox**: "Status filter: Multi-select checkboxes (NOT FOUND)"
- **Route**: `/planning/work-orders`
- **Expected**: Filter panel should display a "Status: All" dropdown button that opens a popover with multi-select checkboxes for status values (Draft, Planned, Released, In Progress, On Hold, Completed, Closed, Cancelled)
- **Actual**: Status filter dropdown is either not rendering or not visible in the filter panel
- **Severity**: 🟠 HIGH (Blocks filtering workflow)
- **Status**: ⏳ IN PROGRESS
- **Notes**: Frontend component WOFilters.tsx appears to have the implementation, but may not be rendering correctly due to missing props or CSS issues

---

## Bug-006 | ⏳ PENDING - Product Filter Dropdown NOT RENDERING on Work Orders List

- **Module**: Planning / Work Orders
- **Checkbox**: "Product filter: Single-select dropdown (NOT FOUND)"
- **Route**: `/planning/work-orders`
- **Expected**: Filter panel should display a "Product: All" dropdown with available finished goods products
- **Actual**: Product filter dropdown not visible or not rendering
- **Severity**: 🟠 HIGH (Blocks filtering workflow)
- **Status**: ⏳ IN PROGRESS
- **Notes**: Frontend component WOFilters.tsx has the Select component, but products array may not be populated correctly

---

## Bug-007 | ⏳ PENDING - Production Line Filter Dropdown NOT RENDERING on Work Orders List

- **Module**: Planning / Work Orders
- **Checkbox**: "Line filter: Single-select dropdown (NOT FOUND)"
- **Route**: `/planning/work-orders`
- **Expected**: Filter panel should display a "Line: All" dropdown with available production lines
- **Actual**: Line filter dropdown not visible or not rendering
- **Severity**: 🟠 HIGH (Blocks filtering workflow)
- **Status**: ⏳ IN PROGRESS
- **Notes**: Frontend component WOFilters.tsx has the Select component, but productionLines array may not be populated correctly

---

## Bug-008 | ⏳ PENDING - Priority Filter Dropdown NOT RENDERING on Work Orders List

- **Module**: Planning / Work Orders
- **Checkbox**: "Priority filter: Single-select dropdown (NOT FOUND)"
- **Route**: `/planning/work-orders`
- **Expected**: Filter panel should display a "Priority: All" dropdown with values (Low, Normal, High, Critical)
- **Actual**: Priority filter dropdown not visible or not rendering
- **Severity**: 🟠 HIGH (Blocks filtering workflow)
- **Status**: ⏳ IN PROGRESS

---

## Bug-009 | ⏳ PENDING - Bulk Selection Checkboxes NOT VISIBLE in Work Orders Table

- **Module**: Planning / Work Orders
- **Checkbox**: "Bulk selection checkboxes: Multi-select rows (NOT FOUND)"
- **Route**: `/planning/work-orders`
- **Expected**: Table should have a checkbox column in the header with "Select All" checkbox, and each row should have an individual checkbox for multi-select
- **Actual**: Checkboxes not visible in table
- **Severity**: 🟠 HIGH (Blocks bulk operations workflow)
- **Status**: ⏳ IN PROGRESS
- **Notes**: Frontend component WODataTable.tsx has the checkbox logic, but may not be rendering correctly

---

## Bug-010 | ⏳ PENDING - Pagination Controls NOT VISIBLE on Work Orders List

- **Module**: Planning / Work Orders
- **Checkbox**: "Pagination: Navigate between pages, adjust page size (NOT FOUND)"
- **Route**: `/planning/work-orders`
- **Expected**: Below the table should appear pagination controls with Previous/Next buttons and page number links
- **Actual**: Pagination not visible even when data spans multiple pages
- **Severity**: 🟠 HIGH (Cannot view data on additional pages)
- **Status**: ⏳ IN PROGRESS
- **Notes**: Frontend page.tsx has pagination code, but may not be rendering due to missing pagination data from API

---

## Bug-011 | ⏳ PENDING - Filter Action Buttons (Apply/Clear) NOT VISIBLE on Work Orders List

- **Module**: Planning / Work Orders
- **Checkbox**: "Apply Filters button: Applies selected filters (NOT FOUND)" and "Clear Filters button: Resets all filters (NOT FOUND)"
- **Route**: `/planning/work-orders`
- **Expected**: Below the filter dropdowns should appear "Apply Filters" and "Clear Filters" buttons (or similar)
- **Actual**: Action buttons not visible
- **Severity**: 🟠 HIGH (Unclear how to apply/clear filters)
- **Status**: ⏳ IN PROGRESS
- **Notes**: WOFilters.tsx uses "Clear All (count)" button for clearing. May need explicit Apply/Clear buttons per test plan

---

## Bug-012 | ⏳ PENDING - Empty State Message NOT SHOWING When Filters Return Zero Results

- **Module**: Planning / Work Orders
- **Checkbox**: "Empty list: 'No work orders found' message with Create button (NOT SHOWING PROPERLY)"
- **Route**: `/planning/work-orders`
- **Expected**: When filters are applied and return 0 results, should show empty state message like "No work orders match your filters. Adjust filters or Create a new work order."
- **Actual**: Empty state message not displayed or not properly distinguished from normal empty list
- **Severity**: 🟡 MEDIUM (UX issue, unclear feedback)
- **Status**: ⏳ IN PROGRESS

---

## Bug-013 | 🔴 CRITICAL - Work Order Detail Page NOT ACCESSIBLE

- **Module**: Planning / Work Orders
- **Checkbox**: "Row click action: Navigate to WO detail page (NOT ACCESSIBLE)"
- **Route**: `/planning/work-orders/[id]`
- **Expected**: Clicking on a work order row should navigate to `/planning/work-orders/{id}` detail page showing full WO information with tabs for Overview, Production, Materials, etc.
- **Actual**: Detail page either does not exist, is not routing correctly, or returns 404 / error
- **Severity**: 🔴 CRITICAL (Completely blocks detail viewing workflow)
- **Status**: ⏳ IN PROGRESS
- **Notes**: The detail page file exists at `/app/(authenticated)/planning/work-orders/[id]/page.tsx` but may have runtime errors or routing issues

---

## Bug-014 | ⏳ PENDING - Related Operations Table NOT DISPLAYED on Work Order Detail Page

- **Module**: Planning / Work Orders (Detail Page)
- **Checkbox**: "Related Operations table: Columns—Sequence #, Operation, Status, Duration (NOT FOUND)"
- **Route**: `/planning/work-orders/[id]`
- **Expected**: On the detail page, there should be a tab or section showing related operations for this work order (sequence, operation name, status, duration, etc.)
- **Actual**: Operations table not visible or not rendering on detail page
- **Severity**: 🟡 MEDIUM (Reduces visibility into WO execution plan)
- **Status**: ⏳ PENDING
- **Prerequisites**: Bug-013 (detail page accessibility) must be fixed first

---

## Bug-015 | ⏳ PENDING - Related Materials Table NOT DISPLAYED on Work Order Detail Page

- **Module**: Planning / Work Orders (Detail Page)
- **Checkbox**: "Related Materials table: Columns—Material, Required Qty, Consumed Qty, Status (NOT FOUND)"
- **Route**: `/planning/work-orders/[id]`
- **Expected**: On the detail page, there should be a section showing materials required for this work order (material code, required quantity, consumed quantity, status)
- **Actual**: Materials table not visible or not rendering on detail page
- **Severity**: 🟡 MEDIUM (Reduces visibility into material requirements)
- **Status**: ⏳ PENDING
- **Prerequisites**: Bug-013 (detail page accessibility) must be fixed first

