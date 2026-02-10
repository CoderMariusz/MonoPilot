import { chromium } from 'playwright';

async function testLogoutFix() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 15000 });
    
    // Check page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Wait for email input and fill form
    console.log('2. Filling login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.fill('input[type="email"]', 'admin@monopilot.com');
    await page.fill('input[type="password"]', 'test1234');
    
    // Take screenshot
    await page.screenshot({ path: './logout-test-01-form.png' });
    
    // Click login
    console.log('3. Clicking login...');
    await page.click('button:has-text("Login")');
    
    // Wait for navigation and for dashboard to load
    console.log('4. Waiting for dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 });
    
    // Navigate to Planning
    console.log('5. Navigating to Planning module...');
    await page.goto('http://localhost:3000/planning', { waitUntil: 'networkidle', timeout: 10000 });
    
    // Take screenshot of Planning page
    await page.screenshot({ path: './logout-test-02-planning.png' });
    console.log('✓ Planning page loaded');
    
    // Look for user menu button
    console.log('6. Checking for user menu button...');
    
    // Get all buttons
    const buttons = await page.$$('button');
    console.log(`Total buttons found: ${buttons.length}`);
    
    let userMenuFound = false;
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      const ariaLabel = await buttons[i].getAttribute('aria-label');
      const classes = await buttons[i].getAttribute('class');
      
      // Look for the user avatar button (usually has initials or profile info)
      if (classes?.includes('rounded-full') || text?.match(/^[A-Z]{1,2}$/) || ariaLabel?.includes('user')) {
        console.log(`Found potential user menu button at index ${i}:`, {
          text: text?.trim(),
          ariaLabel,
          classes: classes?.substring(0, 50)
        });
        
        // Try clicking it
        try {
          await buttons[i].click();
          await page.waitForTimeout(500);
          userMenuFound = true;
          console.log('✓ User menu button clicked');
          break;
        } catch (e) {
          // Continue looking
        }
      }
    }
    
    if (!userMenuFound) {
      console.log('✗ User menu button not found, trying direct selector...');
      // Try to find by common avatar selectors
      const avatarBtn = await page.$('button[class*="rounded-full"]');
      if (avatarBtn) {
        console.log('✓ Found avatar button by class selector');
        await avatarBtn.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Take screenshot after menu click
    await page.screenshot({ path: './logout-test-03-menu-opened.png' });
    
    // Look for logout option
    console.log('7. Looking for Logout option...');
    const menuItems = await page.$$('[role="menuitem"]');
    console.log(`Menu items found: ${menuItems.length}`);
    
    let logoutFound = false;
    for (let item of menuItems) {
      const text = await item.textContent();
      console.log(`  Menu item: ${text?.trim()}`);
      if (text?.toLowerCase().includes('logout')) {
        logoutFound = true;
        console.log('✓ LOGOUT OPTION FOUND');
      }
    }
    
    if (!logoutFound) {
      console.log('✗ LOGOUT OPTION NOT FOUND');
      // Check page content
      const pageContent = await page.content();
      if (pageContent.includes('Logout')) {
        console.log('  (Logout text exists in page, but not in menu item)');
      }
    }
    
    // Also check for UserMenu component or logout button text anywhere
    const hasLogoutText = await page.locator('text=Logout').isVisible();
    console.log(`8. Logout text visible on page: ${hasLogoutText}`);
    
    console.log('\n✅ Test completed. Check screenshots for visual verification.');
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: './logout-test-error.png' });
  } finally {
    await browser.close();
  }
}

testLogoutFix().catch(console.error);
