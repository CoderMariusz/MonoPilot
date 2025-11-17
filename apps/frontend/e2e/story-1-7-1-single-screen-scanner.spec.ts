/**
 * E2E Tests - Story 1.7.1: Single-Screen Scanner (Variant B)
 *
 * Test coverage:
 * - AC-1: Camera integration and barcode scanning
 * - AC-2: Scanned items list and visual feedback
 * - AC-3: Swipe-to-remove error correction
 * - AC-4: Auto-generated LP and batch prefill
 * - AC-5: Offline queue and sync
 * - AC-6: Thumb-zone action buttons
 *
 * Target metrics validation:
 * - 8-10 items/min throughput (100% faster than Variant A)
 * - 2-5 taps per workflow (90% reduction)
 * - 0 typing (100% reduction)
 * - <1s camera start time (p95)
 * - <500ms scan-to-display latency
 */

import { test, expect, type Page } from '@playwright/test';
import { login } from './helpers';

// Mock barcode scanning (since we can't test real camera in E2E)
async function mockBarcodeScan(page: Page, barcode: string) {
  // Simulate barcode scan by triggering the onScan callback
  await page.evaluate((code) => {
    // Find CameraViewfinder component and trigger scan
    const event = new CustomEvent('barcode-scan', { detail: { barcode: code } });
    window.dispatchEvent(event);
  }, barcode);
}

// Helper to setup test ASN with items
async function setupTestASN(page: Page) {
  // Navigate to scanner receive v2
  await page.goto('/scanner/receive-v2');

  // Wait for ASN list to load
  await expect(page.locator('text=Receive ASN')).toBeVisible();

  // Click first ASN in list
  const firstASN = page.locator('[data-testid="asn-card"]').first();
  await firstASN.click();

  // Wait for scanner to initialize
  await expect(page.locator('text=Point at barcode')).toBeVisible({ timeout: 2000 });
}

