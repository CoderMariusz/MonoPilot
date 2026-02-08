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
    
    console.log('\n=== PLANNING DASHBOARD BATCH 2 ===\n');
    
    // Test 1: PO Pending Approval KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'PO Pending Approval' }).first();
      await kpi.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      // Should navigate to purchase orders list with filter
      if (newUrl === currentUrl || !newUrl.includes('/planning/purchase-orders')) {
        throw new Error(`URL didn't change to purchase orders. Was: ${newUrl}`);
      }
      results.push({ test: 'PO Pending Approval KPI navigates to list', passed: true });
      console.log('✓ PO Pending Approval KPI navigates to filtered list');
    } catch (e) {
      results.push({ test: 'PO Pending Approval KPI navigates to list', passed: false, error: e.message });
      console.log('✗ PO Pending Approval KPI navigates to list:', e.message);
    }
    
    // Test 2: PO This Month KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'PO This Month' }).first();
      await kpi.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/purchase-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'PO This Month KPI navigates to list', passed: true });
      console.log('✓ PO This Month KPI navigates to filtered list');
    } catch (e) {
      results.push({ test: 'PO This Month KPI navigates to list', passed: false, error: e.message });
      console.log('✗ PO This Month KPI navigates to list:', e.message);
    }
    
    // Test 3: TO In Transit KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'TO In Transit' }).first();
      await kpi.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/transfer-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'TO In Transit KPI navigates to list', passed: true });
      console.log('✓ TO In Transit KPI navigates to filtered list');
    } catch (e) {
      results.push({ test: 'TO In Transit KPI navigates to list', passed: false, error: e.message });
      console.log('✗ TO In Transit KPI navigates to list:', e.message);
    }
    
    // Test 4: WO Scheduled Today KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'WO Scheduled Today' }).first();
      await kpi.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/work-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'WO Scheduled Today KPI navigates to list', passed: true });
      console.log('✓ WO Scheduled Today KPI navigates to filtered list');
    } catch (e) {
      results.push({ test: 'WO Scheduled Today KPI navigates to list', passed: false, error: e.message });
      console.log('✗ WO Scheduled Today KPI navigates to list:', e.message);
    }
    
    // Test 5: WO Overdue KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'WO Overdue' }).first();
      await kpi.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/work-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'WO Overdue KPI navigates to list', passed: true });
      console.log('✓ WO Overdue KPI navigates to filtered list');
    } catch (e) {
      results.push({ test: 'WO Overdue KPI navigates to list', passed: false, error: e.message });
      console.log('✗ WO Overdue KPI navigates to list:', e.message);
    }
    
    // Test 6: Open Orders KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'Open Orders' }).first();
      await kpi.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'Open Orders KPI navigates', passed: true });
      console.log('✓ Open Orders KPI navigates to filtered list');
    } catch (e) {
      results.push({ test: 'Open Orders KPI navigates', passed: false, error: e.message });
      console.log('✗ Open Orders KPI navigates:', e.message);
    }
    
    // Test 7: Alert item is clickable
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      // Find first alert button  
      const alertButton = page.locator('[role="button"]').filter({ hasText: /PO-\d{4}-\d{5}/ }).first();
      const alertText = await alertButton.textContent();
      if (!alertText || !alertText.includes('PO-')) {
        throw new Error('No alert button found');
      }
      // Click the alert
      const currentUrl = page.url();
      await alertButton.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      // Should navigate to PO detail page
      if (newUrl === currentUrl || !newUrl.includes('/planning/purchase-orders/')) {
        throw new Error(`Alert click didn't navigate. Was: ${currentUrl}, Now: ${newUrl}`);
      }
      results.push({ test: 'Alert link navigates to detail page', passed: true });
      console.log('✓ Alert link navigates to entity detail page');
    } catch (e) {
      results.push({ test: 'Alert link navigates to detail page', passed: false, error: e.message });
      console.log('✗ Alert link navigates to detail page:', e.message);
    }
    
    // Test 8: Activity item is clickable
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      // Find first activity button that has PO or WO number
      const activityButtons = page.locator('[role="button"]').filter({ hasText: /PO-\d{4}-\d{5}|WO-/ });
      const count = await activityButtons.count();
      if (count < 1) {
        throw new Error('No activity items found');
      }
      // Get the last few buttons which should be activities
      const lastButton = activityButtons.last();
      const activityText = await lastButton.textContent();
      console.log(`  Clicking activity: ${activityText.substring(0, 60)}`);
      const currentUrl = page.url();
      await lastButton.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      // Should navigate somewhere, likely to a detail page
      if (newUrl === currentUrl) {
        throw new Error('Activity click didn\t navigate');
      }
      results.push({ test: 'Activity item navigates to detail', passed: true });
      console.log('✓ Activity item is clickable and navigates');
    } catch (e) {
      results.push({ test: 'Activity item navigates to detail', passed: false, error: e.message });
      console.log('✗ Activity item navigates to detail:', e.message);
    }
    
    // Test 9: Alerts section displays multiple items
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      // Find all critical alerts
      const alertItems = page.locator('[role="button"]').filter({ hasText: 'Critical' });
      const count = await alertItems.count();
      if (count < 1) {
        throw new Error('No alerts displayed');
      }
      results.push({ test: 'Alerts section displays items', passed: true, count: count });
      console.log(`✓ Alerts section displays ${count} items`);
    } catch (e) {
      results.push({ test: 'Alerts section displays items', passed: false, error: e.message });
      console.log('✗ Alerts section displays items:', e.message);
    }
    
    // Test 10: Recent Activity section exists
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const activityHeader = page.locator('text=Recent Activity').first();
      await activityHeader.waitFor({ state: 'visible', timeout: 2000 });
      const activityList = page.locator('list').filter({ has: page.locator('text=Recent Activity').first() }).first();
      // Get all activity items in the list
      const activityItems = page.locator('ul:has(text="Recent Activity") >> [role="button"]');
      const count = await activityItems.count();
      if (count < 1) {
        throw new Error('No activity items in list');
      }
      results.push({ test: 'Recent Activity list has items', passed: true, count: count });
      console.log(`✓ Recent Activity section has ${count} items`);
    } catch (e) {
      results.push({ test: 'Recent Activity list has items', passed: false, error: e.message });
      console.log('✗ Recent Activity list has items:', e.message);
    }
    
    console.log('\n=== BATCH 2 SUMMARY ===');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Passed: ${passed}/10`);
    console.log(`Failed: ${failed}/10`);
    
    // Save results
    fs.writeFileSync('/Users/mariuszkrawczyk/.openclaw/workspace/batch2-results.json', JSON.stringify(results, null, 2));
    
  } finally {
    if (browser) await browser.close();
  }
}

runTests().catch(console.error);
