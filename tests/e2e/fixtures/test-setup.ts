/**
 * Test Setup Fixtures
 * Helpers for E2E test initialization and cleanup
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

// ============================================================================
// Test Organization Setup
// ============================================================================

export async function createTestOrganization(): Promise<{ orgId: string }> {
  // Use TEST_ORG_ID from environment instead of creating new org
  const testOrgId = process.env.TEST_ORG_ID
  if (!testOrgId) {
    throw new Error('TEST_ORG_ID not configured in .env.test')
  }

  // Verify org exists
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', testOrgId)
      .single()

    if (error || !data) {
      throw new Error(`Organization with id ${testOrgId} not found in Supabase`)
    }

    return { orgId: testOrgId }
  } catch (error) {
    console.error('Failed to verify test organization:', error)
    throw error
  }
}

// ============================================================================
// Test User Setup
// ============================================================================

export async function createTestUser(orgId: string): Promise<{
  userId: string
  email: string
  password: string
  token: string
}> {
  try {
    // Create auth user with credentials from env or defaults
    const email = `test-user-${Date.now()}@monopilot.test`
    const password = process.env.TEST_USER_PASSWORD || 'Test123!@#'

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { org_id: orgId },
    })

    if (error) throw error

    const userId = data.user?.id || ''

    // Create user profile
    await supabase.from('users').insert({
      id: userId,
      email,
      org_id: orgId,
      role: 'admin',
      status: 'active',
    })

    // Get JWT token via Supabase REST API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

    const tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({
        email,
        password,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get JWT token: ${tokenResponse.statusText}`)
    }

    const tokenData = await tokenResponse.json()
    const token = tokenData.access_token || ''

    if (!token) {
      throw new Error('No access token returned from auth endpoint')
    }

    return {
      userId,
      email,
      password,
      token,
    }
  } catch (error) {
    console.error('Failed to create test user:', error)
    throw error
  }
}

// ============================================================================
// Test Warehouses Setup
// ============================================================================

export async function createTestWarehouses(orgId: string): Promise<{
  from_warehouse_id: string
  to_warehouse_id: string
}> {
  try {
    // Create two test warehouses
    const { data, error } = await supabase
      .from('warehouses')
      .insert([
        {
          org_id: orgId,
          code: `WH-FROM-${Date.now()}`,
          name: `Test Warehouse From ${Date.now()}`,
          address: '123 Test St',
          status: 'active',
        },
        {
          org_id: orgId,
          code: `WH-TO-${Date.now()}`,
          name: `Test Warehouse To ${Date.now()}`,
          address: '456 Test Ave',
          status: 'active',
        },
      ])
      .select('id')

    if (error) throw error

    return {
      from_warehouse_id: data[0].id,
      to_warehouse_id: data[1].id,
    }
  } catch (error) {
    console.error('Failed to create test warehouses:', error)
    throw error
  }
}

// ============================================================================
// Test Products Setup
// ============================================================================

export async function createTestProducts(
  orgId: string,
  count = 3
): Promise<Array<{ id: string; code: string; name: string }>> {
  try {
    const products = Array.from({ length: count }, (_, i) => ({
      org_id: orgId,
      code: `PROD-${Date.now()}-${i}`,
      name: `Test Product ${i} ${Date.now()}`,
      uom: 'kg',
      status: 'active',
    }))

    const { data, error } = await supabase.from('products').insert(products).select('id, code, name')

    if (error) throw error

    return data
  } catch (error) {
    console.error('Failed to create test products:', error)
    throw error
  }
}

// ============================================================================
// Cleanup
// ============================================================================

export async function cleanupTestData(orgId: string): Promise<void> {
  try {
    // Delete in correct order due to foreign keys
    // 1. Transfer Order line LP selections
    const { data: toLines } = await supabase
      .from('to_lines')
      .select('id')
      .eq('transfer_order_id', orgId)

    if (toLines && toLines.length > 0) {
      const lineIds = toLines.map((l) => l.id)
      await supabase.from('to_line_lps').delete().in('to_line_id', lineIds)
    }

    // 2. Transfer Orders and their lines (cascade)
    await supabase.from('transfer_orders').delete().eq('org_id', orgId)

    // 3. Products
    await supabase.from('products').delete().eq('org_id', orgId)

    // 4. Warehouses
    await supabase.from('warehouses').delete().eq('org_id', orgId)

    // 5. Users
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .eq('org_id', orgId)

    if (users && users.length > 0) {
      const userIds = users.map((u) => u.id)
      await supabase.auth.admin.deleteUser(userIds[0])
      await supabase.from('users').delete().in('id', userIds)
    }

    // Note: Don't delete organization - it's used across multiple test runs
    // It's cleaned up manually or persists as test org fixture

    console.log(`Cleaned up test data for org: ${orgId}`)
  } catch (error) {
    console.error('Failed to cleanup test data:', error)
    // Don't throw - cleanup errors shouldn't fail tests
  }
}

// ============================================================================
// Test Data Helpers
// ============================================================================

export async function getOrCreateTestOrganization(name?: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id')
      .ilike('name', `%Test%${name || ''}%`)
      .limit(1)
      .single()

    if (!error && data) {
      return data.id
    }

    // Create new if not found
    const result = await createTestOrganization()
    return result.orgId
  } catch (error) {
    console.error('Error getting/creating test organization:', error)
    const result = await createTestOrganization()
    return result.orgId
  }
}
