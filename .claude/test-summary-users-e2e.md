# E2E CRUD Test Suite: Settings/Users Page

**File**: `e2e/tests/settings/users.spec.ts` (533 lines)
**Status**: RED PHASE - All tests should FAIL (no implementation yet)
**Test Count**: 28 tests across 8 test suites
**Generated**: TEST-WRITER Agent

---

## Test Organization

### 1. User List Management (4 tests)
- **displays user list with correct columns** - Verifies table headers (Name, Email, Role, Status, Last Login, Actions)
- **filters users by name/email search** - Tests search input with real-time filtering
- **filters users by role** - Tests role dropdown filter
- **filters users by status** - Tests status dropdown filter

**Selectors Used**:
- Table headers: `page.getByRole('columnheader', { name: 'Name|Email|Role|Status|Last Login|Actions' })`
- Search: `input[placeholder="Search by name or email..."]`
- Role filter: `page.locator('select').nth(0)`
- Status filter: `page.locator('select').nth(1)`

### 2. Create User (4 tests)
- **opens create user modal** - Verifies "Add User" button opens dialog
- **creates user with all required fields** - Tests full form submission with email, first/last name, role
- **validates required fields** - Tests form validation errors
- **displays invitation token after creation** - Verifies invitation success modal

**Selectors Used**:
- Add User button: `page.getByRole('button', { name: /Add User/i })`
- Dialog: `[role="dialog"]`
- Email input: `input[placeholder="user@example.com"]`
- First name: `input[placeholder="John"]`
- Last name: `input[placeholder="Doe"]`
- Role select: `[role="combobox"]` (first)
- Create button: `page.getByRole('button', { name: /Create User|Creating/ })`

### 3. Edit User (6 tests)
- **opens edit drawer for user** - Verifies edit button opens Sheet component
- **updates user first and last name** - Tests name field updates and save
- **changes user role** - Tests role dropdown change
- **changes user status to inactive** - Tests status dropdown change
- **email field is read-only during edit** - Verifies email input is disabled
- **cancel button closes drawer without saving** - Verifies cancel doesn't persist changes

**Selectors Used**:
- Edit button: First button in table row with svg icon
- Sheet/Drawer: `[role="presentation"]`
- Title: `text=Edit User`
- Email (disabled): `input.bg-gray-100[disabled]`
- Role select: `[role="combobox"]` (first)
- Status select: `[role="combobox"]` (second)
- Save button: `page.getByRole('button', { name: /Save Changes/ })`
- Cancel button: `page.getByRole('button', { name: /Cancel/ })`

### 4. Deactivate User (3 tests)
- **shows deactivate button for active users** - Verifies trash icon is visible for active status
- **deactivates user with confirmation** - Tests confirmation dialog and DELETE API call
- **disables deactivate button for inactive users** - Verifies button disabled attribute

**Selectors Used**:
- Trash button: `button` with `svg[class*="text-red"]` (second button in row)
- Confirmation: `page.on('dialog', ...)`
- Disabled state: `.isDisabled()`

### 5. Role Assignment (1 test)
- **assigns all available roles** - Tests changing user role to different values

**Available Roles**: Admin, Manager, Operator, Viewer, Planner, Technical, Purchasing, Warehouse, QC, Finance

### 6. Resend Invitation (2 tests)
- **shows resend button for invited users** - Verifies "Resend" link appears for invited status
- **resends invitation email** - Tests resend button click and success

**Selectors Used**:
- Resend link: `text=Resend` (appears in Status column for invited users)
- Success: `text=/resent|success/i`

### 7. Tabs Navigation (1 test)
- **switches between Users and Invitations tabs** - Tests tab switching functionality

**Selectors Used**:
- Users tab: `page.getByRole('tab', { name: /Users/i })`
- Invitations tab: `page.getByRole('tab', { name: /Invitations/i })`

---

## Key Patterns & Selectors

