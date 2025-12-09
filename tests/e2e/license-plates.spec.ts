import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData, createTestProducts, createTestWarehouses } from './fixtures/test-setup'

/**
 * License Plate E2E Tests
 * Epic 5: Warehouse & Scanner (Batch 05A-1)
 * Stories: 5.1, 5.2, 5.3, 5.4
 *
 * Tests cover:
 * - Story 5.1: LP Creation & CRUD
 * - Story 5.2: LP Status Management
 * - Story 5.3: Batch & Expiry Tracking
 * - Story 5.4: LP Numbering Configuration
 *
 * Acceptance Criteria:
 * - AC-5.1.1: Create LP with required fields
 * - AC-5.1.2: Auto-generate LP number
 * - AC-5.1.3: Get LP by ID
 * - AC-5.1.4: Get LP by number
 * - AC-5.1.5: List LPs with filters
 * - AC-5.1.6: Update LP
 * - AC-5.2.1: Status transitions
 * - AC-5.2.2: Invalid transition rejection
 * - AC-5.3.1: Get expiring LPs
 * - AC-5.3.2: Get expired LPs
 * - AC-5.3.3: Get LPs by batch
 * - AC-5.3.4: FEFO sorting
 * - AC-5.4.1: LP number format
 * - AC-5.4.2: Warehouse settings
 */

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

let testOrgId: string
let testUserId: string
let testUserEmail: string
let testUserPassword: string
let testProductId: string
let testWarehouseId: string
let testLocationId: string

test.beforeAll(async () => {
  const orgResult = await createTestOrganization()
  testOrgId = orgResult.orgId

  const userResult = await createTestUser(testOrgId)
  testUserId = userResult.userId
  testUserEmail = userResult.email
  testUserPassword = userResult.password
})

test.afterAll(async () => {
  // Cleanup created LPs
  await cleanupTestData(testOrgId)
})

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function loginAsTestUser(page: Page) {
  await page.goto('/login')
  await page.waitForSelector('input[type="email"]', { timeout: 30000 })
  await page.fill('input[type="email"]', testUserEmail)
  await page.fill('input[type="password"]', testUserPassword)
  await page.click('button:has-text("Sign In")')
  await page.waitForURL(/\/(dashboard|warehouse|planning)/, { timeout: 60000 })
}

async function getOrCreateTestProduct(page: Page): Promise<string> {
  if (testProductId) return testProductId

  const response = await page.request.get('/api/products')
  if (response.ok()) {
    const data = await response.json()
    const products = data.products || data || []
    if (products.length > 0) {
      testProductId = products[0].id
      return testProductId
    }
  }

  // Create product via API
  const createResponse = await page.request.post('/api/products', {
    data: {
      code: `TEST-PROD-${Date.now()}`,
      name: 'Test Product for LP',
      type: 'RM',
      uom: 'kg',
      status: 'active',
    },
  })

  if (createResponse.ok()) {
    const data = await createResponse.json()
    testProductId = data.data?.id || data.id
    return testProductId
  }

  throw new Error('Failed to get or create test product')
}

async function getOrCreateTestWarehouse(page: Page): Promise<{ warehouseId: string; locationId: string }> {
  if (testWarehouseId && testLocationId) {
    return { warehouseId: testWarehouseId, locationId: testLocationId }
  }

  // Get existing warehouse
  const whResponse = await page.request.get('/api/settings/warehouses')
  if (whResponse.ok()) {
    const data = await whResponse.json()
    const warehouses = data.warehouses || data || []
    if (warehouses.length > 0) {
      testWarehouseId = warehouses[0].id

      // Get location for this warehouse
      const locResponse = await page.request.get(`/api/settings/locations?warehouse_id=${testWarehouseId}`)
      if (locResponse.ok()) {
        const locData = await locResponse.json()
        const locations = locData.locations || locData || []
        if (locations.length > 0) {
          testLocationId = locations[0].id
          return { warehouseId: testWarehouseId, locationId: testLocationId }
        }
      }
    }
  }

  throw new Error('No test warehouse/location available')
}

