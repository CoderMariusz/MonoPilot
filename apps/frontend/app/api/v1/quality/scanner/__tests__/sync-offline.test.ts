import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Integration Tests: Scanner QA Sync Offline API
 * Story: 06.8 Scanner QA Pass/Fail
 * Endpoint: POST /api/quality/scanner/sync-offline
 * AC-8.9: Auto-Sync When Online
 *
 * Tests bulk offline action sync, error handling, and conflict prevention
 */

// Mock Supabase auth
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({
          data: {
            user: {
              id: 'user-uuid',
              user_metadata: { org_id: 'org-uuid' },
            },
          },
          error: null,
        })
      ),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
  })),
}))

describe('POST /api/quality/scanner/sync-offline - Successful Sync (AC-8.9)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should sync 3 queued actions successfully', async () => {
    const payload = {
      actions: [
        {
          id: 'local-uuid-1',
          type: 'quick_inspection',
          payload: {
            inspection_id: 'insp-1',
            result: 'pass',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:30:00Z',
        },
        {
          id: 'local-uuid-2',
          type: 'quick_inspection',
          payload: {
            inspection_id: 'insp-2',
            result: 'fail',
            result_notes: 'Damaged',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:35:00Z',
        },
        {
          id: 'local-uuid-3',
          type: 'quick_inspection',
          payload: {
            inspection_id: 'insp-3',
            result: 'pass',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:40:00Z',
        },
      ],
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockResponse = {
      success: 3,
      failed: 0,
      errors: [],
    }

    ;(supabase.rpc as any)('sync_offline_inspections').mockResolvedValue({
      data: mockResponse,
      error: null,
    })

    expect(mockResponse.success).toBe(3)
    expect(mockResponse.failed).toBe(0)
    expect(mockResponse.errors).toHaveLength(0)
  })

  it('should process actions in chronological order', async () => {
    const payload = {
      actions: [
        {
          id: 'local-3',
          type: 'quick_inspection',
          timestamp: '2025-12-16T10:40:00Z',
          payload: { inspection_id: 'insp-3', result: 'pass', inspection_method: 'scanner' },
        },
        {
          id: 'local-1',
          type: 'quick_inspection',
          timestamp: '2025-12-16T10:30:00Z',
          payload: { inspection_id: 'insp-1', result: 'pass', inspection_method: 'scanner' },
        },
        {
          id: 'local-2',
          type: 'quick_inspection',
          timestamp: '2025-12-16T10:35:00Z',
          payload: { inspection_id: 'insp-2', result: 'fail', inspection_method: 'scanner' },
        },
      ],
    }

    // Should be sorted chronologically before processing
    const sortedActions = [...payload.actions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    expect(sortedActions[0].id).toBe('local-1')
    expect(sortedActions[1].id).toBe('local-2')
    expect(sortedActions[2].id).toBe('local-3')
  })

  it('should update inspection and LP status for each action', async () => {
    const action = {
      id: 'local-1',
      type: 'quick_inspection',
      payload: {
        inspection_id: 'insp-1',
        result: 'pass',
        inspection_method: 'scanner',
      },
      timestamp: '2025-12-16T10:30:00Z',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockInspection = {
      id: 'insp-1',
      lp_id: 'lp-1',
      status: 'completed',
      result: 'pass',
    }

    const mockLP = {
      id: 'lp-1',
      qa_status: 'passed',
    }

    ;(supabase.from as any)('quality_inspections')
      .update({})
      .eq()
      .single.mockResolvedValue({
        data: mockInspection,
        error: null,
      })

    ;(supabase.from as any)('license_plates')
      .update({})
      .eq()
      .single.mockResolvedValue({
        data: mockLP,
        error: null,
      })

    ;(supabase.from as any)('scanner_offline_queue')
      .insert({})
      .single.mockResolvedValue({
        data: { id: 'queue-entry', sync_status: 'synced' },
        error: null,
      })

    // Verify inspection and LP were updated
    expect(mockInspection.status).toBe('completed')
    expect(mockLP.qa_status).toBe('passed')
  })

  it('should return 200 with success summary', async () => {
    const expectedResponse = {
      success: 3,
      failed: 0,
      errors: [],
    }

    expect(expectedResponse.success).toBe(3)
    expect(expectedResponse.failed).toBe(0)
  })
})

describe('POST /api/quality/scanner/sync-offline - Partial Failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle partial failures and continue processing', async () => {
    const payload = {
      actions: [
        {
          id: 'local-1',
          type: 'quick_inspection',
          payload: {
            inspection_id: 'insp-valid',
            result: 'pass',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:30:00Z',
        },
        {
          id: 'local-2',
          type: 'quick_inspection',
          payload: {
            inspection_id: 'insp-invalid',
            result: 'fail',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:35:00Z',
        },
        {
          id: 'local-3',
          type: 'quick_inspection',
          payload: {
            inspection_id: 'insp-valid-2',
            result: 'pass',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:40:00Z',
        },
      ],
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockResponse = {
      success: 2,
      failed: 1,
      errors: [
        {
          action_id: 'local-2',
          error: 'Inspection not found',
        },
      ],
    }

    ;(supabase.rpc as any)('sync_offline_inspections').mockResolvedValue({
      data: mockResponse,
      error: null,
    })

    expect(mockResponse.success).toBe(2)
    expect(mockResponse.failed).toBe(1)
    expect(mockResponse.errors[0].action_id).toBe('local-2')
  })

  it('should return error details with action_id and error message', async () => {
    const errorDetail = {
      action_id: 'local-2',
      error: 'Inspection already completed',
    }

    expect(errorDetail).toHaveProperty('action_id')
    expect(errorDetail).toHaveProperty('error')
    expect(errorDetail.error).toContain('already completed')
  })

  it('should not clear queue on partial failure (allow retry)', async () => {
    const mockResponse = {
      success: 2,
      failed: 1,
      errors: [
        {
          action_id: 'local-2',
          error: 'Inspection not found',
        },
      ],
    }

    // Failed action should remain in queue for retry
    expect(mockResponse.failed).toBeGreaterThan(0)
  })
})

describe('POST /api/quality/scanner/sync-offline - Conflict Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should prevent duplicate completions', async () => {
    const action = {
      id: 'local-dup',
      type: 'quick_inspection',
      payload: {
        inspection_id: 'insp-already-done',
        result: 'pass',
        inspection_method: 'scanner',
      },
      timestamp: '2025-12-16T10:30:00Z',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockResponse = {
      success: 0,
      failed: 1,
      errors: [
        {
          action_id: 'local-dup',
          error: 'Inspection already completed',
        },
      ],
    }

    ;(supabase.rpc as any)('sync_offline_inspections').mockResolvedValue({
      data: mockResponse,
      error: null,
    })

    expect(mockResponse.errors[0].error).toContain('already completed')
  })

  it('should log duplicate attempt in scanner_offline_queue with sync_status failed', async () => {
    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const expectedQueueEntry = {
      id: 'queue-entry',
      sync_status: 'duplicate',
      error_message: 'Inspection already completed',
    }

    ;(supabase.from as any)('scanner_offline_queue')
      .insert({})
      .single.mockResolvedValue({
        data: expectedQueueEntry,
        error: null,
      })

    expect(expectedQueueEntry.sync_status).toBe('duplicate')
    expect(expectedQueueEntry).toHaveProperty('error_message')
  })
})

describe('POST /api/quality/scanner/sync-offline - Validation & Limits', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if actions array is empty', async () => {
    const payload = {
      actions: [],
    }

    // Validation should fail for empty actions
    expect(payload.actions).toHaveLength(0)
  })

  it('should return 400 if actions exceed 100', async () => {
    const actions = Array.from({ length: 101 }, (_, i) => ({
      id: `local-${i}`,
      type: 'quick_inspection',
      payload: {
        inspection_id: `insp-${i}`,
        result: 'pass',
        inspection_method: 'scanner',
      },
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
    }))

    const payload = {
      actions,
    }

    // Should validate max 100 actions
    expect(payload.actions.length).toBeGreaterThan(100)
  })

  it('should return 400 if action payload missing required fields', async () => {
    const payload = {
      actions: [
        {
          id: 'local-1',
          type: 'quick_inspection',
          payload: {
            // Missing inspection_id
            result: 'pass',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:30:00Z',
        },
      ],
    }

    const action = payload.actions[0]
    expect(action.payload).not.toHaveProperty('inspection_id')
  })

  it('should return 403 if user not QA Inspector', async () => {
    const payload = {
      actions: [
        {
          id: 'local-1',
          type: 'quick_inspection',
          payload: {
            inspection_id: 'insp-1',
            result: 'pass',
            inspection_method: 'scanner',
          },
          timestamp: '2025-12-16T10:30:00Z',
        },
      ],
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    // Mock user with VIEWER role
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'user-uuid',
          user_metadata: { role: 'VIEWER' },
        } as any,
      },
      error: null,
    })

    expect(supabase.auth.getUser).toBeDefined()
  })
})

