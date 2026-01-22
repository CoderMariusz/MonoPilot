/**
 * Specification Service - Unit Tests
 * Story: 06.3 - Product Specifications
 * Phase: RED - Tests will fail until implementation exists
 *
 * Tests the SpecificationService which handles:
 * - Active specification resolution
 * - Specification approval with superseding
 * - Versioning and cloning
 * - Review date management
 * - Spec number generation
 *
 * Coverage Target: 90%+
 * Test Count: 30+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-06: Approve specification workflow
 * - AC-08: Clone as new version
 * - AC-09: Active spec resolution
 * - AC-10: No active spec (404 case)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SpecificationService } from '../specification-service'
import type { QualitySpecification } from '@/lib/types/quality'

/**
 * Mock Supabase
 */
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

vi.mock('../audit-service', () => ({
  AuditService: {
    log: vi.fn().mockResolvedValue(undefined),
  },
}))

import { createServerSupabase } from '@/lib/supabase/server'
import { AuditService } from '../audit-service'

/**
 * Test Data Helpers
 */
const createMockSpecification = (overrides?: Partial<QualitySpecification>): QualitySpecification => ({
  id: 'spec-001',
  org_id: 'org-001',
  product_id: 'prod-001',
  product_code: 'PROD-001',
  product_name: 'Test Product',
  spec_number: 'QS-202512-001',
  version: 1,
  name: 'Test Specification',
  description: 'Test specification description',
  effective_date: '2025-01-01',
  expiry_date: null,
  status: 'draft',
  approved_by: null,
  approved_by_name: null,
  approved_at: null,
  superseded_by: null,
  superseded_at: null,
  review_frequency_days: 365,
  next_review_date: null,
  last_review_date: null,
  notes: null,
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user-001',
  updated_at: '2025-01-01T00:00:00Z',
  updated_by: null,
  review_status: 'ok',
  days_until_review: undefined,
  version_count: 1,
  ...overrides,
})

