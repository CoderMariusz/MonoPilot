import { test, expect } from '@playwright/test';

test.describe('PO Approval Workflow - E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login as planner
    await page.goto('/login');
    await page.fill('input[name="email"]', 'planner@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL('/dashboard');
  });

  test('E2E-01: Full approval workflow (submit -> approve -> confirm)', async ({ page, context }) => {
    // Test case: E2E test - AC-01 to AC-05
    // Story: 03.5b - Full critical path

    // 1. Create PO with total above threshold
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Mill Co.');
    await page.fill('input[name="warehouse"]', 'Main Warehouse');
    await page.fill('input[name="expected_delivery"]', '2024-12-20');

    // Add line items
    await page.click('button:has-text("Add Line")');
    await page.fill('input[name="product"]', 'Flour Type A');
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="unit_price"]', '30'); // Total: 15,000 (above threshold)
    await page.click('button:has-text("Save")');

    const poUrl = page.url();
    const poNumber = await page.textContent('[data-testid="po-number"]');

    // 2. Submit PO for approval
    await page.click('button:has-text("Submit for Approval")');
    await expect(page.locator('text=submitted for approval')).toBeVisible();

    // 3. Verify status is pending_approval
    const statusBadge = page.locator('[data-testid="po-status"]');
    await expect(statusBadge).toContainText('Pending Approval');

    // 4. Log in as manager
    const managerContext = await context.newPage();
    await managerContext.goto('/login');
    await managerContext.fill('input[name="email"]', 'manager@company.com');
    await managerContext.fill('input[name="password"]', 'password123');
    await managerContext.click('button:has-text("Sign In")');
    await managerContext.waitForURL('/dashboard');

    // 5. Navigate to PO for review
    await managerContext.goto(poUrl);

    // 6. Open approval modal
    await managerContext.click('button:has-text("Approve")');
    await expect(managerContext.locator('[role="dialog"]')).toBeVisible();

    // 7. Approve PO with notes
    const notesField = managerContext.locator('textarea[name="notes"]');
    await notesField.fill('Approved for Q4 stock replenishment. Good pricing.');
    await managerContext.click('button:has-text("Approve PO")');

    // 8. Verify approval success
    await expect(managerContext.locator('text=approved successfully')).toBeVisible();

    // 9. Log back in as planner
    await page.reload();

    // 10. Verify status is now approved
    await expect(page.locator('[data-testid="po-status"]')).toContainText('Approved');

    // 11. Confirm PO
    await page.click('button:has-text("Confirm")');

    // 12. Verify status is confirmed
    await expect(page.locator('[data-testid="po-status"]')).toContainText('Confirmed');

    // Cleanup
    await managerContext.close();
  });

  test('E2E-02: Rejection workflow (submit -> reject -> edit -> resubmit)', async ({ page }) => {
    // Test case: E2E test - Rejection workflow
    // Story: 03.5b - Rejection and re-submission

    // 1. Create and submit PO
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Sugar Inc.');
    await page.fill('input[name="quantity"]', '1000');
    await page.fill('input[name="unit_price"]', '2');
    await page.click('button:has-text("Save")');

    const poUrl = page.url();

    // 2. Submit for approval
    await page.click('button:has-text("Submit for Approval")');
    await expect(page.locator('text=submitted for approval')).toBeVisible();

    // 3. Have manager reject it (in new context)
    const managerPage = await page.context().newPage();
    await managerPage.goto('/login');
    await managerPage.fill('input[name="email"]', 'manager@company.com');
    await managerPage.fill('input[name="password"]', 'password123');
    await managerPage.click('button:has-text("Sign In")');
    await managerPage.waitForURL('/dashboard');

    await managerPage.goto(poUrl);
    await managerPage.click('button:has-text("Reject")');

    // 4. Fill rejection reason
    const reasonField = managerPage.locator('textarea[name="rejection_reason"]');
    await reasonField.fill('Quantity too high for current inventory capacity. Please reduce to 500kg.');
    await managerPage.click('button:has-text("Reject PO")');

    // 5. Verify rejection success
    await expect(managerPage.locator('text=rejected')).toBeVisible();

    // 6. Back in planner context, verify rejection
    await page.reload();
    await expect(page.locator('[data-testid="po-status"]')).toContainText('Rejected');

    // 7. Edit PO
    await page.click('button:has-text("Edit")');
    const quantityField = page.locator('input[name="quantity"]');
    await quantityField.fill('500'); // Reduce quantity
    await page.click('button:has-text("Save")');

    // 8. Resubmit for approval
    await page.click('button:has-text("Submit for Approval")');
    await expect(page.locator('text=submitted for approval')).toBeVisible();

    // 9. Verify new pending_approval status
    await expect(page.locator('[data-testid="po-status"]')).toContainText('Pending Approval');

    // Cleanup
    await managerPage.close();
  });

  test('E2E-03: Below threshold - direct submit without approval', async ({ page }) => {
    // Test case: E2E test - AC-01
    // Below threshold PO should submit directly

    // 1. Create PO with total below threshold ($5,000 < $10,000)
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Small Supplier');
    await page.fill('input[name="quantity"]', '100');
    await page.fill('input[name="unit_price"]', '40'); // Total: 4,000
    await page.click('button:has-text("Save")');

    // 2. Submit PO
    await page.click('button:has-text("Submit")');

    // 3. Verify status is submitted (not pending_approval)
    await expect(page.locator('[data-testid="po-status"]')).toContainText('Submitted');

    // 4. Verify no approval notification was sent
    // (Check notification center or email - would depend on test setup)
  });

  test('E2E-04: Permission denied - non-approver cannot approve', async ({ page, context }) => {
    // Test case: E2E test - AC-06
    // Planner (non-approver) should not be able to approve

    // 1. Create PO above threshold and submit
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Mill Co.');
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="unit_price"]', '30'); // Total: 15,000
    await page.click('button:has-text("Save")');

    const poUrl = page.url();

    await page.click('button:has-text("Submit for Approval")');
    await expect(page.locator('text=submitted for approval')).toBeVisible();

    // 2. Try to approve as same user (planner - not in approval roles)
    // The Approve button should be disabled or not visible
    const approveButton = page.locator('button:has-text("Approve")');
    await expect(approveButton).not.toBeVisible();

    // 3. Verify error message if attempting to access approval endpoint directly
    // (Would need to test API directly for this)
  });

  test('E2E-05: Approval history displays correctly', async ({ page, context }) => {
    // Test case: E2E test - AC-10
    // Approval history should show all actions in order

    // 1. Create PO and perform multiple actions
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Test Supplier');
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="unit_price"]', '30');
    await page.click('button:has-text("Save")');

    const poUrl = page.url();

    // 2. Submit
    await page.click('button:has-text("Submit for Approval")');
    await expect(page.locator('text=submitted for approval')).toBeVisible();

    // 3. Have manager reject
    const managerPage = await context.newPage();
    await managerPage.goto('/login');
    await managerPage.fill('input[name="email"]', 'manager@company.com');
    await managerPage.fill('input[name="password"]', 'password123');
    await managerPage.click('button:has-text("Sign In")');
    await managerPage.waitForURL('/dashboard');

    await managerPage.goto(poUrl);
    await managerPage.click('button:has-text("Reject")');
    const reasonField = managerPage.locator('textarea[name="rejection_reason"]');
    await reasonField.fill('Please reduce quantity.');
    await managerPage.click('button:has-text("Reject PO")');

    // 4. Back in planner, edit and resubmit
    await page.reload();
    await page.click('button:has-text("Edit")');
    const quantityField = page.locator('input[name="quantity"]');
    await quantityField.fill('300');
    await page.click('button:has-text("Save")');
    await page.click('button:has-text("Submit for Approval")');

    // 5. Have manager approve
    await managerPage.reload();
    await managerPage.click('button:has-text("Approve")');
    const notesField = managerPage.locator('textarea[name="notes"]');
    await notesField.fill('Approved');
    await managerPage.click('button:has-text("Approve PO")');

    // 6. View approval history
    await page.reload();
    await page.click('text=Approval History');

    // 7. Verify all actions appear in reverse chronological order
    const historyEntries = page.locator('[data-testid="history-entry"]');
    await expect(historyEntries).toHaveCount(4); // submitted, rejected, submitted, approved

    // 8. Verify each entry shows correct information
    // - User name
    // - Role
    // - Action
    // - Notes
    // - Timestamp
    const firstEntry = historyEntries.first();
    await expect(firstEntry).toContainText('Approved');
    await expect(firstEntry).toContainText('Manager');

    // Cleanup
    await managerPage.close();
  });

  test('E2E-06: Mobile responsive approval modal', async ({ page, context }) => {
    // Test case: E2E test - Responsive design
    // Modal should be responsive on mobile

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Create PO and submit
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Test Supplier');
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="unit_price"]', '30');
    await page.click('button:has-text("Save")');

    const poUrl = page.url();
    await page.click('button:has-text("Submit for Approval")');

    // 2. As manager, open approval modal on mobile
    const managerPage = await context.newPage();
    await managerPage.setViewportSize({ width: 375, height: 667 });
    await managerPage.goto('/login');
    await managerPage.fill('input[name="email"]', 'manager@company.com');
    await managerPage.fill('input[name="password"]', 'password123');
    await managerPage.click('button:has-text("Sign In")');
    await managerPage.waitForURL('/dashboard');

    await managerPage.goto(poUrl);
    await managerPage.click('button:has-text("Approve")');

    // 3. Verify modal content is accessible on mobile
    const modal = managerPage.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // 4. Verify action buttons are accessible
    const approveButton = managerPage.locator('button:has-text("Approve PO")');
    const boundingBox = await approveButton.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(48); // Min touch target
    expect(boundingBox?.width).toBeGreaterThanOrEqual(48);

    // 5. Complete approval on mobile
    await managerPage.click('button:has-text("Approve PO")');
    await expect(managerPage.locator('text=approved successfully')).toBeVisible();

    // Cleanup
    await managerPage.close();
  });

  test('E2E-07: Concurrent approval prevention', async ({ page, context }) => {
    // Test case: RISK-01 - Race condition handling
    // Two managers trying to approve simultaneously

    // 1. Create PO and submit
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Test Supplier');
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="unit_price"]', '30');
    await page.click('button:has-text("Save")');

    const poUrl = page.url();
    await page.click('button:has-text("Submit for Approval")');

    // 2. Open in two manager contexts
    const manager1 = await context.newPage();
    const manager2 = await context.newPage();

    // Manager 1 login
    await manager1.goto('/login');
    await manager1.fill('input[name="email"]', 'manager@company.com');
    await manager1.fill('input[name="password"]', 'password123');
    await manager1.click('button:has-text("Sign In")');
    await manager1.waitForURL('/dashboard');

    // Manager 2 login
    await manager2.goto('/login');
    await manager2.fill('input[name="email"]', 'admin@company.com');
    await manager2.fill('input[name="password"]', 'password123');
    await manager2.click('button:has-text("Sign In")');
    await manager2.waitForURL('/dashboard');

    // Both navigate to same PO
    await manager1.goto(poUrl);
    await manager2.goto(poUrl);

    // 3. Both open approval modal
    await manager1.click('button:has-text("Approve")');
    await manager2.click('button:has-text("Approve")');

    // 4. Manager 1 approves first
    await manager1.click('button:has-text("Approve PO")');
    await expect(manager1.locator('text=approved successfully')).toBeVisible();

    // 5. Manager 2 attempts to approve
    await manager2.click('button:has-text("Approve PO")');

    // 6. Verify Manager 2 gets error
    await expect(manager2.locator('text=already been approved')).toBeVisible();

    // Cleanup
    await manager1.close();
    await manager2.close();
  });

  test('E2E-08: Email notification received after approval', async ({ page, context }) => {
    // Test case: AC-05 - Email verification
    // (Would require email service mock/interceptor)

    // 1. Create and submit PO
    await page.goto('/planning/purchase-orders/new');
    await page.fill('input[name="supplier"]', 'Test Supplier');
    await page.fill('input[name="quantity"]', '500');
    await page.fill('input[name="unit_price"]', '30');
    await page.click('button:has-text("Save")');

    const poUrl = page.url();
    const poNumber = await page.textContent('[data-testid="po-number"]');

    await page.click('button:has-text("Submit for Approval")');

    // 2. Manager approves
    const managerPage = await context.newPage();
    await managerPage.goto('/login');
    await managerPage.fill('input[name="email"]', 'manager@company.com');
    await managerPage.fill('input[name="password"]', 'password123');
    await managerPage.click('button:has-text("Sign In")');
    await managerPage.waitForURL('/dashboard');

    await managerPage.goto(poUrl);
    await managerPage.click('button:has-text("Approve")');
    const notesField = managerPage.locator('textarea[name="notes"]');
    await notesField.fill('Approved');
    await managerPage.click('button:has-text("Approve PO")');

    // 3. Verify planner receives notification
    // (This would require accessing email system or notification center)
    await page.reload();
    await page.click('[data-testid="notification-center"]');
    await expect(page.locator(`text=PO ${poNumber} has been approved`)).toBeVisible();

    // Cleanup
    await managerPage.close();
  });
});
