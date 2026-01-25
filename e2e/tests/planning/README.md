# Purchase Orders E2E Tests

## Overview

Comprehensive E2E test suite for the Purchase Orders module (Epic 3) of MonoPilot.

**Test File**: `purchase-orders.spec.ts`
**Total Tests**: 75 test cases
**Coverage Areas**:
- List View & Navigation (10 tests)
- Create PO (15 tests)
- Edit PO (15 tests)
- PO Approval Workflow (15 tests)
- Bulk Operations (10 tests)
- Delete & Duplicate (10 tests)

## Stories Covered

- **Story 03.1**: Supplier Setup
- **Story 03.3**: PO CRUD + Lines
- **Story 03.4**: PO Approval Workflow
- **Story 03.6**: PO Bulk Operations (status updates, import/export)

## Test Categories

### 1. List View & Navigation (TC-PO-001 to TC-PO-010)

Tests for the main purchase orders list view:
- Page header and description display
- Table columns and data display
- Create PO button visibility
- Search by PO number
- Filter by status
- Empty state display
- KPI cards display
- Pagination
- Row actions menu
- Filter controls

**Key Features Tested**:
- Navigation to purchase orders page
- List data loading and display
- Search functionality
- Status filtering
- Pagination controls
- Row-level actions

### 2. Create PO (TC-PO-011 to TC-PO-025)

Tests for creating new purchase orders:
- Navigate to create PO page
- Form field display
- Supplier selection requirement
- Fill form with minimal data
- Expected delivery date input
- Payment terms selection
- Notes/comments
- Add PO lines
- Multiple lines
- Discount application
- Totals calculation
- Currency inheritance from supplier
- Save as draft
- Form validation

**Key Features Tested**:
- Form rendering
- Field population
- Line item management
- Calculation accuracy
- Data persistence
- Validation rules

### 3. Edit PO (TC-PO-026 to TC-PO-040)

Tests for editing existing purchase orders:
- Navigate to edit page
- Display current data
- Update supplier
- Update delivery date
- Update notes
- Edit PO line product
- Edit line quantity
- Edit unit price
- Delete PO line
- Add line to existing PO
- Save changes
- Cannot edit approved PO
- Discard changes on cancel
- Reload data when switching POs
- Edit button visibility

**Key Features Tested**:
- Data loading for edit
- Form pre-population
- Line item editing
- Field updates
- Save/cancel workflows
- Permission checks (cannot edit approved)

### 4. PO Approval Workflow (TC-PO-041 to TC-PO-055)

Tests for PO approval process:
- PO approval status field
- Approve button visibility for pending POs
- Navigate to approval dialog
- Approval form fields
- Add approval notes
- Approve PO
- Reject PO with reason
- Approval cannot be given twice
- Approval history visibility
- Approval timeline display
- Approval date display
- Rejection reason display
- Resubmit rejected PO
- Approved by user display
- Cannot delete approved PO

**Key Features Tested**:
- Approval workflow states
- Dialog interactions
- Status transitions
- Audit trail display
- Rejection handling
- Re-submission capability

### 5. Bulk Operations (TC-PO-056 to TC-PO-065)

Tests for bulk operations on multiple POs:
- Select multiple POs
- Select all button
- Bulk export
- Bulk status update
- Deselect individual PO
- Clear selection
- Bulk delete with confirmation
- Export selected POs to Excel
- Export respects filters
- Bulk actions disabled without selection

**Key Features Tested**:
- Multi-select functionality
- Bulk action bar
- Export functionality
- Selection management
- Confirmation dialogs
- Filter persistence

### 6. Delete & Duplicate (TC-PO-066 to TC-PO-075)

Tests for deleting and duplicating POs:
- Delete button visibility
- Delete shows confirmation dialog
- Cancel delete operation
- Delete confirmation shows PO number
- Cannot delete approved PO
- Duplicate button visibility
- Duplicate creates copy of PO
- Duplicated PO has new PO number
- Duplicated PO copies supplier and warehouse
- Duplicated PO can be saved independently

**Key Features Tested**:
- Delete workflow
- Confirmation dialogs
- Duplication logic
- Data cloning
- Permission checks

## Execution

