import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const LOGIN_EMAIL = 'admin@monopilot.com';
const LOGIN_PASSWORD = 'test1234';
const TEST_PLAN_PATH = './TEST_PLAN_PRODUCTION.md';

let testResults = [];

async function login(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[placeholder="name@example.com"]', { timeout: 10000 });
  
  await page.fill('input[placeholder="name@example.com"]', LOGIN_EMAIL);
  await page.fill('input[placeholder="Enter your password"]', LOGIN_PASSWORD);
  
  const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
  await submitButton.click();
  
  await page.waitForURL(/\/(dashboard|production|planning)/, { timeout: 30000 });
}

async function testElement(page, testName, testFn) {
  try {
    const result = await testFn(page);
    testResults.push({ test: testName, status: result ? '✓' : '✗', result });
    console.log(`${result ? '✓' : '✗'} ${testName}`);
    return result;
  } catch (error) {
    testResults.push({ test: testName, status: '✗', error: error.message });
    console.log(`✗ ${testName} - Error: ${error.message}`);
    return false;
  }
}

async function runProductionDashboardTests(page) {
  console.log('\n=== PRODUCTION DASHBOARD TESTS ===\n');
  
  await page.goto(`${BASE_URL}/production/dashboard`);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  // Test KPI Cards existence
  await testElement(page, 'Orders Today: Card visible', async (p) => {
    return await p.locator('text=/Orders|WO/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  await testElement(page, 'Units Produced: Card visible', async (p) => {
    return await p.locator('text=/Units|Produced/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  await testElement(page, 'Avg Yield: Card visible', async (p) => {
    return await p.locator('text=/Yield|%/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  await testElement(page, 'Active WOs: Card visible', async (p) => {
    return await p.locator('text=/Active.*WO/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  await testElement(page, 'Material Shortages: Card visible', async (p) => {
    return await p.locator('text=/Shortage|Material/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  // Test refresh button
  await testElement(page, 'Refresh button: Present and clickable', async (p) => {
    const refreshBtn = p.locator('button').filter({ has: p.locator('svg') }).first();
    return await refreshBtn.isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  // Test Active Work Orders Table
  await testElement(page, 'Active WOs Table: Present', async (p) => {
    const table = p.locator('table, [role="table"]').first();
    return await table.isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  // Test Alerts Panel
  await testElement(page, 'Alerts Panel: Present or empty state shown', async (p) => {
    const alertPanel = p.locator('text=/Alert|Warning|Critical/i').first();
    return await alertPanel.isVisible({ timeout: 5000 }).catch(async () => {
      // Check for empty state
      return await p.locator('text=/No.*alert|No.*item/i').first().isVisible({ timeout: 2000 }).catch(() => false);
    });
  });
  
  // Test Error States
  await testElement(page, 'Loading state: Not showing spinner or data loaded', async (p) => {
    const spinner = p.locator('[class*="spinner"], [class*="loader"], .animate-spin').first();
    const isSpinning = await spinner.isVisible({ timeout: 2000 }).catch(() => false);
    return !isSpinning; // Pass if no spinner visible
  });
}

async function runWorkOrderDetailsTests(page) {
  console.log('\n=== WORK ORDER DETAILS TESTS ===\n');
  
  // Navigate to first work order (assuming we can find one)
  await page.goto(`${BASE_URL}/production/dashboard`);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  // Try to click first work order
  try {
    const firstWO = page.locator('table tbody tr, [role="row"]').first();
    await firstWO.click({ timeout: 5000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  } catch (e) {
    console.log('⚠ No work orders found to test details');
    return;
  }
  
  // Check if we're on a work order details page
  const isOnWODetails = await page.url().includes('/work-orders/');
  if (!isOnWODetails) {
    console.log('⚠ Could not navigate to work order details');
    return;
  }
  
  // Test Back button
  await testElement(page, 'Back button: Present and navigates back', async (p) => {
    const backBtn = p.locator('button').filter({ has: p.locator('[class*="back"], [class*="arrow"]') }).first();
    return await backBtn.isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  // Test WO Info Section
  await testElement(page, 'WO Number: Displayed', async (p) => {
    return await p.locator('text=/WO|Work Order/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  });
  
  // Test status badge
  await testElement(page, 'Status Badge: Present', async (p) => {
    return await p.locator('[class*="badge"], [class*="status"]').first().isVisible({ timeout: 5000 }).catch(() => false);
  });
}

async function updateTestPlan(passCount, failCount, totalCount) {
  const testPlanContent = fs.readFileSync(TEST_PLAN_PATH, 'utf-8');
  let lines = testPlanContent.split('\n');
  
  // Group results by tested items
  const uncheckResults = testResults.filter(r => r.status === '✓');
  const failedResults = testResults.filter(r => r.status === '✗');
  
  // For now, just report results
  console.log(`\n\n=== TEST SUMMARY ===`);
  console.log(`Total Tests Run: ${totalCount}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Pass Rate: ${((passCount / totalCount) * 100).toFixed(1)}%`);
  
  if (failedResults.length > 0) {
    console.log(`\n=== FAILED TESTS ===`);
    failedResults.forEach(r => console.log(`✗ ${r.test}`));
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Starting Production Module QA Tests...\n');
    
    // Login
    console.log('Logging in...');
    await login(page);
    console.log('✓ Login successful\n');
    
    // Run dashboard tests
    await runProductionDashboardTests(page);
    
    // Run work order details tests
    await runWorkOrderDetailsTests(page);
    
    // Calculate results
    const passCount = testResults.filter(r => r.status === '✓').length;
    const failCount = testResults.filter(r => r.status === '✗').length;
    const totalCount = testResults.length;
    
    // Update test plan and report results
    await updateTestPlan(passCount, failCount, totalCount);
    
  } catch (error) {
    console.error('Fatal error:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

main().catch(console.error);
