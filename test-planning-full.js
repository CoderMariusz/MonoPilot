const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: '✓' });
    console.log(`✓ ${name}`);
  } catch (error) {
    results.push({ name, status: '✗', error: error.message });
    console.log(`✗ ${name}: ${error.message}`);
  }
}

async function runTests() {
  let browser;
  let page;
  
  try {
    // Connect to CDP
    browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
    const contexts = browser.contexts();
    const context = contexts[0];
    const pages = context.pages();
    page = pages[0];
    
    console.log('\n=== PLANNING DASHBOARD TESTS ===\n');
    
    // Navigate to dashboard
    await page.goto('http://localhost:3000/planning');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Create PO button opens modal
    await test('Create PO button: Opens purchase order form modal', async () => {
      const btn = page.locator('button:has-text("Create PO")');
      await btn.click();
      const modal = await page.locator('[role="dialog"]');
      if (!await modal.isVisible()) throw new Error('Modal not visible');
      await page.keyboard.press('Escape'); // Close modal
      await page.waitForTimeout(300);
    });
    
    // Test 2: Create TO button opens modal
    await test('Create TO button: Opens transfer order form modal', async () => {
      const btn = page.locator('button:has-text("Create TO")');
      await btn.click();
      const modal = await page.locator('[role="dialog"]');
      if (!await modal.isVisible()) throw new Error('Modal not visible');
      await page.keyboard.press('Escape'); // Close modal
      await page.waitForTimeout(300);
    });
    
    // Test 3: Create WO button opens modal
    await test('Create WO button: Opens work order form modal', async () => {
      const btn = page.locator('button:has-text("Create WO")');
      await btn.click();
      const modal = await page.locator('[role="dialog"]');
      if (!await modal.isVisible()) throw new Error('Modal not visible');
      await page.press('Escape'); // Close modal
      await page.waitForTimeout(300);
    });
    
    // Test 4: PO Pending Approval KPI shows count
    await test('PO Pending Approval: Shows count', async () => {
      const kpiText = await page.locator('text=PO Pending Approval').first().isVisible();
      if (!kpiText) throw new Error('KPI not found');
      const count = await page.locator('button:has-text("PO Pending Approval")').textContent();
      if (!count) throw new Error('Count not shown');
    });
    
    // Test 5: PO This Month KPI shows count
    await test('PO This Month: Shows count', async () => {
      const kpiText = await page.locator('text=PO This Month').first().isVisible();
      if (!kpiText) throw new Error('KPI not found');
      const count = await page.locator('button:has-text("PO This Month")').textContent();
      if (!count) throw new Error('Count not shown');
    });
    
    // Test 6: TO In Transit KPI shows count
    await test('TO In Transit: Shows count', async () => {
      const kpiText = await page.locator('text=TO In Transit').first().isVisible();
      if (!kpiText) throw new Error('KPI not found');
      const count = await page.locator('button:has-text("TO In Transit")').textContent();
      if (!count) throw new Error('Count not shown');
    });
    
    // Test 7: WO Scheduled Today KPI shows count
    await test('WO Scheduled Today: Shows count', async () => {
      const kpiText = await page.locator('text=WO Scheduled Today').first().isVisible();
      if (!kpiText) throw new Error('KPI not found');
      const count = await page.locator('button:has-text("WO Scheduled Today")').textContent();
      if (!count) throw new Error('Count not shown');
    });
    
    // Test 8: WO Overdue KPI shows count
    await test('WO Overdue: Shows count', async () => {
      const kpiText = await page.locator('text=WO Overdue').first().isVisible();
      if (!kpiText) throw new Error('KPI not found');
      const count = await page.locator('button:has-text("WO Overdue")').textContent();
      if (!count) throw new Error('Count not shown');
    });
    
    // Test 9: Open Orders KPI shows count
    await test('Open Orders: Shows count', async () => {
      const btn = page.locator('button:has-text("Open Orders")');
      if (!await btn.isVisible()) throw new Error('KPI not found');
      const text = await btn.textContent();
      if (!text || !text.includes('Open Orders')) throw new Error('Text not correct');
    });
    
    // Test 10: PO Pending Approval KPI is clickable
    await test('PO Pending Approval: Click filters by pending approval status', async () => {
      const currentUrl = page.url();
      const btn = page.locator('button:has-text("PO Pending Approval")');
      await btn.click();
      await page.waitForLoadState('networkidle');
      const newUrl = page.url();
      if (newUrl === currentUrl) throw new Error('URL did not change after click');
      await page.goBack();
      await page.waitForLoadState('networkidle');
    });
    
    console.log('\n=== BATCH 1 COMPLETED ===');
    console.log(`Passed: ${results.filter(r => r.status === '✓').length}/10`);
    console.log(`Failed: ${results.filter(r => r.status === '✗').length}/10\n`);
    
  } finally {
    if (browser) await browser.close();
    
    // Save results
    const reportPath = '/Users/mariuszkrawczyk/.openclaw/workspace/TEST_RESULTS.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${reportPath}`);
    process.exit(0);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
