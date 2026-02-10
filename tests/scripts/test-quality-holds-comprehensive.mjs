import { chromium } from 'playwright';

const email = 'admin@monopilot.com';
const password = 'test1234';

async function testQualityHolds() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to login page
    console.log('1. Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Fill and submit login form
    console.log('2. Filling login form...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
    
    console.log('3. Logged in successfully, navigating to quality holds...');
    
    // Navigate to quality holds
    await page.goto('http://localhost:3000/quality/holds', { waitUntil: 'networkidle' });
    
    // Test 1: Check initial state (with data)
    console.log('\n=== TEST 1: Initial Page Load (With Data) ===');
    await page.screenshot({ path: 'test1-initial-load.png' });
    const dataRows1 = await page.locator('table tbody tr').count();
    console.log(`✓ Initial data rows: ${dataRows1}`);
    
    // Test 2: Search with no matches
    console.log('\n=== TEST 2: Search with No Matches ===');
    const searchInput = await page.locator('input[placeholder="Search by hold number..."]');
    await searchInput.fill('ZZZZZZZZZZZZ999999');
    await page.waitForTimeout(500); // Wait for debounce
    
    await page.screenshot({ path: 'test2-search-no-match.png' });
    
    // Check for empty state message
    const emptyStateText = await page.locator('h2:has-text("No Quality Holds")').first();
    const isVisible = await emptyStateText.isVisible().catch(() => false);
    console.log(`✓ Empty state h2 visible: ${isVisible}`);
    
    // Check for "no holds match" text
    const noMatchText = await page.locator('text=No holds match your search criteria').first();
    const noMatchVisible = await noMatchText.isVisible().catch(() => false);
    console.log(`✓ "No holds match" text visible: ${noMatchVisible}`);
    
    // Test 3: Clear search and test status filter
    console.log('\n=== TEST 3: Filter by Status (No Matches) ===');
    await searchInput.clear();
    
    // Get the status dropdown
    const statusDropdown = await page.locator('button:has-text("All Statuses")').first();
    await statusDropdown.click();
    
    // Look for a status option that likely won't match
    const statusOption = await page.locator('[role="option"]:has-text("Disposed")').first();
    await statusOption.click().catch(() => console.log('Could not click status option'));
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test3-status-filter.png' });
    
    // Test 4: Check if empty state shows for filtered results
    console.log('\n=== TEST 4: Check Empty State Visibility After Filter ===');
    const emptyStateAfterFilter = await page.locator('h2').filter({ hasText: 'No Quality Holds' }).first();
    const filterEmptyVisible = await emptyStateAfterFilter.isVisible().catch(() => false);
    console.log(`✓ Empty state h2 visible after filter: ${filterEmptyVisible}`);
    
    // Get all text content to verify message
    const pageContent = await page.content();
    const hasEmptyMsg = pageContent.includes('No Quality Holds');
    const hasFilterMsg = pageContent.includes('No holds match');
    
    console.log(`✓ HTML contains "No Quality Holds": ${hasEmptyMsg}`);
    console.log(`✓ HTML contains "No holds match": ${hasFilterMsg}`);
    
    // Test 5: Check mobile view
    console.log('\n=== TEST 5: Mobile View Test ===');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/quality/holds', { waitUntil: 'networkidle' });
    
    // Trigger search that returns no results on mobile
    const mobileSearch = await page.locator('input[placeholder="Search by hold number..."]');
    await mobileSearch.fill('NONEXISTENTMOBILE123');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test5-mobile-empty-state.png' });
    
    const mobileEmptyTitle = await page.locator('h2').filter({ hasText: 'No Quality Holds' }).first();
    const mobileEmptyVisible = await mobileEmptyTitle.isVisible().catch(() => false);
    console.log(`✓ Mobile empty state h2 visible: ${mobileEmptyVisible}`);
    
    // Test 6: Check if border is rendering
    console.log('\n=== TEST 6: Check Empty State Container Styling ===');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('http://localhost:3000/quality/holds', { waitUntil: 'networkidle' });
    
    // Clear filters and search
    await page.goto('http://localhost:3000/quality/holds', { waitUntil: 'networkidle' });
    
    // Get the empty state container
    const emptyContainer = await page.locator('div.border.border-dashed').first();
    const containerVisible = await emptyContainer.isVisible().catch(() => false);
    console.log(`✓ Empty state container visible: ${containerVisible}`);
    
    // Check computed styles
    if (containerVisible) {
      const style = await emptyContainer.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return {
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          borderStyle: computedStyle.borderStyle,
          borderColor: computedStyle.borderColor,
          opacity: computedStyle.opacity,
        };
      });
      console.log(`✓ Container styles:`, JSON.stringify(style, null, 2));
    }
    
    // Final summary
    console.log('\n=== TEST SUMMARY ===');
    console.log('Screenshots saved:');
    console.log('  - test1-initial-load.png');
    console.log('  - test2-search-no-match.png');
    console.log('  - test3-status-filter.png');
    console.log('  - test5-mobile-empty-state.png');
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testQualityHolds();
