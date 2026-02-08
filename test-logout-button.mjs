import { chromium } from 'playwright';

async function testLogout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: './test-01-homepage.png' });
    console.log('✓ Home page loaded');

    // Check if redirected to login
    const url = page.url();
    console.log('Current URL:', url);

    if (url.includes('login')) {
      console.log('2. On login page, filling credentials...');
      
      // Wait for form to load
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      
      await page.fill('input[type="email"]', 'admin@monopilot.com');
      await page.fill('input[type="password"]', 'test1234');
      
      // Take screenshot
      await page.screenshot({ path: './test-02-form-filled.png' });
      
      // Click login button
      console.log('3. Clicking login...');
      await page.click('button:has-text("Login")');
      
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
      await page.screenshot({ path: './test-03-after-login.png' });
      console.log('✓ Logged in');
    }

    // Navigate to Planning
    console.log('4. Navigating to Planning module...');
    await page.goto('http://localhost:3000/planning', { waitUntil: 'networkidle', timeout: 10000 });
    await page.screenshot({ path: './test-04-planning-page.png' });
    console.log('✓ Planning page loaded');

    // Look for user menu button (should be in header)
    console.log('5. Looking for user menu button...');
    const buttons = await page.$$('button');
    let userMenuFound = false;
    
    for (let btn of buttons) {
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      console.log(`  Button: "${text}", aria-label: "${ariaLabel}"`);
      
      // Look for user avatar button (usually the one with initials)
      if ((text && text.match(/^[A-Z]{1,2}$/)) || ariaLabel?.includes('user') || ariaLabel?.includes('menu')) {
        userMenuFound = true;
        console.log('✓ User menu button found, clicking...');
        await btn.click();
        await page.waitForTimeout(500);
        break;
      }
    }

    if (!userMenuFound) {
      console.log('✗ User menu button not found');
    }

    // Take screenshot to see if menu opened
    await page.screenshot({ path: './test-05-user-menu-opened.png' });

    // Look for logout option in the menu
    console.log('6. Looking for logout option...');
    const logoutItems = await page.$$('text=Logout');
    if (logoutItems && logoutItems.length > 0) {
      console.log('✓ Logout option FOUND');
    } else {
      console.log('✗ Logout option NOT FOUND');
      
      // Check what menu items are visible
      const menuItems = await page.$$('[role="menuitem"]');
      console.log(`Menu items found: ${menuItems.length}`);
      for (let item of menuItems) {
        const text = await item.textContent();
        console.log(`  - ${text}`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: './test-error.png' });
  } finally {
    await browser.close();
  }
}

testLogout().catch(console.error);
