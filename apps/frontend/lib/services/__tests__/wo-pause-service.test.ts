/**
 * WO Pause Service Tests - RED PHASE
 * Story: 04.2b - WO Pause/Resume
 *
 * These tests verify the service layer logic for Work Order pause/resume functionality.
 * They will FAIL because the service implementation does not exist yet.
 *
 * Test Cases:
 * - isPauseEnabled: Check if pause is allowed via production_settings
 * - pauseWorkOrder: Pause in_progress WO with valid reason
 * - resumeWorkOrder: Resume paused WO
 * - getPauseHistory: Return list of pauses with duration
 * - getPauseReasons: Return available pause reasons
 * - getDowntimeSummary: Calculate total downtime for a WO
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isPauseEnabled,
  getPauseReasons,
  pauseWorkOrder,
  resumeWorkOrder,
  getPauseHistory,
  getDowntimeSummary,
  WOPauseError,
  PauseReason,
} from './wo-pause-service'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseAdmin: vi.fn(),
}))

describe('WO Pause Service', () => {
  const mockSupabase = {
    from: vi.fn(),
  }

  const TEST_ORG_ID = 'org-123'
  const TEST_WO_ID = 'wo-456'
  const TEST_USER_ID = 'user-789'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createClient).mockReturnValue(mockSupabase as any)
  })

  describe('isPauseEnabled', () => {
    it('should return true when allow_pause_wo is enabled in settings', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { allow_pause_wo: true },
          error: null,
        }),
      } as any)

      const result = await isPauseEnabled(TEST_ORG_ID)
      expect(result).toBe(true)
    })

    it('should return false when allow_pause_wo is disabled in settings', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { allow_pause_wo: false },
          error: null,
        }),
      } as any)

      const result = await isPauseEnabled(TEST_ORG_ID)
      expect(result).toBe(false)
    })

    it('should return false (default) when no settings exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      } as any)

      const result = await isPauseEnabled(TEST_ORG_ID)
      expect(result).toBe(false)
    })
  })

  describe('getPauseReasons', () => {
    it('should return all available pause reasons', () => {
      const reasons = getPauseReasons()

      expect(reasons).toHaveLength(5)
      expect(reasons).toContainEqual({
        code: 'machine_breakdown',
        label: 'Machine Breakdown',
      })
      expect(reasons).toContainEqual({
        code: 'material_shortage',
        label: 'Material Shortage',
      })
      expect(reasons).toContainEqual({
        code: 'break',
        label: 'Break/Lunch',
      })
      expect(reasons).toContainEqual({
        code: 'quality_issue',
        label: 'Quality Issue',
      })
      expect(reasons).toContainEqual({
        code: 'other',
        label: 'Other',
      })
    })
  })

  describe('pauseWorkOrder', () => {
    const mockPauseData = {
      reason: 'machine_breakdown' as PauseReason,
      notes: 'Motor overheating',
    }

    it('should pause an in_progress WO with valid reason', async () => {
      // Mock WO fetch - status is in_progress
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            wo_number: 'WO-2025-0001',
            status: 'in_progress',
            org_id: TEST_ORG_ID,
          },
          error: null,
        }),
      } as any)

      // Mock settings check - pause enabled
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { allow_pause_wo: true },
          error: null,
        }),
      } as any)

      // Mock WO status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            status: 'paused',
            wo_number: 'WO-2025-0001',
          },
          error: null,
        }),
      } as any)

      // Mock wo_pauses insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'pause-001',
            work_order_id: TEST_WO_ID,
            paused_at: '2025-01-08T10:00:00Z',
            pause_reason: 'machine_breakdown',
            notes: 'Motor overheating',
            paused_by_user_id: TEST_USER_ID,
          },
          error: null,
        }),
      } as any)

      const result = await pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData)

      expect(result).toBeDefined()
      expect(result.id).toBe('pause-001')
      expect(result.pause_reason).toBe('machine_breakdown')
      expect(result.paused_at).toBeDefined()
    })

    it('should reject pause if WO is not in_progress', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            wo_number: 'WO-2025-0001',
            status: 'released', // Not in_progress
            org_id: TEST_ORG_ID,
          },
          error: null,
        }),
      } as any)

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData),
      ).rejects.toThrow(WOPauseError)

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData),
      ).rejects.toMatchObject({
        code: 'INVALID_STATUS',
        statusCode: 400,
      })
    })

    it('should reject pause if already paused', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            wo_number: 'WO-2025-0001',
            status: 'paused', // Already paused
            org_id: TEST_ORG_ID,
          },
          error: null,
        }),
      } as any)

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData),
      ).rejects.toThrow(WOPauseError)
    })

    it('should reject pause without reason', async () => {
      const invalidData = { reason: '' as PauseReason, notes: 'test' }

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, invalidData),
      ).rejects.toThrow()
    })

    it('should reject pause if allow_pause_wo setting is disabled', async () => {
      // Mock WO fetch - status is in_progress
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            wo_number: 'WO-2025-0001',
            status: 'in_progress',
            org_id: TEST_ORG_ID,
          },
          error: null,
        }),
      } as any)

      // Mock settings check - pause disabled
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { allow_pause_wo: false },
          error: null,
        }),
      } as any)

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData),
      ).rejects.toThrow(WOPauseError)

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData),
      ).rejects.toMatchObject({
        code: 'PAUSE_DISABLED',
        statusCode: 403,
      })
    })

    it('should return 404 for non-existent WO', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      } as any)

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData),
      ).rejects.toThrow(WOPauseError)

      await expect(
        pauseWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID, mockPauseData),
      ).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      })
    })
  })

  describe('resumeWorkOrder', () => {
    it('should resume a paused WO', async () => {
      // Mock WO fetch - status is paused
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            wo_number: 'WO-2025-0001',
            status: 'paused',
            org_id: TEST_ORG_ID,
          },
          error: null,
        }),
      } as any)

      // Mock WO status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            status: 'in_progress',
            wo_number: 'WO-2025-0001',
          },
          error: null,
        }),
      } as any)

      // Mock wo_pauses update (set resumed_at)
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'pause-001',
            work_order_id: TEST_WO_ID,
            paused_at: '2025-01-08T10:00:00Z',
            resumed_at: '2025-01-08T10:30:00Z',
            duration_minutes: 30,
            resumed_by_user_id: TEST_USER_ID,
          },
          error: null,
        }),
      } as any)

      const result = await resumeWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID)

      expect(result).toBeDefined()
      expect(result.status).toBe('in_progress')
      expect(result.resumed_at).toBeDefined()
    })

    it('should reject resume if WO is not paused', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            wo_number: 'WO-2025-0001',
            status: 'in_progress', // Not paused
            org_id: TEST_ORG_ID,
          },
          error: null,
        }),
      } as any)

      await expect(resumeWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID)).rejects.toThrow(
        WOPauseError,
      )

      await expect(resumeWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID)).rejects.toMatchObject({
        code: 'INVALID_STATUS',
        statusCode: 400,
      })
    })

    it('should return 404 for non-existent WO', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      } as any)

      await expect(resumeWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID)).rejects.toThrow(
        WOPauseError,
      )

      await expect(resumeWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID)).rejects.toMatchObject({
        code: 'NOT_FOUND',
        statusCode: 404,
      })
    })

    it('should calculate duration_minutes when resuming', async () => {
      // Mock WO fetch - status is paused
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            wo_number: 'WO-2025-0001',
            status: 'paused',
            org_id: TEST_ORG_ID,
          },
          error: null,
        }),
      } as any)

      // Mock WO status update
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: TEST_WO_ID,
            status: 'in_progress',
            wo_number: 'WO-2025-0001',
          },
          error: null,
        }),
      } as any)

      // Mock wo_pauses update with calculated duration
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'pause-001',
            paused_at: '2025-01-08T10:00:00Z',
            resumed_at: '2025-01-08T10:45:00Z',
            duration_minutes: 45, // 45 minutes calculated
          },
          error: null,
        }),
      } as any)

      const result = await resumeWorkOrder(TEST_WO_ID, TEST_USER_ID, TEST_ORG_ID)

      expect(result.pause_record.duration_minutes).toBe(45)
    })
  })

  describe('getPauseHistory', () => {
    const mockPauses = [
      {
        id: 'pause-001',
        work_order_id: TEST_WO_ID,
        paused_at: '2025-01-08T10:00:00Z',
        resumed_at: '2025-01-08T10:30:00Z',
        duration_minutes: 30,
        pause_reason: 'machine_breakdown',
        notes: 'Motor issue',
        paused_by_user: { id: 'user-1', full_name: 'John Doe' },
        resumed_by_user: { id: 'user-2', full_name: 'Jane Smith' },
      },
      {
        id: 'pause-002',
        work_order_id: TEST_WO_ID,
        paused_at: '2025-01-08T14:00:00Z',
        resumed_at: '2025-01-08T14:15:00Z',
        duration_minutes: 15,
        pause_reason: 'break',
        notes: null,
        paused_by_user: { id: 'user-1', full_name: 'John Doe' },
        resumed_by_user: { id: 'user-1', full_name: 'John Doe' },
      },
    ]

    it('should return list of pauses with duration', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockPauses,
          error: null,
        }),
      } as any)

      const result = await getPauseHistory(TEST_WO_ID, TEST_ORG_ID)

      expect(result.pauses).toHaveLength(2)
      expect(result.pauses[0].duration_minutes).toBe(30)
      expect(result.pauses[0].pause_reason).toBe('machine_breakdown')
      expect(result.pauses[1].duration_minutes).toBe(15)
    })

    it('should return empty array for WO without pauses', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any)

      const result = await getPauseHistory(TEST_WO_ID, TEST_ORG_ID)

      expect(result.pauses).toHaveLength(0)
      expect(result.summary.total_count).toBe(0)
    })

    it('should include summary with total downtime', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockPauses,
          error: null,
        }),
      } as any)

      const result = await getPauseHistory(TEST_WO_ID, TEST_ORG_ID)

      expect(result.summary).toBeDefined()
      expect(result.summary.total_count).toBe(2)
      expect(result.summary.total_duration_minutes).toBe(45) // 30 + 15
      expect(result.summary.average_duration_minutes).toBe(22.5) // 45 / 2
    })

    it('should include user information for paused_by and resumed_by', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockPauses,
          error: null,
        }),
      } as any)

      const result = await getPauseHistory(TEST_WO_ID, TEST_ORG_ID)

      expect(result.pauses[0].paused_by_user.full_name).toBe('John Doe')
      expect(result.pauses[0].resumed_by_user?.full_name).toBe('Jane Smith')
    })

    it('should sort pauses by paused_at descending', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockPauses,
          error: null,
        }),
      } as any)

      const result = await getPauseHistory(TEST_WO_ID, TEST_ORG_ID)

      // Most recent first
      expect(new Date(result.pauses[0].paused_at).getTime()).toBeLessThan(
        new Date(result.pauses[1].paused_at).getTime(),
      )
    })
  })

  describe('getDowntimeSummary', () => {
    it('should calculate total downtime summary for WO', async () => {
      const mockPauses = [
        { duration_minutes: 30, pause_reason: 'machine_breakdown' },
        { duration_minutes: 15, pause_reason: 'break' },
        { duration_minutes: 45, pause_reason: 'machine_breakdown' },
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({
          data: mockPauses,
          error: null,
        }),
      } as any)

      const result = await getDowntimeSummary(TEST_WO_ID, TEST_ORG_ID)

      expect(result.total_count).toBe(3)
      expect(result.total_duration_minutes).toBe(90)
      expect(result.average_duration_minutes).toBe(30)
      expect(result.top_reason.reason).toBe('machine_breakdown')
      expect(result.top_reason.total_minutes).toBe(75) // 30 + 45
    })

    it('should return zeros for WO without completed pauses', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        not: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      } as any)

      const result = await getDowntimeSummary(TEST_WO_ID, TEST_ORG_ID)

      expect(result.total_count).toBe(0)
      expect(result.total_duration_minutes).toBe(0)
      expect(result.average_duration_minutes).toBe(0)
    })
  })

  describe('WOPauseError', () => {
    it('should create error with code, statusCode, and message', () => {
      const error = new WOPauseError('INVALID_STATUS', 400, 'WO must be in_progress to pause')

      expect(error.code).toBe('INVALID_STATUS')
      expect(error.statusCode).toBe(400)
      expect(error.message).toBe('WO must be in_progress to pause')
      expect(error.name).toBe('WOPauseError')
    })
  })
})
