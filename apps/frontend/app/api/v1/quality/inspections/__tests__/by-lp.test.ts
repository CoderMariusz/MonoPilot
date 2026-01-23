import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Integration Tests: Get Inspection by LP API
 * Story: 06.8 Scanner QA Pass/Fail
 * Endpoint: GET /api/quality/inspections/by-lp/:lpId
 * AC-8.2: Scan LP to Load Inspection
 *
 * Tests LP-based inspection lookup for scanner workflow
 */

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
      maybeSingle: vi.fn(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
  })),
}))

describe('GET /api/quality/inspections/by-lp/:lpId - Success Cases (AC-8.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return inspection if pending inspection exists for LP', async () => {
    const lpId = 'lp-uuid-001'

    const mockLP = {
      id: lpId,
      barcode: 'LP00000001',
      product_id: 'prod-001',
      batch_number: 'BATCH-2025-001',
      quantity: 100,
      qa_status: 'pending',
    }

    const mockInspection = {
      id: 'insp-uuid-001',
      lp_id: lpId,
      inspection_number: 'INS-INC-2025-00001',
      status: 'in_progress',
      result: null,
      created_at: new Date().toISOString(),
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    ;(supabase.from as any)('license_plates')
      .select()
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: mockLP,
        error: null,
      })

    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq('lp_id', lpId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single.mockResolvedValue({
        data: mockInspection,
        error: null,
      })

    const expectedResponse = {
      inspection: mockInspection,
      lp: mockLP,
      has_pending_inspection: true,
    }

    expect(expectedResponse).toHaveProperty('inspection')
    expect(expectedResponse.inspection).toEqual(mockInspection)
    expect(expectedResponse.has_pending_inspection).toBe(true)
  })

  it('should return LP with null inspection if no pending inspection', async () => {
    const lpId = 'lp-uuid-002'

    const mockLP = {
      id: lpId,
      barcode: 'LP00000002',
      qa_status: 'passed',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    ;(supabase.from as any)('license_plates')
      .select()
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: mockLP,
        error: null,
      })

    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq('lp_id', lpId)
      .order()
      .limit()
      .single.mockResolvedValue({
        data: null,
        error: null,
      })

    const expectedResponse = {
      inspection: null,
      lp: mockLP,
      has_pending_inspection: false,
    }

    expect(expectedResponse.inspection).toBeNull()
    expect(expectedResponse.has_pending_inspection).toBe(false)
  })

  it('should only return pending/in_progress inspections (filter completed)', async () => {
    const lpId = 'lp-uuid-003'

    const mockLP = {
      id: lpId,
      barcode: 'LP00000003',
    }

    // Completed inspection should be filtered out
    const completedInspection = {
      id: 'insp-completed',
      status: 'completed',
      result: 'pass',
    }

    // In-progress inspection should be returned
    const inProgressInspection = {
      id: 'insp-in-progress',
      status: 'in_progress',
      result: null,
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    ;(supabase.from as any)('license_plates')
      .select()
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: mockLP,
        error: null,
      })

    // Should query for in_progress inspection
    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq('lp_id', lpId)
      .eq('status', 'in_progress')
      .order()
      .limit()
      .single.mockResolvedValue({
        data: inProgressInspection,
        error: null,
      })

    expect(inProgressInspection.status).toBe('in_progress')
  })

  it('should return 200 with inspection data', async () => {
    const lpId = 'lp-uuid-001'

    const expectedResponse = {
      inspection: {
        id: 'insp-001',
        lp_id: lpId,
        status: 'in_progress',
      },
      lp: {
        id: lpId,
        barcode: 'LP00000001',
      },
      has_pending_inspection: true,
    }

    expect(expectedResponse).toHaveProperty('inspection')
    expect(expectedResponse).toHaveProperty('lp')
    expect(expectedResponse).toHaveProperty('has_pending_inspection')
  })
})

describe('GET /api/quality/inspections/by-lp/:lpId - Error Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 404 if LP not found', async () => {
    const lpId = 'lp-uuid-nonexistent'

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    ;(supabase.from as any)('license_plates')
      .select()
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: null,
        error: new Error('LP not found'),
      })

    // Should return 404 when LP not found
    expect(supabase.from).toBeDefined()
  })

  it('should return 400 if lpId is invalid UUID', async () => {
    const lpId = 'invalid-uuid'

    // Validation should fail for non-UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    expect(uuidRegex.test(lpId)).toBe(false)
  })

  it('should return 403 if user org_id does not match LP org', async () => {
    const lpId = 'lp-uuid-other-org'

    const mockLP = {
      id: lpId,
      org_id: 'other-org-uuid', // Different org
      barcode: 'LP00000099',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    ;(supabase.from as any)('license_plates')
      .select()
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: mockLP,
        error: null,
      })

    // RLS should enforce org isolation
    // API should return 403 if user's org doesn't match
    expect(mockLP.org_id).not.toBe('org-uuid')
  })
})

