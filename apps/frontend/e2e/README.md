# E2E Testing with Playwright

This directory contains end-to-end tests for the MonoPilot application using Playwright.

## Test Structure

```
e2e/
├── utils/           # Test utilities and helpers
├── fixtures/        # Test data fixtures
├── auth/            # Authentication tests
├── bom/             # BOM module tests
├── planning/        # Planning module tests
├── production/      # Production module tests
├── warehouse/       # Warehouse module tests
├── scanner/         # Scanner module tests
├── settings/        # Settings module tests
├── admin/           # Admin module tests
├── integration/     # Cross-module integration tests
├── components/      # UI component tests
├── error-handling/  # Error handling tests
├── performance/     # Performance tests
└── accessibility/   # Accessibility tests
```

## Running Tests

### Local Development

```bash
# Install Playwright browsers
pnpm playwright:install

# Run all E2E tests
pnpm test:e2e

# Run tests with UI mode
pnpm test:e2e:ui

# Run tests in headed mode
pnpm test:e2e:headed

# Run tests in debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e --grep "BOM - Create MEAT Product"

# Run tests for specific module
pnpm test:e2e --grep "BOM"
```

### CI/CD

Tests run automatically on:
- Push to main/develop branches
- Pull requests to main/develop branches

## Test Utilities

### TestHelpers

Core utility class with methods for:
- Authentication (`login`, `logout`)
- Navigation (`navigateToBOM`, `navigateToPlanning`, etc.)
- Form interactions (`fillFormField`, `selectDropdownOption`)
- Assertions (`verifyToast`, `verifyTableContainsRow`)
- UI interactions (`clickButton`, `waitForLoadingComplete`)

### NavigationHelpers

Navigation-specific utilities for:
- Module navigation
- Tab switching
- Breadcrumb verification
- User menu interactions

### DataHelpers

Data management utilities for:
- Creating test data
- Cleaning up test data
- Generating unique IDs
- Data validation

### AssertionHelpers

Assertion utilities for:
- Field validation
- Table operations
- Modal interactions
- Error handling

### CleanupHelpers

Cleanup utilities for:
- Removing test data
- Cleaning up by prefix
- Handling cascading deletes

## Test Data

Test fixtures are located in `fixtures/test-data.ts` and include:
- Test users with different roles
- Test products for different categories
- Test work orders, purchase orders, transfer orders
- Test suppliers, warehouses, locations
- Test system settings and configurations

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { testUsers } from '../fixtures/test-data';

test.describe('Module - Feature', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.login(testUsers.admin.email, testUsers.admin.password);
  });

  test.afterEach(async () => {
    // Cleanup test data
  });

  test('should perform specific action', async ({ page }) => {
    // Test implementation
  });
});
```

### Best Practices

1. **Use TestHelpers**: Leverage the utility methods for common operations
2. **Clean up data**: Always clean up test data in `afterEach` hooks
3. **Use fixtures**: Use test data from fixtures for consistency
4. **Test error cases**: Include tests for validation errors and network failures
5. **Test loading states**: Verify loading states and user feedback
6. **Test accessibility**: Include keyboard navigation and screen reader tests

### Common Patterns

#### Creating Test Data
```typescript
const testProduct = await helpers.createTestProduct({
  partNumber: `TEST-${Date.now()}`,
  description: 'Test Product',
  category: 'DRYGOODS'
});
```

#### Verifying Success
```typescript
await helpers.verifyToast('Product created successfully');
await expect(page.locator(`tr:has-text("${testProduct.partNumber}")`)).toBeVisible();
```

#### Testing Error Cases
```typescript
await page.route('**/api/products/**', route => route.abort());
await page.click('button:has-text("Save")');
await helpers.verifyToast('Network error');
```

## Test Categories

### Authentication Tests
- Login/logout flows
- Signup process
- Session management
- Role-based access control

### Module Tests
- BOM: Product creation, editing, deletion, BOM components
- Planning: Work orders, purchase orders, transfer orders
- Production: Yield reports, consumption, operations, traceability
- Warehouse: GRN, stock moves, license plate operations
- Scanner: Pack/process terminals, material staging
- Settings: Locations, machines, suppliers, warehouses
- Admin: User management, sessions, system settings

### Integration Tests
- Cross-module workflows
- End-to-end production flows
- Data consistency across modules

### Component Tests
- Modal behaviors
- Table operations
- Form validations
- Navigation

### Error Handling Tests
- API errors
- Validation errors
- Permission errors
- Network failures

### Performance Tests
- Load times
- Search performance
- Large dataset handling

### Accessibility Tests
- Keyboard navigation
- Screen reader support
- ARIA labels

## Troubleshooting

### Common Issues

1. **Test timeouts**: Increase timeout in test configuration
2. **Element not found**: Use proper selectors and wait strategies
3. **Data conflicts**: Use unique test data and proper cleanup
4. **Network issues**: Mock API responses for consistent testing

### Debug Mode

Use `pnpm test:e2e:debug` to run tests in debug mode with:
- Step-by-step execution
- Element inspection
- Network monitoring
- Console logs

### Test Reports

After running tests, view the HTML report:
```bash
pnpm playwright show-report
```

## CI/CD Integration

Tests run automatically in GitHub Actions with:
- Automatic browser installation
- Test result artifacts
- Failure notifications
- Performance monitoring

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Use descriptive test names
3. Include both positive and negative test cases
4. Add proper cleanup
5. Update documentation as needed
