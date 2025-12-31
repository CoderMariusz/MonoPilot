/**
 * Unit Tests: Planning Settings Service
 * Story: 03.17 - Planning Settings (Module Configuration)
 * Phase: GREEN - Tests should PASS with implementation
 *
 * Tests the planning settings CRUD service:
 * - getPlanningSettings(orgId) - Get settings, auto-initialize if missing
 * - updatePlanningSettings(orgId, updates) - Update settings
 * - initializePlanningSettings(orgId) - Create with defaults
 *
 * Coverage Target: 80%
 * Test Count: 13 tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Mock Supabase client
 */
const mockSupabaseFrom = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseUpdate = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseSingle = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    from: mockSupabaseFrom,
  })),
}))

import {
  getPlanningSettings,
  updatePlanningSettings,
  initializePlanningSettings,
  type PlanningSettings,
} from '@/lib/services/planning-settings-service'

describe('03.17 getPlanningSettings - Fetch Planning Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-01: Fetch existing settings for org', () => {
    it('should return planning settings when record exists', async () => {
      // GIVEN organization with existing planning_settings
      const orgId = 'org-a-id'
      const existingSettings: PlanningSettings = {
        id: 'settings-id',
        org_id: orgId,
        po_require_approval: false,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
        po_auto_number_prefix: 'PO-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 30',
        po_default_currency: 'PLN',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 1,
        wo_material_check: true,
        wo_copy_routing: true,
        wo_auto_select_bom: true,
        wo_require_bom: true,
        wo_allow_overproduction: false,
        wo_overproduction_limit: 10,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockSupabaseSingle.mockResolvedValue({ data: existingSettings, error: null })
      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })

      // WHEN fetching planning settings
      const result = await getPlanningSettings(orgId)

      // THEN returns complete settings object
      expect(result).toBeDefined()
      expect(result.org_id).toBe(orgId)
      expect(result.po_require_approval).toBe(false)
      expect(result.po_auto_number_prefix).toBe('PO-')
      expect(result.to_allow_partial_shipments).toBe(true)
      expect(result.wo_require_bom).toBe(true)
    })

    it('should return all PO settings fields', async () => {
      // GIVEN org with settings
      const orgId = 'org-test'
      const settings = {
        id: 'id',
        org_id: orgId,
        po_require_approval: true,
        po_approval_threshold: 5000,
        po_approval_roles: ['admin'],
        po_auto_number_prefix: 'PUR-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 60',
        po_default_currency: 'EUR',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 1,
        wo_material_check: true,
        wo_copy_routing: true,
        wo_auto_select_bom: true,
        wo_require_bom: true,
        wo_allow_overproduction: false,
        wo_overproduction_limit: 10,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockSupabaseSingle.mockResolvedValue({ data: settings, error: null })
      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })

      // WHEN fetching
      const result = await getPlanningSettings(orgId)

      // THEN all PO fields present
      expect(result.po_require_approval).toBe(true)
      expect(result.po_approval_threshold).toBe(5000)
      expect(result.po_approval_roles).toEqual(['admin'])
      expect(result.po_default_payment_terms).toBe('Net 60')
      expect(result.po_default_currency).toBe('EUR')
    })
  })

  describe('AC-02: Auto-initialize when settings missing', () => {
    it('should auto-initialize when no record exists (PGRST116 error)', async () => {
      // GIVEN organization with no planning_settings record
      const orgId = 'new-org-id'
      const error = { code: 'PGRST116' }

      // Mock the initialization insert
      const initSettings: PlanningSettings = {
        id: 'new-settings-id',
        org_id: orgId,
        po_require_approval: false,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
        po_auto_number_prefix: 'PO-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 30',
        po_default_currency: 'PLN',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 1,
        wo_material_check: true,
        wo_copy_routing: true,
        wo_auto_select_bom: true,
        wo_require_bom: true,
        wo_allow_overproduction: false,
        wo_overproduction_limit: 10,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      // First call returns error, second call returns inserted data
      mockSupabaseSingle
        .mockResolvedValueOnce({ data: null, error })
        .mockResolvedValueOnce({ data: initSettings, error: null })

      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq, single: mockSupabaseSingle })
      mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
        insert: mockSupabaseInsert,
      })

      // WHEN fetching (should auto-initialize)
      const result = await getPlanningSettings(orgId)

      // THEN returns new settings with defaults
      expect(result).toBeDefined()
      expect(result.org_id).toBe(orgId)
      expect(result.po_require_approval).toBe(false)
      expect(result.po_auto_number_prefix).toBe('PO-')
    })

    it('should set correct default values on auto-initialization', async () => {
      // GIVEN new org with no settings
      const orgId = 'brand-new-org'
      const error = { code: 'PGRST116' }

      const defaultSettings: PlanningSettings = {
        id: 'new-id',
        org_id: orgId,
        po_require_approval: false,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
        po_auto_number_prefix: 'PO-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 30',
        po_default_currency: 'PLN',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 1,
        wo_material_check: true,
        wo_copy_routing: true,
        wo_auto_select_bom: true,
        wo_require_bom: true,
        wo_allow_overproduction: false,
        wo_overproduction_limit: 10,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: null, error })
        .mockResolvedValueOnce({ data: defaultSettings, error: null })

      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq, single: mockSupabaseSingle })
      mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
        insert: mockSupabaseInsert,
      })

      // WHEN auto-initializing
      const result = await getPlanningSettings(orgId)

      // THEN all defaults are correct
      expect(result.po_require_approval).toBe(false)
      expect(result.po_approval_threshold).toBeNull()
      expect(result.po_approval_roles).toEqual(['admin', 'manager'])
      expect(result.to_allow_partial_shipments).toBe(true)
      expect(result.to_require_lp_selection).toBe(false)
      expect(result.wo_material_check).toBe(true)
      expect(result.wo_allow_overproduction).toBe(false)
      expect(result.wo_overproduction_limit).toBe(10)
    })
  })

  describe('Error Handling', () => {
    it('should throw database error if not PGRST116', async () => {
      // GIVEN database error other than missing record
      const orgId = 'org-error'
      const dbError = new Error('Database connection failed')

      mockSupabaseSingle.mockResolvedValue({ data: null, error: dbError })
      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })

      // WHEN fetching
      // THEN throws error
      await expect(getPlanningSettings(orgId)).rejects.toThrow()
    })
  })
})