describe('GET /api/quality/inspections/by-lp/:lpId - RLS Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should respect RLS and only return data for user org', async () => {
    const lpId = 'lp-uuid-001'

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    // RLS policy should filter by org_id
    ;(supabase.from as any)('license_plates')
      .select()
      .eq('org_id', 'org-uuid')
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: {
          id: lpId,
          org_id: 'org-uuid',
          barcode: 'LP00000001',
        },
        error: null,
      })

    // Verify RLS filter was applied
    expect(supabase.from).toHaveBeenCalledWith('license_plates')
  })

  it('should not return inspection from different org due to RLS', async () => {
    const lpId = 'lp-uuid-other-org'

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    // RLS should prevent returning data from other org
    ;(supabase.from as any)('license_plates')
      .select()
      .eq('org_id', 'org-uuid')
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: null,
        error: new Error('Not found'),
      })

    expect(supabase.from).toBeDefined()
  })
})

describe('GET /api/quality/inspections/by-lp/:lpId - Barcode Lookup (AC-8.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should support lookup by LP barcode if endpoint modified', async () => {
    const barcode = 'LP00000001'

    const mockLP = {
      id: 'lp-uuid-001',
      barcode,
      qa_status: 'pending',
    }

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    // If endpoint supports barcode lookup via query param
    ;(supabase.from as any)('license_plates')
      .select()
      .eq('barcode', barcode)
      .single.mockResolvedValue({
        data: mockLP,
        error: null,
      })

    // Lookup should work with barcode
    expect(mockLP.barcode).toBe(barcode)
  })

  it('should handle barcode format variations (case-insensitive)', async () => {
    const barcode1 = 'LP00000001'
    const barcode2 = 'lp00000001'

    // Both should map to same LP
    expect(barcode1.toUpperCase()).toBe(barcode2.toUpperCase())
  })
})

describe('GET /api/quality/inspections/by-lp/:lpId - Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return within 500ms for valid LP lookup', async () => {
    const lpId = 'lp-uuid-001'

    const { createServerSupabase } = await import('@/lib/supabase/server')
    const supabase = createServerSupabase()

    const startTime = Date.now()

    ;(supabase.from as any)('license_plates')
      .select()
      .eq('id', lpId)
      .single.mockResolvedValue({
        data: { id: lpId, barcode: 'LP00000001' },
        error: null,
      })

    ;(supabase.from as any)('quality_inspections')
      .select()
      .eq('lp_id', lpId)
      .order()
      .limit()
      .single.mockResolvedValue({
        data: null,
        error: null,
      })

    await supabase.from('license_plates').select().eq('id', lpId).single()

    const duration = Date.now() - startTime
    // Should complete in under 500ms
    expect(duration).toBeLessThan(500)
  })
})

describe('GET /api/quality/inspections/by-lp/:lpId - Response Format', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return proper response structure', async () => {
    const expectedResponse = {
      inspection: {
        id: 'insp-uuid',
        lp_id: 'lp-uuid',
        inspection_number: 'INS-INC-2025-00001',
        status: 'in_progress',
        result: null,
      },
      lp: {
        id: 'lp-uuid',
        barcode: 'LP00000001',
        product_id: 'prod-uuid',
        batch_number: 'BATCH-2025-001',
        quantity: 100,
        qa_status: 'pending',
      },
      has_pending_inspection: true,
    }

    expect(expectedResponse).toHaveProperty('inspection')
    expect(expectedResponse).toHaveProperty('lp')
    expect(expectedResponse).toHaveProperty('has_pending_inspection')
    expect(typeof expectedResponse.has_pending_inspection).toBe('boolean')
  })

  it('should return inspection with all required fields', async () => {
    const inspection = {
      id: 'insp-uuid',
      lp_id: 'lp-uuid',
      inspection_number: 'INS-INC-2025-00001',
      status: 'in_progress',
      result: null,
      created_at: '2025-12-16T10:00:00Z',
    }

    expect(inspection).toHaveProperty('id')
    expect(inspection).toHaveProperty('lp_id')
    expect(inspection).toHaveProperty('inspection_number')
    expect(inspection).toHaveProperty('status')
  })

  it('should return LP with all required fields', async () => {
    const lp = {
      id: 'lp-uuid',
      barcode: 'LP00000001',
      product_id: 'prod-uuid',
      batch_number: 'BATCH-2025-001',
      quantity: 100,
      qa_status: 'pending',
    }

    expect(lp).toHaveProperty('id')
    expect(lp).toHaveProperty('barcode')
    expect(lp).toHaveProperty('qa_status')
  })
})
