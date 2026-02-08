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
    
    console.log('\n=== PLANNING DASHBOARD BATCH 1 (V2) ===\n');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    // Test 1: Create PO button opens modal
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      const btn = page.locator('button:has-text("Create PO")');
      await btn.click({ timeout: 3000 });
      const modal = page.locator('[role="dialog"]').first();
      await modal.waitFor({ state: 'visible', timeout: 2000 });
      results.push({ test: 'Create PO button opens modal', passed: true });
      console.log('✓ Create PO button opens modal');
      await page.waitForTimeout(500);
    } catch (e) {
      results.push({ test: 'Create PO button opens modal', passed: false, error: e.message });
      console.log('✗ Create PO button opens modal:', e.message);
    }
    
    // Test 2: Create TO button opens modal
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      const btn = page.locator('button:has-text("Create TO")');
      await btn.click({ timeout: 3000 });
      const modal = page.locator('[role="dialog"]').first();
      await modal.waitFor({ state: 'visible', timeout: 2000 });
      results.push({ test: 'Create TO button opens modal', passed: true });
      console.log('✓ Create TO button opens modal');
      await page.waitForTimeout(500);
    } catch (e) {
      results.push({ test: 'Create TO button opens modal', passed: false, error: e.message });
      console.log('✗ Create TO button opens modal:', e.message);
    }
    
    // Test 3: Create WO button opens modal
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      const btn = page.locator('button:has-text("Create WO")');
      await btn.click({ timeout: 3000 });
      const modal = page.locator('[role="dialog"]').first();
      await modal.waitFor({ state: 'visible', timeout: 2000 });
      results.push({ test: 'Create WO button opens modal', passed: true });
      console.log('✓ Create WO button opens modal');
      await page.waitForTimeout(500);
    } catch (e) {
      results.push({ test: 'Create WO button opens modal', passed: false, error: e.message });
      console.log('✗ Create WO button opens modal:', e.message);
    }
    
    // Test 4: PO Pending Approval KPI visible
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const kpi = page.locator('button:has-text("PO Pending Approval")');
      await kpi.waitFor({ state: 'visible', timeout: 3000 });
      const text = await kpi.textContent();
      if (!text.includes('PO Pending Approval')) throw new Error('Text not found');
      results.push({ test: 'PO Pending Approval KPI visible', passed: true });
      console.log('✓ PO Pending Approval KPI visible');
    } catch (e) {
      results.push({ test: 'PO Pending Approval KPI visible', passed: false, error: e.message });
      console.log('✗ PO Pending Approval KPI visible:', e.message);
    }
    
    // Test 5: PO This Month KPI visible
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const kpi = page.locator('button:has-text("PO This Month")');
      await kpi.waitFor({ state: 'visible', timeout: 3000 });
      const text = await kpi.textContent();
      if (!text.includes('PO This Month')) throw new Error('Text not found');
      results.push({ test: 'PO This Month KPI visible', passed: true });
      console.log('✓ PO This Month KPI visible');
    } catch (e) {
      results.push({ test: 'PO This Month KPI visible', passed: false, error: e.message });
      console.log('✗ PO This Month KPI visible:', e.message);
    }
    
    // Test 6: TO In Transit KPI visible
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const kpi = page.locator('button:has-text("TO In Transit")');
      await kpi.waitFor({ state: 'visible', timeout: 3000 });
      const text = await kpi.textContent();
      if (!text.includes('TO In Transit')) throw new Error('Text not found');
      results.push({ test: 'TO In Transit KPI visible', passed: true });
      console.log('✓ TO In Transit KPI visible');
    } catch (e) {
      results.push({ test: 'TO In Transit KPI visible', passed: false, error: e.message });
      console.log('✗ TO In Transit KPI visible:', e.message);
    }
    
    // Test 7: WO Scheduled Today KPI visible
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const kpi = page.locator('button:has-text("WO Scheduled Today")');
      await kpi.waitFor({ state: 'visible', timeout: 3000 });
      const text = await kpi.textContent();
      if (!text.includes('WO Scheduled Today')) throw new Error('Text not found');
      results.push({ test: 'WO Scheduled Today KPI visible', passed: true });
      console.log('✓ WO Scheduled Today KPI visible');
    } catch (e) {
      results.push({ test: 'WO Scheduled Today KPI visible', passed: false, error: e.message });
      console.log('✗ WO Scheduled Today KPI visible:', e.message);
    }
    
    // Test 8: WO Overdue KPI visible
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const kpi = page.locator('button:has-text("WO Overdue")');
      await kpi.waitFor({ state: 'visible', timeout: 3000 });
      const text = await kpi.textContent();
      if (!text.includes('WO Overdue')) throw new Error('Text not found');
      results.push({ test: 'WO Overdue KPI visible', passed: true });
      console.log('✓ WO Overdue KPI visible');
    } catch (e) {
      results.push({ test: 'WO Overdue KPI visible', passed: false, error: e.message });
      console.log('✗ WO Overdue KPI visible:', e.message);
    }
    
    // Test 9: Open Orders KPI visible
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const kpi = page.locator('button:has-text("Open Orders")');
      await kpi.waitFor({ state: 'visible', timeout: 3000 });
      const text = await kpi.textContent();
      if (!text.includes('Open Orders')) throw new Error('Text not found');
      results.push({ test: 'Open Orders KPI visible', passed: true });
      console.log('✓ Open Orders KPI visible');
    } catch (e) {
      results.push({ test: 'Open Orders KPI visible', passed: false, error: e.message });
      console.log('✗ Open Orders KPI visible:', e.message);
    }
    
    // Test 10: Activity Feed visible
    try {
      await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(500);
      const feed = page.locator('text=Recent Activity').first();
      await feed.waitFor({ state: 'visible', timeout: 3000 });
      results.push({ test: 'Activity Feed visible', passed: true });
      console.log('✓ Activity Feed visible');
    } catch (e) {
      results.push({ test: 'Activity Feed visible', passed: false, error: e.message });
      console.log('✗ Activity Feed visible:', e.message);
    }
    
    console.log('\n=== SUMMARY ===');
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    console.log(`Passed: ${passed}/10`);
    console.log(`Failed: ${failed}/10`);
    
    // Save results
    fs.writeFileSync('/Users/mariuszkrawczyk/.openclaw/workspace/batch1-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults saved');
    
  } finally {
    if (browser) await browser.close();
  }
}

runTests().catch(console.error);
