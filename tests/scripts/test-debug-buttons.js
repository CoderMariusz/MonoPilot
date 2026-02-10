const { chromium } = require('@playwright/test');

async function debug() {
  let browser;
  let page;
  
  try {
    browser = await chromium.connectOverCDP('http://127.0.0.1:18800');
    const contexts = browser.contexts();
    const context = contexts[0];
    const pages = context.pages();
    page = pages[0];
    
    await page.goto('http://localhost:3000/planning', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // Get all buttons
    const buttons = await page.locator('button').all();
    console.log(`\nFound ${buttons.length} buttons on the page:\n`);
    
    for (let i = 0; i < Math.min(20, buttons.length); i++) {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`[${i}] (visible: ${isVisible}) "${text.substring(0, 80)}"`);
    }
    
    // Also check divs/regions that might contain KPI data
    console.log('\n\nSearching for KPI-like elements:');
    const allDivs = await page.locator('//button[contains(text(), "PO")]').all();
    console.log(`Found ${allDivs.length} elements with "PO" in button text`);
    
    for (let div of allDivs) {
      const text = await div.textContent();
      console.log(`- "${text.substring(0, 100)}"`);
    }
    
  } finally {
    if (browser) await browser.close();
  }
}

debug().catch(console.error);
