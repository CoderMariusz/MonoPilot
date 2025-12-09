/**
 * Story 2.25 - BOM Production Lines E2E Tests
 *
 * Tests API endpoints for BOM production line assignments
 */

import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

test.describe.serial('Story 2.25 - BOM Production Lines', () => {
  let orgId: string
  let userEmail: string
  let userPassword: string
  let productId: string
  let bomId: string
  let lineId1: string
  let lineId2: string
  let warehouseId: string
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const org = await createTestOrganization()
    orgId = org.orgId
    const user = await createTestUser(orgId)
    userEmail = user.email
    userPassword = user.password

    // Create a single browser context/page for all tests to share state
    const context = await browser.newContext()
    page = await context.newPage()

    // Login once
    await page.goto('/login')
    await page.waitForSelector('input[type="email"]', { timeout: 30000 })
    await page.fill('input[type="email"]', userEmail)
    await page.fill('input[type="password"]', userPassword)
    await page.click('button:has-text("Sign In")')
    await page.waitForURL(/\/(dashboard|planning|technical)/, { timeout: 60000 })
  })

  test.afterAll(async () => {
    await page?.close()
    await cleanupTestData(orgId)
  })

  test('Setup: Create warehouse, production lines, product and BOM', async () => {
    const suffix = Date.now().toString(36)

    // 1. Create warehouse
    const whRes = await page.request.post('/api/settings/warehouses', {
      data: {
        code: `WH-225-${suffix}`.toUpperCase(),
        name: `E2E Test Warehouse 2.25 ${suffix}`,
        is_active: true,
      },
    })
    expect(whRes.status()).toBe(201)
    const whData = await whRes.json()
    warehouseId = whData.warehouse?.id || whData.id

    // 2. Create production line 1
    const line1Res = await page.request.post('/api/settings/lines', {
      data: {
        code: `L1-${suffix}`.toUpperCase(),
        name: `E2E Line 1 ${suffix}`,
        warehouse_id: warehouseId,
      },
    })
    expect(line1Res.status()).toBe(201)
    const line1Data = await line1Res.json()
    lineId1 = line1Data.line?.id || line1Data.id

    // 3. Create production line 2
    const line2Res = await page.request.post('/api/settings/lines', {
      data: {
        code: `L2-${suffix}`.toUpperCase(),
        name: `E2E Line 2 ${suffix}`,
        warehouse_id: warehouseId,
      },
    })
    expect(line2Res.status()).toBe(201)
    const line2Data = await line2Res.json()
    lineId2 = line2Data.line?.id || line2Data.id

    // 4. Create product
    const prodRes = await page.request.post('/api/technical/products', {
      data: {
        code: `P225-${suffix}`.toUpperCase(),
        name: `E2E Test Product 2.25 ${suffix}`,
        type: 'FG',
        uom: 'EA',
      },
    })
    expect(prodRes.status()).toBe(201)
    const prodData = await prodRes.json()
    productId = prodData.product?.id || prodData.id

    // 5. Create BOM
    const bomRes = await page.request.post('/api/technical/boms', {
      data: {
        product_id: productId,
        effective_from: '2025-01-01',
        status: 'Draft',
        output_qty: 1,
        output_uom: 'EA',
      },
    })
    expect(bomRes.status()).toBe(201)
    const bomData = await bomRes.json()
    bomId = bomData.bom?.id || bomData.id
  })

  test('GET /api/technical/boms/:id/lines returns empty list initially', async () => {
    const response = await page.request.get(`/api/technical/boms/${bomId}/lines`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.lines).toHaveLength(0)
    expect(data.total).toBe(0)
  })

  test('PUT /api/technical/boms/:id/lines assigns 2 production lines', async () => {
    const response = await page.request.put(`/api/technical/boms/${bomId}/lines`, {
      data: {
        lines: [
          { line_id: lineId1, labor_cost_per_hour: 25.50 },
          { line_id: lineId2 },
        ],
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.lines).toHaveLength(2)
    expect(data.message).toBe('BOM lines updated successfully')

    // Verify first line has labor cost
    const line1 = data.lines.find((l: { line_id: string }) => l.line_id === lineId1)
    expect(line1.labor_cost_per_hour).toBe(25.50)

    // Verify second line has no labor cost
    const line2 = data.lines.find((l: { line_id: string }) => l.line_id === lineId2)
    expect(line2.labor_cost_per_hour).toBeNull()
  })

  test('GET /api/technical/boms/:id/lines returns both lines', async () => {
    const response = await page.request.get(`/api/technical/boms/${bomId}/lines`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.lines).toHaveLength(2)
    expect(data.total).toBe(2)

    // Verify line details are joined
    const line1 = data.lines.find((l: { line_id: string }) => l.line_id === lineId1)
    expect(line1.line).toBeDefined()
    expect(line1.line.name).toContain('E2E Line 1')
  })

  test('GET /api/technical/boms/:id includes production_lines', async () => {
    const response = await page.request.get(`/api/technical/boms/${bomId}`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.bom.production_lines).toBeDefined()
    expect(data.bom.production_lines).toHaveLength(2)
  })

  test('PUT /api/technical/boms/:id/lines updates to 1 line', async () => {
    const response = await page.request.put(`/api/technical/boms/${bomId}/lines`, {
      data: {
        lines: [{ line_id: lineId1, labor_cost_per_hour: 30.00 }],
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.lines).toHaveLength(1)
    expect(data.lines[0].line_id).toBe(lineId1)
    expect(data.lines[0].labor_cost_per_hour).toBe(30.00)
  })

  test('PUT /api/technical/boms/:id/lines with empty array clears all', async () => {
    const response = await page.request.put(`/api/technical/boms/${bomId}/lines`, {
      data: {
        lines: [],
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.lines).toHaveLength(0)
  })

  test('PUT /api/technical/boms/:id/lines with duplicate line_id returns 400', async () => {
    const response = await page.request.put(`/api/technical/boms/${bomId}/lines`, {
      data: {
        lines: [
          { line_id: lineId1 },
          { line_id: lineId1 },
        ],
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('DUPLICATE')
  })

  test('PUT /api/technical/boms/:id/lines with invalid line_id returns 400', async () => {
    const fakeLineId = '00000000-0000-0000-0000-000000000000'
    const response = await page.request.put(`/api/technical/boms/${bomId}/lines`, {
      data: {
        lines: [{ line_id: fakeLineId }],
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('INVALID_LINE')
  })

  test('Unauthenticated request returns 401', async ({ request, baseURL }) => {
    // Use fresh request context without cookies
    const response = await request.get(`${baseURL}/api/technical/boms/${bomId}/lines`)
    expect(response.status()).toBe(401)
  })
})
