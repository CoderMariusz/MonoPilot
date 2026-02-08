# Dashboard Module - Phase 2 Test Bugs

## Bug-001 | 🟠 HIGH - Create Menu Items Navigate to List Pages Instead of Create Pages

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
