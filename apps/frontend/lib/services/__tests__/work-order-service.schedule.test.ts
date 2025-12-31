/**
 * Work Order Service - Schedule Method Tests (Story 03.14)
 * Unit tests for scheduleWorkOrder service method
 *
 * RED PHASE - These tests WILL FAIL until scheduleWorkOrder is implemented
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkOrderService } from '../work-order-service'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client
const createMockSupabase = () => {
  const mockClient = {
    from: vi.fn(() => mockClient),
    select: vi.fn(() => mockClient),
    insert: vi.fn(() => mockClient),
    update: vi.fn(() => mockClient),
    delete: vi.fn(() => mockClient),
    eq: vi.fn(() => mockClient),
    single: vi.fn(() => mockClient),
    rpc: vi.fn(() => mockClient),
  }
  return mockClient as unknown as SupabaseClient
}

describe('WorkOrderService.scheduleWorkOrder', () => {
  let mockSupabase: SupabaseClient

  const testOrgId = '123e4567-e89b-12d3-a456-426614174000'
  const testUserId = '987e6543-e21b-12d3-a456-426614174000'
  const testWoId = '111e1111-e11b-11d1-a111-111111111111'
  const testLineId = '222e2222-e22b-22d2-a222-222222222222'
  const testMachineId = '333e3333-e33b-33d3-a333-333333333333'

  beforeEach(() => {
    mockSupabase = createMockSupabase()
    vi.clearAllMocks()
  })

  describe('Success cases', () => {
    it('should schedule WO with valid times', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'draft',
        wo_number: 'WO-20241220-0001',
      }

      const mockUpdatedWO = {
        ...mockWO,
        scheduled_start_time: '08:00',
        scheduled_end_time: '16:00',
        updated_at: new Date().toISOString(),
        updated_by: testUserId,
      }

      // Mock fetch existing WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock update WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockUpdatedWO, error: null }),
              }),
            }),
          }),
        }),
      } as any)

      const input = {
        scheduled_start_time: '08:00',
        scheduled_end_time: '16:00',
      }

      const result = await WorkOrderService.scheduleWorkOrder(
        mockSupabase,
        testOrgId,
        testWoId,
        testUserId,
        input
      )

      expect(result).toBeDefined()
      expect(result.scheduled_start_time).toBe('08:00')
      expect(result.scheduled_end_time).toBe('16:00')
    })

    it('should update production line with schedule', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'planned',
      }

      const mockLine = { id: testLineId, org_id: testOrgId, name: 'Line 1' }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock fetch line
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockLine, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock update
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWO, production_line_id: testLineId },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any)

      const input = {
        production_line_id: testLineId,
        scheduled_start_time: '09:00',
      }

      const result = await WorkOrderService.scheduleWorkOrder(
        mockSupabase,
        testOrgId,
        testWoId,
        testUserId,
        input
      )

      expect(result.production_line_id).toBe(testLineId)
    })

    it('should clear machine assignment when machine_id is null', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'draft',
        machine_id: testMachineId,
      }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock update
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWO, machine_id: null },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any)

      const input = {
        machine_id: null,
      }

      const result = await WorkOrderService.scheduleWorkOrder(
        mockSupabase,
        testOrgId,
        testWoId,
        testUserId,
        input
      )

      expect(result.machine_id).toBeNull()
    })
  })

  describe('Status validation', () => {
    it('should reject scheduling completed WO', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'completed',
      }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      const input = {
        scheduled_start_time: '08:00',
        scheduled_end_time: '16:00',
      }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).rejects.toThrow(/cannot schedule completed/i)
    })

    it('should reject scheduling cancelled WO', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'cancelled',
      }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      const input = {
        scheduled_start_time: '08:00',
      }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).rejects.toThrow(/cannot schedule.*cancelled/i)
    })

    it('should reject scheduling closed WO', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'closed',
      }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      const input = {
        scheduled_start_time: '08:00',
      }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).rejects.toThrow()
    })

    it('should allow scheduling draft WO', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'draft',
      }

      // Mock fetch
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock update
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockWO, scheduled_start_time: '08:00' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any)

      const input = { scheduled_start_time: '08:00' }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).resolves.toBeDefined()
    })
  })

  describe('Existence validation', () => {
    it('should reject non-existent WO', async () => {
      // Mock WO not found
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      } as any)

      const input = { scheduled_start_time: '08:00' }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          'non-existent-id',
          testUserId,
          input
        )
      ).rejects.toThrow(/not found/i)
    })

    it('should reject invalid production line', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'draft',
      }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock line not found
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any)

      const input = {
        production_line_id: 'non-existent-uuid',
      }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).rejects.toThrow(/line not found/i)
    })

    it('should reject invalid machine', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'draft',
      }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock machine not found
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any)

      const input = {
        machine_id: 'non-existent-uuid',
      }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).rejects.toThrow(/machine not found/i)
    })
  })

  describe('Multi-tenant isolation', () => {
    it('should enforce org_id on WO lookup', async () => {
      const mockWO = {
        id: testWoId,
        org_id: 'different-org-id',
        status: 'draft',
      }

      // Mock fetch WO (returns null due to org mismatch)
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      } as any)

      const input = { scheduled_start_time: '08:00' }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).rejects.toThrow(/not found/i)
    })

    it('should enforce org_id on production line lookup', async () => {
      const mockWO = {
        id: testWoId,
        org_id: testOrgId,
        status: 'draft',
      }

      // Mock fetch WO
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockWO, error: null }),
            }),
          }),
        }),
      } as any)

      // Mock line from different org (not found)
      vi.spyOn(mockSupabase, 'from').mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      } as any)

      const input = {
        production_line_id: testLineId,
      }

      await expect(
        WorkOrderService.scheduleWorkOrder(
          mockSupabase,
          testOrgId,
          testWoId,
          testUserId,
          input
        )
      ).rejects.toThrow()
    })
  })
})
