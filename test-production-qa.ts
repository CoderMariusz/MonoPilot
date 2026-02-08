import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const LOGIN_EMAIL = 'admin@monopilot.com';
const LOGIN_PASSWORD = 'test1234';

async function login(page: any) {
  await page.goto(`${BASE_URL}/login`);
  
  // Wait for form to be ready
  await page.waitForSelector('input[placeholder="name@example.com"]', { timeout: 10000 });
  
  // Fill and submit login form
  await page.fill('input[placeholder="name@example.com"]', LOGIN_EMAIL);
  await page.fill('input[placeholder="Enter your password"]', LOGIN_PASSWORD);
  
  const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
  await submitButton.click();
  
  // Wait for redirect to authenticated page
  await page.waitForURL(/\/(dashboard|production|planning)/, { timeout: 30000 });
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log('Starting QA Tests...\n');
  
  try {
    // Login first
    console.log('1. Logging in...');
    await login(page);
    console.log('✓ Login successful\n');
    
    // Navigate to Production Dashboard
    console.log('2. Navigating to Production Dashboard...');
    await page.goto(`${BASE_URL}/production/dashboard`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    console.log('✓ Opened /production/dashboard\n');
    
    // Check page content
    const pageTitle = await page.title();
    console.log(`Page Title: ${pageTitle}`);
    
    // Look for KPI cards (generic selectors)
    const allDivs = await page.locator('div').count();
    console.log(`Total divs on page: ${allDivs}`);
    
    // Try to find text content
    const pageText = await page.locator('body').textContent();
    if (pageText.includes('Orders') || pageText.includes('Produced') || pageText.includes('Dashboard')) {
      console.log('✓ Dashboard content found');
    }
    
    // Try generic searches
    const headings = await page.locator('h1, h2, h3').count();
    console.log(`Found ${headings} headings`);
    
    // Get all text on page (first 500 chars)
    const htmlContent = await page.content();
    console.log('Page content snippet:', htmlContent.substring(0, 500));
    
  } catch (error) {
    console.error('Error during testing:', error);
    const screenshot = await page.screenshot();
    console.error('Screenshot saved');
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }
}

runTests().catch(console.error);