### Run all PO tests
```bash
pnpm test:e2e planning/purchase-orders
```

### Run tests in UI mode
```bash
pnpm test:e2e:ui planning/purchase-orders
```

### Run tests in headed mode (with browser visible)
```bash
pnpm test:e2e:headed planning/purchase-orders
```

### Run specific test
```bash
pnpm test:e2e -- -g "TC-PO-001"
```

### Generate HTML report
```bash
pnpm test:e2e planning/purchase-orders
pnpm test:e2e:report
```

## Test Architecture

### Page Object Pattern

The test suite uses a Page Object Model (POM) with the `PurchaseOrdersPage` class that encapsulates:
- Navigation methods
- Element selectors
- User interactions
- Assertion helpers

**Key Methods**:
- `goto()` - Navigate to PO list
- `expectPageHeader()` - Assert header visible
- `fillPOForm()` - Fill form fields
- `addPOLine()` - Add line items
- `savePO()` - Save PO
- `clickApproveButton()` - Approve PO
- `selectRow()` - Select row for bulk operations

### Selectors Used

- **ShadCN Select**: Handles Radix UI dropdowns
- **Test IDs**: Uses standard Playwright locators (role, label, placeholder)
- **Role-based**: Uses accessibility roles (button, dialog, option)
- **Text matching**: Uses regex for fuzzy matching

### Error Handling

Tests include comprehensive error handling:
- Try-catch blocks for optional features
- Graceful skip on missing prerequisites
- Timeout management
- Dialog cleanup in afterEach

## Test Data

Tests use dynamic data generation:
- Unique PO numbers from existing data
- Current date for delivery date calculations
- Fake suppliers/warehouses (existing data)
- Unique notes with timestamps

## Coverage

### Features Covered
- Complete CRUD operations (Create, Read, Update, Delete)
- Approval workflow with multi-state handling
- Bulk operations (select, export, delete, update)
- Line item management
- Form validation
- Permission checks (approved POs)
- Discount calculations
- Status filtering and search

### Edge Cases
- Empty states
- Multiple selection
- Approval constraints
- Delete prevention for approved POs
- Edit prevention for approved POs
- Duplicate with new PO numbers

## Dependencies

- Playwright Test (1.49.0+)
- BasePage (common test utilities)
- DataTablePage (table interaction helpers)

## Future Enhancements

1. **Import Wizard Tests**: Separate test file for import functionality
2. **Performance Tests**: Load time for large PO lists
3. **Mobile Tests**: Responsive design testing
4. **Accessibility Tests**: WCAG compliance
5. **Visual Regression**: Screenshot comparisons
6. **Multi-user Tests**: Concurrent approval workflows

## Known Limitations

1. **Approval Dialog**: Tests skip if POs not in pending approval state
2. **KPI Cards**: May be optional feature, tests handle gracefully
3. **Warehouses API**: Returns 404 in some environments
4. **Selectors**: Uses loose matching for flexibility with UI changes

## Troubleshooting

### Tests Timing Out
- Increase playwright timeout in `playwright.config.ts`
- Check if backend is running (`pnpm dev`)
- Verify auth state files exist (`.auth/admin.json`)

### Element Not Found
- Check if selectors match current UI (using `--debug` flag)
- Verify test data exists (suppliers, warehouses)
- Run single test in headed mode to inspect

### Flaky Tests
- Add longer waits for async operations
- Use `page.waitForLoadState()` explicitly
- Check for overlapping dialogs/modals

## Maintenance

### Updating Tests
When UI components change:
1. Update selectors in PurchaseOrdersPage class
2. Update form field names/labels
3. Add/remove tests for new features
4. Update README with new test names

### Adding New Tests
1. Follow naming convention: `TC-PO-XXX`
2. Use describe blocks for grouping
3. Add comments for complex operations
4. Include error handling with try-catch

## Related Files

- `/e2e/pages/BasePage.ts` - Base page object utilities
- `/e2e/pages/DataTablePage.ts` - Table interaction helpers
- `/playwright.config.ts` - Playwright configuration
- `/e2e/global-setup.ts` - Authentication setup

---

**Last Updated**: 2026-01-25
**Status**: Ready for testing
**Author**: Claude Code E2E Test Engineer
