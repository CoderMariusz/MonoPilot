/**
 * Row Click Navigation Test - Planning Module
 * Tests row click handlers on all Planning module list pages
 * Verifies navigation from list to detail pages
 */

const { chromium } = require('@playwright/test');
const fs = require('fs');

async function testRowClickNavigation() {
  let browser;
  let page;
  const results = [];
  
  try {
    console.log('\n=== TESTING ROW CLICK NAVIGATION - PLANNING MODULE ===\n');
    
    // Connect to Chrome
    browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
    const contexts = browser.contexts();
    const context = contexts[0];
    const pages = context.pages();
    page = pages[0];
    
    // Test 1: Work Orders Row Click
    try {
      console.log('TEST 1: Work Orders - Row click navigates to detail page');
      await page.goto('http://localhost:3000/planning/work-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Find first data row
      const firstRow = page.locator('tbody tr').first();
      await firstRow.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get the row ID from the first row's text (WO number)
      const woNumber = await firstRow.locator('td').first().textContent();
      console.log(`Found WO: ${woNumber}`);
      
      // Click the first row
      await firstRow.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      
      // Check if navigated to detail page
      const currentUrl = page.url();
      if (currentUrl.includes('/planning/work-orders/') && !currentUrl.includes('/planning/work-orders/new')) {
        console.log(`✅ PASS: Navigated to detail page: ${currentUrl}`);
        results.push({ test: 'WO Row Click', passed: true, details: 'Navigation successful' });
      } else {
        console.log(`❌ FAIL: Not navigated to detail page. URL: ${currentUrl}`);
        results.push({ test: 'WO Row Click', passed: false, details: `Wrong URL: ${currentUrl}` });
      }
    } catch (e) {
      console.log('❌ FAIL: WO Row Click -', e.message);
      results.push({ test: 'WO Row Click', passed: false, error: e.message });
    }
    
    // Test 2: Purchase Orders Row Click
    try {
      console.log('\nTEST 2: Purchase Orders - Row click navigates to detail page');
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Find first data row
      const firstRow = page.locator('tbody tr').first();
      await firstRow.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get PO number
      const poNumber = await firstRow.locator('td').first().textContent();
      console.log(`Found PO: ${poNumber}`);
      
      // Click the row
      await firstRow.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      
      // Check if navigated to detail page
      const currentUrl = page.url();
      if (currentUrl.includes('/planning/purchase-orders/') && !currentUrl.includes('/planning/purchase-orders/new')) {
        console.log(`✅ PASS: Navigated to detail page: ${currentUrl}`);
        results.push({ test: 'PO Row Click', passed: true, details: 'Navigation successful' });
      } else {
        console.log(`❌ FAIL: Not navigated to detail page. URL: ${currentUrl}`);
        results.push({ test: 'PO Row Click', passed: false, details: `Wrong URL: ${currentUrl}` });
      }
    } catch (e) {
      console.log('❌ FAIL: PO Row Click -', e.message);
      results.push({ test: 'PO Row Click', passed: false, error: e.message });
    }
    
    // Test 3: Transfer Orders Row Click
    try {
      console.log('\nTEST 3: Transfer Orders - Row click navigates to detail page');
      await page.goto('http://localhost:3000/planning/transfer-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      
      // Find first data row
      const firstRow = page.locator('tbody tr').first();
      await firstRow.waitFor({ state: 'visible', timeout: 5000 });
      
      // Get TO number
      const toNumber = await firstRow.locator('td').first().textContent();
      console.log(`Found TO: ${toNumber}`);
      
      // Click the row
      await firstRow.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      
      // Check if navigated to detail page
      const currentUrl = page.url();
      if (currentUrl.includes('/planning/transfer-orders/') && !currentUrl.includes('/planning/transfer-orders/new')) {
        console.log(`✅ PASS: Navigated to detail page: ${currentUrl}`);
        results.push({ test: 'TO Row Click', passed: true, details: 'Navigation successful' });
      } else {
        console.log(`❌ FAIL: Not navigated to detail page. URL: ${currentUrl}`);
        results.push({ test: 'TO Row Click', passed: false, details: `Wrong URL: ${currentUrl}` });
      }
    } catch (e) {
      console.log('❌ FAIL: TO Row Click -', e.message);
      results.push({ test: 'TO Row Click', passed: false, error: e.message });
    }
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Passed: ${passed}/${results.length}`);
    console.log(`Failed: ${failed}/${results.length}\n`);
    
    results.forEach(r => {
      const status = r.passed ? '✅' : '❌';
      console.log(`${status} ${r.test}: ${r.details || r.error}`);
    });
    
    // Save results
    fs.writeFileSync('/Users/mariuszkrawczyk/.openclaw/workspace/monopilot-repo/test-row-click-results.json', 
      JSON.stringify(results, null, 2)
    );
    
    console.log('\nResults saved to test-row-click-results.json');
    
  } catch (e) {
    console.error('Test execution error:', e);
  } finally {
    if (browser) await browser.close();
  }
}

testRowClickNavigation().catch(console.error);
