/**
 * POST /api/production/work-orders/:woId/operations/:opId/complete - Integration Tests (Story 04.3)
 * Purpose: Test completing an operation - transition from in_progress to completed
 * Phase: RED - Tests should FAIL until implementation matches all requirements
 *
 * Test Coverage:
 * - AC-06: Complete operation with in-progress status
 * - AC-08: Cannot complete pending operation
 * - AC-09: Duration auto-calculated on complete
 * - AC-11: Yield capture on complete
 * - AC-12: Yield field required on complete
 * - AC-13: Yield must be 0-100%
 * - AC-19: Log created on operation complete
 *
 * Coverage Target: 90%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock data
const TEST_ORG_ID = 'org-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_ORG_B_ID = 'org-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
const TEST_USER_ID = 'user-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_WO_ID = 'wo-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const TEST_OP_ID = 'op-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

const mockUser = {
  id: TEST_USER_ID,
  org_id: TEST_ORG_ID,
  role: 'operator',
  first_name: 'Test',
  last_name: 'User',
}

const mockWorkOrder = {
  id: TEST_WO_ID,
  wo_number: 'WO-001',
  status: 'in_progress',
  org_id: TEST_ORG_ID,
}

const mockOperation = {
  id: TEST_OP_ID,
  wo_id: TEST_WO_ID,
  organization_id: TEST_ORG_ID,
  sequence: 1,
  operation_name: 'Mixing',
  status: 'in_progress',
  started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1 hour ago
  started_by_user_id: TEST_USER_ID,
  completed_at: null,
  completed_by_user_id: null,
  expected_duration_minutes: 60,
  expected_yield_percent: 95,
  actual_duration_minutes: null,
  actual_yield_percent: null,
}

// Mock Supabase
const mockGetUser = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}))

function createRequest(
  woId: string = TEST_WO_ID,
  opId: string = TEST_OP_ID,
  body?: Record<string, unknown>
): NextRequest {
  const url = `http://localhost/api/production/work-orders/${woId}/operations/${opId}/complete`
  return new NextRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function setupAuthenticatedUser(user = mockUser) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: user.id } },
    error: null,
  })
}

function createMockQueryBuilder() {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }
  return builder
}

describe('POST /api/production/work-orders/:woId/operations/:opId/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN: No authenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 401
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when user has no permission to complete operations', async () => {
      // GIVEN: User with viewer role (no permission)
      const viewerUser = { ...mockUser, role: 'viewer' }
      setupAuthenticatedUser(viewerUser)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: viewerUser, error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 403
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('FORBIDDEN')
    })
  })

  describe('Operation Status Validation', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-06: Complete operation with in-progress status
    it('should successfully complete operation with in_progress status', async () => {
      // GIVEN: Operation with status 'in_progress' and valid yield input
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made with yield
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95.5 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200 with completed operation
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.status).toBe('completed')
      expect(data.data.completed_at).toBeDefined()
      expect(data.data.completed_by_user_id).toBe(TEST_USER_ID)
    })

    // AC-08: Cannot complete pending operation
    it('should return 400 when operation is pending', async () => {
      // GIVEN: Operation with status 'pending'
      const pendingOp = { ...mockOperation, status: 'pending', started_at: null }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: pendingOp, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_STATUS')
      expect(data.message).toContain('must be in progress')
    })

    it('should return 400 when operation is already completed', async () => {
      // GIVEN: Operation with status 'completed'
      const completedOp = { ...mockOperation, status: 'completed' }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: completedOp, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_STATUS')
    })

    it('should return 404 when operation does not exist', async () => {
      // GIVEN: Operation not found
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, 'non-existent-op', { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: 'non-existent-op' }),
      })

      // THEN: Returns 404
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
    })

    it('should return 404 for cross-org access (RLS)', async () => {
      // GIVEN: Operation belongs to different org
      const otherOrgOp = { ...mockOperation, organization_id: TEST_ORG_B_ID }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: otherOrgOp, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 404 (not 403 for security)
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
    })
  })

  describe('Yield Validation', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-12: Yield field required on complete
    it('should return 400 when yield is missing', async () => {
      // GIVEN: Valid operation but no yield provided
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made without yield
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, {})
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('MISSING_YIELD')
      expect(data.message).toContain('required')
    })

    // AC-13: Yield must be 0-100%
    it('should return 400 when yield is negative', async () => {
      // GIVEN: Negative yield value
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made with negative yield
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: -5 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_YIELD')
      expect(data.message).toContain('0')
      expect(data.message).toContain('100')
    })

    // AC-13: Yield must be 0-100%
    it('should return 400 when yield exceeds 100%', async () => {
      // GIVEN: Yield value over 100
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made with yield > 100
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 105 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_YIELD')
    })

    // AC-11: Yield capture on complete
    it('should save actual_yield_percent on successful complete', async () => {
      // GIVEN: Valid operation with yield 95.5
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made with yield
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95.5 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200 with yield saved
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.actual_yield_percent).toBe(95.5)
    })

    it('should accept yield at boundary values (0 and 100)', async () => {
      // GIVEN: Valid operation
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request with yield = 0
      const request0 = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 0 })
      const response0 = await POST(request0, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Should accept 0
      expect(response0.status).toBe(200)

      // Reset mocks and test 100
      vi.clearAllMocks()
      setupAuthenticatedUser()

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request with yield = 100
      const request100 = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 100 })
      const response100 = await POST(request100, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Should accept 100
      expect(response100.status).toBe(200)
    })
  })

  describe('Duration Calculation', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-09: Duration auto-calculated on complete
    it('should calculate duration_minutes automatically', async () => {
      // GIVEN: Operation started 60 minutes ago
      const startedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const opWith60MinStart = { ...mockOperation, started_at: startedAt }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: opWith60MinStart, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200 with calculated duration
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.actual_duration_minutes).toBeGreaterThanOrEqual(59)
      expect(data.data.actual_duration_minutes).toBeLessThanOrEqual(61)
    })

    it('should accept manual duration override', async () => {
      // GIVEN: Valid operation with manual duration
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request with manual duration
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, {
        actual_yield_percent: 95,
        actual_duration_minutes: 45,
      })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200 with manual duration
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.actual_duration_minutes).toBe(45)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    it('should return variance calculations', async () => {
      // GIVEN: Operation with expected values
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, {
        actual_yield_percent: 90,
        actual_duration_minutes: 75,
      })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns variance calculations
      expect(response.status).toBe(200)
      const data = await response.json()
      // Expected duration: 60, actual: 75 -> variance: +15
      expect(data.data.duration_variance_minutes).toBeDefined()
      // Expected yield: 95, actual: 90 -> variance: -5
      expect(data.data.yield_variance_percent).toBeDefined()
    }
    )

    it('should include next_operation in response if exists', async () => {
      // GIVEN: Operation with a next operation in sequence
      const nextOp = {
        id: 'op-next',
        sequence: 2,
        operation_name: 'Baking',
        status: 'pending',
      }

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: nextOp, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns next_operation
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.next_operation).toBeDefined()
      expect(data.data.next_operation.id).toBe('op-next')
      expect(data.data.next_operation.operation_name).toBe('Baking')
    })

    it('should accept optional notes', async () => {
      // GIVEN: Valid operation with notes
      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request with notes
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, {
        actual_yield_percent: 95,
        notes: 'Completed with minor adjustments',
      })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200 with notes
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.notes).toBe('Completed with minor adjustments')
    })

    it('should reject notes longer than 2000 characters', async () => {
      // GIVEN: Notes exceeding max length
      const longNotes = 'x'.repeat(2001)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request with long notes
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, {
        actual_yield_percent: 95,
        notes: longNotes,
      })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('VALIDATION')
    })
  })

  describe('Audit Logging', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-19: Log created on operation complete
    it('should create operation_log entry on successful complete', async () => {
      // GIVEN: Valid operation complete
      const insertMock = vi.fn().mockResolvedValue({ data: null, error: null })

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockUser, error: null }),
              }),
            }),
          }
        }
        if (table === 'work_orders') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockWorkOrder, error: null }),
              }),
            }),
          }
        }
        if (table === 'wo_operations') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockOperation, error: null }),
                }),
                gt: () => ({
                  order: () => ({
                    limit: () => ({
                      single: () => Promise.resolve({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'wo_materials') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs' || table === 'operation_logs') {
          return {
            insert: insertMock,
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { actual_yield_percent: 95 })
      await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Log insert was called with metadata
      expect(insertMock).toHaveBeenCalled()
      const insertCall = insertMock.mock.calls[0][0]
      expect(insertCall.metadata).toBeDefined()
    })
  })
})
