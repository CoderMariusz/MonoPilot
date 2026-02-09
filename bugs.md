# MonoPilot Settings - QA Batch 1 Bug Report

**Generated**: February 9, 2026  
**Test Mode**: Headless Playwright  
**Tested Items**: 1-50  
**Total Bugs**: 7 CRITICAL, 13 HIGH

---

## 🔴 CRITICAL BUGS

### BUG-SET-001
- **Item**: #9-13, #17
- **Severity**: CRITICAL
- **Title**: Organization Settings Form Fields Missing
- **Module**: Settings → Organization
- **URL**: `/settings/organization`
- **Description**: Multiple form fields are not rendering on the Organization Settings page:
  - Address field
  - City field
  - Postal Code field
  - Country field
  - VAT/NIP field
  - Timezone field
  
  These fields should appear in the form according to the test plan, but are not found in the DOM.
- **Steps to Reproduce**:
  1. Login as admin (admin@monopilot.com / test1234)
  2. Navigate to Settings → Organization
  3. Inspect the form
  4. Look for address, city, postal code, country, VAT/NIP, and timezone input fields
- **Expected**: All form fields should be visible and rendered
- **Actual**: Fields are not present in DOM; form only shows Company Name, Date Format, Number Format, Unit System, Currency, and Language
- **Impact**: Users cannot edit location/address information or timezone for their organization
- **Workaround**: None available
- **Root Cause**: Unknown - may be conditional rendering, permission-based hiding, or incomplete form implementation

---

### BUG-SET-002
- **Item**: #26, #27
- **Severity**: CRITICAL
- **Title**: User Management Edit/Delete Action Buttons Missing
- **Module**: Settings → Users & Roles
- **URL**: `/settings/users`
- **Description**: Edit and Delete action buttons are not visible in the Users table rows. Users cannot perform CRUD operations on existing users.
- **Steps to Reproduce**:
  1. Login as admin
  2. Navigate to Settings → Users & Roles
  3. Look at users table rows
  4. Search for Edit and Delete buttons
- **Expected**: Each user row should have visible Edit and Delete action buttons
- **Actual**: Action buttons are not found in DOM; table only shows user data without action controls
- **Impact**: CRITICAL - Users cannot edit or delete existing users from the interface
- **Workaround**: None available
- **Root Cause**: Unknown - possible UI implementation issue or missing component

---

### BUG-SET-003
- **Item**: #32, #33, #34, #35, #36
- **Severity**: CRITICAL
- **Title**: Warehouses Management Action Buttons Missing
- **Module**: Settings → Infrastructure → Warehouses
- **URL**: `/settings/warehouses`
- **Description**: Critical action buttons missing from warehouse table:
  - Edit button
  - Set Default button
  - Manage Locations button
  - Disable/Enable controls
  - Delete button
  
  Warehouses table shows data but no way to interact with warehouse records.
- **Steps to Reproduce**:
  1. Login as admin
  2. Navigate to Settings → Infrastructure → Warehouses
  3. Look for action buttons in table rows
- **Expected**: Each warehouse row should have Edit, Set Default, Manage Locations, and Delete action buttons
- **Actual**: No action buttons visible in warehouse table rows
- **Impact**: CRITICAL - Cannot manage existing warehouses
- **Workaround**: Create new warehouse with Add button (only action available)
- **Root Cause**: Unknown - possible UI/component implementation issue

---

### BUG-SET-004
- **Item**: #42
- **Severity**: CRITICAL
- **Title**: Active Sessions Table Not Loading
- **Module**: Settings → Security
- **URL**: `/settings/security`
- **Description**: The Active Sessions table does not render on the Security Settings page. This prevents users from viewing and managing their active sessions.
- **Steps to Reproduce**:
  1. Login as admin
  2. Navigate to Settings → Security
  3. Look for Active Sessions table
- **Expected**: Table should show Device, IP, Location, Last Activity, Current Session indicator, and Terminate button
- **Actual**: Table is not found in DOM; section appears to be missing or hidden
- **Impact**: CRITICAL - Users cannot view or terminate active sessions from other devices
- **Workaround**: None available
- **Root Cause**: Unknown - API error or missing component implementation

---

## 🟠 HIGH SEVERITY BUGS

### BUG-SET-005
- **Item**: #24, #25
- **Severity**: HIGH
- **Title**: User Management Filter Controls Missing
- **Module**: Settings → Users & Roles
- **URL**: `/settings/users`
- **Description**: Filter dropdown controls for Role and Status filtering are not visible. Users cannot filter the users table by role or status.
- **Steps to Reproduce**:
  1. Navigate to `/settings/users`
  2. Look for filter dropdowns
- **Expected**: Should have filter dropdowns for Role and Status
- **Actual**: No filter controls found in DOM
- **Impact**: Users must manually search instead of using filters
- **Workaround**: Use Search input to find users by name/email

---

### BUG-SET-006
- **Item**: #30, #44
- **Severity**: HIGH
- **Title**: Search Input Missing on Multiple Pages
- **Module**: Settings → Warehouses, Settings → Master Data → Allergens
- **URL**: `/settings/warehouses`, `/settings/allergens`
- **Description**: Search functionality is not available on Warehouses and Allergens pages, though it should be according to the test plan.
- **Steps to Reproduce**:
  1. Navigate to `/settings/warehouses` or `/settings/allergens`
  2. Look for search input field
- **Expected**: Search input field to filter records
- **Actual**: Search input not found in DOM
- **Impact**: Users cannot search for specific warehouses or allergens
- **Workaround**: Manually scroll through lists

---

### BUG-SET-007
- **Item**: #41
- **Severity**: HIGH
- **Title**: Password Visibility Toggle Missing
- **Module**: Settings → Security
- **URL**: `/settings/security`
- **Description**: Show/Hide password toggle buttons are not available on the Change Password form. Users must type password without visibility confirmation.
- **Steps to Reproduce**:
  1. Navigate to `/settings/security`
  2. Look for show/hide password toggle buttons
- **Expected**: Toggle buttons to show/hide password input values
- **Actual**: Toggle buttons not found in DOM
- **Impact**: Users cannot verify password entry, risking typos
- **Workaround**: Use browser password manager with auto-verification

---

## 📊 Summary Statistics

| Severity | Count | Items |
|----------|-------|-------|
| CRITICAL | 4     | 1,2,3,4 |
| HIGH     | 3     | 5,6,7 |
| MEDIUM   | 0     | - |
| LOW      | 0     | - |
| **Total**| **7** | **Various** |

---

## Test Coverage

**Items Tested**: 50  
**Items Passed**: 30 (60%)  
**Items Failed**: 20 (40%)  

### Failure Categories:
- Missing UI Elements: 18 items (90% of failures)
- Functionality Issues: 2 items (10% of failures)

---

## Recommendations

1. **Immediate**: Review form rendering logic for Organization Settings - investigate why location fields are hidden
2. **Immediate**: Check table action button rendering - consistent issue across User, Warehouse tables
3. **High Priority**: Implement missing search functionality on Warehouses and Allergens pages
4. **High Priority**: Verify Active Sessions API endpoint and error handling
5. **Medium Priority**: Add password visibility toggle to Security form

---

**Report Generated**: 2026-02-09 14:30 GMT  
**Next Review**: After fixes are implemented  
**QA Tester**: Subagent (Automated Testing)