describe('03.17 updatePlanningSettings - Update Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-03: Update settings successfully', () => {
    it('should update single field and return updated settings', async () => {
      // GIVEN existing settings
      const orgId = 'org-update'
      const updates = { po_require_approval: true }
      const updatedSettings: PlanningSettings = {
        id: 'settings-id',
        org_id: orgId,
        po_require_approval: true,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
        po_auto_number_prefix: 'PO-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 30',
        po_default_currency: 'PLN',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 1,
        wo_material_check: true,
        wo_copy_routing: true,
        wo_auto_select_bom: true,
        wo_require_bom: true,
        wo_allow_overproduction: false,
        wo_overproduction_limit: 10,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T01:00:00Z',
      }

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN updating
      const result = await updatePlanningSettings(orgId, updates)

      // THEN returns updated settings
      expect(result).toBeDefined()
      expect(result.po_require_approval).toBe(true)
      expect(result.updated_at).not.toBe('2025-01-01T00:00:00Z')
    })

    it('should allow partial updates with multiple fields', async () => {
      // GIVEN org with settings
      const orgId = 'org-partial'
      const updates = {
        po_require_approval: true,
        po_approval_threshold: 5000,
        wo_overproduction_limit: 15,
      }

      const updatedSettings: PlanningSettings = {
        id: 'id',
        org_id: orgId,
        po_require_approval: true,
        po_approval_threshold: 5000,
        po_approval_roles: ['admin', 'manager'],
        po_auto_number_prefix: 'PO-',
        po_auto_number_format: 'YYYY-NNNNN',
        po_default_payment_terms: 'Net 30',
        po_default_currency: 'PLN',
        to_allow_partial_shipments: true,
        to_require_lp_selection: false,
        to_auto_number_prefix: 'TO-',
        to_auto_number_format: 'YYYY-NNNNN',
        to_default_transit_days: 1,
        wo_material_check: true,
        wo_copy_routing: true,
        wo_auto_select_bom: true,
        wo_require_bom: true,
        wo_allow_overproduction: false,
        wo_overproduction_limit: 15,
        wo_auto_number_prefix: 'WO-',
        wo_auto_number_format: 'YYYY-NNNNN',
        wo_default_scheduling_buffer_hours: 2,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T01:00:00Z',
      }

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN updating multiple fields
      const result = await updatePlanningSettings(orgId, updates)

      // THEN all fields updated
      expect(result.po_require_approval).toBe(true)
      expect(result.po_approval_threshold).toBe(5000)
      expect(result.wo_overproduction_limit).toBe(15)
    })
  })

  describe('Error Handling', () => {
    it('should throw error on database failure', async () => {
      // GIVEN database error
      const orgId = 'org-error'
      const updates = { po_require_approval: true }
      const dbError = new Error('Update failed')

      mockSupabaseSingle.mockResolvedValue({ data: null, error: dbError })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN updating
      // THEN throws error
      await expect(updatePlanningSettings(orgId, updates)).rejects.toThrow()
    })
  })
})

