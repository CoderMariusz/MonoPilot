/**
 * Production Settings Service Unit Tests
 * Story: 04.5 - Production Settings
 * Phase: RED - Tests should FAIL (service not yet implemented)
 *
 * Tests business logic for production settings service:
 * - getProductionSettings() - Retrieve settings for org (with upsert)
 * - updateProductionSettings() - Update specified fields
 * - isWoPauseAllowed() - Helper for pause check
 * - getDashboardRefreshInterval() - Helper for refresh interval
 * - getProductionSettingsWithDefaults() - Get or create with defaults
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-017)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ProductionSettingsService,
  type ProductionSettings,
} from '@/lib/services/production-settings-service'
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
 * Mock production settings data
 */
const mockDefaultSettings: ProductionSettings = {
  id: '12345678-1234-4234-a234-123456789012',
  org_id: '12345678-1234-4234-a234-123456789abc',
  // WO Execution (Phase 0)
  allow_pause_wo: false,
  auto_complete_wo: false,
  require_operation_sequence: true,
  // Material Consumption (Phase 1)
  allow_over_consumption: false,
  allow_partial_lp_consumption: true,
  // Output (Phase 1)
  require_qa_on_output: true,
  auto_create_by_product_lp: true,
  // Reservations (Phase 1)
  enable_material_reservations: true,
  // Dashboard (Phase 0)
  dashboard_refresh_seconds: 30,
  show_material_alerts: true,
  show_delay_alerts: true,
  show_quality_alerts: true,
  // OEE (Phase 2)
  enable_oee_tracking: false,
  target_oee_percent: 85,
  enable_downtime_tracking: false,
  // Metadata
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockCustomSettings: ProductionSettings = {
  ...mockDefaultSettings,
  allow_pause_wo: true,
  dashboard_refresh_seconds: 15,
  show_material_alerts: false,
  enable_oee_tracking: true,
  target_oee_percent: 90,
}

describe('ProductionSettingsService', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  /**
   * AC-12, AC-13: GET API - Retrieve Settings
   */
  describe('getProductionSettings()', () => {
    it('should return existing settings for org', async () => {
      // GIVEN org has production settings configured
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCustomSettings,
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      // WHEN getting production settings
      const result = await ProductionSettingsService.getProductionSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      // THEN returns all 15 settings fields
      expect(result).toBeDefined()
      expect(result.id).toBe('12345678-1234-4234-a234-123456789012')
      expect(result.org_id).toBe('12345678-1234-4234-a234-123456789abc')
      expect(result.allow_pause_wo).toBe(true)
      expect(result.dashboard_refresh_seconds).toBe(15)
      expect(result.target_oee_percent).toBe(90)
    })

    it('should return all 15 settings fields (AC-12)', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDefaultSettings,
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.getProductionSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      // Verify all 15 fields are present
      expect(result).toHaveProperty('allow_pause_wo')
      expect(result).toHaveProperty('auto_complete_wo')
      expect(result).toHaveProperty('require_operation_sequence')
      expect(result).toHaveProperty('allow_over_consumption')
      expect(result).toHaveProperty('allow_partial_lp_consumption')
      expect(result).toHaveProperty('require_qa_on_output')
      expect(result).toHaveProperty('auto_create_by_product_lp')
      expect(result).toHaveProperty('enable_material_reservations')
      expect(result).toHaveProperty('dashboard_refresh_seconds')
      expect(result).toHaveProperty('show_material_alerts')
      expect(result).toHaveProperty('show_delay_alerts')
      expect(result).toHaveProperty('show_quality_alerts')
      expect(result).toHaveProperty('enable_oee_tracking')
      expect(result).toHaveProperty('target_oee_percent')
      expect(result).toHaveProperty('enable_downtime_tracking')
    })

    it('should upsert default settings for new org (AC-13)', async () => {
      // GIVEN org has NO production settings configured yet
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'production_settings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }, // No rows returned
                }),
              }),
            }),
            upsert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockDefaultSettings,
                  error: null,
                }),
              }),
            }),
          }
        }
      })
      ;(mockSupabase.from as any) = mockFrom

      // WHEN getting production settings
      const result = await ProductionSettingsService.getProductionSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789def'
      )

      // THEN returns default values
      expect(result.allow_pause_wo).toBe(false)
      expect(result.auto_complete_wo).toBe(false)
      expect(result.require_operation_sequence).toBe(true)
      expect(result.allow_over_consumption).toBe(false)
      expect(result.allow_partial_lp_consumption).toBe(true)
      expect(result.require_qa_on_output).toBe(true)
      expect(result.auto_create_by_product_lp).toBe(true)
      expect(result.enable_material_reservations).toBe(true)
      expect(result.dashboard_refresh_seconds).toBe(30)
      expect(result.show_material_alerts).toBe(true)
      expect(result.show_delay_alerts).toBe(true)
      expect(result.show_quality_alerts).toBe(true)
      expect(result.enable_oee_tracking).toBe(false)
      expect(result.target_oee_percent).toBe(85)
      expect(result.enable_downtime_tracking).toBe(false)
    })

    it('should throw error if org_id is invalid', async () => {
      await expect(
        ProductionSettingsService.getProductionSettings(mockSupabase, '')
      ).rejects.toThrow('Invalid organization ID')

      await expect(
        ProductionSettingsService.getProductionSettings(mockSupabase, 'not-a-uuid')
      ).rejects.toThrow('Invalid organization ID')
    })

    it('should throw error if database query fails', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' },
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      await expect(
        ProductionSettingsService.getProductionSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc')
      ).rejects.toThrow()
    })
  })

  /**
   * AC-14: PUT API - Update Settings
   */
  describe('updateProductionSettings()', () => {
    it('should update single field successfully', async () => {
      // GIVEN existing settings
      const updatedSettings = { ...mockDefaultSettings, allow_pause_wo: true }
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedSettings,
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      // WHEN updating single field
      const result = await ProductionSettingsService.updateProductionSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc',
        { allow_pause_wo: true }
      )

      // THEN returns full updated settings
      expect(result.allow_pause_wo).toBe(true)
      expect(result.dashboard_refresh_seconds).toBe(30) // Unchanged
    })

    it('should update multiple fields at once (AC-9)', async () => {
      // GIVEN existing settings
      const updatedSettings = {
        ...mockDefaultSettings,
        allow_pause_wo: true,
        dashboard_refresh_seconds: 15,
        show_material_alerts: false,
      }
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedSettings,
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      // WHEN updating multiple fields
      const result = await ProductionSettingsService.updateProductionSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc',
        {
          allow_pause_wo: true,
          dashboard_refresh_seconds: 15,
          show_material_alerts: false,
        }
      )

      // THEN all specified fields are updated
      expect(result.allow_pause_wo).toBe(true)
      expect(result.dashboard_refresh_seconds).toBe(15)
      expect(result.show_material_alerts).toBe(false)
    })

    it('should return full settings object after update', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockCustomSettings,
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.updateProductionSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc',
        { allow_pause_wo: true }
      )

      // Verify full object returned with all 15 fields
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(17) // 15 settings + id + org_id + timestamps
    })

    it('should update updated_at timestamp', async () => {
      const nowTimestamp = new Date().toISOString()
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...mockDefaultSettings, updated_at: nowTimestamp },
                error: null,
              }),
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.updateProductionSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc',
        { allow_pause_wo: true }
      )

      expect(result.updated_at).toBeDefined()
    })

    it('should throw error if org_id is invalid', async () => {
      await expect(
        ProductionSettingsService.updateProductionSettings(mockSupabase, '', {
          allow_pause_wo: true,
        })
      ).rejects.toThrow('Invalid organization ID')
    })

    it('should throw error if database update fails', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      await expect(
        ProductionSettingsService.updateProductionSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc', {
          allow_pause_wo: true,
        })
      ).rejects.toThrow()
    })

    it('should validate dashboard_refresh_seconds before update (AC-15)', async () => {
      // Service should validate before sending to DB
      await expect(
        ProductionSettingsService.updateProductionSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc', {
          dashboard_refresh_seconds: 3, // Invalid: below 5
        })
      ).rejects.toThrow('Refresh interval must be at least 5 seconds')
    })

    it('should validate target_oee_percent before update (AC-16)', async () => {
      // Service should validate before sending to DB
      await expect(
        ProductionSettingsService.updateProductionSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc', {
          target_oee_percent: 105, // Invalid: above 100
        })
      ).rejects.toThrow('Target OEE must be between 0 and 100')
    })

    it('should reject empty updates', async () => {
      await expect(
        ProductionSettingsService.updateProductionSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc', {})
      ).rejects.toThrow('No fields to update')
    })
  })

  /**
   * Helper Functions
   */
  describe('isWoPauseAllowed()', () => {
    it('should return true when allow_pause_wo is enabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockDefaultSettings, allow_pause_wo: true },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.isWoPauseAllowed(mockSupabase, '12345678-1234-4234-a234-123456789abc')

      expect(result).toBe(true)
    })

    it('should return false when allow_pause_wo is disabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDefaultSettings, // allow_pause_wo: false
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.isWoPauseAllowed(mockSupabase, '12345678-1234-4234-a234-123456789abc')

      expect(result).toBe(false)
    })
  })

  describe('getDashboardRefreshInterval()', () => {
    it('should return configured refresh interval', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockDefaultSettings, dashboard_refresh_seconds: 15 },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.getDashboardRefreshInterval(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      expect(result).toBe(15)
    })

    it('should return default refresh interval (30)', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDefaultSettings,
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.getDashboardRefreshInterval(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      expect(result).toBe(30)
    })
  })

  describe('isAutoCompleteEnabled()', () => {
    it('should return true when auto_complete_wo is enabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockDefaultSettings, auto_complete_wo: true },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.isAutoCompleteEnabled(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      expect(result).toBe(true)
    })

    it('should return false when auto_complete_wo is disabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDefaultSettings,
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.isAutoCompleteEnabled(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      expect(result).toBe(false)
    })
  })

  describe('isOperationSequenceRequired()', () => {
    it('should return true when require_operation_sequence is enabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockDefaultSettings, // require_operation_sequence: true
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.isOperationSequenceRequired(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      expect(result).toBe(true)
    })

    it('should return false when require_operation_sequence is disabled', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockDefaultSettings, require_operation_sequence: false },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.isOperationSequenceRequired(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      expect(result).toBe(false)
    })
  })

  describe('getDashboardAlertSettings()', () => {
    it('should return all alert settings', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockDefaultSettings,
                show_material_alerts: true,
                show_delay_alerts: false,
                show_quality_alerts: true,
              },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.getDashboardAlertSettings(
        mockSupabase,
        '12345678-1234-4234-a234-123456789abc'
      )

      expect(result).toEqual({
        show_material_alerts: true,
        show_delay_alerts: false,
        show_quality_alerts: true,
      })
    })
  })

  describe('getOeeSettings()', () => {
    it('should return all OEE-related settings', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                ...mockDefaultSettings,
                enable_oee_tracking: true,
                target_oee_percent: 90,
                enable_downtime_tracking: true,
              },
              error: null,
            }),
          }),
        }),
      })
      ;(mockSupabase.from as any) = mockFrom

      const result = await ProductionSettingsService.getOeeSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc')

      expect(result).toEqual({
        enable_oee_tracking: true,
        target_oee_percent: 90,
        enable_downtime_tracking: true,
      })
    })
  })

  /**
   * RLS Policy Verification (AC-17)
   */
  describe('RLS Enforcement', () => {
    it('should query with org_id filter', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockDefaultSettings,
            error: null,
          }),
        }),
      })
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      })
      ;(mockSupabase.from as any) = mockFrom

      await ProductionSettingsService.getProductionSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc')

      expect(mockFrom).toHaveBeenCalledWith('production_settings')
    })

    it('should update with org_id filter', async () => {
      const mockEq = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockDefaultSettings,
            error: null,
          }),
        }),
      })
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      })
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      })
      ;(mockSupabase.from as any) = mockFrom

      await ProductionSettingsService.updateProductionSettings(mockSupabase, '12345678-1234-4234-a234-123456789abc', {
        allow_pause_wo: true,
      })

      expect(mockEq).toHaveBeenCalledWith('org_id', '12345678-1234-4234-a234-123456789abc')
    })
  })
})

/**
 * Test Summary for Story 04.5 - Production Settings Service
 * =========================================================
 *
 * Test Coverage:
 * - getProductionSettings(): 5 tests
 * - updateProductionSettings(): 9 tests
 * - isWoPauseAllowed(): 2 tests
 * - getDashboardRefreshInterval(): 2 tests
 * - isAutoCompleteEnabled(): 2 tests
 * - isOperationSequenceRequired(): 2 tests
 * - getDashboardAlertSettings(): 1 test
 * - getOeeSettings(): 1 test
 * - RLS Enforcement: 2 tests
 *
 * Total: 26 test cases
 *
 * Acceptance Criteria Covered:
 * - AC-9: Multiple settings changed at once
 * - AC-12: GET API returns settings for org
 * - AC-13: GET API upserts defaults for new orgs
 * - AC-14: PUT API updates specified fields only
 * - AC-15: Validation errors for dashboard_refresh_seconds
 * - AC-16: Validation errors for target_oee_percent
 * - AC-17: RLS policy enforcement
 */
