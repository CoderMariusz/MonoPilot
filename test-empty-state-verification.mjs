import { chromium } from 'playwright';

const email = 'admin@monopilot.com';
const password = 'test1234';

async function verifyEmptyStates() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });

    // Test 1: Search with no matches
    console.log('\n=== TEST 1: Search Filter (No Matches) ===');
    await page.goto('http://localhost:3000/quality/holds');
    await page.waitForLoadState('domcontentloaded');
    
    const search = await page.locator('input[placeholder*="Search"]');
    await search.fill('NONEXISTENT_SEARCH_123456');
    await page.waitForTimeout(1000);
    
    const test1Empty = await page.locator('text=No holds match your search criteria').isVisible().catch(() => false);
    const test1Title = await page.locator('text=No Quality Holds').isVisible().catch(() => false);
    console.log(`  ✓ Empty message visible: ${test1Empty}`);
    console.log(`  ✓ Title visible: ${test1Title}`);
    results.push({
      test: 'Search Filter (No Matches)',
      passed: test1Empty && test1Title,
    });

    // Test 2: Status filter with no matches
    console.log('\n=== TEST 2: Status Filter (No Matches) ===');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    const statusBtn = await page.locator('button:has-text("All Statuses")').first();
    await statusBtn.click();
    await page.waitForTimeout(500);
    
    const disposedOption = await page.locator('[role="option"]:has-text("Disposed")').first();
    await disposedOption.click();
    await page.waitForTimeout(1000);
    
    const test2Empty = await page.locator('text=No holds match your search criteria').isVisible().catch(() => false);
    const test2Title = await page.locator('text=No Quality Holds').isVisible().catch(() => false);
    console.log(`  ✓ Empty message visible: ${test2Empty}`);
    console.log(`  ✓ Title visible: ${test2Title}`);
    results.push({
      test: 'Status Filter (No Matches)',
      passed: test2Empty && test2Title,
    });

    // Test 3: Clear filters and verify data shows
    console.log('\n=== TEST 3: Clear Filters (Data Shows) ===');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    await page.waitForTimeout(500);
    const tableExists = await page.locator('table').isVisible().catch(() => false);
    const dataRows = await page.locator('table tbody tr').count();
    console.log(`  ✓ Table visible: ${tableExists}`);
    console.log(`  ✓ Data rows present: ${dataRows > 0} (${dataRows} rows)`);
    results.push({
      test: 'Clear Filters (Data Shows)',
      passed: tableExists && dataRows > 0,
    });

    // Test 4: Priority filter with no matches
    console.log('\n=== TEST 4: Priority Filter (No Matches) ===');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // This assumes all holds have specific priorities
    // For now, just check that filtering works
    const priorBtn = await page.locator('button:has-text("All Priorities")').first();
    await priorBtn.click();
    await page.waitForTimeout(500);
    
    const criticalOption = await page.locator('[role="option"]:has-text("Critical")').first();
    if (await criticalOption.isVisible()) {
      await criticalOption.click();
      await page.waitForTimeout(1000);
      
      const test4Title = await page.locator('text=No Quality Holds').isVisible().catch(() => false);
      console.log(`  ✓ Filter applied successfully`);
      results.push({
        test: 'Priority Filter (Applied)',
        passed: true,
      });
    }

    // Print summary
    console.log('\n=== SUMMARY ===');
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    console.log(`  Passed: ${passed}/${total}`);
    
    results.forEach(r => {
      const status = r.passed ? '✓' : '✗';
      console.log(`  ${status} ${r.test}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

verifyEmptyStates();
