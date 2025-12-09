import { test, expect } from '../../support/fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * P0 Tests: Story 2.24 - Routing Operations CRUD
 *
 * Tests routing operations endpoints with labor cost handling.
 * Risk Coverage: R-001, R-002 (operations cascade delete)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_ORG_ID = process.env.TEST_ORG_ID || '';
const API_BASE = process.env.BASE_URL || 'http://localhost:5000';

test.describe('Story 2.24: Routing Operations - P0 Critical Tests', () => {
  let testUser: any;
  let testRouting: any;

  test.beforeAll(async () => {
    // Create test user
    const password = 'TestPassword123!';
    const email = `test-ops-${Date.now()}@test.com`.toLowerCase();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    // Create public user
    await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        role: 'technical',
        status: 'active',
        org_id: TEST_ORG_ID,
      })
      .select()
      .single();

    testUser = {
      id: authUser.user.id,
      email,
      password,
      org_id: TEST_ORG_ID,
    };
  });

  test.afterAll(async () => {
    if (testUser?.id) {
      try {
        await supabase.from('users').delete().eq('id', testUser.id);
        await supabase.auth.admin.deleteUser(testUser.id);
      } catch (error) {
        console.error('Failed to cleanup test user:', error);
      }
    }
  });

  test.beforeEach(async () => {
    // Create test routing for all operations tests
    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Ops Test Routing ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    testRouting = routing;
  });

  test.afterEach(async () => {
    // Cleanup operations and routing
    if (testRouting?.id) {
      await supabase.from('routing_operations').delete().eq('routing_id', testRouting.id);
      await supabase.from('routings').delete().eq('id', testRouting.id);
    }
  });

  // Helper function to login and get session cookies for page.request
  async function loginForAPI(page: any, context: any, email: string, password: string) {
    await page.goto('/login');
    await page.fill('input[placeholder="name@example.com"]', email);
    await page.fill('input[placeholder="Enter your password"]', password);
    await page.click('button[type="submit"]');
    // Wait for either dashboard or planning page URL, allowing more time
    await page.waitForURL(/\/(dashboard|planning|login)/, { timeout: 60000 });
    // If still on login, wait a bit more for redirect
    if (page.url().includes('/login')) {
      await page.waitForTimeout(3000);
    }

    // Extract cookies from page and add to context for page.request
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'sb-auth-token' || c.name.includes('session'));

    if (!sessionCookie) {
      // If no explicit session cookie, try to get from localStorage via Supabase
      const sessionData = await page.evaluate(() => {
        const auth = window.localStorage.getItem('sb-' + 'auth-token');
        return auth;
      });

      if (sessionData) {
        await context.addCookies([{
          name: 'sb-auth-token',
          value: sessionData,
          domain: new URL(page.url()).hostname,
          path: '/',
        }]);
      }
    }
  }

  // =========================================================================
  // P0-013: POST /api/technical/routings/:id/operations
  // =========================================================================

  test('P0-013: POST creates operation with labor_cost_per_hour', async ({ page, context }) => {
    /**
     * AC-2.24.6: Create operation endpoint
     * - sequence required, unique per routing
     * - labor_cost_per_hour optional, stored correctly
     * - Returns 201 with operation
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    const response = await page.request.post(
      `${API_BASE}/api/technical/routings/${testRouting.id}/operations`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: {
          sequence: 1,
          name: 'Mixing',
          description: 'Initial mixing step',
          estimated_duration_minutes: 30,
          labor_cost_per_hour: 45.50, // Test labor cost precision
        },
      }
    );

    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    console.log('Response body:', JSON.stringify(responseBody, null, 2));
    const { data } = responseBody;
    expect(data).toBeDefined();
    if (data) {
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('sequence', 1);
      expect(data).toHaveProperty('name', 'Mixing');
      expect(data).toHaveProperty('labor_cost_per_hour', 45.50);
      expect(data).toHaveProperty('estimated_duration_minutes', 30);
    }
  });

  test('P0-014: GET lists operations ordered by sequence', async ({ page, context }) => {
    /**
     * AC-2.24.6: List operations endpoint
     * - Returns array of operations
     * - Ordered by sequence ASC
     * - Includes machine relationship if assigned
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    // Create 3 operations out of order
    await supabase
      .from('routing_operations')
      .insert({
        routing_id: testRouting.id,
        sequence: 3,
        name: 'Step3',
        labor_cost_per_hour: 30,
      });

    await supabase
      .from('routing_operations')
      .insert({
        routing_id: testRouting.id,
        sequence: 1,
        name: 'Step1',
        labor_cost_per_hour: 10,
      });

    await supabase
      .from('routing_operations')
      .insert({
        routing_id: testRouting.id,
        sequence: 2,
        name: 'Step2',
        labor_cost_per_hour: 20,
      });

    const response = await page.request.get(
      `${API_BASE}/api/technical/routings/${testRouting.id}/operations`
    );

    expect(response.status()).toBe(200);
    const { data: operations } = await response.json();

    expect(Array.isArray(operations)).toBeTruthy();
    expect(operations.length).toBe(3);

    // Verify ordered by sequence
    for (let i = 0; i < operations.length - 1; i++) {
      expect(operations[i].sequence).toBeLessThanOrEqual(operations[i + 1].sequence);
    }

    expect(operations[0].sequence).toBe(1);
    expect(operations[1].sequence).toBe(2);
    expect(operations[2].sequence).toBe(3);
  });

  test('P0-015: PUT updates operation labor cost', async ({ page, context }) => {
    /**
     * AC-2.24.6: Update operation endpoint
     * - Updates sequence, labor_cost_per_hour, other fields
     * - Validates sequence uniqueness
     * - Returns 200 with updated operation
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    // Create operation
    const { data: created } = await supabase
      .from('routing_operations')
      .insert({
        routing_id: testRouting.id,
        sequence: 1,
        name: 'Original',
        labor_cost_per_hour: 25.00,
      })
      .select()
      .single();

    // Update operation
    const response = await page.request.put(
      `${API_BASE}/api/technical/routings/${testRouting.id}/operations/${created.id}`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: {
          name: 'Updated',
          labor_cost_per_hour: 50.75,
        },
      }
    );

    expect(response.status()).toBe(200);
    const { data } = await response.json();
    expect(data).toHaveProperty('name', 'Updated');
    expect(data).toHaveProperty('labor_cost_per_hour', 50.75);
  });

  test('P0-016: DELETE operation', async ({ page, context }) => {
    /**
     * AC-2.24.6: Delete operation endpoint
     * - Deletes operation
     * - Returns 200 on success
     * - Returns 404 if not found
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    // Create operation
    const { data: created } = await supabase
      .from('routing_operations')
      .insert({
        routing_id: testRouting.id,
        sequence: 1,
        name: 'ToDelete',
      })
      .select()
      .single();

    const response = await page.request.delete(
      `${API_BASE}/api/technical/routings/${testRouting.id}/operations/${created.id}`
    );

    expect(response.status()).toBe(200);

    // Verify deleted
    const { data: found, error } = await supabase
      .from('routing_operations')
      .select()
      .eq('id', created.id)
      .single();

    expect(error).toBeTruthy();
  });

  test('P0-017: UNIQUE constraint on (routing_id, sequence) enforced', async ({ page, context }) => {
    /**
     * AC-2.24.3: UNIQUE(routing_id, sequence) constraint
     * - Cannot create two operations with same sequence in routing
     * - Returns 400 with DUPLICATE_SEQUENCE error
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    // Create first operation
    const response1 = await page.request.post(
      `${API_BASE}/api/technical/routings/${testRouting.id}/operations`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: {
          sequence: 1,
          name: 'Op1',
        },
      }
    );

    expect(response1.status()).toBe(201);

    // Try to create duplicate sequence
    const response2 = await page.request.post(
      `${API_BASE}/api/technical/routings/${testRouting.id}/operations`,
      {
        headers: { 'Content-Type': 'application/json' },
        data: {
          sequence: 1, // Same sequence
          name: 'Op2',
        },
      }
    );

    expect(response2.status()).toBe(400);
    const error = await response2.json();
    expect(error.error).toBeDefined();
  });
});
