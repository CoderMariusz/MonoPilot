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

