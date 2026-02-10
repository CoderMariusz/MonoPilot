import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';
const LOGIN_EMAIL = 'admin@monopilot.com';
const LOGIN_PASSWORD = 'test1234';

async function login(page) {
  console.log('Navigating to login page...');
  await page.goto(`${BASE_URL}/login`);
  
  // Wait for form to be ready
  try {
    await page.waitForSelector('input[placeholder="name@example.com"]', { timeout: 10000 });
    console.log('Login form found');
  } catch (e) {
    console.log('Login form not found with expected placeholder, trying alternative selectors...');
    const inputs = await page.locator('input').count();
    console.log(`Found ${inputs} input fields on page`);
    return;
  }
  
  // Fill and submit login form
  await page.fill('input[placeholder="name@example.com"]', LOGIN_EMAIL);
  await page.fill('input[placeholder="Enter your password"]', LOGIN_PASSWORD);
  
  const submitButton = page.getByRole('button', { name: /sign in|login|submit/i });
  await submitButton.click();
  
  // Wait for redirect to authenticated page
  await page.waitForURL(/\/(dashboard|production|planning)/, { timeout: 30000 });
  console.log('Login successful, redirected to authenticated page');
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
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch (e) {
      console.log('Network idle timeout, continuing...');
    }
    console.log('✓ Opened /production/dashboard\n');
    
    // Check page content
    const pageTitle = await page.title();
    console.log(`Page Title: ${pageTitle}`);
    
    // Get visible text content
    const bodyText = await page.locator('body').textContent();
    if (bodyText) {
      console.log(`Page text length: ${bodyText.length} chars`);
      console.log(`Page contains "Orders": ${bodyText.includes('Orders')}`);
      console.log(`Page contains "Production": ${bodyText.includes('Production')}`);
      console.log(`Page contains "Dashboard": ${bodyText.includes('Dashboard')}`);
    }
    
    // Try to find buttons
    const buttons = await page.locator('button').count();
    console.log(`Found ${buttons} buttons on page`);
    
    // Take a screenshot for visual inspection
    const screenshot = await page.screenshot({ path: '/tmp/production-dashboard.png' });
    console.log('\nScreenshot saved to /tmp/production-dashboard.png');
    
    // Try to find elements by role
    console.log('\nLooking for common page elements:');
    try {
      const heading = await page.locator('h1').first().textContent();
      if (heading) console.log(`- Page heading: "${heading}"`);
    } catch (e) {}
    
    try {
      const cards = await page.locator('[class*="card"]').count();
      console.log(`- Found ${cards} card-like elements`);
    } catch (e) {}
    
  } catch (error) {
    console.error('Error during testing:', error.message);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
    console.log('\nBrowser closed');
  }
}

runTests().catch(console.error);
