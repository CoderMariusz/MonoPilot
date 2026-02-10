const { chromium } = require('@playwright/test');
const fs = require('fs');

async function runTests() {
  let browser;
  let page;
  const results = [];
  
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
    const contexts = browser.contexts();
    const context = contexts[0];
    const pages = context.pages();
    page = pages[0];
    
    console.log('\n=== PURCHASE ORDERS MODULE TESTS ===\n');
    
    // Navigate to Purchase Orders page
    await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Test 1: Create Purchase Order button exists
    try {
      const btn = page.locator('button:has-text("Create Purchase Order"), button:has-text("Create PO"), button:has-text("New Purchase Order")').first();
      const isVisible = await btn.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Create button not visible');
      await btn.click();
      const modal = page.locator('[role="dialog"]').first();
      await modal.waitFor({ state: 'visible', timeout: 2000 });
      results.push({ test: 'Create Purchase Order button opens modal', passed: true });
      console.log('✓ Create Purchase Order button opens modal');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } catch (e) {
      results.push({ test: 'Create Purchase Order button opens modal', passed: false, error: e.message });
      console.log('✗ Create Purchase Order button opens modal:', e.message);
    }
    
    // Test 2: Search input exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="PO"], input[placeholder*="purchase"]').first();
      const isVisible = await searchInput.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Search input not found');
      results.push({ test: 'Search input exists', passed: true });
      console.log('✓ Search input exists');
    } catch (e) {
      results.push({ test: 'Search input exists', passed: false, error: e.message });
      console.log('✗ Search input exists:', e.message);
    }
    
    // Test 3: Status filter exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const statusFilter = page.locator('[role="combobox"]:has-text("Status"), button:has-text("Status")').first();
      const isVisible = await statusFilter.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Status filter not found');
      results.push({ test: 'Status filter exists', passed: true });
      console.log('✓ Status filter exists');
    } catch (e) {
      results.push({ test: 'Status filter exists', passed: false, error: e.message });
      console.log('✗ Status filter exists:', e.message);
    }
    
    // Test 4: Vendor filter exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const vendorFilter = page.locator('[role="combobox"]:has-text("Vendor"), button:has-text("Vendor")').first();
      const isVisible = await vendorFilter.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Vendor filter not found');
      results.push({ test: 'Vendor filter exists', passed: true });
      console.log('✓ Vendor filter exists');
    } catch (e) {
      results.push({ test: 'Vendor filter exists', passed: false, error: e.message });
      console.log('✗ Vendor filter exists:', e.message);
    }
    
    // Test 5: Purchase Orders table exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const table = page.locator('table, [role="table"], [role="grid"]').first();
      const isVisible = await table.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Table not found');
      const headerText = await table.textContent();
      if (!headerText.includes('PO') && !headerText.includes('Purchase Order') && !headerText.includes('Number')) {
        throw new Error('Table header not correct');
      }
      results.push({ test: 'Purchase Orders table exists', passed: true });
      console.log('✓ Purchase Orders table exists');
    } catch (e) {
      results.push({ test: 'Purchase Orders table exists', passed: false, error: e.message });
      console.log('✗ Purchase Orders table exists:', e.message);
    }
    
    // Test 6: PO Number column header exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const header = page.locator('th, [role="columnheader"]').filter({ hasText: /PO|Number/ }).first();
      const isVisible = await header.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('PO Number header not found');
      results.push({ test: 'PO Number column header exists', passed: true });
      console.log('✓ PO Number column header exists');
    } catch (e) {
      results.push({ test: 'PO Number column header exists', passed: false, error: e.message });
      console.log('✗ PO Number column header exists:', e.message);
    }
    
    // Test 7: Vendor column header exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const header = page.locator('th, [role="columnheader"]').filter({ hasText: 'Vendor' }).first();
      const isVisible = await header.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Vendor header not found');
      results.push({ test: 'Vendor column header exists', passed: true });
      console.log('✓ Vendor column header exists');
    } catch (e) {
      results.push({ test: 'Vendor column header exists', passed: false, error: e.message });
      console.log('✗ Vendor column header exists:', e.message);
    }
    
    // Test 8: Status column header exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const header = page.locator('th, [role="columnheader"]').filter({ hasText: 'Status' }).first();
      const isVisible = await header.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Status header not found');
      results.push({ test: 'Status column header exists', passed: true });
      console.log('✓ Status column header exists');
    } catch (e) {
      results.push({ test: 'Status column header exists', passed: false, error: e.message });
      console.log('✗ Status column header exists:', e.message);
    }
    
    // Test 9: Total/Amount column exists
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const header = page.locator('th, [role="columnheader"]').filter({ hasText: /Total|Amount|Price/ }).first();
      const isVisible = await header.isVisible({ timeout: 2000 });
      if (!isVisible) throw new Error('Total/Amount header not found');
      results.push({ test: 'Total/Amount column exists', passed: true });
      console.log('✓ Total/Amount column exists');
    } catch (e) {
      results.push({ test: 'Total/Amount column exists', passed: false, error: e.message });
      console.log('✗ Total/Amount column exists:', e.message);
    }
    
    // Test 10: Table has data rows with PO numbers
    try {
      await page.goto('http://localhost:3000/planning/purchase-orders', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const tableBody = page.locator('tbody, [role="rowgroup"]').last();
      const rows = tableBody.locator('tr, [role="row"]');
      const count = await rows.count();
      if (count < 1) {
        throw new Error('No data rows in table');
      }
      const firstRow = rows.first();
      const rowText = await firstRow.textContent();
      if (!rowText.includes('PO-')) {
        throw new Error('Row doesn\'t contain PO number');
      }
      results.push({ test: 'Table has data with PO numbers', passed: true, count: count });
      console.log(`✓ Table has ${count} data rows with PO numbers`);
    } catch (e) {
      results.push({ test: 'Table has data with PO numbers', passed: false, error: e.message });
      console.log('✗ Table has data with PO numbers:', e.message);
    }
    
    console.log('\n=== PURCHASE ORDERS BATCH 4 SUMMARY ===');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Passed: ${passed}/10`);
    console.log(`Failed: ${failed}/10`);
    
    // Save results
    fs.writeFileSync('/Users/mariuszkrawczyk/.openclaw/workspace/batch4-results.json', JSON.stringify(results, null, 2));
    
  } finally {
    if (browser) await browser.close();
  }
}

runTests().catch(console.error);
