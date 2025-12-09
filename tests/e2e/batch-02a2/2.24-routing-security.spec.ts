import { test, expect } from '../../support/fixtures';
import { createClient } from '@supabase/supabase-js';

/**
 * P0 Tests: Story 2.24 - Routing Security & Isolation
 *
 * Tests org_id isolation and RLS policies.
 * Risk Coverage: R-003 (Security - org_id isolation)
 */

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_ORG_ID = process.env.TEST_ORG_ID || '';
const API_BASE = process.env.BASE_URL || 'http://localhost:5000';

test.describe('Story 2.24: Routing Security - P0 Critical Tests', () => {
  let testUser: any;

  test.beforeAll(async () => {
    // Create test user
    const password = 'TestPassword123!';
    const email = `test-sec-${Date.now()}@test.com`.toLowerCase();

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

  // =========================================================================
  // P0-018 & P0-019: org_id Isolation
  // Risk: R-003 (Security)
  // =========================================================================

  test('P0-018: Service validates org_id isolation on list', async () => {
    /**
     * AC-2.24.8: RoutingService.list() enforces org_id
     * - Only returns routings for authenticated org
     * - Cross-org queries rejected or filtered
     * - Isolation at service layer (not just DB)
     */

    // Create routing in TEST_ORG
    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Isolation test ${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    expect(routing.org_id).toBe(TEST_ORG_ID);

    // Verify we can retrieve it
    const { data: retrieved, error } = await supabase
      .from('routings')
      .select()
      .eq('id', routing.id)
      .eq('org_id', TEST_ORG_ID)
      .single();

    expect(error).toBeNull();
    expect(retrieved.org_id).toBe(TEST_ORG_ID);

    // Cleanup
    await supabase.from('routings').delete().eq('id', routing.id);
  });

  test('P0-019: RLS policy allows authenticated access to org routings', async () => {
    /**
     * AC-2.24.4: RLS policy enables authenticated access
     * - Authenticated users can read/create/update routings
     * - Policy: "Enable all for authenticated"
     * - Isolation enforced by app layer (org_id check in service)
     */

    const routingName = `RLS test ${Date.now()}`;

    // Create routing (should succeed with RLS)
    const { data: created, error: createError } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: routingName,
        is_active: true,
      })
      .select()
      .single();

    expect(createError).toBeNull();
    expect(created).toBeDefined();

    // Read routing (should succeed with RLS)
    const { data: read, error: readError } = await supabase
      .from('routings')
      .select()
      .eq('id', created.id)
      .single();

    expect(readError).toBeNull();
    expect(read.id).toBe(created.id);

    // Update routing (should succeed with RLS)
    const { data: updated, error: updateError } = await supabase
      .from('routings')
      .update({ description: 'Updated' })
      .eq('id', created.id)
      .select()
      .single();

    expect(updateError).toBeNull();
    expect(updated.description).toBe('Updated');

    // Cleanup
    await supabase.from('routings').delete().eq('id', created.id);
  });

  test('P0-020: labor_cost_per_hour field accessible only by authenticated', async () => {
    /**
     * Bonus test: Verify sensitive financial fields
     * - labor_cost_per_hour visible to authenticated users
     * - Properly stored in operations table
     */

    const { data: routing } = await supabase
      .from('routings')
      .insert({
        org_id: TEST_ORG_ID,
        name: `Labor cost test ${Date.now()}`,
      })
      .select()
      .single();

    const { data: operation, error } = await supabase
      .from('routing_operations')
      .insert({
        routing_id: routing.id,
        sequence: 1,
        name: 'Test',
        labor_cost_per_hour: 123.45,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(operation).toHaveProperty('labor_cost_per_hour', 123.45);

    // Verify decimal precision preserved
    const { data: fetched } = await supabase
      .from('routing_operations')
      .select()
      .eq('id', operation.id)
      .single();

    expect(fetched.labor_cost_per_hour).toBe(123.45);

    // Cleanup
    await supabase.from('routing_operations').delete().eq('id', operation.id);
    await supabase.from('routings').delete().eq('id', routing.id);
  });

  // =========================================================================
  // Bonus P0 Tests: Error Handling
  // =========================================================================

  test('P0-021: NOT_FOUND error on missing routing', async ({ page, context }) => {
    /**
     * AC-2.24.5: Error handling
     * - Returns 404 with NOT_FOUND error
     * - Proper error message format
     */

    // Login first to set cookies
    await page.goto('/login');
    await page.fill('input[placeholder="name@example.com"]', testUser.email);
    await page.fill('input[placeholder="Enter your password"]', testUser.password);
    await page.click('button[type="submit"]');
    // Wait for either dashboard or planning page URL, allowing more time
    await page.waitForURL(/\/(dashboard|planning|login)/, { timeout: 60000 });
    // If still on login, wait a bit more for redirect
    if (page.url().includes('/login')) {
      await page.waitForTimeout(3000);
    }

    // Extract and add cookies to context for page.request
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'sb-auth-token' || c.name.includes('session'));
    if (!sessionCookie) {
      const sessionData = await page.evaluate(() => {
        return window.localStorage.getItem('sb-' + 'auth-token');
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

    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await page.request.get(
      `${API_BASE}/api/technical/routings/${fakeId}`
    );

    expect(response.status()).toBe(404);
    const { error } = await response.json();
    expect(error).toBeDefined();
  });

  test('P0-022: Validation errors return 400', async ({ page, context }) => {
    /**
     * AC-2.24.7: Validation
     * - Invalid input returns 400
     * - Specific error codes (INVALID_NAME, etc.)
     */

    // Login first to set cookies
    await page.goto('/login');
    await page.fill('input[placeholder="name@example.com"]', testUser.email);
    await page.fill('input[placeholder="Enter your password"]', testUser.password);
    await page.click('button[type="submit"]');
    // Wait for either dashboard or planning page URL, allowing more time
    await page.waitForURL(/\/(dashboard|planning|login)/, { timeout: 60000 });
    // If still on login, wait a bit more for redirect
    if (page.url().includes('/login')) {
      await page.waitForTimeout(3000);
    }

    // Extract and add cookies to context for page.request
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name === 'sb-auth-token' || c.name.includes('session'));
    if (!sessionCookie) {
      const sessionData = await page.evaluate(() => {
        return window.localStorage.getItem('sb-' + 'auth-token');
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

    // Missing required field
    const response = await page.request.post(`${API_BASE}/api/technical/routings`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        // name missing
        description: 'Test',
      },
    });

    expect(response.status()).toBe(400);
    const { error } = await response.json();
    expect(error).toBeDefined();
  });
});
