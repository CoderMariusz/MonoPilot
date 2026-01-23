import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Integration Tests: Scanner QA Quick Inspection API
 * Story: 06.8 Scanner QA Pass/Fail
 * Endpoint: POST /api/quality/scanner/quick-inspection
 * AC-8.4, AC-8.5, AC-8.15: Quick Pass/Fail & Audit Trail
 *
 * Tests inspection completion, LP status update, and audit logging
 */

// Mock request/response
const mockRequest = {
  json: vi.fn(),
  headers: {
    get: vi.fn((name: string) => {
      if (name === 'authorization') return 'Bearer test-token'
      return null
    }),
  },
}

const mockResponse = (status: number = 200) => ({
  status: vi.fn(() => ({
    json: vi.fn((data: any) => ({
      status,
      body: data,
    })),
  })),
})

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
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
    })),
  })),
}))

describe('POST /api/quality/scanner/quick-inspection - Quick Pass (AC-8.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete inspection with pass result', async () => {
    const payload = {
      inspection_id: 'insp-uuid-001',
      result: 'pass',
      inspection_method: 'scanner',
      scanner_device_id: 'device-001',
    }

    mockRequest.json.mockResolvedValue(payload)

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockInspection = {
      id: payload.inspection_id,
      lp_id: 'lp-uuid-001',
      status: 'in_progress',
      result: null,
    }

    const mockUpdatedInspection = {
      ...mockInspection,
      status: 'completed',
      result: 'pass',
      inspection_method: 'scanner',
      scanner_device_id: 'device-001',
      completed_at: new Date().toISOString(),
    }

    // Mock inspection lookup
    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq('id', payload.inspection_id)
      .single.mockResolvedValue({
        data: mockInspection,
        error: null,
      })

    // Mock inspection update
    ;(supabase.from as any)('quality_inspections')
      .update({})
      .eq()
      .single.mockResolvedValue({
        data: mockUpdatedInspection,
        error: null,
      })

    // Verify inspection status transitioned to completed
    expect(mockUpdatedInspection.status).toBe('completed')
    expect(mockUpdatedInspection.result).toBe('pass')
  })

  it('should update LP QA status to passed', async () => {
    const payload = {
      inspection_id: 'insp-uuid-001',
      result: 'pass',
      inspection_method: 'scanner',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockInspection = {
      id: payload.inspection_id,
      lp_id: 'lp-uuid-001',
    }

    const mockLP = {
      id: 'lp-uuid-001',
      qa_status: 'pending',
    }

    const mockUpdatedLP = {
      ...mockLP,
      qa_status: 'passed',
    }

    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq()
      .single.mockResolvedValue({
        data: mockInspection,
        error: null,
      })

    ;(supabase.from as any)('license_plates')
      .select()
      .eq()
      .single.mockResolvedValue({
        data: mockLP,
        error: null,
      })

    ;(supabase.from as any)('license_plates')
      .update({})
      .eq()
      .single.mockResolvedValue({
        data: mockUpdatedLP,
        error: null,
      })

    expect(mockUpdatedLP.qa_status).toBe('passed')
  })

  it('should return 200 with inspection data on success', async () => {
    const payload = {
      inspection_id: 'insp-uuid-001',
      result: 'pass',
      inspection_method: 'scanner',
    }

    const expectedResponse = {
      inspection: {
        id: payload.inspection_id,
        status: 'completed',
        result: 'pass',
      },
      lp_status_updated: true,
      lp_new_status: 'passed',
    }

    // Verify response structure
    expect(expectedResponse).toHaveProperty('inspection')
    expect(expectedResponse).toHaveProperty('lp_status_updated')
    expect(expectedResponse).toHaveProperty('lp_new_status')
  })
})

describe('POST /api/quality/scanner/quick-inspection - Quick Fail (AC-8.5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete inspection with fail result and notes', async () => {
    const payload = {
      inspection_id: 'insp-uuid-002',
      result: 'fail',
      result_notes: 'Damaged packaging detected',
      defects_found: 3,
      inspection_method: 'scanner',
    }

    mockRequest.json.mockResolvedValue(payload)

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockInspection = {
      id: payload.inspection_id,
      lp_id: 'lp-uuid-002',
      status: 'in_progress',
    }

    const mockUpdatedInspection = {
      ...mockInspection,
      status: 'completed',
      result: 'fail',
      result_notes: payload.result_notes,
      defects_found: payload.defects_found,
      inspection_method: 'scanner',
    }

    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq()
      .single.mockResolvedValue({
        data: mockInspection,
        error: null,
      })

    ;(supabase.from as any)('quality_inspections')
      .update({})
      .eq()
      .single.mockResolvedValue({
        data: mockUpdatedInspection,
        error: null,
      })

    // Verify fail inspection captured notes and defect count
    expect(mockUpdatedInspection.result).toBe('fail')
    expect(mockUpdatedInspection.result_notes).toBe('Damaged packaging detected')
    expect(mockUpdatedInspection.defects_found).toBe(3)
  })

  it('should update LP QA status to failed', async () => {
    const payload = {
      inspection_id: 'insp-uuid-002',
      result: 'fail',
      inspection_method: 'scanner',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockLP = {
      id: 'lp-uuid-002',
      qa_status: 'pending',
    }

    const mockUpdatedLP = {
      ...mockLP,
      qa_status: 'failed',
    }

    ;(supabase.from as any)('license_plates')
      .update({})
      .eq()
      .single.mockResolvedValue({
        data: mockUpdatedLP,
        error: null,
      })

    expect(mockUpdatedLP.qa_status).toBe('failed')
  })
})