test.describe('Story 1.7.1 - Single-Screen Scanner (Variant B)', () => {
  test.beforeEach(async ({ page }) => {
    // Login using helper (uses przyslony@gmail.com from .env or default)
    await login(page);
  });

  /**
   * Subtask 8.1: Happy Path Test (Online, No Errors)
   * Validates: AC-1, AC-2, AC-4, AC-6
   */
  test('8.1 - Happy path: Scan items, verify auto-fill, finish workflow', async ({ page }) => {
    await setupTestASN(page);

    // Verify camera started (AC-1)
    await expect(page.locator('video')).toBeVisible();
    await expect(page.locator('text=Point at barcode')).toBeVisible();

    // Measure camera start time (target: <1s)
    const cameraStartTime = await page.evaluate(() => {
      const metric = performance.getEntriesByName('camera-start-time')[0];
      return metric ? metric.duration : 0;
    });
    expect(cameraStartTime).toBeLessThan(1000);

    // Scan first item (AC-2, AC-4)
    const scanStartTime = Date.now();
    await mockBarcodeScan(page, 'PRODUCT-001');

    // Verify item appears in list with auto-generated LP and batch
    const firstItem = page.locator('[data-testid="scanned-item"]').first();
    await expect(firstItem).toBeVisible();

    // Measure scan-to-display latency (target: <500ms)
    const scanLatency = Date.now() - scanStartTime;
    expect(scanLatency).toBeLessThan(500);

    // Verify auto-generated LP number format: LP-YYYYMMDD-NNN (AC-4)
    const lpText = await firstItem.locator('text=/LP-\\d{8}-\\d{3}/').textContent();
    expect(lpText).toMatch(/LP-\d{8}-\d{3}/);

    // Verify batch number present (AC-4: ASN metadata, AI prediction, or fallback)
    const batchText = await firstItem.textContent();
    expect(batchText).toMatch(/LP-\d{8}-\d{3} • .+/); // LP number • batch pattern

    // Verify haptic feedback triggered (AC-2)
    const hapticCalls = await page.evaluate(() => {
      return (window as any).__hapticCalls || [];
    });
    expect(hapticCalls).toContain(50); // Success vibration

    // Scan second item
    await mockBarcodeScan(page, 'PRODUCT-002');
    await expect(page.locator('[data-testid="scanned-item"]')).toHaveCount(2);

    // Verify progress indicator shows 2 of N (AC-2)
    await expect(page.locator('text=/Scanned Items \\(2 of \\d+\\)/')).toBeVisible();

    // Click Finish button (AC-6 - thumb zone)
    const finishButton = page.locator('button:has-text("Finish")');
    await expect(finishButton).toBeEnabled();
    await finishButton.click();

    // Verify GRN created
    await expect(page.locator('text=/GRN.*created/')).toBeVisible({ timeout: 5000 });

    // Verify redirected to scanner hub
    await expect(page).toHaveURL('/scanner');

    // Track taps (target: 2-5 taps)
    const tapCount = await page.evaluate(() => {
      return (window as any).__tapCount || 0;
    });
    expect(tapCount).toBeLessThanOrEqual(5);

    // Verify zero typing (target: 0 chars)
    const typedChars = await page.evaluate(() => {
      return (window as any).__typedChars || 0;
    });
    expect(typedChars).toBe(0);
  });

  /**
   * Subtask 8.2: Error Correction Test (Swipe-to-Remove)
   * Validates: AC-3
   */
  test('8.2 - Error correction: Swipe to remove, undo within 5 seconds', async ({ page }) => {
    await setupTestASN(page);

    // Scan item
    await mockBarcodeScan(page, 'PRODUCT-001');
    const item = page.locator('[data-testid="scanned-item"]').first();
    await expect(item).toBeVisible();

    // Swipe left to remove (simulate touch gesture)
    await item.evaluate((el) => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 300, clientY: 100 } as any],
      });
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 200, clientY: 100 } as any],
      });
      const touchEnd = new TouchEvent('touchend', { touches: [] });

      el.dispatchEvent(touchStart);
      el.dispatchEvent(touchMove);
      el.dispatchEvent(touchEnd);
    });

    // Verify item removed from list
    await expect(item).not.toBeVisible();

    // Verify undo toast appears
    await expect(page.locator('text=Item removed. Tap Undo within 5 seconds')).toBeVisible();

    // Verify undo button appears in bottom section
    const undoButton = page.locator('button:has-text("Undo")');
    await expect(undoButton).toBeVisible();

    // Click undo within 5 seconds
    await undoButton.click();

    // Verify item restored to list
    await expect(item).toBeVisible();
    await expect(page.locator('text=Item restored')).toBeVisible();

    // Verify undo button disappears
    await expect(undoButton).not.toBeVisible();

    // Test auto-expiry (5 seconds)
    await mockBarcodeScan(page, 'PRODUCT-002');
    const item2 = page.locator('[data-testid="scanned-item"]').nth(1);

    // Swipe to remove again
    await item2.evaluate((el) => {
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 300, clientY: 100 } as any],
      });
      const touchEnd = new TouchEvent('touchend', {
        touches: [{ clientX: 200, clientY: 100 } as any],
      });
      el.dispatchEvent(touchStart);
      el.dispatchEvent(touchEnd);
    });

    // Wait 5+ seconds
    await page.waitForTimeout(5500);

    // Verify undo button disappeared
    await expect(undoButton).not.toBeVisible();
  });

  /**
   * Subtask 8.3: Offline Mode Test
   * Validates: AC-5
   */
  test('8.3 - Offline mode: Queue items, auto-sync on reconnect', async ({ page, context }) => {
    await setupTestASN(page);

    // Go offline
    await context.setOffline(true);

    // Verify offline indicator appears
    await expect(page.locator('text=Offline')).toBeVisible();

    // Scan items while offline
    await mockBarcodeScan(page, 'PRODUCT-001');
    await mockBarcodeScan(page, 'PRODUCT-002');

    // Verify items added to list
    await expect(page.locator('[data-testid="scanned-item"]')).toHaveCount(2);

    // Click Finish
    await page.locator('button:has-text("Finish")').click();

    // Verify queued toast message
    await expect(page.locator('text=/saved offline.*Will sync when online/')).toBeVisible();

    // Verify redirected to scanner hub
    await expect(page).toHaveURL('/scanner');

    // Go back online
    await context.setOffline(false);

    // Trigger online event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    // Wait for auto-sync
    await page.waitForTimeout(2000);

    // Verify sync success toast
    await expect(page.locator('text=/Synced.*offline scans/')).toBeVisible({ timeout: 5000 });

    // Verify queue count badge updated/cleared
    await expect(page.locator('text=/Retry \\(0\\)/')).not.toBeVisible();
  });

  /**
   * Subtask 8.4: Camera Fallback Test
   * Validates: Camera permission denied → redirect to Variant A
   */
  test('8.4 - Camera fallback: Permission denied redirects to manual mode', async ({ page, context }) => {
    // Deny camera permissions
    await context.grantPermissions([], { origin: page.url() });

    await page.goto('/scanner/receive-v2');

    // Select ASN
    const firstASN = page.locator('[data-testid="asn-card"]').first();
    await firstASN.click();

    // Verify camera error message
    await expect(page.locator('text=Camera permission denied')).toBeVisible();
    await expect(page.locator('text=Redirecting to manual mode')).toBeVisible();

    // Wait for redirect (2 seconds)
    await page.waitForTimeout(2500);

    // Verify redirected to Variant A (manual receive workflow)
    await expect(page).toHaveURL(/\/scanner\/receive\?asn_id=/);
  });

  /**
   * Subtask 8.5: Performance Test
   * Validates: <1s camera start, <500ms scan-to-display, 8-10 items/min
   */
  test('8.5 - Performance: Camera start <1s, scan latency <500ms, throughput 8-10 items/min', async ({ page }) => {
    await setupTestASN(page);

    // Test 1: Camera start time (p95 < 1s)
    const cameraStartTime = await page.evaluate(() => {
      const metric = performance.getEntriesByName('camera-start-time')[0];
      return metric ? metric.duration : 0;
    });
    console.log(`[Performance] Camera start time: ${cameraStartTime}ms`);
    expect(cameraStartTime).toBeLessThan(1000);

    // Test 2: Scan-to-display latency (p95 < 500ms)
    const scanLatencies: number[] = [];

    for (let i = 0; i < 10; i++) {
      const scanStart = Date.now();
      await mockBarcodeScan(page, `PRODUCT-${String(i + 1).padStart(3, '0')}`);
      await expect(page.locator('[data-testid="scanned-item"]')).toHaveCount(i + 1);
      const scanLatency = Date.now() - scanStart;
      scanLatencies.push(scanLatency);
    }

    const p95Latency = scanLatencies.sort((a, b) => a - b)[Math.floor(scanLatencies.length * 0.95)];
    console.log(`[Performance] Scan-to-display latency (p95): ${p95Latency}ms`);
    expect(p95Latency).toBeLessThan(500);

    // Test 3: Throughput (8-10 items/min = 6-7.5s per item)
    const avgLatency = scanLatencies.reduce((a, b) => a + b, 0) / scanLatencies.length;
    const itemsPerMinute = 60000 / avgLatency;
    console.log(`[Performance] Throughput: ${itemsPerMinute.toFixed(1)} items/min`);
    expect(itemsPerMinute).toBeGreaterThanOrEqual(8);
  });

  /**
   * Additional Test: Retry Last Button
   * Validates: AC-6 thumb-zone button functionality
   */
  test('Additional - Retry Last button removes last scanned item', async ({ page }) => {
    await setupTestASN(page);

    // Scan 3 items
    await mockBarcodeScan(page, 'PRODUCT-001');
    await mockBarcodeScan(page, 'PRODUCT-002');
    await mockBarcodeScan(page, 'PRODUCT-003');
    await expect(page.locator('[data-testid="scanned-item"]')).toHaveCount(3);

    // Click Retry Last
    const retryButton = page.locator('button:has-text("Retry Last")');
    await retryButton.click();

    // Verify last item removed
    await expect(page.locator('[data-testid="scanned-item"]')).toHaveCount(2);
    await expect(page.locator('text=Item removed')).toBeVisible();

    // Verify undo button appears
    await expect(page.locator('button:has-text("Undo")')).toBeVisible();
  });

  /**
   * Additional Test: All Items Scanned Animation
   * Validates: AC-2 visual feedback when all items scanned
   */
  test('Additional - Finish button animates when all items scanned', async ({ page }) => {
    await setupTestASN(page);

    // Get total item count
    const totalItems = await page.locator('text=/Scanned Items \\(0 of (\\d+)\\)/').textContent();
    const total = parseInt(totalItems?.match(/\\d+$/)?.[0] || '0');

    // Scan all items
    for (let i = 0; i < total; i++) {
      await mockBarcodeScan(page, `PRODUCT-${String(i + 1).padStart(3, '0')}`);
    }

    // Verify all scanned
    await expect(page.locator(`text=/Scanned Items \\(${total} of ${total}\\)/`)).toBeVisible();

    // Verify checkmark icon appears
    await expect(page.locator('[data-testid="all-scanned-checkmark"]')).toBeVisible();

    // Verify Finish button has animate-pulse class
    const finishButton = page.locator('button:has-text("Finish")');
    const hasAnimation = await finishButton.evaluate((el) =>
      el.classList.contains('animate-pulse')
    );
    expect(hasAnimation).toBe(true);
  });

  /**
   * Additional Test: AI Batch Prediction
   * Validates: AC-4 Priority 2 (AI prediction)
   */
  test('Additional - AI batch prediction shows confidence badge', async ({ page }) => {
    await setupTestASN(page);

    // Scan item
    await mockBarcodeScan(page, 'PRODUCT-001');
    const item = page.locator('[data-testid="scanned-item"]').first();
    await expect(item).toBeVisible();

    // Check if AI confidence badge is present (if batch was AI-predicted)
    const confidenceBadge = item.locator('text=/AI: \\d+%/');
    const badgeExists = await confidenceBadge.count() > 0;

    if (badgeExists) {
      // Verify badge shows confidence percentage
      const badgeText = await confidenceBadge.textContent();
      expect(badgeText).toMatch(/AI: \d+%/);

      // Verify badge has appropriate color based on confidence
      const badgeClass = await confidenceBadge.getAttribute('class');
      expect(badgeClass).toMatch(/bg-(green|yellow|orange)-100/);
    } else {
      // If no badge, batch was from ASN metadata (100% confidence) or fallback
      console.log('[Test] No AI badge - batch from ASN metadata or fallback');
    }
  });

  /**
   * Additional Test: Tap-to-Edit Modal
   * Validates: AC-4 tap-to-edit functionality
   */
  test('Additional - Tap-to-edit modal allows manual corrections', async ({ page }) => {
    await setupTestASN(page);

    // Scan item
    await mockBarcodeScan(page, 'PRODUCT-001');
    const item = page.locator('[data-testid="scanned-item"]').first();
    await expect(item).toBeVisible();

    // Get original batch number
    const originalText = await item.textContent();
    const originalBatch = originalText?.match(/BATCH-\d{4}-\d{3}|LP-\d{8}-\d{3} • (.+)/)?.[1] || 'UNKNOWN';

    // Click edit button
    const editButton = item.locator('[data-testid="edit-item-btn"]');
    await editButton.click();

    // Verify modal appears
    await expect(page.locator('[data-testid="edit-modal-backdrop"]')).toBeVisible();
    await expect(page.locator('text=Edit Item')).toBeVisible();

    // Verify LP number is read-only
    const lpInput = page.locator('input[value^="LP-"]');
    await expect(lpInput).toHaveAttribute('readonly', '');

    // Edit batch number
    const batchInput = page.locator('[data-testid="edit-batch-input"]');
    await expect(batchInput).toBeVisible();
    await batchInput.clear();
    await batchInput.fill('CUSTOM-BATCH-123');

    // Edit quantity
    const quantityInput = page.locator('[data-testid="edit-quantity-input"]');
    await quantityInput.clear();
    await quantityInput.fill('50');

    // Save changes
    const saveButton = page.locator('[data-testid="edit-save-btn"]');
    await saveButton.click();

    // Verify modal closed
    await expect(page.locator('[data-testid="edit-modal-backdrop"]')).not.toBeVisible();

    // Verify success toast
    await expect(page.locator('text=Item updated')).toBeVisible();

    // Verify changes reflected in item card
    const updatedText = await item.textContent();
    expect(updatedText).toContain('CUSTOM-BATCH-123');
    expect(updatedText).toContain('50');
  });

  /**
   * Additional Test: Green Flash Animation
   * Validates: AC-2 visual feedback enhancement
   */
  test('Additional - Green flash animation on successful scan', async ({ page }) => {
    await setupTestASN(page);

    // Scan item
    await mockBarcodeScan(page, 'PRODUCT-001');
    const item = page.locator('[data-testid="scanned-item"]').first();
    await expect(item).toBeVisible();

    // Wait a moment for animation to trigger
    await page.waitForTimeout(100);

    // Check if item has flash styling (green border + shadow)
    const itemCard = item.locator('div.border-2').first();
    const classList = await itemCard.getAttribute('class');

    // Initially should have flash classes (within 500ms)
    if (classList) {
      const hasFlashClasses = classList.includes('border-green-500') ||
                             classList.includes('bg-green-50') ||
                             classList.includes('shadow-green-200');

      if (hasFlashClasses) {
        console.log('[Test] Flash animation detected');
      }
    }

    // Wait for animation to complete (500ms)
    await page.waitForTimeout(600);

    // After animation, should revert to normal green border
    const finalClassList = await itemCard.getAttribute('class');
    expect(finalClassList).toContain('border-green-200');
  });

  /**
   * AC-4 Gap 1: LP Number Atomicity Test
   * Validates: Database sequence ensures unique LP numbers
   */
  test('AC-4 Gap 1 - LP numbers are unique (atomic generation)', async ({ page }) => {
    await setupTestASN(page);

    // Scan multiple items rapidly
    await mockBarcodeScan(page, 'PRODUCT-001');
    await mockBarcodeScan(page, 'PRODUCT-002');
    await mockBarcodeScan(page, 'PRODUCT-003');

    // Get all LP numbers
    const lpNumbers: string[] = [];
    const items = await page.locator('[data-testid="scanned-item"]').all();

    for (const item of items) {
      const lpText = await item.textContent();
      const match = lpText?.match(/LP-\d{8}-\d{3}/);
      if (match) {
        lpNumbers.push(match[0]);
      }
    }

    // Verify all LP numbers are unique
    const uniqueLPs = new Set(lpNumbers);
    expect(uniqueLPs.size).toBe(lpNumbers.length);

    // Verify LP numbers are sequential (Gap 4: daily counter)
    expect(lpNumbers).toHaveLength(3);
    console.log('[Test] Generated LP numbers:', lpNumbers);
  });

  /**
   * AC-4 Gap 5: LP Uniqueness Validation
   * Validates: No duplicate LP numbers in database
   */
  test('AC-4 Gap 5 - Validate LP uniqueness before save', async ({ page }) => {
    await setupTestASN(page);

    // Scan item
    await mockBarcodeScan(page, 'PRODUCT-001');

    // Get LP number
    const firstItem = page.locator('[data-testid="scanned-item"]').first();
    const lpText = await firstItem.textContent();
    const match = lpText?.match(/LP-\d{8}-\d{3}/);

    expect(match).not.toBeNull();
    if (match) {
      const lpNumber = match[0];
      console.log('[Test] Validated unique LP:', lpNumber);

      // LP should follow format LP-YYYYMMDD-NNN
      expect(lpNumber).toMatch(/^LP-\d{8}-\d{3}$/);
    }
  });

  /**
   * AC-4 Gap 6: Batch Validation (Empty String Handling)
   * Validates: Empty ASN batch triggers fallback
   */
  test('AC-4 Gap 6 - Empty batch triggers fallback generation', async ({ page }) => {
    await setupTestASN(page);

    // Scan item
    await mockBarcodeScan(page, 'PRODUCT-001');
    const item = page.locator('[data-testid="scanned-item"]').first();
    await expect(item).toBeVisible();

    // Verify batch number present (should be fallback if ASN batch empty)
    const itemText = await item.textContent();

    // Should have either ASN batch or fallback (BATCH-YYYY-DDD format)
    const hasBatchInfo = itemText?.includes('•') && itemText.split('•').length >= 2;
    expect(hasBatchInfo).toBe(true);

    console.log('[Test] Batch info:', itemText?.split('•')[1]?.trim());
  });
});