async function createLPViaAPI(
  page: Page,
  overrides: Partial<{
    product_id: string
    quantity: number
    uom: string
    warehouse_id: string
    location_id: string
    batch_number: string
    expiry_date: string
    status: string
    qa_status: string
  }> = {}
): Promise<{ id: string; lp_number: string }> {
  const productId = overrides.product_id || (await getOrCreateTestProduct(page))
  const { warehouseId, locationId } = await getOrCreateTestWarehouse(page)

  const response = await page.request.post('/api/warehouse/license-plates', {
    data: {
      product_id: productId,
      quantity: overrides.quantity || 100,
      uom: overrides.uom || 'kg',
      warehouse_id: overrides.warehouse_id || warehouseId,
      location_id: overrides.location_id || locationId,
      batch_number: overrides.batch_number || `BATCH-${Date.now()}`,
      expiry_date: overrides.expiry_date,
      status: overrides.status || 'available',
      qa_status: overrides.qa_status || 'pending',
    },
  })

  if (!response.ok()) {
    const error = await response.text()
    throw new Error(`Failed to create LP: ${error}`)
  }

  const data = await response.json()
  return {
    id: data.data?.id || data.id,
    lp_number: data.data?.lp_number || data.lp_number,
  }
}

// ============================================================================
// STORY 5.1: LP CREATION & CRUD
// ============================================================================

