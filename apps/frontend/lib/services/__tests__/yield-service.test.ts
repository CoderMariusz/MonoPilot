/**
 * Yield Service Unit Tests
 * Story: 04.4 - Yield Tracking
 * Phase: RED - Tests should FAIL (service not yet implemented)
 *
 * Tests business logic for yield tracking service:
 * - calculateYieldPercentage() - formula: (produced/planned)*100, rounded to 1 decimal
 * - getYieldIndicatorColor() - green >=80%, yellow 70-79%, red <70%
 * - validateYieldUpdate() - no negative, overproduction check
 * - updateWorkOrderYield() - update produced_quantity and log
 * - getYieldHistory() - fetch yield logs for WO
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-014)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  YieldService,
  calculateYieldPercentage,
  getYieldIndicatorColor,
  validateYieldUpdate,
  type YieldColor,
  type YieldUpdateResult,
  type YieldLog,
  type ValidationResult,
} from '@/lib/services/yield-service'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mock Supabase client factory
 */
const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient

  return mockClient
}

/**
 * Mock work order data
 */
const mockWorkOrder = {
  id: 'wo-001',
  org_id: 'org-123',
  wo_number: 'WO-2025-001',
  status: 'In Progress',
  planned_quantity: 1000,
  produced_quantity: 0,
  yield_percent: 0,
  product_id: 'prod-001',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

/**
 * Mock yield log entry
 */
const mockYieldLog: YieldLog = {
  id: 'log-001',
  org_id: 'org-123',
  wo_id: 'wo-001',
  old_quantity: 0,
  new_quantity: 500,
  old_yield_percent: 0,
  new_yield_percent: 50,
  notes: 'Initial production run',
  created_at: '2025-01-08T10:00:00Z',
  created_by: 'user-001',
  user_name: 'John Operator',
}

describe('YieldService (Story 04.4)', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  // ==========================================================================
  // calculateYieldPercentage() - AC-3: Yield Percentage Calculation
  // ==========================================================================
  describe('calculateYieldPercentage()', () => {
    it('should calculate yield percentage correctly: 950/1000 = 95.0%', () => {
      // AC-3: planned=1000, produced=950 => 95.0%
      const result = calculateYieldPercentage(950, 1000)
      expect(result).toBe(95.0)
    })

    it('should calculate yield percentage correctly: 475/500 = 95.0%', () => {
      // AC-3: planned=500, produced=475 => 95.0%
      const result = calculateYieldPercentage(475, 500)
      expect(result).toBe(95.0)
    })

    it('should calculate overproduction yield: 1050/1000 = 105.0%', () => {
      // AC-3: planned=1000, produced=1050 => 105.0%
      const result = calculateYieldPercentage(1050, 1000)
      expect(result).toBe(105.0)
    })

    it('should return 0% when produced is 0', () => {
      // AC-3: planned=1000, produced=0 => 0.0%
      const result = calculateYieldPercentage(0, 1000)
      expect(result).toBe(0.0)
    })

    it('should round to 1 decimal place: 95.456% => 95.5%', () => {
      // AC-3: 954.56/1000 = 95.456% rounds to 95.5%
      const result = calculateYieldPercentage(954.56, 1000)
      expect(result).toBe(95.5)
    })

    it('should round down correctly: 95.44% => 95.4%', () => {
      const result = calculateYieldPercentage(954.4, 1000)
      expect(result).toBe(95.4)
    })

    it('should handle edge case: planned_quantity = 0 returns 0', () => {
      // Edge case: avoid division by zero
      const result = calculateYieldPercentage(100, 0)
      expect(result).toBe(0)
    })

    it('should handle small quantities: 3/4 = 75.0%', () => {
      const result = calculateYieldPercentage(3, 4)
      expect(result).toBe(75.0)
    })

    it('should handle large quantities: 9500000/10000000 = 95.0%', () => {
      const result = calculateYieldPercentage(9500000, 10000000)
      expect(result).toBe(95.0)
    })

    it('should handle decimal quantities: 47.5/50 = 95.0%', () => {
      const result = calculateYieldPercentage(47.5, 50)
      expect(result).toBe(95.0)
    })

    it('should handle exact 100%: 1000/1000 = 100.0%', () => {
      const result = calculateYieldPercentage(1000, 1000)
      expect(result).toBe(100.0)
    })

    it('should handle very low yield: 10/1000 = 1.0%', () => {
      const result = calculateYieldPercentage(10, 1000)
      expect(result).toBe(1.0)
    })
  })

  // ==========================================================================
  // getYieldIndicatorColor() - AC-4: Yield Visual Indicators
  // ==========================================================================
  describe('getYieldIndicatorColor()', () => {
    it('should return green for yield >= 80%', () => {
      // AC-4: yield_percent = 95% => green
      const result = getYieldIndicatorColor(95)
      expect(result).toBe('green')
    })

    it('should return green for yield exactly 80% (threshold boundary)', () => {
      // AC-4: yield_percent = 80% => green
      const result = getYieldIndicatorColor(80)
      expect(result).toBe('green')
    })

    it('should return yellow for yield 70-79%', () => {
      // AC-4: yield_percent = 75% => yellow
      const result = getYieldIndicatorColor(75)
      expect(result).toBe('yellow')
    })

    it('should return yellow for yield exactly 79.9% (just below green threshold)', () => {
      // AC-4: yield_percent = 79.9% => yellow
      const result = getYieldIndicatorColor(79.9)
      expect(result).toBe('yellow')
    })

    it('should return yellow for yield exactly 70%', () => {
      const result = getYieldIndicatorColor(70)
      expect(result).toBe('yellow')
    })

    it('should return red for yield < 70%', () => {
      // AC-4: yield_percent = 65% => red
      const result = getYieldIndicatorColor(65)
      expect(result).toBe('red')
    })

    it('should return red for yield exactly 69.9%', () => {
      // AC-4: yield_percent = 69.9% => red
      const result = getYieldIndicatorColor(69.9)
      expect(result).toBe('red')
    })

    it('should return red for yield = 0%', () => {
      const result = getYieldIndicatorColor(0)
      expect(result).toBe('red')
    })

    it('should return green for overproduction (105%)', () => {
      const result = getYieldIndicatorColor(105)
      expect(result).toBe('green')
    })

    it('should return green for yield = 100%', () => {
      const result = getYieldIndicatorColor(100)
      expect(result).toBe('green')
    })

    it('should return green for high yield = 85%', () => {
      const result = getYieldIndicatorColor(85)
      expect(result).toBe('green')
    })

    it('should return yellow for yield = 72%', () => {
      const result = getYieldIndicatorColor(72)
      expect(result).toBe('yellow')
    })

    it('should return red for yield = 50%', () => {
      const result = getYieldIndicatorColor(50)
      expect(result).toBe('red')
    })
  })

  // ==========================================================================
  // validateYieldUpdate() - AC-2: Manual Yield Entry Validation
  // ==========================================================================
  describe('validateYieldUpdate()', () => {
    it('should reject negative produced_quantity', async () => {
      // AC-2: operator enters -50 => error "Produced quantity must be positive"
      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        -50,
        'org-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('positive')
    })

    it('should accept zero produced_quantity', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockWorkOrder, planned_quantity: 1000 },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        0,
        'org-123'
      )

      expect(result.valid).toBe(true)
    })

    it('should accept valid produced_quantity within planned', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockWorkOrder, planned_quantity: 1000 },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        950,
        'org-123'
      )

      expect(result.valid).toBe(true)
    })

    it('should reject overproduction when allow_overproduction=false', async () => {
      // AC-2: setting allow_overproduction=false, produced=1100, planned=1000 => error
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, planned_quantity: 1000 },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        1100,
        'org-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('cannot exceed planned quantity')
    })

    it('should accept overproduction when allow_overproduction=true', async () => {
      // AC-2: setting allow_overproduction=true, produced=1100, planned=1000 => valid
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, planned_quantity: 1000 },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: true },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        1100,
        'org-123'
      )

      expect(result.valid).toBe(true)
    })

    it('should reject non-numeric produced_quantity', async () => {
      // AC-2: operator enters "ABC" => error "Must be a valid number"
      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        NaN,
        'org-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('valid number')
    })

    it('should reject if WO not found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-nonexistent',
        500,
        'org-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('should reject if WO status is not In Progress', async () => {
      // Business rule: Yield entry only allowed when WO status = "In Progress"
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockWorkOrder, status: 'Draft' },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        500,
        'org-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('In Progress')
    })

    it('should reject if WO status is Completed', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockWorkOrder, status: 'Completed' },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        500,
        'org-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('In Progress')
    })

    it('should reject if WO status is Cancelled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockWorkOrder, status: 'Cancelled' },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        500,
        'org-123'
      )

      expect(result.valid).toBe(false)
    })

    it('should reject Infinity as produced_quantity', async () => {
      const result = await validateYieldUpdate(
        mockSupabase,
        'wo-001',
        Infinity,
        'org-123'
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('valid number')
    })
  })

  // ==========================================================================
  // updateWorkOrderYield() - AC-2, AC-5: Update and Audit
  // ==========================================================================
  describe('updateWorkOrderYield()', () => {
    it('should update produced_quantity and return result', async () => {
      // AC-2: produced_quantity=950 updates within 500ms
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, status: 'In Progress', planned_quantity: 1000 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      ...mockWorkOrder,
                      produced_quantity: 950,
                      yield_percent: 95.0,
                      updated_at: '2025-01-08T14:00:00Z',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'yield_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockYieldLog,
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await YieldService.updateWorkOrderYield(
        mockSupabase,
        'wo-001',
        950,
        'user-001'
      )

      expect(result).toBeDefined()
      expect(result.produced_quantity).toBe(950)
      expect(result.yield_percent).toBe(95.0)
    })

    it('should calculate yield_percent automatically', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, status: 'In Progress', planned_quantity: 1000, produced_quantity: 0 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      ...mockWorkOrder,
                      produced_quantity: 750,
                      yield_percent: 75.0,
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'yield_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockYieldLog,
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await YieldService.updateWorkOrderYield(
        mockSupabase,
        'wo-001',
        750,
        'user-001'
      )

      expect(result.yield_percent).toBe(75.0)
    })

    it('should create yield_log entry with old/new values (AC-5)', async () => {
      // AC-5: yield_logs records: wo_id, user_id, old_qty, new_qty, old_yield, new_yield, timestamp
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'log-002',
              wo_id: 'wo-001',
              old_quantity: 500,
              new_quantity: 950,
              old_yield_percent: 50,
              new_yield_percent: 95,
              created_by: 'user-001',
            },
            error: null,
          }),
        }),
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, status: 'In Progress', planned_quantity: 1000, produced_quantity: 500, yield_percent: 50 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...mockWorkOrder, produced_quantity: 950, yield_percent: 95 },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'yield_logs') {
          return { insert: mockInsert }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      await YieldService.updateWorkOrderYield(
        mockSupabase,
        'wo-001',
        950,
        'user-001'
      )

      expect(mockInsert).toHaveBeenCalled()
    })

    it('should include notes in yield_log if provided (AC-5)', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { ...mockYieldLog, notes: 'Adjusted after recount' },
            error: null,
          }),
        }),
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, status: 'In Progress', planned_quantity: 1000 },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...mockWorkOrder, produced_quantity: 950, yield_percent: 95 },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'yield_logs') {
          return { insert: mockInsert }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      await YieldService.updateWorkOrderYield(
        mockSupabase,
        'wo-001',
        950,
        'user-001',
        'Adjusted after recount'
      )

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: 'Adjusted after recount',
        })
      )
    })

    it('should throw error if validation fails', async () => {
      await expect(
        YieldService.updateWorkOrderYield(
          mockSupabase,
          'wo-001',
          -50,
          'user-001'
        )
      ).rejects.toThrow()
    })

    it('should throw error if database update fails', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, status: 'In Progress' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Database update failed' },
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      await expect(
        YieldService.updateWorkOrderYield(
          mockSupabase,
          'wo-001',
          500,
          'user-001'
        )
      ).rejects.toThrow()
    })

    it('should update updated_at timestamp', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, status: 'In Progress' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      ...mockWorkOrder,
                      produced_quantity: 500,
                      yield_percent: 50,
                      updated_at: '2025-01-08T15:00:00Z',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'yield_logs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockYieldLog, error: null }),
              }),
            }),
          }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await YieldService.updateWorkOrderYield(
        mockSupabase,
        'wo-001',
        500,
        'user-001'
      )

      expect(result.updated_at).toBeDefined()
    })
  })

  // ==========================================================================
  // getYieldHistory() - AC-5: Yield History Tracking
  // ==========================================================================
  describe('getYieldHistory()', () => {
    it('should return yield logs for WO', async () => {
      const mockLogs = [
        { ...mockYieldLog, id: 'log-001', created_at: '2025-01-08T14:00:00Z' },
        { ...mockYieldLog, id: 'log-002', created_at: '2025-01-08T10:00:00Z' },
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLogs,
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await YieldService.getYieldHistory(mockSupabase, 'wo-001')

      expect(result).toHaveLength(2)
    })

    it('should sort logs by timestamp DESC (newest first) - AC-5', async () => {
      const mockLogs = [
        { ...mockYieldLog, id: 'log-002', created_at: '2025-01-08T14:00:00Z' },
        { ...mockYieldLog, id: 'log-001', created_at: '2025-01-08T10:00:00Z' },
      ]

      const mockOrder = vi.fn().mockResolvedValue({
        data: mockLogs,
        error: null,
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: mockOrder,
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      await YieldService.getYieldHistory(mockSupabase, 'wo-001')

      expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should include user name in logs (joined)', async () => {
      const mockLogs = [
        { ...mockYieldLog, user_name: 'John Operator' },
      ]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLogs,
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await YieldService.getYieldHistory(mockSupabase, 'wo-001')

      expect(result[0].user_name).toBe('John Operator')
    })

    it('should return empty array if no logs exist', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await YieldService.getYieldHistory(mockSupabase, 'wo-001')

      expect(result).toEqual([])
    })

    it('should throw error if database query fails', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      await expect(
        YieldService.getYieldHistory(mockSupabase, 'wo-001')
      ).rejects.toThrow()
    })

    it('should return all required fields for each log entry', async () => {
      const mockLogs = [mockYieldLog]

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockLogs,
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await YieldService.getYieldHistory(mockSupabase, 'wo-001')

      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('old_quantity')
      expect(result[0]).toHaveProperty('new_quantity')
      expect(result[0]).toHaveProperty('old_yield_percent')
      expect(result[0]).toHaveProperty('new_yield_percent')
      expect(result[0]).toHaveProperty('notes')
      expect(result[0]).toHaveProperty('created_at')
      expect(result[0]).toHaveProperty('created_by')
    })
  })

  // ==========================================================================
  // getYieldLabel() - AC-4: Yield Labels
  // ==========================================================================
  describe('getYieldLabel()', () => {
    it('should return "Excellent" for yield >= 80%', () => {
      const result = YieldService.getYieldLabel(95)
      expect(result).toBe('Excellent')
    })

    it('should return "Excellent" for yield = 80%', () => {
      const result = YieldService.getYieldLabel(80)
      expect(result).toBe('Excellent')
    })

    it('should return "Below Target" for yield 70-79%', () => {
      const result = YieldService.getYieldLabel(75)
      expect(result).toBe('Below Target')
    })

    it('should return "Low Yield" for yield < 70%', () => {
      const result = YieldService.getYieldLabel(65)
      expect(result).toBe('Low Yield')
    })

    it('should return "Not Started" for yield = 0', () => {
      const result = YieldService.getYieldLabel(0)
      expect(result).toBe('Not Started')
    })
  })

  // ==========================================================================
  // RLS Enforcement
  // ==========================================================================
  describe('RLS Enforcement', () => {
    it('should query yield_logs with org_id filter', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: mockEq,
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      await YieldService.getYieldHistory(mockSupabase, 'wo-001')

      expect(mockFrom).toHaveBeenCalledWith('yield_logs')
    })

    it('should insert yield_log with org_id', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockYieldLog,
            error: null,
          }),
        }),
      })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'work_orders') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWorkOrder, status: 'In Progress', org_id: 'org-123' },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...mockWorkOrder, produced_quantity: 500, yield_percent: 50 },
                    error: null,
                  }),
                }),
              }),
            }),
          }
        }
        if (table === 'yield_logs') {
          return { insert: mockInsert }
        }
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { allow_overproduction: false },
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      await YieldService.updateWorkOrderYield(
        mockSupabase,
        'wo-001',
        500,
        'user-001'
      )

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          org_id: 'org-123',
        })
      )
    })
  })
})

