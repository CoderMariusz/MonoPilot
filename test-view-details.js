/**
 * Test Script: Verify "View Details" Functionality
 * 
 * This script tests if the View Details button/functionality works correctly
 * by examining the code flow and testing the components.
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'admin@monopilot.com';
const TEST_PASSWORD = 'test1234';

async function testViewDetails() {
  console.log('🧪 Testing View Details Functionality\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error.message));

    // Step 1: Navigate to login
    console.log('1️⃣  Navigating to login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });

    // Step 2: Login
    console.log('2️⃣  Logging in...');
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' })
    ]);

    // Step 3: Navigate to Work Orders
    console.log('3️⃣  Navigating to Work Orders...');
    await page.goto(`${BASE_URL}/planning/work-orders`, { waitUntil: 'networkidle2' });

    await page.waitForTimeout(2000);

    // Step 4: Check if table has rows
    console.log('4️⃣  Checking for work orders in table...');
    const rows = await page.$$('tbody tr');
    console.log(`   Found ${rows.length} work orders`);

    if (rows.length === 0) {
      console.log('⚠️  No work orders found. Cannot test View Details.');
      return;
    }

    // Step 5: Get first WO number
    const firstRow = rows[0];
    const woNumber = await firstRow.$eval('td:first-child', el => el.textContent?.trim());
    console.log(`5️⃣  Testing with WO: ${woNumber}`);

    // Step 6: Open dropdown menu
    console.log('6️⃣  Opening action menu...');
    const menuButton = await firstRow.$('button[aria-label*="menu"], button[aria-haspopup="true"]');
    
    if (!menuButton) {
      console.error('❌ Menu button not found!');
      return;
    }

    await menuButton.click();
    await page.waitForTimeout(500);

    // Step 7: Find and click "View Details"
    console.log('7️⃣  Looking for "View Details" button...');
    const viewDetailsButton = await page.$('div[role="menuitem"]:has-text("View Details")');
    
    if (!viewDetailsButton) {
      console.error('❌ "View Details" button not found in menu!');
      
      // List all menu items
      const menuItems = await page.$$('div[role="menuitem"]');
      console.log(`   Found ${menuItems.length} menu items:`);
      for (const item of menuItems) {
        const text = await item.textContent();
        console.log(`   - ${text?.trim()}`);
      }
      return;
    }

    console.log('8️⃣  Clicking "View Details"...');
    
    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'networkidle2',
      timeout: 5000
    }).catch(e => console.log('   No navigation occurred'));

    await viewDetailsButton.click();
    await navigationPromise;
    await page.waitForTimeout(2000);

    // Step 9: Check if we're on the detail page
    const currentUrl = page.url();
    console.log(`9️⃣  Current URL: ${currentUrl}`);

    if (currentUrl.includes('/planning/work-orders/') && currentUrl.split('/').length > 4) {
      console.log('✅ SUCCESS: Navigated to detail page!');
      
      // Check if detail page content loaded
      const pageTitle = await page.$('h1');
      if (pageTitle) {
        const titleText = await pageTitle.textContent();
        console.log(`   Page title: ${titleText}`);
      }

      // Check for tabs
      const tabs = await page.$$('[role="tab"]');
      console.log(`   Found ${tabs.length} tabs`);
      
      for (const tab of tabs) {
        const tabText = await tab.textContent();
        console.log(`   - Tab: ${tabText?.trim()}`);
      }

      console.log('\n✅ View Details functionality is WORKING');
    } else {
      console.error('❌ FAILED: Did not navigate to detail page');
      console.error(`   Expected URL pattern: /planning/work-orders/{id}`);
      console.error(`   Actual URL: ${currentUrl}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
if (require.main === module) {
  testViewDetails()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testViewDetails };
