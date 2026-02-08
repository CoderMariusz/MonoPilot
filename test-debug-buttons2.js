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
    
    // Look for text content
    console.log('\nSearching for "PO Pending Approval" text:');
    const poElements = await page.locator('text="PO Pending Approval"').all();
    console.log(`Found ${poElements.length} elements`);
    
    for (let i = 0; i < poElements.length; i++) {
      const parent = poElements[i].locator('xpath=ancestor::*[1]');
      const tagName = await parent.evaluate(el => el.tagName);
      const role = await parent.evaluate(el => el.getAttribute('role'));
      const classList = await parent.evaluate(el => el.className);
      console.log(`  [${i}] Tag: ${tagName}, Role: ${role}, Classes: ${classList}`);
    }
    
    // Try finding by paragraph
    console.log('\nSearching for paragraphs with PO text:');
    const paraElements = await page.locator('//p[contains(text(), "PO Pending")]').all();
    console.log(`Found ${paraElements.length} paragraph elements`);
    
    for (let i = 0; i < paraElements.length; i++) {
      const text = await paraElements[i].textContent();
      const parent = paraElements[i].locator('xpath=ancestor::button[1]');
      const isButton = await parent.count() > 0;
      console.log(`  [${i}] Text: "${text}", Has button parent: ${isButton}`);
    }
    
    // Try finding all interactive elements
    console.log('\nSearching for all clickable elements with role=button:');
    const roleButtons = await page.locator('[role="button"]').all();
    console.log(`Found ${roleButtons.length} role=button elements`);
    
    for (let i = 0; i < Math.min(15, roleButtons.length); i++) {
      const text = await roleButtons[i].textContent();
      const isVisible = await roleButtons[i].isVisible();
      console.log(`  [${i}] (visible: ${isVisible}) "${text.substring(0, 60)}"`);
    }
    
    // Screenshot
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('\nScreenshot saved to debug-screenshot.png');
    
  } finally {
    if (browser) await browser.close();
  }
}

debug().catch(console.error);