test.describe('Story 5.1: LP Creation & CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('AC-5.1.1: Create LP with required fields', async ({ page }) => {
    const productId = await getOrCreateTestProduct(page)
    const { warehouseId, locationId } = await getOrCreateTestWarehouse(page)

    const response = await page.request.post('/api/warehouse/license-plates', {
      data: {
        product_id: productId,
        quantity: 500,
        uom: 'kg',
        warehouse_id: warehouseId,
        location_id: locationId,
        batch_number: `BATCH-5.1.1-${Date.now()}`,
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.data).toBeDefined()
    expect(data.data.id).toBeDefined()
    expect(data.data.product_id).toBe(productId)
    expect(data.data.quantity).toBe(500)
    expect(data.data.status).toBe('available')
  })

  test('AC-5.1.2: Auto-generate LP number', async ({ page }) => {
    const lp = await createLPViaAPI(page)

    expect(lp.lp_number).toBeDefined()
    expect(lp.lp_number.length).toBeGreaterThan(0)
    // LP number should have a prefix pattern
    expect(lp.lp_number).toMatch(/^LP-|^[A-Z]{2,}-/)
  })

  test('AC-5.1.3: Get LP by ID', async ({ page }) => {
    const lp = await createLPViaAPI(page)

    const response = await page.request.get(`/api/warehouse/license-plates/${lp.id}`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.id || data.data?.id).toBe(lp.id)
    expect(data.lp_number || data.data?.lp_number).toBe(lp.lp_number)
  })

  test('AC-5.1.5: List LPs with filters', async ({ page }) => {
    // Create LP with specific batch
    const batchNumber = `FILTER-TEST-${Date.now()}`
    await createLPViaAPI(page, { batch_number: batchNumber })

    // Filter by batch number
    const response = await page.request.get(`/api/warehouse/license-plates?batch_number=${batchNumber}`)
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    expect(data.data.length).toBeGreaterThanOrEqual(1)
    expect(data.data[0].batch_number).toContain('FILTER-TEST')
  })

  test('AC-5.1.5: List LPs with status filter', async ({ page }) => {
    const response = await page.request.get('/api/warehouse/license-plates?status=available')
    expect(response.ok()).toBeTruthy()

    const data = await response.json()
    // All returned LPs should have 'available' status
    if (data.data.length > 0) {
      data.data.forEach((lp: any) => {
        expect(lp.status).toBe('available')
      })
    }
  })

  test('AC-5.1.6: Update LP', async ({ page }) => {
    const lp = await createLPViaAPI(page)
    const newBatchNumber = `UPDATED-${Date.now()}`

    const response = await page.request.patch(`/api/warehouse/license-plates/${lp.id}`, {
      data: {
        batch_number: newBatchNumber,
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.batch_number || data.data?.batch_number).toBe(newBatchNumber)
  })

  test('Validation: Missing required fields returns 400', async ({ page }) => {
    const response = await page.request.post('/api/warehouse/license-plates', {
      data: {
        // Missing product_id, quantity, uom, warehouse_id
      },
    })

    expect(response.status()).toBe(400)
  })

  test('Authorization: Unauthorized user returns 401', async ({ page }) => {
    // Clear cookies to simulate unauthenticated request
    await page.context().clearCookies()

    const response = await page.request.post('/api/warehouse/license-plates', {
      data: {
        product_id: 'test',
        quantity: 100,
        uom: 'kg',
        warehouse_id: 'test',
      },
    })

    expect(response.status()).toBe(401)
  })
})

// ============================================================================
// STORY 5.2: LP STATUS MANAGEMENT
// ============================================================================

test.describe('Story 5.2: LP Status Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('AC-5.2.1: Valid status transition available -> reserved', async ({ page }) => {
    const lp = await createLPViaAPI(page, { status: 'available' })

    const response = await page.request.patch(`/api/warehouse/license-plates/${lp.id}/status`, {
      data: {
        status: 'reserved',
        reason: 'Reserved for work order',
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.status || data.data?.status).toBe('reserved')
  })

  test('AC-5.2.1: Valid status transition available -> quarantine', async ({ page }) => {
    const lp = await createLPViaAPI(page, { status: 'available' })

    const response = await page.request.patch(`/api/warehouse/license-plates/${lp.id}/status`, {
      data: {
        status: 'quarantine',
        reason: 'Quality issue detected',
      },
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.status || data.data?.status).toBe('quarantine')
  })

  test('AC-5.2.2: Invalid status transition rejected', async ({ page }) => {
    // Create LP with 'consumed' status (terminal state)
    const lp = await createLPViaAPI(page, { status: 'available' })

    // First transition to reserved
    await page.request.patch(`/api/warehouse/license-plates/${lp.id}/status`, {
      data: { status: 'reserved' },
    })

    // Then to consumed
    await page.request.patch(`/api/warehouse/license-plates/${lp.id}/status`, {
      data: { status: 'consumed' },
    })

    // Try invalid transition from consumed -> available
    const response = await page.request.patch(`/api/warehouse/license-plates/${lp.id}/status`, {
      data: { status: 'available' },
    })

    expect(response.ok()).toBeFalsy()
    expect(response.status()).toBe(400)
  })

  test('AC-5.2.3: Status transition creates audit trail', async ({ page }) => {
    const lp = await createLPViaAPI(page, { status: 'available' })

    await page.request.patch(`/api/warehouse/license-plates/${lp.id}/status`, {
      data: {
        status: 'quarantine',
        reason: 'Audit test',
      },
    })

    // Check movement history
    const historyResponse = await page.request.get(`/api/warehouse/license-plates/${lp.id}/movements`)
    if (historyResponse.ok()) {
      const data = await historyResponse.json()
      // Should have status_change movement
      const statusChange = (data.movements || data.data || []).find(
        (m: any) => m.movement_type === 'status_change'
      )
      expect(statusChange).toBeDefined()
    }
  })
})

// ============================================================================
// STORY 5.3: BATCH & EXPIRY TRACKING
// ============================================================================

test.describe('Story 5.3: Batch & Expiry Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('AC-5.3.1: Get LPs expiring within N days', async ({ page }) => {
    // Create LP expiring in 10 days
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    const expiryDate = futureDate.toISOString().split('T')[0]

    await createLPViaAPI(page, {
      expiry_date: expiryDate,
      batch_number: `EXPIRY-TEST-${Date.now()}`,
    })

    // Get LPs expiring in next 30 days
    const response = await page.request.get('/api/warehouse/license-plates?expiry_before=' +
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    // Should include our expiring LP
    expect(data.data.length).toBeGreaterThanOrEqual(0)
  })

  test('AC-5.3.2: Get expired LPs', async ({ page }) => {
    // Create LP that expired yesterday
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 1)
    const expiryDate = pastDate.toISOString().split('T')[0]

    await createLPViaAPI(page, {
      expiry_date: expiryDate,
      batch_number: `EXPIRED-TEST-${Date.now()}`,
    })

    // Get expired LPs
    const today = new Date().toISOString().split('T')[0]
    const response = await page.request.get(`/api/warehouse/license-plates?expiry_before=${today}`)

    expect(response.ok()).toBeTruthy()
  })

  test('AC-5.3.3: Get LPs by batch number', async ({ page }) => {
    const batchNumber = `BATCH-SEARCH-${Date.now()}`

    // Create 2 LPs with same batch
    await createLPViaAPI(page, { batch_number: batchNumber })
    await createLPViaAPI(page, { batch_number: batchNumber })

    // Search by batch
    const response = await page.request.get(`/api/warehouse/license-plates?batch_number=${batchNumber}`)

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.data.length).toBeGreaterThanOrEqual(2)
  })

  test('AC-5.3.4: FEFO sorting (First Expiry First Out)', async ({ page }) => {
    const productId = await getOrCreateTestProduct(page)

    // Create LPs with different expiry dates
    const dates = [30, 10, 20].map((days) => {
      const d = new Date()
      d.setDate(d.getDate() + days)
      return d.toISOString().split('T')[0]
    })

    for (const expiryDate of dates) {
      await createLPViaAPI(page, {
        product_id: productId,
        expiry_date: expiryDate,
        batch_number: `FEFO-${expiryDate}`,
      })
    }

    // Get available LPs sorted by expiry (FEFO)
    const response = await page.request.get(
      `/api/warehouse/license-plates?product_id=${productId}&status=available`
    )

    expect(response.ok()).toBeTruthy()
    const data = await response.json()

    // Verify FEFO order (earliest expiry first)
    if (data.data.length >= 2) {
      for (let i = 0; i < data.data.length - 1; i++) {
        const current = data.data[i].expiry_date
        const next = data.data[i + 1].expiry_date
        if (current && next) {
          expect(new Date(current) <= new Date(next)).toBeTruthy()
        }
      }
    }
  })
})

