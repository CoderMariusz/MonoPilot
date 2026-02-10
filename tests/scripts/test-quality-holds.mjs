import { chromium } from 'playwright';

const email = 'admin@monopilot.com';
const password = 'test1234';

async function testQualityHolds() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate to login page
    console.log('Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('Login page screenshot saved');

    // Wait for email input and fill it
    console.log('Filling login form...');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to complete
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
    
    console.log('Login successful, navigating to quality holds...');
    
    // Navigate to quality holds
    await page.goto('http://localhost:3000/quality/holds', { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: 'quality-holds-page.png' });
    console.log('Quality holds page screenshot saved');
    
    // Check for empty state message
    const emptyStateMessage = await page.$('h2:has-text("No Quality Holds")');
    console.log('Empty state message found:', !!emptyStateMessage);
    
    // Get all h2 elements
    const h2s = await page.locator('h2').all();
    console.log(`Found ${h2s.length} h2 elements`);
    
    for (let i = 0; i < h2s.length; i++) {
      const text = await h2s[i].textContent();
      console.log(`h2 ${i}: "${text}"`);
    }
    
    // Test filtering to get empty state
    console.log('\nTesting search filter...');
    await page.fill('input[placeholder="Search by hold number..."]', 'NONEXISTENT123456');
    
    // Wait for results to load
    await page.waitForTimeout(1000);
    
    // Take screenshot after search
    await page.screenshot({ path: 'quality-holds-empty-search.png' });
    console.log('Quality holds empty search screenshot saved');
    
    // Check for "No holds match" message
    const noResultsMessage = await page.$('text=No holds match your search criteria');
    console.log('No results message found:', !!noResultsMessage);
    
    // Get page content
    const bodyContent = await page.content();
    if (bodyContent.includes('No Quality Holds')) {
      console.log('✓ "No Quality Holds" text found in HTML');
    } else {
      console.log('✗ "No Quality Holds" text NOT found in HTML');
    }
    
    if (bodyContent.includes('No holds match')) {
      console.log('✓ "No holds match" text found in HTML');
    } else {
      console.log('✗ "No holds match" text NOT found in HTML');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
}

testQualityHolds();
