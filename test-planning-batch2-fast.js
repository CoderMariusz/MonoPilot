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
    
    console.log('\n=== PLANNING DASHBOARD BATCH 2 (FAST) ===\n');
    
    // Test 1: PO Pending Approval KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'PO Pending Approval' }).first();
      await kpi.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/purchase-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'PO Pending Approval KPI navigates', passed: true });
      console.log('✓ PO Pending Approval KPI navigates');
    } catch (e) {
      results.push({ test: 'PO Pending Approval KPI navigates', passed: false, error: e.message });
      console.log('✗ PO Pending Approval KPI navigates:', e.message);
    }
    
    // Test 2: PO This Month KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'PO This Month' }).first();
      await kpi.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/purchase-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'PO This Month KPI navigates', passed: true });
      console.log('✓ PO This Month KPI navigates');
    } catch (e) {
      results.push({ test: 'PO This Month KPI navigates', passed: false, error: e.message });
      console.log('✗ PO This Month KPI navigates:', e.message);
    }
    
    // Test 3: TO In Transit KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'TO In Transit' }).first();
      await kpi.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/transfer-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'TO In Transit KPI navigates', passed: true });
      console.log('✓ TO In Transit KPI navigates');
    } catch (e) {
      results.push({ test: 'TO In Transit KPI navigates', passed: false, error: e.message });
      console.log('✗ TO In Transit KPI navigates:', e.message);
    }
    
    // Test 4: WO Scheduled Today KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'WO Scheduled Today' }).first();
      await kpi.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/work-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'WO Scheduled Today KPI navigates', passed: true });
      console.log('✓ WO Scheduled Today KPI navigates');
    } catch (e) {
      results.push({ test: 'WO Scheduled Today KPI navigates', passed: false, error: e.message });
      console.log('✗ WO Scheduled Today KPI navigates:', e.message);
    }
    
    // Test 5: WO Overdue KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'WO Overdue' }).first();
      await kpi.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/work-orders')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'WO Overdue KPI navigates', passed: true });
      console.log('✓ WO Overdue KPI navigates');
    } catch (e) {
      results.push({ test: 'WO Overdue KPI navigates', passed: false, error: e.message });
      console.log('✗ WO Overdue KPI navigates:', e.message);
    }
    
    // Test 6: Open Orders KPI click navigates
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const currentUrl = page.url();
      const kpi = page.locator('[role="button"]').filter({ hasText: 'Open Orders' }).first();
      await kpi.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/')) {
        throw new Error(`URL didn't change. Was: ${newUrl}`);
      }
      results.push({ test: 'Open Orders KPI navigates', passed: true });
      console.log('✓ Open Orders KPI navigates');
    } catch (e) {
      results.push({ test: 'Open Orders KPI navigates', passed: false, error: e.message });
      console.log('✗ Open Orders KPI navigates:', e.message);
    }
    
    // Test 7: Alert item is clickable
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const alertButton = page.locator('[role="button"]').filter({ hasText: /PO-\d{4}-\d{5}/ }).first();
      const alertText = await alertButton.textContent();
      if (!alertText || !alertText.includes('PO-')) {
        throw new Error('No alert button found');
      }
      const currentUrl = page.url();
      await alertButton.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl || !newUrl.includes('/planning/purchase-orders/')) {
        throw new Error(`Alert click didn't navigate properly`);
      }
      results.push({ test: 'Alert link navigates', passed: true });
      console.log('✓ Alert link navigates to detail page');
    } catch (e) {
      results.push({ test: 'Alert link navigates', passed: false, error: e.message });
      console.log('✗ Alert link navigates:', e.message);
    }
    
    // Test 8: Activity item is clickable
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      // Find activity items (ones that have PO or WO numbers and are in activity section)
      const allPoWoButtons = page.locator('[role="button"]').filter({ hasText: /PO-\d{4}-\d{5}|WO-/ });
      const count = await allPoWoButtons.count();
      if (count < 2) {
        throw new Error('Not enough activity items');
      }
      // Get one from the end (likely in activity section)
      const button = allPoWoButtons.nth(count - 1);
      const currentUrl = page.url();
      await button.click();
      await page.waitForTimeout(1500);
      const newUrl = page.url();
      if (newUrl === currentUrl) {
        throw new Error('Activity click didn\'t navigate');
      }
      results.push({ test: 'Activity item navigates', passed: true });
      console.log('✓ Activity item is clickable');
    } catch (e) {
      results.push({ test: 'Activity item navigates', passed: false, error: e.message });
      console.log('✗ Activity item is clickable:', e.message);
    }
    
    // Test 9: Alerts section displays items
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const alertSection = page.locator('text=Alerts').first();
      await alertSection.waitFor({ state: 'visible', timeout: 2000 });
      const alertItems = page.locator('[role="button"]').filter({ hasText: 'Critical' });
      const count = await alertItems.count();
      if (count < 1) {
        throw new Error('No alerts displayed');
      }
      results.push({ test: 'Alerts section has items', passed: true });
      console.log(`✓ Alerts section displays ${count} alerts`);
    } catch (e) {
      results.push({ test: 'Alerts section has items', passed: false, error: e.message });
      console.log('✗ Alerts section has items:', e.message);
    }
    
    // Test 10: Recent Activity section exists
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const activityHeader = page.locator('text=Recent Activity').first();
      await activityHeader.waitFor({ state: 'visible', timeout: 2000 });
      // Count buttons that look like activity items
      const allButtons = page.locator('[role="button"]');
      const count = await allButtons.count();
      if (count < 5) {
        throw new Error('Not enough buttons/items on page');
      }
      results.push({ test: 'Recent Activity section exists', passed: true });
      console.log('✓ Recent Activity section exists');
    } catch (e) {
      results.push({ test: 'Recent Activity section exists', passed: false, error: e.message });
      console.log('✗ Recent Activity section exists:', e.message);
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
