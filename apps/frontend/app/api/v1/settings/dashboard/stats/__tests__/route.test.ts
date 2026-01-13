/**
 * API Tests: Dashboard Stats Endpoint
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 * Phase: P2 (RED) - All tests should FAIL
 *
 * Tests GET /api/v1/settings/dashboard/stats:
 * - Returns correct stats structure
 * - Filters stats based on user role
 * - Requires authentication
 * - Returns 403 for insufficient permissions
 * - Handles org context errors
 *
 * Coverage Target: 80%
 * Test Count: 7 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('GET /api/v1/settings/dashboard/stats', () => {
  let mockSupabase: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockSupabase = {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
      rpc: vi.fn(),
    }

    vi.mocked(createClient).mockResolvedValue(mockSupabase)
  })

  // AC-01: Success - Admin gets all stats
  it('should return all dashboard stats for admin user', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { org_id: 'org-123', role_code: 'admin' },
        error: null,
      }),
      count: vi.fn().mockResolvedValueOnce({
        count: 8,
        error: null,
      }),
    }))

    // Mock counts for each category
    mockSupabase.rpc.mockResolvedValueOnce({ data: { users: 8, pending_invitations: 2 }, error: null })
    mockSupabase.rpc.mockResolvedValueOnce({ data: { warehouses: 3, machines: 5, production_lines: 2 }, error: null })
    mockSupabase.rpc.mockResolvedValueOnce({ data: { allergens: 14, tax_codes: 4 }, error: null })
    mockSupabase.rpc.mockResolvedValueOnce({ data: { api_keys: 2, webhooks: 0 }, error: null })
    mockSupabase.rpc.mockResolvedValueOnce({ data: { enabled_modules: 6, audit_log_entries: 348 }, error: null })
    mockSupabase.rpc.mockResolvedValueOnce({ data: { last_login: '2026-01-04T12:30:00Z', session_status: 'active' }, error: null })

    const request = new NextRequest('http://localhost:3000/api/v1/settings/dashboard/stats')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toEqual({
      users: { total: 8, pending_invitations: 2 },
      infrastructure: { warehouses: 3, machines: 5, production_lines: 2 },
      master_data: { allergens: 14, tax_codes: 4 },
      integrations: { api_keys: 2, webhooks: 0 },
      system: { enabled_modules: 6, audit_log_entries: 348 },
      security: { last_login: '2026-01-04T12:30:00Z', session_status: 'active' },
    })
  })

  // AC-02: Permission filtering for warehouse_manager
  it('should return filtered stats for warehouse_manager role', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.from.mockImplementation((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { org_id: 'org-123', role_code: 'warehouse_manager' },
        error: null,
      }),
    }))

    mockSupabase.rpc.mockResolvedValueOnce({ data: { warehouses: 3, machines: 5, production_lines: 2 }, error: null })

    const request = new NextRequest('http://localhost:3000/api/v1/settings/dashboard/stats')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toEqual({
      infrastructure: { warehouses: 3, machines: 5, production_lines: 2 },
    })

    // Should NOT have admin-only sections
    expect(data).not.toHaveProperty('users')
    expect(data).not.toHaveProperty('system')
    expect(data).not.toHaveProperty('integrations')
  })

  // AC-03: Authentication required
  it('should return 401 when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Unauthorized' },
    })

    const request = new NextRequest('http://localhost:3000/api/v1/settings/dashboard/stats')
    const response = await GET(request)

    expect(response.status).toBe(401)

    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  // AC-04: Org context required
  it('should return 400 when org context is missing', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'No organization context' },
      }),
    }))

    const request = new NextRequest('http://localhost:3000/api/v1/settings/dashboard/stats')
    const response = await GET(request)

    expect(response.status).toBe(400)

    const data = await response.json()
    expect(data.error).toContain('organization context')
  })

  // AC-05: Database error handling
  it('should return 500 when database query fails', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { org_id: 'org-123', role_code: 'admin' },
        error: null,
      }),
    }))

    mockSupabase.rpc.mockRejectedValueOnce(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/v1/settings/dashboard/stats')
    const response = await GET(request)

    expect(response.status).toBe(500)

    const data = await response.json()
    expect(data.error).toContain('Internal server error')
  })

  // AC-06: Viewer role - no access
  it('should return empty stats for viewer role', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { org_id: 'org-123', role_code: 'viewer' },
        error: null,
      }),
    }))

    const request = new NextRequest('http://localhost:3000/api/v1/settings/dashboard/stats')
    const response = await GET(request)

    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data).toEqual({})
  })

  // AC-07: Response caching headers
  it('should include cache headers in response', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    mockSupabase.from.mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValueOnce({
        data: { org_id: 'org-123', role_code: 'admin' },
        error: null,
      }),
    }))

    mockSupabase.rpc.mockResolvedValue({ data: {}, error: null })

    const request = new NextRequest('http://localhost:3000/api/v1/settings/dashboard/stats')
    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('max-age=300') // 5 minutes
  })
})

/**
 * Test Summary for Dashboard Stats API
 * =====================================
 *
 * Test Coverage:
 * - Success with all stats (admin): 1 test
 * - Permission filtering (warehouse_manager): 1 test
 * - Authentication required: 1 test
 * - Org context validation: 1 test
 * - Database error handling: 1 test
 * - Viewer role (empty stats): 1 test
 * - Cache headers: 1 test
 *
 * Total: 7 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - GET /api/v1/settings/dashboard/stats route not created
 * - Database RPC functions not implemented
 * - Permission filtering logic not implemented
 *
 * Next Steps for BACKEND-DEV:
 * 1. Create app/api/v1/settings/dashboard/stats/route.ts
 * 2. Implement GET handler with auth check
 * 3. Add org context validation
 * 4. Implement permission-based filtering
 * 5. Create database RPC functions:
 *    - get_user_stats(org_id)
 *    - get_infrastructure_stats(org_id)
 *    - get_master_data_stats(org_id)
 *    - get_integration_stats(org_id)
 *    - get_system_stats(org_id)
 *    - get_security_stats(user_id)
 * 6. Add cache headers (max-age=300)
 * 7. Run tests - should transition from RED to GREEN
 *
 * Coverage Target: 80%
 */
