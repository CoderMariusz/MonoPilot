const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
  const contexts = browser.contexts();
  const context = contexts[0];
  const pages = context.pages();
  const page = pages[0];
  
  if (!page) {
    console.log('No page found');
    await browser.close();
    process.exit(1);
  }
  
  console.log('Current URL:', page.url());
  
  // Navigate to planning dashboard
  await page.goto('http://localhost:3000/planning');
  console.log('Navigated to planning dashboard');
  
  // Check if Create PO button exists
  const createPoBtn = await page.locator('button:has-text("Create PO")');
  console.log('Create PO button found:', await createPoBtn.isVisible());
  
  // Click Create PO button
  await createPoBtn.click();
  console.log('Clicked Create PO button');
  
  // Wait for modal to appear
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {
    console.log('Modal did not appear');
  });
  
  const modal = await page.locator('[role="dialog"]');
  const isVisible = await modal.isVisible().catch(() => false);
  console.log('Modal visible:', isVisible);
  
  await page.screenshot({ path: 'test-dashboard-1.png' });
  
  await browser.close();
  console.log('Test completed');
})();
