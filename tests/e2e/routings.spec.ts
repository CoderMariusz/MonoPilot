/**
 * Story 2.24 - Routing Restructure E2E Tests
 *
 * Tests API endpoints for routings and operations
 */

import { test, expect } from '@playwright/test'
import { createTestOrganization, createTestUser, cleanupTestData } from './fixtures/test-setup'

test.describe('Story 2.24 - Routing Restructure', () => {
  let orgId: string
  let token: string
  let routingId: string

  test.beforeAll(async () => {
    const org = await createTestOrganization()
    orgId = org.orgId
    const user = await createTestUser(orgId)
    token = user.token
  })

  test.afterAll(async () => {
    await cleanupTestData(orgId)
  })

  test('Create routing and operations, then delete', async ({ request, baseURL }) => {
    // 1. Create routing via API
    const createRes = await request.post(`${baseURL}/api/technical/routings`, {
      headers: {
        'Content-Type': 'application/json',
        cookie: `sb-auth=${token}`,
      },
      data: {
        name: 'E2E Test Routing',
        description: 'E2E test routing for Story 2.24',
        is_active: true,
      },
    })

    expect(createRes.status()).toBe(201)
    const { routing } = await createRes.json()
    routingId = routing.id
    expect(routing.name).toBe('E2E Test Routing')
    expect(routing.is_active).toBe(true)

    // 2. Add 3 operations with labor costs
    const operations = [
      { sequence: 1, name: 'Mixing', labor_cost_per_hour: 25.50 },
      { sequence: 2, name: 'Baking', labor_cost_per_hour: 30.00 },
      { sequence: 3, name: 'Packaging', labor_cost_per_hour: 15.00 },
    ]

    for (const op of operations) {
      const opRes = await request.post(`${baseURL}/api/technical/routings/${routingId}/operations`, {
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb-auth=${token}`,
        },
        data: op,
      })
      expect(opRes.status()).toBe(201)
    }

    // 3. List operations - verify ordered by sequence
    const listRes = await request.get(`${baseURL}/api/technical/routings/${routingId}/operations`, {
      headers: { cookie: `sb-auth=${token}` },
    })
    expect(listRes.status()).toBe(200)
    const { operations: ops } = await listRes.json()
    expect(ops).toHaveLength(3)
    expect(ops[0].sequence).toBe(1)
    expect(ops[1].sequence).toBe(2)
    expect(ops[2].sequence).toBe(3)
    expect(ops[0].labor_cost_per_hour).toBe(25.50)

    // 4. Update first operation labor cost
    const updateRes = await request.put(
      `${baseURL}/api/technical/routings/${routingId}/operations/${ops[0].id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          cookie: `sb-auth=${token}`,
        },
        data: { labor_cost_per_hour: 35.00 },
      }
    )
    expect(updateRes.status()).toBe(200)
    const { operation: updatedOp } = await updateRes.json()
    expect(updatedOp.labor_cost_per_hour).toBe(35.00)

    // 5. Delete routing - cascades operations
    const deleteRes = await request.delete(`${baseURL}/api/technical/routings/${routingId}`, {
      headers: { cookie: `sb-auth=${token}` },
    })
    expect(deleteRes.status()).toBe(200)

    // 6. Verify routing is gone
    const getRes = await request.get(`${baseURL}/api/technical/routings/${routingId}`, {
      headers: { cookie: `sb-auth=${token}` },
    })
    expect(getRes.status()).toBe(404)
  })

  test('Duplicate name returns error', async ({ request, baseURL }) => {
    // Create routing
    await request.post(`${baseURL}/api/technical/routings`, {
      headers: {
        'Content-Type': 'application/json',
        cookie: `sb-auth=${token}`,
      },
      data: { name: 'Duplicate Name Test', is_active: true },
    })

    // Try again with same name
    const dupRes = await request.post(`${baseURL}/api/technical/routings`, {
      headers: {
        'Content-Type': 'application/json',
        cookie: `sb-auth=${token}`,
      },
      data: { name: 'Duplicate Name Test', is_active: true },
    })
    expect(dupRes.status()).toBe(400)
    const data = await dupRes.json()
    expect(data.error).toContain('name already exists')
  })

  test('Duplicate sequence returns error', async ({ request, baseURL }) => {
    // Create routing
    const res = await request.post(`${baseURL}/api/technical/routings`, {
      headers: {
        'Content-Type': 'application/json',
        cookie: `sb-auth=${token}`,
      },
      data: { name: 'Seq Dup Test', is_active: true },
    })
    const { routing } = await res.json()

    // Add operation
    await request.post(`${baseURL}/api/technical/routings/${routing.id}/operations`, {
      headers: {
        'Content-Type': 'application/json',
        cookie: `sb-auth=${token}`,
      },
      data: { sequence: 1, name: 'First' },
    })

    // Try duplicate sequence
    const dupRes = await request.post(`${baseURL}/api/technical/routings/${routing.id}/operations`, {
      headers: {
        'Content-Type': 'application/json',
        cookie: `sb-auth=${token}`,
      },
      data: { sequence: 1, name: 'Second' },
    })
    expect(dupRes.status()).toBe(400)
  })

  test('Unauthenticated request returns 401', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/api/technical/routings`)
    expect(response.status()).toBe(401)
  })
})
