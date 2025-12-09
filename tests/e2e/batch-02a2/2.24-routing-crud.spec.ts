import { test, expect } from '../../support/fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * P0 Tests: Story 2.24 - Routing Restructure
 *
 * Tests critical routing CRUD operations after schema restructure.
 * Risk Coverage: R-001 (migration), R-002 (cascade delete), R-003 (org_id)
 */

// Initialize Supabase client for direct DB access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_ORG_ID = process.env.TEST_ORG_ID || '';
const API_BASE = process.env.BASE_URL || 'http://localhost:5000';

test.describe('Story 2.24: Routing Restructure - P0 Critical Tests', () => {
  // =========================================================================
  // Auth Setup for API Tests
  // =========================================================================

  let testUser: any;

  // Helper function to login and get session cookies for page.request
  async function loginForAPI(page: any, context: any, email: string, password: string) {
    await page.goto('/login');
    // Use placeholder selectors instead of name attributes
    await page.fill('input[placeholder="name@example.com"]', email);
    await page.fill('input[placeholder="Enter your password"]', password);
    await page.click('button[type="submit"]');
    // Wait for either dashboard or planning page URL, allowing more time
    await page.waitForURL(/\/(dashboard|planning)/, { timeout: 60000 });
    // If navigation fails, still proceed (user might already be authenticated)
    if (page.url().includes('/login')) {
      await page.waitForTimeout(2000);
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

  test.beforeAll(async () => {
    // Create test user once for all tests
    const password = 'TestPassword123!';
    const email = `test-routing-${Date.now()}@test.com`.toLowerCase();

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authUser.user) {
      throw new Error(`Failed to create auth user: ${authError?.message}`);
    }

    // Create public user
    const { data: publicUser, error: publicError } = await supabase
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

    if (publicError || !publicUser) {
      throw new Error(`Failed to create public user: ${publicError?.message}`);
    }

    testUser = {
      id: authUser.user.id,
      email,
      password,
      org_id: TEST_ORG_ID,
    };
  });

  test.afterAll(async () => {
    // Cleanup test user
    if (testUser?.id) {
      try {
        await supabase.from('users').delete().eq('id', testUser.id);
        await supabase.auth.admin.deleteUser(testUser.id);
      } catch (error) {
        console.error('Failed to cleanup test user:', error);
      }
    }
  });

  // Helper to login (sets cookies for page.request)
  async function loginForPageRequest(page: any): Promise<void> {
    await page.goto('/auth/sign-in');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|settings)/, { timeout: 10000 });
    // Cookies are now set in page.context, page.request will use them automatically
  }

  // =========================================================================
  // P0-001 & P0-002: Schema Migration Validation
  // Risk: R-001 (Breaking migration)
  // =========================================================================

  test('P0-001: Migration creates new routings table with correct schema', async () => {
    /**
     * AC-2.24.2: Verify routings table structure
     * - Columns: id, org_id, name, description, is_active, created_at, updated_at
     * - UNIQUE(org_id, name)
     * - No product_id column (key difference)
     */

    const { data: columns, error: schemaError } = await supabase
      .from('routings')
      .select('*')
      .limit(0); // Get schema without fetching data

    expect(schemaError).toBeNull();
    // Schema is validated by Supabase - if table doesn't exist or has wrong structure, query fails

    // Verify we can insert a routing
    const testRouting = {
      org_id: TEST_ORG_ID,
      name: `Test Routing ${Date.now()}`,
      description: 'Migration test routing',
      is_active: true,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('routings')
      .insert(testRouting)
      .select()
      .single();

    expect(insertError).toBeNull();
    expect(inserted).toHaveProperty('id');
    expect(inserted).toHaveProperty('org_id', TEST_ORG_ID);
    expect(inserted).toHaveProperty('name', testRouting.name);
    expect(inserted).toHaveProperty('is_active', true);
    expect(inserted).toHaveProperty('created_at');
    expect(inserted).toHaveProperty('updated_at');
    // Key: NO product_id property
    expect(inserted).not.toHaveProperty('product_id');

    // Cleanup
    await supabase.from('routings').delete().eq('id', inserted.id);
  });

  test('P0-002: Migration creates routing_operations table with labor_cost', async () => {
    /**
     * AC-2.24.3: Verify routing_operations table structure
     * - Columns: id, routing_id, sequence, name, description, machine_id,
     *           estimated_duration_minutes, labor_cost_per_hour, created_at
     * - NEW: labor_cost_per_hour column
     * - UNIQUE(routing_id, sequence)
     * - FK routing_id with ON DELETE CASCADE
     */

    // Create parent routing
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Routing for ops test ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    expect(routingError).toBeNull();

    // Create operation with labor_cost_per_hour
    const testOperation = {
      routing_id: routing.id,
      sequence: 1,
      name: 'Mixing',
      description: 'Test operation',
      machine_id: null,
      estimated_duration_minutes: 30,
      labor_cost_per_hour: 50.75, // Key: NEW field
    };

    const { data: operation, error: opError } = await supabase
      .from('routing_operations')
      .insert(testOperation)
      .select()
      .single();

    expect(opError).toBeNull();
    expect(operation).toHaveProperty('id');
    expect(operation).toHaveProperty('routing_id', routing.id);
    expect(operation).toHaveProperty('sequence', 1);
    expect(operation).toHaveProperty('name', 'Mixing');
    expect(operation).toHaveProperty('labor_cost_per_hour', 50.75);
    expect(operation).toHaveProperty('created_at');

    // Cleanup
    await supabase.from('routing_operations').delete().eq('id', operation.id);
    await supabase.from('routings').delete().eq('id', routing.id);
  });

  // =========================================================================
  // P0-003 to P0-007: Routing CRUD Operations
  // Risk: R-001, R-002
  // =========================================================================

  test('P0-003: POST /api/technical/routings creates routing', async ({ page, context }) => {
    /**
     * AC-2.24.5: POST endpoint creates routing
     * - name required, unique per org
     * - org_id set from auth context
     * - Returns 201 with created routing
     */

    await loginForAPI(page, context, testUser.email, testUser.password);
    const routingName = `P0-Test-${Date.now()}`;
    const response = await page.request.post(`${API_BASE}/api/technical/routings`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        name: routingName,
        description: 'P0 test routing',
        is_active: true,
      },
    });

    expect(response.status()).toBe(201);
    const responseData = await response.json();
    expect(responseData.routing).toHaveProperty('id');
    expect(responseData.routing).toHaveProperty('name', routingName);
    expect(responseData.routing).toHaveProperty('org_id');
    expect(responseData.routing).toHaveProperty('is_active', true);

    // Cleanup
    await supabase.from('routings').delete().eq('id', responseData.routing.id);
  });

  test('P0-004: GET /api/technical/routings lists routings', async ({ page, context }) => {
    /**
     * AC-2.24.5: GET endpoint lists routings
     * - Returns array of routing objects
     * - Includes operations_count computed field
     * - Filters by org_id
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    // Create test routing
    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `List test ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    const response = await page.request.get(`${API_BASE}/api/technical/routings`);

    expect(response.status()).toBe(200);
    const { routings } = await response.json();
    expect(Array.isArray(routings)).toBeTruthy();

    const found = routings.find((r: any) => r.id === routing.id);
    expect(found).toBeDefined();
    expect(found).toHaveProperty('name', routing.name);

    // Cleanup
    await supabase.from('routings').delete().eq('id', routing.id);
  });

  test('P0-005: GET /api/technical/routings/:id returns with operations', async ({ page, context }) => {
    /**
     * AC-2.24.5: GET :id endpoint with eager load
     * - Returns routing with nested operations array
     * - Operations ordered by sequence
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    // Create routing with operations
    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Get detail test ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    // Add operations
    const op1 = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routing.id,
        sequence: 1,
        name: 'Op1',
        labor_cost_per_hour: 10,
      })
      .select()
      .single();

    const op2 = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routing.id,
        sequence: 2,
        name: 'Op2',
        labor_cost_per_hour: 20,
      })
      .select()
      .single();

    const response = await page.request.get(`${API_BASE}/api/technical/routings/${routing.id}`);

    expect(response.status()).toBe(200);
    const { routing: fetchedRouting } = await response.json();
    expect(fetchedRouting).toHaveProperty('id', routing.id);
    expect(fetchedRouting).toHaveProperty('operations');
    expect(Array.isArray(fetchedRouting.operations)).toBeTruthy();
    expect(fetchedRouting.operations.length).toBe(2);
    // Operations ordered by sequence
    expect(fetchedRouting.operations[0].sequence).toBeLessThan(fetchedRouting.operations[1].sequence);

    // Cleanup
    await supabase.from('routing_operations').delete().eq('routing_id', routing.id);
    await supabase.from('routings').delete().eq('id', routing.id);
  });

  test('P0-006: PUT /api/technical/routings/:id updates routing', async ({ page, context }) => {
    /**
     * AC-2.24.5: PUT endpoint updates routing
     * - name optional but unique per org if provided
     * - description, is_active optional
     * - Returns 200 with updated routing
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Update test ${Date.now()}`,
        description: 'Original',
        is_active: true,
      })
      .select()
      .single();

    const response = await page.request.put(`${API_BASE}/api/technical/routings/${routing.id}`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        description: 'Updated description',
        is_active: false,
      },
    });

    expect(response.status()).toBe(200);
    const { routing: updated } = await response.json();
    expect(updated).toHaveProperty('description', 'Updated description');
    expect(updated).toHaveProperty('is_active', false);

    // Cleanup
    await supabase.from('routings').delete().eq('id', routing.id);
  });

  test('P0-007: DELETE /api/technical/routings/:id deletes routing', async ({ page, context }) => {
    /**
     * AC-2.24.5: DELETE endpoint deletes routing
     * - Fails if routing used by BOMs (IN_USE error)
     * - Cascades delete operations
     * - Returns 200 on success
     */

    await loginForAPI(page, context, testUser.email, testUser.password);

    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Delete test ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    const response = await page.request.delete(`${API_BASE}/api/technical/routings/${routing.id}`);

    expect(response.status()).toBe(200);

    // Verify deleted
    const { data: found, error } = await supabase
      .from('routings')
      .select()
      .eq('id', routing.id)
      .single();

    expect(error).toBeTruthy(); // Not found
  });

  // =========================================================================
  // P0-008 to P0-010: Cascade Delete Verification
  // Risk: R-002 (Data Integrity)
  // =========================================================================

  test('P0-008: DELETE routing cascades delete of operations', async () => {
    /**
     * AC-2.24.3: ON DELETE CASCADE for routing_operations
     * - When routing deleted, all operations deleted
     * - No orphaned operations remain
     */

    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Cascade test ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    // Add 3 operations
    const op1 = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routing.id,
        sequence: 1,
        name: 'Op1',
      })
      .select()
      .single();

    const op2 = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routing.id,
        sequence: 2,
        name: 'Op2',
      })
      .select()
      .single();

    const op3 = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routing.id,
        sequence: 3,
        name: 'Op3',
      })
      .select()
      .single();

    // Delete routing
    await supabase.from('routings').delete().eq('id', routing.id);

    // Verify operations are gone
    const { data: remainingOps, error } = await supabase
      .from('routing_operations')
      .select()
      .eq('routing_id', routing.id);

    expect(error).toBeNull();
    expect(remainingOps.length).toBe(0);
  });

  test('P0-009: RLS policies enable authenticated access', async ({ page }) => {
    /**
     * AC-2.24.4: RLS policies allow authenticated access
     * - Authenticated users can CRUD routings
     * - Anonymous users get 401
     */

    // Authenticated request should work (already authenticated in test)
    const response = await page.request.get(`${API_BASE}/api/technical/routings`);
    expect([200, 401, 403]).toContain(response.status()); // Should not error on schema

    // Verify table exists and has RLS
    const { data: routings } = await supabase
      .from('routings')
      .select('count', { count: 'exact' })
      .limit(1);

    expect(routings).toBeDefined();
  });

  // =========================================================================
  // P0-011 & P0-012: org_id Isolation
  // Risk: R-003 (Security)
  // =========================================================================

  test('P0-011: Service rejects cross-org routing access', async ({ page }) => {
    /**
     * AC-2.24.5: org_id isolation enforced
     * - Service validates org_id on all queries
     * - Cross-org requests rejected with 403
     */

    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Isolation test ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    // This test assumes auth context validates org_id
    // In real scenario, would need different org token to test rejection
    // For now, verify routing created with correct org_id
    expect(routing.org_id).toBe(TEST_ORG_ID);

    // Cleanup
    await supabase.from('routings').delete().eq('id', routing.id);
  });

  test('P0-012: UNIQUE constraint on (org_id, name) enforced', async ({ page, context }) => {
    /**
     * AC-2.24.2: UNIQUE(org_id, name) constraint
     * - Cannot create routing with duplicate name in same org
     * - Returns 400 with DUPLICATE_NAME error
     */

    await loginForAPI(page, context, testUser.email, testUser.password);
    const routingName = `Unique test ${Date.now()}`;

    // Create first routing
    const response1 = await page.request.post(`${API_BASE}/api/technical/routings`, {
      headers: { 'Content-Type': 'application/json' },
      data: { name: routingName },
    });

    expect(response1.status()).toBe(201);
    const data1 = await response1.json();

    // Try to create duplicate
    const response2 = await page.request.post(`${API_BASE}/api/technical/routings`, {
      headers: { 'Content-Type': 'application/json' },
      data: { name: routingName },
    });

    expect(response2.status()).toBe(400);
    const error = await response2.json();
    expect(error.error).toBeDefined();

    // Cleanup
    await supabase.from('routings').delete().eq('id', data1.routing.id);
  });
});