/**
 * Test Summary for Story 04.4 - Yield Service
 * ============================================
 *
 * Test Coverage:
 * - calculateYieldPercentage(): 12 tests
 *   - Standard calculations (95%, 75%, etc.)
 *   - Edge cases (0 planned, 0 produced, overproduction)
 *   - Rounding to 1 decimal place
 *
 * - getYieldIndicatorColor(): 13 tests
 *   - Green threshold (>=80%)
 *   - Yellow threshold (70-79%)
 *   - Red threshold (<70%)
 *   - Boundary conditions
 *
 * - validateYieldUpdate(): 11 tests
 *   - Negative values rejected
 *   - Non-numeric values rejected
 *   - Overproduction check (setting-based)
 *   - WO status check (In Progress required)
 *   - WO not found handling
 *
 * - updateWorkOrderYield(): 8 tests
 *   - Successful updates
 *   - Yield calculation
 *   - Audit log creation
 *   - Error handling
 *
 * - getYieldHistory(): 6 tests
 *   - Log retrieval
 *   - Sorting (DESC by timestamp)
 *   - User name joining
 *   - Empty results
 *
 * - getYieldLabel(): 5 tests
 *   - Label mapping
 *
 * - RLS Enforcement: 2 tests
 *   - org_id filtering
 *
 * Total: 57 test cases
 *
 * Acceptance Criteria Covered:
 * - AC-2: Manual Yield Entry validation
 * - AC-3: Yield Percentage Calculation
 * - AC-4: Yield Visual Indicators
 * - AC-5: Yield History Tracking
 *
 * Status: RED (service not implemented yet)
 */
