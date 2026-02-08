import { chromium } from 'playwright';

const email = 'admin@monopilot.com';
const password = 'test1234';

async function testAPI() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login first
    console.log('Logging in...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 });
    
    console.log('Logged in, checking API responses...\n');
    
    // Intercept API responses
    const responses = [];
    page.on('response', async (response) => {
      if (response.url().includes('/api/quality/holds')) {
        try {
          const body = await response.json();
          responses.push({
            url: response.url(),
            status: response.status(),
            data: body,
          });
        } catch (e) {
          responses.push({
            url: response.url(),
            status: response.status(),
            error: e.message,
          });
        }
      }
    });

    // Test 1: Normal request
    console.log('TEST 1: Normal request (no filters)');
    await page.goto('http://localhost:3000/quality/holds', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      console.log(`  URL: ${lastResponse.url}`);
      console.log(`  Status: ${lastResponse.status}`);
      console.log(`  Holds count: ${lastResponse.data?.holds?.length || 'N/A'}`);
      console.log(`  Total: ${lastResponse.data?.pagination?.total || 'N/A'}`);
    }
    
    responses.length = 0;
    
    // Test 2: Search request
    console.log('\nTEST 2: Search request (search=NONEXISTENT)');
    const searchInput = await page.locator('input[placeholder="Search by hold number..."]');
    await searchInput.fill('NONEXISTENT');
    await page.waitForTimeout(800); // Wait for debounce + response
    
    if (responses.length > 0) {
      const lastResponse = responses[responses.length - 1];
      console.log(`  URL: ${lastResponse.url}`);
      console.log(`  Status: ${lastResponse.status}`);
      console.log(`  Holds count: ${lastResponse.data?.holds?.length || 'N/A'}`);
      console.log(`  Total: ${lastResponse.data?.pagination?.total || 'N/A'}`);
      console.log(`  Full response:`, JSON.stringify(lastResponse.data, null, 2));
    } else {
      console.log('  No API responses captured');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testAPI();
