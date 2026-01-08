/**
 * POST /api/production/work-orders/:woId/operations/:opId/start - Integration Tests (Story 04.3)
 * Purpose: Test starting an operation - transition from pending to in_progress
 * Phase: RED - Tests should FAIL until implementation matches all requirements
 *
 * Test Coverage:
 * - AC-01: Start operation with pending status
 * - AC-04: Cannot start if WO not in_progress
 * - AC-05: Cannot start already in-progress operation
 * - AC-14: Sequence enforcement - blocks out of order (if enabled)
 * - AC-15: Sequence enforcement - allows next operation
 * - AC-16: Sequence enforcement disabled
 * - AC-17: Skipped operations don't block sequence
 * - AC-23: Permission enforcement (PROD_OPERATOR can start)
 * - AC-25: Org isolation on operation start
 * - AC-26: Cross-tenant operation access returns 404
 * - AC-28: Successful start returns updated operation
 * - AC-29: Sequence violation returns 409
 * - AC-30: Invalid status returns 400
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
  status: 'pending',
  started_at: null,
  started_by_user_id: null,
  expected_duration_minutes: 30,
}

// Mock Supabase
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockLt = vi.fn()
const mockNeq = vi.fn()

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
  const url = `http://localhost/api/production/work-orders/${woId}/operations/${opId}/start`
  return new NextRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  })
}

function setupAuthenticatedUser(user = mockUser) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: user.id } },
    error: null,
  })

  // Setup user query
  mockFrom.mockImplementation((table: string) => {
    if (table === 'users') {
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: user, error: null }),
          }),
        }),
      }
    }
    return createMockQueryBuilder()
  })
}

function createMockQueryBuilder() {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  }
  return builder
}

describe('POST /api/production/work-orders/:woId/operations/:opId/start', () => {
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
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 401
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    // AC-23: Permission enforcement
    it('should return 403 when user has no permission to start operations', async () => {
      // GIVEN: User with viewer role (no permission)
      const viewerUser = { ...mockUser, role: 'viewer' }
      setupAuthenticatedUser(viewerUser)

      // WHEN: POST request is made
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 403
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('FORBIDDEN')
    })

    // AC-23: Production Operator can start
    it('should allow production_operator role to start operations', async () => {
      // GIVEN: User with production_operator role and valid operation
      const operatorUser = { ...mockUser, role: 'operator' }
      setupAuthenticatedUser(operatorUser)

      mockFrom.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: operatorUser, error: null }),
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
            update: () => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: () =>
                      Promise.resolve({
                        data: { ...mockOperation, status: 'in_progress' },
                        error: null,
                      }),
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: false }, error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200
      expect(response.status).toBe(200)
    })
  })

  describe('Work Order Validation', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-04: Cannot start if WO not in_progress
    it('should return 400 when WO status is not in_progress', async () => {
      // GIVEN: WO with status 'released'
      const releasedWO = { ...mockWorkOrder, status: 'released' }

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
                single: () => Promise.resolve({ data: releasedWO, error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400 with appropriate error
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('WO_NOT_IN_PROGRESS')
      expect(data.message).toContain('Work order status is')
    })

    // AC-26: Cross-tenant operation access returns 404
    it('should return 404 for cross-org WO access (RLS)', async () => {
      // GIVEN: WO belongs to different org
      const otherOrgWO = { ...mockWorkOrder, org_id: TEST_ORG_B_ID }

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
                single: () => Promise.resolve({ data: otherOrgWO, error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 404 (not 403 for security)
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
    })

    it('should return 404 when WO does not exist', async () => {
      // GIVEN: WO not found
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
                single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest('non-existent-wo')
      const response = await POST(request, {
        params: Promise.resolve({ id: 'non-existent-wo', opId: TEST_OP_ID }),
      })

      // THEN: Returns 404
      expect(response.status).toBe(404)
    })
  })

  describe('Operation Status Validation', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-01: Start operation with pending status
    it('should successfully start operation with pending status', async () => {
      // GIVEN: Operation with status 'pending' and WO in_progress
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
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: { ...mockOperation, status: 'in_progress' },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: false }, error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200 with updated operation
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.status).toBe('in_progress')
      expect(data.data.started_at).toBeDefined()
      expect(data.data.started_by_user_id).toBe(TEST_USER_ID)
    })

    // AC-05: Cannot start already in-progress operation
    it('should return 400 when operation is already in_progress', async () => {
      // GIVEN: Operation with status 'in_progress'
      const inProgressOp = { ...mockOperation, status: 'in_progress' }

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
                  single: () => Promise.resolve({ data: inProgressOp, error: null }),
                }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 400
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('INVALID_STATUS')
      expect(data.message).toContain('in_progress')
    })

    // AC-30: Invalid status returns 400
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
      const request = createRequest()
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
      const request = createRequest(TEST_WO_ID, 'non-existent-op')
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: 'non-existent-op' }),
      })

      // THEN: Returns 404
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
    })
  })

  describe('Sequence Enforcement', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-14: Sequence enforcement - blocks out of order
    it('should return 409 when sequence enforcement enabled and prior op not completed', async () => {
      // GIVEN: require_operation_sequence=true and prior op pending
      const op2 = { ...mockOperation, id: 'op-2', sequence: 2 }
      const priorOp = { ...mockOperation, id: 'op-1', sequence: 1, status: 'pending' }

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
                  single: () => Promise.resolve({ data: op2, error: null }),
                }),
                lt: () => ({
                  neq: () => Promise.resolve({ data: [priorOp], error: null }),
                }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: true }, error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, 'op-2')
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: 'op-2' }),
      })

      // THEN: Returns 409 with sequence violation error
      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error).toBe('SEQUENCE_VIOLATION')
      expect(data.message).toContain('must be completed first')
    })

    // AC-15: Sequence enforcement - allows next operation
    it('should allow starting next operation when prior is completed', async () => {
      // GIVEN: require_operation_sequence=true and prior op completed
      const op2 = { ...mockOperation, id: 'op-2', sequence: 2 }

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
                  single: () => Promise.resolve({ data: op2, error: null }),
                }),
                lt: () => ({
                  neq: () => Promise.resolve({ data: [], error: null }), // No blocking ops
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: { ...op2, status: 'in_progress' },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: true }, error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, 'op-2')
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: 'op-2' }),
      })

      // THEN: Returns 200
      expect(response.status).toBe(200)
    })

    // AC-16: Sequence enforcement disabled
    it('should allow any order when sequence enforcement disabled', async () => {
      // GIVEN: require_operation_sequence=false
      const op3 = { ...mockOperation, id: 'op-3', sequence: 3 }

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
                  single: () => Promise.resolve({ data: op3, error: null }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: { ...op3, status: 'in_progress' },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: false }, error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request to start op 3 (op 1, 2 not completed)
      const request = createRequest(TEST_WO_ID, 'op-3')
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: 'op-3' }),
      })

      // THEN: Returns 200 (no sequence check)
      expect(response.status).toBe(200)
    })

    // AC-17: Skipped operations don't block sequence
    it('should allow starting when prior operations are skipped', async () => {
      // GIVEN: require_operation_sequence=true but prior op is skipped
      const op2 = { ...mockOperation, id: 'op-2', sequence: 2 }
      // Prior op is skipped, so won't be returned in blocking query

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
                  single: () => Promise.resolve({ data: op2, error: null }),
                }),
                lt: () => ({
                  neq: () => Promise.resolve({ data: [], error: null }), // Skipped op not blocking
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: { ...op2, status: 'in_progress' },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: true }, error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest(TEST_WO_ID, 'op-2')
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: 'op-2' }),
      })

      // THEN: Returns 200
      expect(response.status).toBe(200)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-28: Successful start returns updated operation
    it('should return operation with started_at timestamp', async () => {
      // GIVEN: Valid operation start scenario
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
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: false }, error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made
      const request = createRequest()
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns expected fields
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveProperty('id')
      expect(data.data).toHaveProperty('wo_id')
      expect(data.data).toHaveProperty('status', 'in_progress')
      expect(data.data).toHaveProperty('started_at')
      expect(data.data).toHaveProperty('started_by_user_id')
      expect(data.data).toHaveProperty('operation_name')
      expect(data.data).toHaveProperty('sequence')
    })

    it('should accept optional started_at override', async () => {
      // GIVEN: Valid operation with custom started_at
      const customStartedAt = '2025-12-15T09:30:00Z'

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
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: { ...mockOperation, status: 'in_progress', started_at: customStartedAt },
                    error: null,
                  }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: false }, error: null }),
              }),
            }),
          }
        }
        if (table === 'activity_logs') {
          return {
            insert: () => Promise.resolve({ data: null, error: null }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: POST request is made with started_at
      const request = createRequest(TEST_WO_ID, TEST_OP_ID, { started_at: customStartedAt })
      const response = await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 200 with custom timestamp
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.started_at).toBe(customStartedAt)
    })
  })

  describe('Audit Logging', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-18: Log created on operation start
    it('should create operation_log entry on successful start', async () => {
      // GIVEN: Valid operation start
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
        if (table === 'production_settings') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({ data: { require_operation_sequence: false }, error: null }),
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
      const request = createRequest()
      await POST(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Activity log insert was called
      expect(insertMock).toHaveBeenCalled()
    })
  })
})