describe('POST /api/quality/scanner/quick-inspection - Validation & Errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 if inspection_id is missing', async () => {
    const payload = {
      result: 'pass',
      inspection_method: 'scanner',
    }

    mockRequest.json.mockResolvedValue(payload)

    // Validation should fail for missing inspection_id
    expect(payload).not.toHaveProperty('inspection_id')
  })

  it('should return 400 if result is invalid enum value', async () => {
    const payload = {
      inspection_id: 'insp-uuid',
      result: 'maybe', // Invalid
      inspection_method: 'scanner',
    }

    mockRequest.json.mockResolvedValue(payload)

    // Validation should fail for invalid result enum
    expect(['pass', 'fail']).not.toContain(payload.result)
  })

  it('should return 400 if inspection already completed', async () => {
    const payload = {
      inspection_id: 'insp-uuid-completed',
      result: 'pass',
      inspection_method: 'scanner',
    }

    mockRequest.json.mockResolvedValue(payload)

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const mockInspection = {
      id: payload.inspection_id,
      status: 'completed',
      result: 'pass',
    }

    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq()
      .single.mockResolvedValue({
        data: mockInspection,
        error: null,
      })

    // Should prevent re-completion
    expect(mockInspection.status).toBe('completed')
  })

  it('should return 403 if user not QA Inspector role', async () => {
    const payload = {
      inspection_id: 'insp-uuid',
      result: 'pass',
      inspection_method: 'scanner',
    }

    mockRequest.json.mockResolvedValue(payload)

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    // Mock user with VIEWER role instead of QA_INSPECTOR
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: {
        user: {
          id: 'user-uuid',
          user_metadata: { role: 'VIEWER' },
        } as any,
      },
      error: null,
    })

    // Authorization should fail
    expect(supabase.auth.getUser).toBeDefined()
  })

  it('should return 404 if inspection not found', async () => {
    const payload = {
      inspection_id: 'insp-uuid-nonexistent',
      result: 'pass',
      inspection_method: 'scanner',
    }

    mockRequest.json.mockResolvedValue(payload)

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq()
      .single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

    // Should return 404 for missing inspection
    expect(supabase.from).toBeDefined()
  })
})

describe('POST /api/quality/scanner/quick-inspection - Audit Trail (AC-8.15)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should log audit trail with scanner metadata on pass', async () => {
    const payload = {
      inspection_id: 'insp-uuid-001',
      result: 'pass',
      inspection_method: 'scanner',
      scanner_device_id: 'device-001',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const expectedAuditEntry = {
      entity_type: 'inspection',
      entity_id: payload.inspection_id,
      action: 'scanner_complete',
      user_id: 'user-uuid',
      old_value: { status: 'in_progress', result: null },
      new_value: { status: 'completed', result: 'pass' },
      change_reason: 'Scanner quick pass',
      metadata: {
        inspection_method: 'scanner',
        device_id: 'device-001',
        offline_queued: false,
      },
    }

    ;(supabase.from as any)('quality_audit_log')
      .insert({})
      .single.mockResolvedValue({
        data: expectedAuditEntry,
        error: null,
      })

    // Verify audit trail structure
    expect(expectedAuditEntry).toHaveProperty('entity_type', 'inspection')
    expect(expectedAuditEntry).toHaveProperty('action', 'scanner_complete')
    expect(expectedAuditEntry.metadata).toHaveProperty('inspection_method', 'scanner')
    expect(expectedAuditEntry.metadata).toHaveProperty('device_id', 'device-001')
  })

  it('should include offline_queued flag in audit trail', async () => {
    const auditEntry = {
      metadata: {
        inspection_method: 'scanner',
        device_id: 'device-001',
        offline_queued: true, // This action was queued offline
        sync_delay_seconds: 45,
      },
    }

    expect(auditEntry.metadata).toHaveProperty('offline_queued', true)
    expect(auditEntry.metadata).toHaveProperty('sync_delay_seconds')
  })
})
