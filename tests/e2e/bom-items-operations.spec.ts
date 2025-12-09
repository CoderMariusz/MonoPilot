/**
 * Story 2.26 - BOM Items with Operation Assignment E2E Tests
 *
 * Tests API endpoints for BOM items with operation assignment
 */

import { test, expect, Page } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

test.describe.serial('Story 2.26 - BOM Items Operation Assignment', () => {
  let orgId: string
  let userEmail: string
  let userPassword: string
  let productId: string
  let componentId1: string
  let componentId2: string
  let bomId: string
  let routingId: string
  let lineId: string
  let warehouseId: string
  let itemId: string
  let page: Page

  test.beforeAll(async ({ browser }) => {
    const org = await createTestOrganization()
    orgId = org.orgId
    const user = await createTestUser(orgId)
    userEmail = user.email
    userPassword = user.password

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

  test('Setup: Create warehouse, line, routing, products and BOM', async () => {
    const suffix = Date.now().toString(36)

    // 1. Create warehouse
    const whRes = await page.request.post('/api/settings/warehouses', {
      data: {
        code: `WH-226-${suffix}`.toUpperCase(),
        name: `E2E Test Warehouse 2.26 ${suffix}`,
        is_active: true,
      },
    })
    expect(whRes.status()).toBe(201)
    const whData = await whRes.json()
    warehouseId = whData.warehouse?.id || whData.id

    // 2. Create production line
    const lineRes = await page.request.post('/api/settings/lines', {
      data: {
        code: `L226-${suffix}`.toUpperCase(),
        name: `E2E Line 2.26 ${suffix}`,
        warehouse_id: warehouseId,
      },
    })
    expect(lineRes.status()).toBe(201)
    const lineData = await lineRes.json()
    lineId = lineData.line?.id || lineData.id

    // 3. Create main product (FG)
    const prodRes = await page.request.post('/api/technical/products', {
      data: {
        code: `FG226-${suffix}`.toUpperCase(),
        name: `E2E Finished Good 2.26 ${suffix}`,
        type: 'FG',
        uom: 'EA',
      },
    })
    expect(prodRes.status()).toBe(201)
    const prodData = await prodRes.json()
    productId = prodData.product?.id || prodData.id

    // 4. Create component 1 (RM)
    const comp1Res = await page.request.post('/api/technical/products', {
      data: {
        code: `RM226A-${suffix}`.toUpperCase(),
        name: `E2E Raw Material A ${suffix}`,
        type: 'RM',
        uom: 'KG',
      },
    })
    expect(comp1Res.status()).toBe(201)
    const comp1Data = await comp1Res.json()
    componentId1 = comp1Data.product?.id || comp1Data.id

    // 5. Create component 2 (RM)
    const comp2Res = await page.request.post('/api/technical/products', {
      data: {
        code: `RM226B-${suffix}`.toUpperCase(),
        name: `E2E Raw Material B ${suffix}`,
        type: 'RM',
        uom: 'L',
      },
    })
    expect(comp2Res.status()).toBe(201)
    const comp2Data = await comp2Res.json()
    componentId2 = comp2Data.product?.id || comp2Data.id

    // 6. Create routing
    const routingRes = await page.request.post('/api/technical/routings', {
      data: {
        code: `RT226-${suffix}`.toUpperCase(),
        name: `E2E Routing 2.26 ${suffix}`,
        status: 'Active',
      },
    })
    expect(routingRes.status()).toBe(201)
    const routingData = await routingRes.json()
    routingId = routingData.routing?.id || routingData.id

    // 7. Add operations to routing
    await page.request.post(`/api/technical/routings/${routingId}/operations`, {
      data: {
        sequence: 10,
        name: 'Mixing',
        work_center: 'WC1',
        estimated_duration_minutes: 30,
      },
    })
    await page.request.post(`/api/technical/routings/${routingId}/operations`, {
      data: {
        sequence: 20,
        name: 'Packaging',
        work_center: 'WC2',
        estimated_duration_minutes: 15,
      },
    })

    // 8. Create BOM with routing
    const bomRes = await page.request.post('/api/technical/boms', {
      data: {
        product_id: productId,
        effective_from: '2025-01-01',
        status: 'Draft',
        output_qty: 1,
        output_uom: 'EA',
        routing_id: routingId,
      },
    })
    expect(bomRes.status()).toBe(201)
    const bomData = await bomRes.json()
    bomId = bomData.bom?.id || bomData.id

    // 9. Assign line to BOM (for line_ids validation)
    await page.request.put(`/api/technical/boms/${bomId}/lines`, {
      data: {
        lines: [{ line_id: lineId }],
      },
    })
  })

  test('GET /api/technical/boms/:id/items returns empty list initially', async () => {
    const response = await page.request.get(`/api/technical/boms/${bomId}/items`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.data).toHaveLength(0)
  })

  test('POST /api/technical/boms/:id/items creates item with operation_seq', async () => {
    const response = await page.request.post(`/api/technical/boms/${bomId}/items`, {
      data: {
        component_id: componentId1,
        operation_seq: 10,
        quantity: 5.5,
        uom: 'KG',
        scrap_percent: 2,
        sequence: 1,
        consume_whole_lp: false,
        notes: 'Test item 1',
      },
    })

    expect(response.status()).toBe(201)
    const data = await response.json()
    expect(data.data.component_id).toBe(componentId1)
    expect(data.data.operation_seq).toBe(10)
    expect(data.data.quantity).toBe(5.5)
    expect(data.data.is_output).toBe(false)
    expect(data.message).toBe('BOM item added successfully')

    itemId = data.data.id
  })

  test('POST creates item with is_output=true (byproduct)', async () => {
    const response = await page.request.post(`/api/technical/boms/${bomId}/items`, {
      data: {
        component_id: componentId2,
        operation_seq: 20,
        is_output: true,
        quantity: 0.5,
        uom: 'L',
        sequence: 1,
      },
    })

    expect(response.status()).toBe(201)
    const data = await response.json()
    expect(data.data.is_output).toBe(true)
    expect(data.data.operation_seq).toBe(20)
  })

  test('GET /api/technical/boms/:id/items returns items ordered by operation_seq', async () => {
    const response = await page.request.get(`/api/technical/boms/${bomId}/items`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.data.length).toBeGreaterThanOrEqual(2)

    // Verify order: operation_seq 10 before 20
    const seqs = data.data.map((item: { operation_seq: number }) => item.operation_seq)
    expect(seqs[0]).toBeLessThanOrEqual(seqs[1])
  })

  test('GET with group_by_operation=true returns grouped structure', async () => {
    const response = await page.request.get(`/api/technical/boms/${bomId}/items?group_by_operation=true`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.data.operations).toBeDefined()
    expect(Array.isArray(data.data.operations)).toBe(true)

    // Should have 2 operations (10 and 20)
    expect(data.data.operations.length).toBe(2)

    // Operation 10 should have inputs
    const op10 = data.data.operations.find((op: { operation_seq: number }) => op.operation_seq === 10)
    expect(op10.inputs.length).toBeGreaterThanOrEqual(1)

    // Operation 20 should have outputs
    const op20 = data.data.operations.find((op: { operation_seq: number }) => op.operation_seq === 20)
    expect(op20.outputs.length).toBeGreaterThanOrEqual(1)
  })

  test('PUT /api/technical/boms/:id/items/:itemId updates item', async () => {
    const response = await page.request.put(`/api/technical/boms/${bomId}/items/${itemId}`, {
      data: {
        quantity: 7.5,
        scrap_percent: 3,
        notes: 'Updated notes',
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.data.quantity).toBe(7.5)
    expect(data.data.scrap_percent).toBe(3)
    expect(data.data.notes).toBe('Updated notes')
  })

  test('PUT can assign line_ids to item', async () => {
    const response = await page.request.put(`/api/technical/boms/${bomId}/items/${itemId}`, {
      data: {
        line_ids: [lineId],
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.data.line_ids).toContain(lineId)
  })

  test('PUT can clear line_ids to null', async () => {
    const response = await page.request.put(`/api/technical/boms/${bomId}/items/${itemId}`, {
      data: {
        line_ids: null,
      },
    })

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.data.line_ids).toBeNull()
  })

  test('POST with invalid component_id returns 400', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const response = await page.request.post(`/api/technical/boms/${bomId}/items`, {
      data: {
        component_id: fakeId,
        operation_seq: 10,
        quantity: 1,
        uom: 'EA',
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('INVALID_COMPONENT')
  })

  test('POST with invalid operation_seq returns 400', async () => {
    const response = await page.request.post(`/api/technical/boms/${bomId}/items`, {
      data: {
        component_id: componentId1,
        operation_seq: 999, // Not in routing
        quantity: 1,
        uom: 'EA',
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('INVALID_OPERATION_SEQ')
  })

  test('POST with self-reference (input) returns 400', async () => {
    const response = await page.request.post(`/api/technical/boms/${bomId}/items`, {
      data: {
        component_id: productId, // Same as BOM product
        operation_seq: 10,
        is_output: false, // Input cannot be self-reference
        quantity: 1,
        uom: 'EA',
      },
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('SELF_REFERENCE')
  })

  test('POST with empty line_ids array returns 400', async () => {
    const response = await page.request.post(`/api/technical/boms/${bomId}/items`, {
      data: {
        component_id: componentId1,
        operation_seq: 10,
        quantity: 1,
        uom: 'EA',
        line_ids: [], // Empty array not allowed
      },
    })

    expect(response.status()).toBe(400)
  })

  test('DELETE /api/technical/boms/:id/items/:itemId removes item', async () => {
    const response = await page.request.delete(`/api/technical/boms/${bomId}/items/${itemId}`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    expect(data.message).toBe('BOM item deleted successfully')
  })

  test('GET after delete shows reduced count', async () => {
    const response = await page.request.get(`/api/technical/boms/${bomId}/items`)

    expect(response.status()).toBe(200)
    const data = await response.json()
    // Should have 1 item left (the byproduct)
    expect(data.data.length).toBe(1)
  })

  test('Unauthenticated request returns 401', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/technical/boms/${bomId}/items`)
    expect(response.status()).toBe(401)
  })
})
