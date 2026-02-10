import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:3000'
const EMAIL = 'admin@monopilot.com'
const PASSWORD = 'test1234'

async function createHolds(page) {
  console.log('Creating test holds...')
  
  for (let i = 1; i <= 25; i++) {
    try {
      // Click Create Hold button
      await page.click('button:has-text("Create Hold")')
      await page.waitForSelector('text=Create Quality Hold')
      
      // Fill reason
      const reasonTextarea = page.locator('textarea[placeholder*="Describe the reason"]')
      await reasonTextarea.fill(`Test Hold ${i} - Pagination Test`)
      
      // Create Hold button
      await page.click('button:has-text("Create Hold"):last-of-type')
      
      // Wait for modal to close
      await page.waitForTimeout(500)
      await page.reload()
      console.log(`✓ Created hold ${i}`)
    } catch (error) {
      console.error(`Error creating hold ${i}:`, error.message)
    }
  }
}

async function testPagination(page) {
  console.log('\n--- Testing Pagination ---')
  
  // Navigate to holds page
  await page.goto(`${BASE_URL}/quality/holds`)
  await page.waitForLoadState('networkidle')
  
  let pageNum = 1
  let morePages = true
  
  while (morePages) {
    console.log(`\nOn page ${pageNum}`)
    
    // Get current URL and check if pagination controls exist
    const nextButton = await page.locator('button:has-text("Next")').isEnabled()
    const prevButton = await page.locator('button:has-text("Previous")').isEnabled()
    
    console.log(`  Next button enabled: ${nextButton}`)
    console.log(`  Previous button enabled: ${prevButton}`)
    
    // Get table rows count
    const rows = await page.locator('table tbody tr').count()
    console.log(`  Visible rows: ${rows}`)
    
    if (nextButton) {
      // Get current query params to check offset
      const currentUrl = page.url()
      const urlParams = new URL(currentUrl).searchParams
      const currentOffset = parseInt(urlParams.get('offset') || '0')
      const currentLimit = parseInt(urlParams.get('limit') || '20')
      console.log(`  Current offset: ${currentOffset}, limit: ${currentLimit}`)
      
      // Click Next
      console.log(`  Clicking Next button...`)
      await page.click('button:has-text("Next")')
      await page.waitForLoadState('networkidle')
      
      const newUrl = page.url()
      const newParams = new URL(newUrl).searchParams
      const newOffset = parseInt(newParams.get('offset') || '0')
      console.log(`  New offset after Next: ${newOffset}`)
      
      pageNum++
    } else {
      morePages = false
    }
  }
  
  // Now test backward navigation
  console.log(`\n--- Testing Backward Navigation ---`)
  console.log(`Currently on page ${pageNum}`)
  
  // Go back pages
  for (let i = pageNum; i > 1; i--) {
    const prevButton = await page.locator('button:has-text("Previous")').isEnabled()
    console.log(`\nPage ${i}: Previous button enabled: ${prevButton}`)
    
    if (prevButton) {
      const currentUrl = page.url()
      const currentParams = new URL(currentUrl).searchParams
      const currentOffset = parseInt(currentParams.get('offset') || '0')
      console.log(`  Current offset: ${currentOffset}`)
      
      console.log(`  Clicking Previous button...`)
      await page.click('button:has-text("Previous")')
      await page.waitForLoadState('networkidle')
      
      const newUrl = page.url()
      const newParams = new URL(newUrl).searchParams
      const newOffset = parseInt(newParams.get('offset') || '0')
      console.log(`  New offset after Previous: ${newOffset}`)
      
      // Check if offset is correct
      const expectedOffset = (i - 2) * 20
      if (newOffset !== expectedOffset) {
        console.error(`  ERROR: Expected offset ${expectedOffset}, got ${newOffset}`)
      } else {
        console.log(`  ✓ Offset is correct`)
      }
    } else {
      console.error('  ERROR: Previous button is disabled but we should be able to go back!')
      break
    }
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  
  try {
    // Navigate to login
    await page.goto(`${BASE_URL}`)
    
    // Check if already logged in by looking for Dashboard
    const isDashboard = await page.locator('text=Dashboard').isVisible().catch(() => false)
    
    if (!isDashboard) {
      console.log('Logging in...')
      // Wait for auth form to appear
      await page.waitForSelector('input[type="email"], input[placeholder*="email"]', { timeout: 5000 }).catch(() => null)
      
      // Try to find and fill email input
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').first()
      await emailInput.fill(EMAIL)
      
      // Fill password
      const passwordInput = page.locator('input[type="password"]').first()
      await passwordInput.fill(PASSWORD)
      
      // Submit form
      await page.locator('button[type="submit"]').first().click()
      await page.waitForLoadState('networkidle')
    }
    
    // Create test holds
    await page.goto(`${BASE_URL}/quality/holds`)
    await page.waitForLoadState('networkidle')
    
    // await createHolds(page)
    
    // Test pagination
    await testPagination(page)
    
  } finally {
    await browser.close()
  }
}

main().catch(console.error)