describe('03.17 initializePlanningSettings - Initialize with Defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create new settings record with all defaults', async () => {
    // GIVEN new organization
    const orgId = 'org-new'
    const newSettings: PlanningSettings = {
      id: 'new-id',
      org_id: orgId,
      po_require_approval: false,
      po_approval_threshold: null,
      po_approval_roles: ['admin', 'manager'],
      po_auto_number_prefix: 'PO-',
      po_auto_number_format: 'YYYY-NNNNN',
      po_default_payment_terms: 'Net 30',
      po_default_currency: 'PLN',
      to_allow_partial_shipments: true,
      to_require_lp_selection: false,
      to_auto_number_prefix: 'TO-',
      to_auto_number_format: 'YYYY-NNNNN',
      to_default_transit_days: 1,
      wo_material_check: true,
      wo_copy_routing: true,
      wo_auto_select_bom: true,
      wo_require_bom: true,
      wo_allow_overproduction: false,
      wo_overproduction_limit: 10,
      wo_auto_number_prefix: 'WO-',
      wo_auto_number_format: 'YYYY-NNNNN',
      wo_default_scheduling_buffer_hours: 2,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    mockSupabaseSingle.mockResolvedValue({ data: newSettings, error: null })
    mockSupabaseSelect.mockReturnValue({ single: mockSupabaseSingle })
    mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
    mockSupabaseFrom.mockReturnValue({ insert: mockSupabaseInsert })

    // WHEN initializing
    const result = await initializePlanningSettings(orgId)

    // THEN creates record with defaults
    expect(result).toBeDefined()
    expect(result.org_id).toBe(orgId)
    expect(result.po_require_approval).toBe(false)
    expect(result.po_auto_number_prefix).toBe('PO-')
    expect(result.created_at).toBeDefined()
  })

  it('should include correct org_id in new record', async () => {
    // GIVEN org for initialization
    const orgId = 'org-specific'
    const settings: PlanningSettings = {
      id: 'id',
      org_id: orgId,
      po_require_approval: false,
      po_approval_threshold: null,
      po_approval_roles: ['admin', 'manager'],
      po_auto_number_prefix: 'PO-',
      po_auto_number_format: 'YYYY-NNNNN',
      po_default_payment_terms: 'Net 30',
      po_default_currency: 'PLN',
      to_allow_partial_shipments: true,
      to_require_lp_selection: false,
      to_auto_number_prefix: 'TO-',
      to_auto_number_format: 'YYYY-NNNNN',
      to_default_transit_days: 1,
      wo_material_check: true,
      wo_copy_routing: true,
      wo_auto_select_bom: true,
      wo_require_bom: true,
      wo_allow_overproduction: false,
      wo_overproduction_limit: 10,
      wo_auto_number_prefix: 'WO-',
      wo_auto_number_format: 'YYYY-NNNNN',
      wo_default_scheduling_buffer_hours: 2,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    }

    mockSupabaseSingle.mockResolvedValue({ data: settings, error: null })
    mockSupabaseSelect.mockReturnValue({ single: mockSupabaseSingle })
    mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
    mockSupabaseFrom.mockReturnValue({ insert: mockSupabaseInsert })

    // WHEN initializing
    const result = await initializePlanningSettings(orgId)

    // THEN org_id matches
    expect(result.org_id).toBe(orgId)
  })

  it('should throw error on creation failure', async () => {
    // GIVEN creation error
    const orgId = 'org-error'
    const dbError = new Error('Insert failed')

    mockSupabaseSingle.mockResolvedValue({ data: null, error: dbError })
    mockSupabaseSelect.mockReturnValue({ single: mockSupabaseSingle })
    mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
    mockSupabaseFrom.mockReturnValue({ insert: mockSupabaseInsert })

    // WHEN initializing
    // THEN throws error
    await expect(initializePlanningSettings(orgId)).rejects.toThrow()
  })
})

/**
 * Test Summary for Story 03.17 - Planning Settings Service
 * ============================================================
 *
 * Test Coverage:
 * - getPlanningSettings: 5 tests (fetch existing, auto-initialize, errors)
 * - updatePlanningSettings: 3 tests (update single/multiple, errors)
 * - initializePlanningSettings: 3 tests (create with defaults, errors)
 * - Total: 11 test cases
 *
 * Coverage Target: 80%
 */