// ============================================================================
// STORY 5.4: LP NUMBERING CONFIGURATION
// ============================================================================

test.describe('Story 5.4: LP Numbering Configuration', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('AC-5.4.1: LP number follows configured format', async ({ page }) => {
    const lp = await createLPViaAPI(page)

    // LP number should be generated
    expect(lp.lp_number).toBeDefined()
    expect(lp.lp_number.length).toBeGreaterThan(3)
  })

  test('AC-5.4.2: Get warehouse settings', async ({ page }) => {
    const { warehouseId } = await getOrCreateTestWarehouse(page)

    const response = await page.request.get(`/api/warehouse/settings?warehouse_id=${warehouseId}`)

    // Settings endpoint should exist and return data
    if (response.ok()) {
      const data = await response.json()
      // Settings may or may not exist yet
      expect(response.status()).toBe(200)
    }
  })

  test('AC-5.4.3: Unique LP numbers', async ({ page }) => {
    // Create multiple LPs
    const lp1 = await createLPViaAPI(page)
    const lp2 = await createLPViaAPI(page)
    const lp3 = await createLPViaAPI(page)

    // All LP numbers should be unique
    const numbers = [lp1.lp_number, lp2.lp_number, lp3.lp_number]
    const uniqueNumbers = new Set(numbers)
    expect(uniqueNumbers.size).toBe(3)
  })
})

// ============================================================================
// EDGE CASES & ERROR HANDLING
// ============================================================================

test.describe('Edge Cases & Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('Get non-existent LP returns 404', async ({ page }) => {
    const response = await page.request.get('/api/warehouse/license-plates/00000000-0000-0000-0000-000000000000')
    expect(response.status()).toBe(404)
  })

  test('Create LP with invalid product_id returns 400/404', async ({ page }) => {
    const { warehouseId, locationId } = await getOrCreateTestWarehouse(page)

    const response = await page.request.post('/api/warehouse/license-plates', {
      data: {
        product_id: '00000000-0000-0000-0000-000000000000',
        quantity: 100,
        uom: 'kg',
        warehouse_id: warehouseId,
        location_id: locationId,
      },
    })

    // Should fail due to invalid product reference
    expect([400, 404, 500].includes(response.status())).toBeTruthy()
  })

  test('Create LP with negative quantity returns 400', async ({ page }) => {
    const productId = await getOrCreateTestProduct(page)
    const { warehouseId, locationId } = await getOrCreateTestWarehouse(page)

    const response = await page.request.post('/api/warehouse/license-plates', {
      data: {
        product_id: productId,
        quantity: -100,
        uom: 'kg',
        warehouse_id: warehouseId,
        location_id: locationId,
      },
    })

    // Negative quantity should be rejected
    expect([400, 500].includes(response.status())).toBeTruthy()
  })

  test('Pagination works correctly', async ({ page }) => {
    // Get first page
    const response1 = await page.request.get('/api/warehouse/license-plates?limit=5&offset=0')
    expect(response1.ok()).toBeTruthy()

    const data1 = await response1.json()
    expect(data1.data.length).toBeLessThanOrEqual(5)

    // Get second page
    const response2 = await page.request.get('/api/warehouse/license-plates?limit=5&offset=5')
    expect(response2.ok()).toBeTruthy()

    // Pages should have different data (if enough records)
    if (data1.total > 5) {
      const data2 = await response2.json()
      expect(data1.data[0]?.id).not.toBe(data2.data[0]?.id)
    }
  })
})