### Form Interaction
```typescript
// Select role/status dropdowns
const select = page.locator('[role="combobox"]').nth(0); // or nth(1) for status
await select.click();
await page.locator('text=Manager').click();

// Fill text inputs
await page.locator('input[placeholder="user@example.com"]').fill(email);
await page.locator('input[placeholder="John"]').fill(firstName);

// Buttons with partial text match
await page.getByRole('button', { name: /Create User|Creating/ }).click();
```

### State Verification
```typescript
// Modal/Dialog states
await expect(page.locator('[role="dialog"]')).toBeVisible();
await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5000 });

// Success notifications
await expect(page.locator('text=/success|updated|deactivated/i')).toBeVisible({ timeout: 3000 });

// Disabled elements
const isDisabled = await button.isDisabled();
expect(isDisabled).toBe(true);
```

### Async Handling
```typescript
// Wait for network operations
await page.waitForLoadState('networkidle');

// Dialog confirmation
page.on('dialog', async dialog => {
  expect(dialog.type()).toBe('confirm');
  await dialog.accept();
});

// Element presence with timeout
await expect(element).toBeVisible({ timeout: 5000 });
```

---

## Test Data Strategy

### Dynamic User Generation
Tests use timestamps to create unique users:
```
testuser-1705967489123@monopilot.local
deactivate-1705967489234@monopilot.local
resend-1705967489345@monopilot.local
testinv-1705967489456@monopilot.local
```

### Form Defaults
- First name: 'John' (used as placeholder for selection)
- Last name: 'Doe' (used as placeholder for selection)
- Email: Unique per test run
- Role: Default varies (operator, viewer)

### Status Badges
- `active`: Default badge style
- `invited`: Secondary badge style + "Resend" button
- `inactive`: Destructive badge style + Delete disabled

---

## Expected Test Behavior (RED Phase)

### What Should Fail
1. **API Endpoints** - `/api/v1/settings/users`, `/api/settings/users`, etc.
2. **Modal/Drawer Rendering** - Dialog/Sheet components may not mount properly
3. **Form Submissions** - POST/PUT/DELETE operations not implemented
4. **Selectors** - Actual markup may differ from test expectations
5. **Notifications** - Toast/success messages may not appear
6. **Confirmation Dialogs** - Native browser confirm() may not work in E2E

### How to Fix (DEV Phase)
1. Run tests to identify exact failures
2. Implement/verify API endpoints return expected data
3. Ensure UserForm, EditUserDrawer components render correctly
4. Verify form submission handlers work
5. Add toast notifications on success/error
6. Implement browser confirmation dialog handling
7. Update selectors if markup differs

### Success Criteria (GREEN Phase)
- All 28 tests pass
- API endpoints respond correctly
- Form data persists to database
- Notifications display as expected
- UI state updates properly

---

## Testing Patterns

### Authentication
All tests use admin auth context:
```typescript
test.use({ storageState: '.auth/admin.json' });
```

### Navigation
Consistent route structure:
```typescript
const ROUTE = '/settings/users';
await page.goto(ROUTE);
```

### Load Waiting
Proper async handling:
```typescript
await page.waitForLoadState('networkidle'); // After navigation
await page.waitForLoadState('domcontentloaded'); // For drawer/modal
```

### Timeout Handling
Generous timeouts for reliability:
- Network: Default (30s)
- Element visibility: 3000-5000ms
- Modal close: 5000ms

---

## File Structure

```
e2e/
  tests/
    settings/
      users.spec.ts  (533 lines, 28 tests)
        - User List Management (4)
        - Create User (4)
        - Edit User (6)
        - Deactivate User (3)
        - Role Assignment (1)
        - Resend Invitation (2)
        - Tabs Navigation (1)
```

---

## Next Steps

1. **DEV Agent**: Implement API endpoints and verify selectors
2. **QA Agent**: Run full test suite and document failures
3. **SENIOR-DEV**: Refactor selectors if needed, optimize test performance
4. **REVIEWER**: Verify all tests pass with full coverage

---

**Created By**: TEST-WRITER Agent
**Phase**: P1 - RED (All tests should FAIL)
**Metrics**: 28 tests, 533 lines, 1 file
**Status**: Ready for GREEN phase implementation
