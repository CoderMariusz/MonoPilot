/**
 * E2E Tests for Story 2.27: BOM Item Alternatives
 * Tests CRUD operations for alternative components on BOM items
 */

import { test, expect } from '@playwright/test'
import {
  createTestOrganization,
  createTestUser,
  cleanupTestData,
  createTestProducts
} from './fixtures/test-setup'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TestContext {
  orgId: string
  userId: string
  token: string
  productIds: string[]
  bomId: string
  itemId: string
  alternativeId: string
}

test.describe('Story 2.27: BOM Item Alternatives', () => {
  let ctx: TestContext

  test.beforeAll(async () => {
    // Setup test data
    const { orgId } = await createTestOrganization()
    const { userId, token } = await createTestUser(orgId)
    const products = await createTestProducts(orgId, 5)
    const productIds = products.map(p => p.id)

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Create a BOM for test product
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .insert({
        org_id: orgId,
        product_id: productIds[0],
        version: 'TEST-ALT-1',
        effective_from: '2025-01-01',
        status: 'Draft',
        output_qty: 1,
        output_uom: 'kg',
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (bomError) throw new Error(`Failed to create BOM: ${bomError.message}`)

    // Create a BOM item
    const { data: item, error: itemError } = await supabase
      .from('bom_items')
      .insert({
        bom_id: bom.id,
        component_id: productIds[1],
        operation_seq: 1,
        is_output: false,
        quantity: 10,
        uom: 'kg',
        scrap_percent: 0,
        sequence: 1
      })
      .select()
      .single()

    if (itemError) throw new Error(`Failed to create BOM item: ${itemError.message}`)

    ctx = {
      orgId,
      userId,
      token,
      productIds,
      bomId: bom.id,
      itemId: item.id,
      alternativeId: ''
    }
  })

  test.afterAll(async () => {
    if (ctx?.orgId) {
      await cleanupTestData(ctx.orgId)
    }
  })

  // ============================================================================
  // AC-2.27.3: List alternatives (initially empty)
  // ============================================================================
  test('AC-2.27.3: should list empty alternatives initially', async ({ request, baseURL }) => {
    const response = await request.get(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`
        }
      }
    )

    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json.data).toEqual([])
  })

  // ============================================================================
  // AC-2.27.4: Create alternative
  // ============================================================================
  test('AC-2.27.4: should create alternative with priority and ratio', async ({ request, baseURL }) => {
    const response = await request.post(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          alternative_component_id: ctx.productIds[2],
          priority: 1,
          quantity_ratio: 1.5,
          notes: 'Primary alternative'
        }
      }
    )

    expect(response.status()).toBe(201)
    const json = await response.json()
    expect(json.data.alternative_component_id).toBe(ctx.productIds[2])
    expect(json.data.priority).toBe(1)
    expect(json.data.quantity_ratio).toBe(1.5)
    expect(json.data.notes).toBe('Primary alternative')
    expect(json.data.alternative_component).toBeDefined()

    ctx.alternativeId = json.data.id
  })

  test('AC-2.27.4: should create second alternative with different priority', async ({ request, baseURL }) => {
    const response = await request.post(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          alternative_component_id: ctx.productIds[3],
          priority: 2,
          quantity_ratio: 1.0
        }
      }
    )

    expect(response.status()).toBe(201)
    const json = await response.json()
    expect(json.data.priority).toBe(2)
  })

  // ============================================================================
  // AC-2.27.4: Validation - self-reference
  // ============================================================================
  test('AC-2.27.4: should reject alternative same as primary component', async ({ request, baseURL }) => {
    const response = await request.post(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          alternative_component_id: ctx.productIds[1], // Same as primary
          priority: 3
        }
      }
    )

    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('SELF_REFERENCE')
  })

  // ============================================================================
  // AC-2.27.4: Validation - duplicate
  // ============================================================================
  test('AC-2.27.4: should reject duplicate alternative', async ({ request, baseURL }) => {
    const response = await request.post(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          alternative_component_id: ctx.productIds[2], // Already added
          priority: 5
        }
      }
    )

    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('DUPLICATE_ALTERNATIVE')
  })

  // ============================================================================
  // AC-2.27.3: List alternatives (with data)
  // ============================================================================
  test('AC-2.27.3: should list alternatives ordered by priority', async ({ request, baseURL }) => {
    const response = await request.get(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`
        }
      }
    )

    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json.data.length).toBe(2)
    expect(json.data[0].priority).toBe(1)
    expect(json.data[1].priority).toBe(2)
  })

  // ============================================================================
  // AC-2.27.5: Update alternative
  // ============================================================================
  test('AC-2.27.5: should update alternative priority and ratio', async ({ request, baseURL }) => {
    const response = await request.put(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives/${ctx.alternativeId}`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          priority: 10,
          quantity_ratio: 2.0,
          notes: 'Updated notes'
        }
      }
    )

    expect(response.status()).toBe(200)
    const json = await response.json()
    expect(json.data.priority).toBe(10)
    expect(json.data.quantity_ratio).toBe(2.0)
    expect(json.data.notes).toBe('Updated notes')
  })

  // ============================================================================
  // AC-2.27.5: Update - not found
  // ============================================================================
  test('AC-2.27.5: should return 404 for non-existent alternative', async ({ request, baseURL }) => {
    const fakeId = '00000000-0000-0000-0000-000000000000'
    const response = await request.put(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives/${fakeId}`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          priority: 5
        }
      }
    )

    expect(response.status()).toBe(404)
    const json = await response.json()
    expect(json.error).toBe('ALTERNATIVE_NOT_FOUND')
  })

  // ============================================================================
  // AC-2.27.6: Delete alternative
  // ============================================================================
  test('AC-2.27.6: should delete alternative', async ({ request, baseURL }) => {
    const response = await request.delete(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives/${ctx.alternativeId}`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`
        }
      }
    )

    expect(response.status()).toBe(200)

    // Verify deletion
    const listResponse = await request.get(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`
        }
      }
    )

    const json = await listResponse.json()
    expect(json.data.length).toBe(1) // Only one left
  })

  // ============================================================================
  // AC-2.27.8: Authorization - unauthenticated
  // ============================================================================
  test('AC-2.27.8: should reject unauthenticated requests', async ({ request, baseURL }) => {
    const response = await request.get(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`
    )

    expect(response.status()).toBe(401)
  })

  // ============================================================================
  // AC-2.27.4: Validation - invalid component
  // ============================================================================
  test('AC-2.27.4: should reject invalid alternative component', async ({ request, baseURL }) => {
    const fakeComponentId = '00000000-0000-0000-0000-000000000000'
    const response = await request.post(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          alternative_component_id: fakeComponentId,
          priority: 1
        }
      }
    )

    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('INVALID_ALTERNATIVE_COMPONENT')
  })

  // ============================================================================
  // AC-2.27.9: Validation - quantity_ratio limits
  // ============================================================================
  test('AC-2.27.9: should reject negative quantity_ratio', async ({ request, baseURL }) => {
    const response = await request.post(
      `${baseURL}/api/technical/boms/${ctx.bomId}/items/${ctx.itemId}/alternatives`,
      {
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
          'Content-Type': 'application/json'
        },
        data: {
          alternative_component_id: ctx.productIds[4],
          priority: 1,
          quantity_ratio: -1
        }
      }
    )

    expect(response.status()).toBe(400)
    const json = await response.json()
    expect(json.error).toBe('Invalid request data')
  })
})