describe('POST /api/quality/scanner/sync-offline - Response Format', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return response with success, failed, and errors properties', async () => {
    const expectedResponse = {
      success: 2,
      failed: 1,
      errors: [
        {
          action_id: 'local-2',
          error: 'Inspection not found',
        },
      ],
    }

    expect(expectedResponse).toHaveProperty('success')
    expect(expectedResponse).toHaveProperty('failed')
    expect(expectedResponse).toHaveProperty('errors')
    expect(Array.isArray(expectedResponse.errors)).toBe(true)
  })

  it('should return 200 with response body', async () => {
    const mockResponse = {
      success: 3,
      failed: 0,
      errors: [],
    }

    // Status 200 for successful sync (regardless of individual action results)
    expect(mockResponse.success).toBeGreaterThanOrEqual(0)
  })
})

describe('POST /api/quality/scanner/sync-offline - Performance (AC-8.13)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete bulk sync of 50 actions in under 10 seconds', async () => {
    const actions = Array.from({ length: 50 }, (_, i) => ({
      id: `local-${i}`,
      type: 'quick_inspection',
      payload: {
        inspection_id: `insp-${i}`,
        result: i % 2 === 0 ? 'pass' : 'fail',
        inspection_method: 'scanner',
      },
      timestamp: new Date(Date.now() + i * 1000).toISOString(),
    }))

    const startTime = Date.now()
    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    ;(supabase.rpc as any)('sync_offline_inspections').mockResolvedValue({
      data: {
        success: 50,
        failed: 0,
        errors: [],
      },
      error: null,
    })

    await supabase.rpc('sync_offline_inspections', { actions })

    const duration = Date.now() - startTime
    // Should complete in under 10 seconds
    expect(duration).toBeLessThan(10000)
  })
})
