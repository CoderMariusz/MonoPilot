/**
 * GET /api/production/work-orders/:woId/operations/:opId/logs - Integration Tests (Story 04.3)
 * Purpose: Test retrieving operation audit trail logs
 * Phase: RED - Tests should FAIL (no /logs endpoint implemented yet)
 *
 * Test Coverage:
 * - AC-18: Log created on operation start (verify retrieval)
 * - AC-19: Log created on operation complete (verify retrieval)
 * - AC-20: Log history viewable with user names
 * - AC-27: Operation logs isolated by org (RLS)
 *
 * Coverage Target: 90%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'
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

const mockOperation = {
  id: TEST_OP_ID,
  wo_id: TEST_WO_ID,
  organization_id: TEST_ORG_ID,
  sequence: 1,
  operation_name: 'Mixing',
  status: 'completed',
}

const mockLogs = [
  {
    id: 'log-1',
    operation_id: TEST_OP_ID,
    organization_id: TEST_ORG_ID,
    event_type: 'started',
    old_status: 'pending',
    new_status: 'in_progress',
    user_id: TEST_USER_ID,
    changed_by_user: {
      id: TEST_USER_ID,
      first_name: 'John',
      last_name: 'Smith',
    },
    metadata: {},
    notes: null,
    created_at: '2025-12-15T09:30:00Z',
  },
  {
    id: 'log-2',
    operation_id: TEST_OP_ID,
    organization_id: TEST_ORG_ID,
    event_type: 'completed',
    old_status: 'in_progress',
    new_status: 'completed',
    user_id: TEST_USER_ID,
    changed_by_user: {
      id: TEST_USER_ID,
      first_name: 'John',
      last_name: 'Smith',
    },
    metadata: {
      actual_yield_percent: 95.5,
      duration_minutes: 45,
    },
    notes: 'Completed successfully',
    created_at: '2025-12-15T10:15:00Z',
  },
]

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
  opId: string = TEST_OP_ID
): NextRequest {
  const url = `http://localhost/api/production/work-orders/${woId}/operations/${opId}/logs`
  return new NextRequest(url, { method: 'GET' })
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
    order: vi.fn().mockReturnThis(),
  }
  return builder
}

describe('GET /api/production/work-orders/:woId/operations/:opId/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN: No authenticated user
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 401
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Operation Validation', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
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

      // WHEN: GET request is made
      const request = createRequest(TEST_WO_ID, 'non-existent-op')
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: 'non-existent-op' }),
      })

      // THEN: Returns 404
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
    })

    // AC-27: Operation logs isolated by org (RLS)
    it('should return 404 for cross-org operation access', async () => {
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

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 404 (not 403 for security)
      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toBe('NOT_FOUND')
    })
  })

  describe('Logs Retrieval', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    // AC-20: Log history viewable with user names
    it('should return logs with user names', async () => {
      // GIVEN: Operation with logs
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
        if (table === 'operation_logs') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockLogs, error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns logs with user info
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.logs).toHaveLength(2)
      expect(data.logs[0].changed_by_user).toBeDefined()
      expect(data.logs[0].changed_by_user.first_name).toBe('John')
      expect(data.logs[0].changed_by_user.last_name).toBe('Smith')
    })

    // AC-18 & AC-19: Verify log entries exist
    it('should return logs ordered by timestamp descending', async () => {
      // GIVEN: Operation with multiple logs
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
        if (table === 'operation_logs') {
          return {
            select: () => ({
              eq: () => ({
                order: () =>
                  Promise.resolve({ data: [...mockLogs].reverse(), error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns logs in descending order (newest first)
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.logs).toHaveLength(2)
      // Most recent (completed) should be first
      expect(data.logs[0].event_type).toBe('completed')
      expect(data.logs[1].event_type).toBe('started')
    })

    it('should return empty array when no logs exist', async () => {
      // GIVEN: Operation with no logs
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
        if (table === 'operation_logs') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: [], error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns empty array
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.logs).toHaveLength(0)
      expect(data.total).toBe(0)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    it('should return logs with correct structure', async () => {
      // GIVEN: Operation with logs
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
        if (table === 'operation_logs') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockLogs, error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns expected structure
      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toHaveProperty('logs')
      expect(data).toHaveProperty('total')
      expect(data.total).toBe(2)

      const log = data.logs[0]
      expect(log).toHaveProperty('id')
      expect(log).toHaveProperty('event_type')
      expect(log).toHaveProperty('old_status')
      expect(log).toHaveProperty('new_status')
      expect(log).toHaveProperty('user_id')
      expect(log).toHaveProperty('changed_by_user')
      expect(log).toHaveProperty('metadata')
      expect(log).toHaveProperty('notes')
      expect(log).toHaveProperty('created_at')
    })

    it('should include metadata with yield and duration for completed events', async () => {
      // GIVEN: Operation with completed log
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
        if (table === 'operation_logs') {
          return {
            select: () => ({
              eq: () => ({
                order: () => Promise.resolve({ data: mockLogs, error: null }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Completed log has metadata
      expect(response.status).toBe(200)
      const data = await response.json()

      const completedLog = data.logs.find((l: any) => l.event_type === 'completed')
      expect(completedLog.metadata).toBeDefined()
      expect(completedLog.metadata.actual_yield_percent).toBe(95.5)
      expect(completedLog.metadata.duration_minutes).toBe(45)
    })

    it('should support event_type filter via query param', async () => {
      // GIVEN: Query for specific event type
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
        if (table === 'operation_logs') {
          return {
            select: () => ({
              eq: vi.fn().mockImplementation(() => ({
                eq: () => ({
                  order: () =>
                    Promise.resolve({
                      data: mockLogs.filter((l) => l.event_type === 'started'),
                      error: null,
                    }),
                }),
                order: () =>
                  Promise.resolve({
                    data: mockLogs.filter((l) => l.event_type === 'started'),
                    error: null,
                  }),
              })),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: GET request with event_type filter
      const url = `http://localhost/api/production/work-orders/${TEST_WO_ID}/operations/${TEST_OP_ID}/logs?event_type=started`
      const request = new NextRequest(url, { method: 'GET' })
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns only filtered logs
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.logs.every((l: any) => l.event_type === 'started')).toBe(true)
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      setupAuthenticatedUser()
    })

    it('should return 500 when database query fails', async () => {
      // GIVEN: Database error
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
        if (table === 'operation_logs') {
          return {
            select: () => ({
              eq: () => ({
                order: () =>
                  Promise.resolve({ data: null, error: { message: 'Database error' } }),
              }),
            }),
          }
        }
        return createMockQueryBuilder()
      })

      // WHEN: GET request is made
      const request = createRequest()
      const response = await GET(request, {
        params: Promise.resolve({ id: TEST_WO_ID, opId: TEST_OP_ID }),
      })

      // THEN: Returns 500
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})
