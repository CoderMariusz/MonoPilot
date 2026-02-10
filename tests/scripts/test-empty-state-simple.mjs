import { chromium } from 'playwright';

const email = 'admin@monopilot.com';
const password = 'test1234';

async function testEmptyState() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Login
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Navigate to holds page
    console.log('Navigating to quality holds...');
    await page.goto('http://localhost:3000/quality/holds');
    await page.waitForLoadState('domcontentloaded');
    
    // Test search with no matches
    console.log('\nSearching for non-existent hold...');
    const search = await page.locator('input[placeholder*="Search"]');
    await search.fill('ZZZZZZZ9999999');
    
    // Wait for search to complete
    await page.waitForTimeout(1000);
    
    // Check if empty state is visible
    const html = await page.content();
    const hasEmptyTitle = html.includes('<h2') && html.includes('No Quality Holds');
    const hasEmptyMsg = html.includes('No holds match');
    
    console.log(`  Empty state h2 found in HTML: ${hasEmptyTitle}`);
    console.log(`  Empty message found in HTML: ${hasEmptyMsg}`);
    
    // Check for visible empty state elements
    const h2Elements = await page.locator('h2').count();
    console.log(`  H2 elements visible: ${h2Elements}`);
    
    // Try to find the empty state container
    const emptyContainer = await page.locator('text=No Quality Holds').isVisible().catch(() => false);
    console.log(`  "No Quality Holds" text visible: ${emptyContainer}`);
    
    // Check table visibility
    const table = await page.locator('table').isVisible().catch(() => false);
    console.log(`  Table visible: ${table}`);
    
    // Check if empty state div exists and its display property
    const emptyDiv = await page.locator('div:has(> h2:has-text("No Quality Holds"))').first();
    const isEmptyDivVisible = await emptyDiv.isVisible().catch(() => false);
    console.log(`  Empty state div visible: ${isEmptyDivVisible}`);
    
    if (isEmptyDivVisible) {
      const styles = await emptyDiv.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          height: computed.height,
        };
      });
      console.log(`  Empty state div styles:`, styles);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testEmptyState();