describe('SpecificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getActiveForProduct', () => {
    it('should return active specification when one exists', async () => {
      const mockSpec = createMockSpecification({ status: 'active' })
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: mockSpec.id, error: null }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - getActiveForProduct not implemented
      const result = await SpecificationService.getActiveForProduct('org-001', 'prod-001')
      expect(result).toBeDefined()
    })

    it('should return null when no active specification exists', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - getActiveForProduct not implemented
      const result = await SpecificationService.getActiveForProduct('org-001', 'prod-001')
      expect(result).toBeNull()
    })

    it('should ignore expired specifications', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Spec with expiry_date in past should not be returned
      const result = await SpecificationService.getActiveForProduct('org-001', 'prod-001')
      expect(result).toBeNull()
    })

    it('should ignore superseded specifications', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Spec with status=superseded should not be returned
      const result = await SpecificationService.getActiveForProduct('org-001', 'prod-001')
      expect(result).toBeNull()
    })

    it('should return most recent active by effective_date', async () => {
      const mockSpec = createMockSpecification({
        id: 'spec-v2',
        version: 2,
        status: 'active',
        effective_date: '2025-01-15',
      })
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: mockSpec.id, error: null }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Should return v2 (more recent) not v1
      const result = await SpecificationService.getActiveForProduct('org-001', 'prod-001')
      expect(result).toBeDefined()
    })

    it('should support as_of_date parameter for historical query', async () => {
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: 'spec-v1', error: null }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const asOfDate = new Date('2025-01-10')
      const result = await SpecificationService.getActiveForProduct('org-001', 'prod-001', asOfDate)

      expect(mockSupabase.rpc).toHaveBeenCalled()
      const callArgs = vi.mocked(mockSupabase.rpc).mock.calls[0]
      expect(callArgs[1]).toHaveProperty('p_as_of_date')
    })
  })

  describe('approve', () => {
    it('should change status from draft to active', async () => {
      const draftSpec = createMockSpecification({ status: 'draft' })
      const activeSpec = createMockSpecification({
        status: 'active',
        approved_by: 'user-001',
        approved_at: '2025-01-22T10:00:00Z',
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: activeSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - approve not implemented
      const result = await SpecificationService.approve('spec-001', 'user-001')
      expect(result.spec.status).toBe('active')
    })

    it('should set approved_by and approved_at on approval', async () => {
      const approvedSpec = createMockSpecification({
        status: 'active',
        approved_by: 'user-001',
        approved_at: '2025-01-22T10:00:00Z',
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: approvedSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - approve not implemented
      const result = await SpecificationService.approve('spec-001', 'user-001')
      expect(result.spec.approved_by).toBe('user-001')
      expect(result.spec.approved_at).toBeDefined()
    })

    it('should supersede previous active specification', async () => {
      // First call returns draft spec (for validation),
      // second call returns approved spec (from update),
      // third call returns superseded specs
      const draftSpec = createMockSpecification({ status: 'draft' })
      const approvedSpec = createMockSpecification({
        status: 'active',
        approved_by: 'user-001',
        approved_at: '2025-01-22T10:00:00Z',
      })
      const supersededSpecs = [
        {
          id: 'spec-old',
          spec_number: 'QS-202512-001',
          version: 1,
        },
      ]

      // Track call count to return appropriate data
      let selectCallCount = 0
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: approvedSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockImplementation(() => {
              selectCallCount++
              return {
                eq: vi.fn().mockResolvedValue({
                  data: selectCallCount === 1 ? [draftSpec] : supersededSpecs,
                  error: null
                }),
              }
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const result = await SpecificationService.approve('spec-001', 'user-001')
      expect(result.superseded).toHaveLength(1)
      expect(result.superseded[0].id).toBe('spec-old')
    })

    it('should calculate next_review_date from effective_date + review_frequency_days', async () => {
      const approvedSpec = createMockSpecification({
        status: 'active',
        effective_date: '2025-01-01',
        review_frequency_days: 90,
        next_review_date: '2025-04-01', // 90 days later
        approved_by: 'user-001',
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: approvedSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - approve not implemented
      const result = await SpecificationService.approve('spec-001', 'user-001')
      expect(result.spec.next_review_date).toBe('2025-04-01')
    })

    it('should reject approval if status is not draft', async () => {
      const activeSpec = createMockSpecification({ status: 'active' })
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [activeSpec], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Should throw ValidationError - not draft
      await expect(SpecificationService.approve('spec-001', 'user-001')).rejects.toThrow('Only draft specifications can be approved')
    })

    it('should create audit log entry on approval', async () => {
      const approvedSpec = createMockSpecification({
        status: 'active',
        approved_by: 'user-001',
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: approvedSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - approve not implemented
      await SpecificationService.approve('spec-001', 'user-001')
      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'specification',
          entity_id: 'spec-001',
          action: 'approve',
          user_id: 'user-001',
        })
      )
    })
  })

  describe('cloneAsNewVersion', () => {
    it('should create new draft with incremented version', async () => {
      const sourceSpec = createMockSpecification({ id: 'spec-v1', version: 1, status: 'active' })
      const newSpec = createMockSpecification({
        id: 'spec-v2',
        version: 2,
        status: 'draft',
        spec_number: 'QS-202512-001',
      })

      // Track select calls: 1st for spec existence, 2nd for version lookup
      let selectCallCount = 0
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockImplementation(() => {
              selectCallCount++
              if (selectCallCount === 1) {
                // First call: check spec exists
                return {
                  eq: vi.fn().mockResolvedValue({ data: [sourceSpec], error: null }),
                }
              }
              // Second call: get max version
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }),
                    }),
                  }),
                }),
              }
            }),
          insert: vi
            .fn()
            .mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newSpec, error: null }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const result = await SpecificationService.cloneAsNewVersion('spec-v1', 'user-001')
      expect(result.version).toBe(2)
      expect(result.status).toBe('draft')
    })

    it('should copy name, description, and review_frequency from original', async () => {
      const sourceSpec = createMockSpecification({ id: 'spec-v1', version: 1, status: 'active' })
      const newSpec = createMockSpecification({
        version: 2,
        status: 'draft',
        name: 'Test Specification',
        description: 'Test specification description',
        review_frequency_days: 365,
      })

      let selectCallCount = 0
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockImplementation(() => {
              selectCallCount++
              if (selectCallCount === 1) {
                return { eq: vi.fn().mockResolvedValue({ data: [sourceSpec], error: null }) }
              }
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }),
                    }),
                  }),
                }),
              }
            }),
          insert: vi
            .fn()
            .mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newSpec, error: null }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const result = await SpecificationService.cloneAsNewVersion('spec-v1', 'user-001')
      expect(result.name).toBe('Test Specification')
      expect(result.description).toBe('Test specification description')
      expect(result.review_frequency_days).toBe(365)
    })

    it('should clear approval fields (approved_by, approved_at)', async () => {
      const sourceSpec = createMockSpecification({ id: 'spec-v1', version: 1, status: 'active' })
      const newSpec = createMockSpecification({
        version: 2,
        status: 'draft',
        approved_by: null,
        approved_at: null,
      })

      let selectCallCount = 0
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockImplementation(() => {
              selectCallCount++
              if (selectCallCount === 1) {
                return { eq: vi.fn().mockResolvedValue({ data: [sourceSpec], error: null }) }
              }
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }),
                    }),
                  }),
                }),
              }
            }),
          insert: vi
            .fn()
            .mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newSpec, error: null }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const result = await SpecificationService.cloneAsNewVersion('spec-v1', 'user-001')
      expect(result.approved_by).toBeNull()
      expect(result.approved_at).toBeNull()
    })

    it('should set effective_date to today', async () => {
      const today = new Date().toISOString().split('T')[0]
      const sourceSpec = createMockSpecification({ id: 'spec-v1', version: 1, status: 'active' })
      const newSpec = createMockSpecification({
        version: 2,
        status: 'draft',
        effective_date: today,
      })

      let selectCallCount = 0
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockImplementation(() => {
              selectCallCount++
              if (selectCallCount === 1) {
                return { eq: vi.fn().mockResolvedValue({ data: [sourceSpec], error: null }) }
              }
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }),
                    }),
                  }),
                }),
              }
            }),
          insert: vi
            .fn()
            .mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newSpec, error: null }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const result = await SpecificationService.cloneAsNewVersion('spec-v1', 'user-001')
      expect(result.effective_date).toBe(today)
    })

    it('should throw NotFoundError if spec not found', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Should throw NotFoundError
      await expect(SpecificationService.cloneAsNewVersion('non-existent', 'user-001')).rejects.toThrow('Specification not found')
    })

    it('should create audit log for cloned spec', async () => {
      const sourceSpec = createMockSpecification({ id: 'spec-v1', version: 1, status: 'active' })
      const newSpec = createMockSpecification({ version: 2, status: 'draft' })

      let selectCallCount = 0
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockImplementation(() => {
              selectCallCount++
              if (selectCallCount === 1) {
                return { eq: vi.fn().mockResolvedValue({ data: [sourceSpec], error: null }) }
              }
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: { version: 1 }, error: null }),
                    }),
                  }),
                }),
              }
            }),
          insert: vi
            .fn()
            .mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newSpec, error: null }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      await SpecificationService.cloneAsNewVersion('spec-v1', 'user-001')
      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'specification',
          action: 'create',
          user_id: 'user-001',
        })
      )
    })
  })

  describe('generateSpecNumber', () => {
    it('should generate QS-YYYYMM-001 format', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                like: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - generateSpecNumber not implemented
      const result = await SpecificationService.generateSpecNumber('org-001')
      expect(result).toMatch(/^QS-\d{6}-001$/)
    })

    it('should increment sequence within same month', async () => {
      // Use current month for test to be date-independent
      const now = new Date()
      const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
      const existingSpec = { spec_number: `QS-${yearMonth}-005` }
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                like: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: existingSpec, error: null }),
                    }),
                  }),
                }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const result = await SpecificationService.generateSpecNumber('org-001')
      expect(result).toBe(`QS-${yearMonth}-006`)
    })

    it('should reset sequence for new month', async () => {
      // Mock returns null - simulating no matching specs for current month
      // (In production, the like clause filters out specs from other months)
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                like: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      const result = await SpecificationService.generateSpecNumber('org-001')
      // Should be -001 for new month (no existing specs for current month)
      expect(result).toMatch(/^QS-\d{6}-001$/)
    })

    it('should pad sequence with zeros', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                like: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: null, error: null }),
                    }),
                  }),
                }),
              }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - generateSpecNumber not implemented
      const result = await SpecificationService.generateSpecNumber('org-001')
      // Should be 001, 002, not 1, 2
      expect(result).toMatch(/^QS-\d{6}-\d{3}$/)
    })
  })

  describe('completeReview', () => {
    it('should update last_review_date and next_review_date', async () => {
      const today = new Date().toISOString().split('T')[0]
      const reviewedSpec = createMockSpecification({
        status: 'active',
        last_review_date: today,
        next_review_date: '2026-01-22',
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: reviewedSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [reviewedSpec], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - completeReview not implemented
      const result = await SpecificationService.completeReview('spec-001', 'user-001')
      expect(result.last_review_date).toBe(today)
      expect(result.next_review_date).toBeDefined()
    })

    it('should calculate next_review_date as today + review_frequency_days', async () => {
      const today = new Date()
      const nextReview = new Date(today)
      nextReview.setDate(nextReview.getDate() + 365)
      const nextReviewStr = nextReview.toISOString().split('T')[0]

      const reviewedSpec = createMockSpecification({
        status: 'active',
        review_frequency_days: 365,
        next_review_date: nextReviewStr,
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: reviewedSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [reviewedSpec], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - completeReview not implemented
      const result = await SpecificationService.completeReview('spec-001', 'user-001')
      expect(result.next_review_date).toBe(nextReviewStr)
    })

    it('should reject if status is not active', async () => {
      const draftSpec = createMockSpecification({ status: 'draft' })
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [draftSpec], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Should throw ValidationError - not active
      await expect(SpecificationService.completeReview('spec-001', 'user-001')).rejects.toThrow('Only active specifications can be reviewed')
    })

    it('should create audit log entry on review completion', async () => {
      const reviewedSpec = createMockSpecification({
        status: 'active',
        last_review_date: '2025-01-22',
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          update: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: reviewedSpec, error: null }),
                }),
              }),
            }),
          select: vi
            .fn()
            .mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [reviewedSpec], error: null }),
            }),
        }),
      }
      vi.mocked(createServerSupabase).mockReturnValue(mockSupabase as any)

      // Will fail - completeReview not implemented
      await SpecificationService.completeReview('spec-001', 'user-001')
      expect(AuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          entity_type: 'specification',
          entity_id: 'spec-001',
          action: 'review_completed',
          user_id: 'user-001',
        })
      )
    })
  })
})
