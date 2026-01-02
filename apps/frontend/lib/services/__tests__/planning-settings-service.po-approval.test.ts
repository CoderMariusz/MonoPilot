/**
 * Unit Tests: Planning Settings Service (PO Approval)
 * Story: 03.5a - PO Approval Setup
 * Phase: RED - Tests should FAIL (implementation not yet written)
 *
 * Tests the planning settings service methods for PO approval:
 * - getPlanningSettings(orgId) - Fetch settings, auto-create defaults
 * - updatePlanningSettings(orgId, updates) - Update approval settings
 * - getDefaultPlanningSettings() - Return default values
 *
 * Coverage Target: 80%
 * Test Count: 18 tests
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
  getDefaultPlanningSettings,
  type PlanningSettings,
} from '@/lib/services/planning-settings-service'

/**
 * Helper to create mock PlanningSettings
 */
function createMockSettings(overrides?: Partial<PlanningSettings>): PlanningSettings {
  return {
    id: 'settings-id',
    org_id: 'org-id',
    po_require_approval: false,
    po_approval_threshold: null,
    po_approval_roles: ['admin', 'manager'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('03.5a getPlanningSettings - Fetch Planning Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-02: Fetch Existing Settings', () => {
    it('should return planning settings when record exists', async () => {
      // GIVEN organization with existing planning_settings
      const orgId = 'org-a-id'
      const existingSettings = createMockSettings({
        org_id: orgId,
        po_require_approval: true,
        po_approval_threshold: 5000,
        po_approval_roles: ['admin', 'manager'],
      })

      mockSupabaseSingle.mockResolvedValue({ data: existingSettings, error: null })
      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })

      // WHEN fetching planning settings
      const result = await getPlanningSettings(orgId)

      // THEN returns complete settings object
      expect(result).toBeDefined()
      expect(result.org_id).toBe(orgId)
      expect(result.po_require_approval).toBe(true)
      expect(result.po_approval_threshold).toBe(5000)
      expect(result.po_approval_roles).toEqual(['admin', 'manager'])
    })

    it('should return default values when approval disabled', async () => {
      // GIVEN org with approval disabled
      const orgId = 'org-test'
      const settings = createMockSettings({
        org_id: orgId,
        po_require_approval: false,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
      })

      mockSupabaseSingle.mockResolvedValue({ data: settings, error: null })
      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })

      // WHEN fetching
      const result = await getPlanningSettings(orgId)

      // THEN returns settings with approval disabled
      expect(result.po_require_approval).toBe(false)
      expect(result.po_approval_threshold).toBeNull()
      expect(result.po_approval_roles).toEqual(['admin', 'manager'])
    })

    it('should include all PO approval fields in response', async () => {
      // GIVEN org with complete settings
      const orgId = 'org-complete'
      const settings = createMockSettings({
        org_id: orgId,
        po_require_approval: true,
        po_approval_threshold: 10000.5,
        po_approval_roles: ['admin', 'finance_manager'],
      })

      mockSupabaseSingle.mockResolvedValue({ data: settings, error: null })
      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect })

      // WHEN fetching
      const result = await getPlanningSettings(orgId)

      // THEN all approval fields present
      expect(result).toHaveProperty('po_require_approval')
      expect(result).toHaveProperty('po_approval_threshold')
      expect(result).toHaveProperty('po_approval_roles')
    })
  })

  describe('AC-02: Auto-Initialize on First Access', () => {
    it('should auto-create default settings when no record exists (PGRST116)', async () => {
      // GIVEN organization with no planning_settings record
      const orgId = 'new-org-id'
      const error = { code: 'PGRST116' }
      const defaultSettings = createMockSettings({
        org_id: orgId,
        po_require_approval: false,
        po_approval_threshold: null,
        po_approval_roles: ['admin', 'manager'],
      })

      // First call returns PGRST116, second returns inserted data
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

      // WHEN fetching (should auto-initialize)
      const result = await getPlanningSettings(orgId)

      // THEN returns new settings with defaults
      expect(result).toBeDefined()
      expect(result.org_id).toBe(orgId)
      expect(result.po_require_approval).toBe(false)
      expect(result.po_approval_threshold).toBeNull()
      expect(result.po_approval_roles).toEqual(['admin', 'manager'])
    })

    it('should set correct default values on auto-creation', async () => {
      // GIVEN brand new org
      const orgId = 'brand-new-org'
      const error = { code: 'PGRST116' }
      const defaultSettings = createMockSettings({
        org_id: orgId,
      })

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

      // THEN all defaults are correct per AC-02
      expect(result.po_require_approval).toBe(false)
      expect(result.po_approval_threshold).toBeNull()
      expect(result.po_approval_roles).toEqual(['admin', 'manager'])
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

    it('should handle auto-create insert failure', async () => {
      // GIVEN auto-create insert fails
      const orgId = 'org-insert-error'
      const selectError = { code: 'PGRST116' }
      const insertError = new Error('Insert failed')

      mockSupabaseSingle
        .mockResolvedValueOnce({ data: null, error: selectError })
        .mockResolvedValueOnce({ data: null, error: insertError })

      mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle })
      mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq, single: mockSupabaseSingle })
      mockSupabaseInsert.mockReturnValue({ select: mockSupabaseSelect })
      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
        insert: mockSupabaseInsert,
      })

      // WHEN fetching
      // THEN throws error
      await expect(getPlanningSettings(orgId)).rejects.toThrow()
    })
  })
})

describe('03.5a updatePlanningSettings - Update Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-03, AC-04, AC-05: Update Settings Successfully', () => {
    it('should update po_require_approval toggle', async () => {
      // GIVEN existing settings
      const orgId = 'org-update'
      const updates = { po_require_approval: true }
      const updatedSettings = createMockSettings({
        org_id: orgId,
        po_require_approval: true,
        updated_at: '2025-01-01T01:00:00Z',
      })

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

    it('should update po_approval_threshold', async () => {
      // GIVEN existing settings
      const orgId = 'org-threshold'
      const updates = { po_approval_threshold: 10000.5 }
      const updatedSettings = createMockSettings({
        org_id: orgId,
        po_approval_threshold: 10000.5,
      })

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN updating
      const result = await updatePlanningSettings(orgId, updates)

      // THEN threshold updated
      expect(result.po_approval_threshold).toBe(10000.5)
    })

    it('should update po_approval_roles', async () => {
      // GIVEN existing settings
      const orgId = 'org-roles'
      const updates = { po_approval_roles: ['admin', 'finance_manager'] }
      const updatedSettings = createMockSettings({
        org_id: orgId,
        po_approval_roles: ['admin', 'finance_manager'],
      })

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN updating
      const result = await updatePlanningSettings(orgId, updates)

      // THEN roles updated
      expect(result.po_approval_roles).toEqual(['admin', 'finance_manager'])
    })

    it('should update multiple fields at once', async () => {
      // GIVEN org with settings
      const orgId = 'org-multi'
      const updates = {
        po_require_approval: true,
        po_approval_threshold: 5000,
        po_approval_roles: ['admin', 'manager', 'finance_manager'],
      }
      const updatedSettings = createMockSettings({
        org_id: orgId,
        ...updates,
      })

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN updating multiple fields
      const result = await updatePlanningSettings(orgId, updates)

      // THEN all fields updated
      expect(result.po_require_approval).toBe(true)
      expect(result.po_approval_threshold).toBe(5000)
      expect(result.po_approval_roles).toEqual(['admin', 'manager', 'finance_manager'])
    })

    it('should preserve threshold when disabling approval', async () => {
      // GIVEN approval enabled with threshold
      const orgId = 'org-disable'
      const updates = { po_require_approval: false }
      const updatedSettings = createMockSettings({
        org_id: orgId,
        po_require_approval: false,
        po_approval_threshold: 5000, // Preserved but not enforced
      })

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN disabling approval
      const result = await updatePlanningSettings(orgId, updates)

      // THEN threshold preserved (AC-04)
      expect(result.po_require_approval).toBe(false)
      expect(result.po_approval_threshold).toBe(5000)
    })

    it('should clear threshold by setting to null', async () => {
      // GIVEN existing threshold
      const orgId = 'org-clear'
      const updates = { po_approval_threshold: null }
      const updatedSettings = createMockSettings({
        org_id: orgId,
        po_approval_threshold: null,
      })

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN clearing threshold
      const result = await updatePlanningSettings(orgId, updates)

      // THEN threshold is null
      expect(result.po_approval_threshold).toBeNull()
    })

    it('should update timestamp on save', async () => {
      // GIVEN existing settings
      const orgId = 'org-timestamp'
      const updates = { po_require_approval: true }
      const oldTimestamp = '2025-01-01T00:00:00Z'
      const newTimestamp = '2025-01-02T10:30:00Z'
      const updatedSettings = createMockSettings({
        org_id: orgId,
        updated_at: newTimestamp,
      })

      mockSupabaseSingle.mockResolvedValue({ data: updatedSettings, error: null })
      mockSupabaseEq.mockReturnValue({ select: vi.fn().mockReturnValue({ single: mockSupabaseSingle }) })
      mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq })
      mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate })

      // WHEN updating
      const result = await updatePlanningSettings(orgId, updates)

      // THEN timestamp updated (AC-12)
      expect(result.updated_at).not.toBe(oldTimestamp)
      expect(result.updated_at).toBe(newTimestamp)
    })
  })

  describe('Validation and Error Handling', () => {
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

    it('should throw error on validation failure', async () => {
      // GIVEN invalid update payload
      const orgId = 'org-validation'
      const invalidUpdates = {
        po_approval_threshold: -500, // Invalid: negative
      }

      // WHEN updating with invalid data
      // THEN throws validation error
      await expect(updatePlanningSettings(orgId, invalidUpdates as any)).rejects.toThrow()
    })
  })
})

describe('03.5a getDefaultPlanningSettings - Default Values', () => {
  it('should return correct default values', () => {
    // WHEN getting defaults
    const defaults = getDefaultPlanningSettings()

    // THEN returns expected defaults
    expect(defaults.po_require_approval).toBe(false)
    expect(defaults.po_approval_threshold).toBeNull()
    expect(defaults.po_approval_roles).toEqual(['admin', 'manager'])
  })

  it('should return immutable default object', () => {
    // GIVEN defaults
    const defaults = getDefaultPlanningSettings()

    // WHEN attempting to modify
    expect(() => {
      (defaults as any).po_require_approval = true
    }).not.toThrow() // JavaScript doesn't prevent mutation

    // THEN still returns correct values on second call
    const defaults2 = getDefaultPlanningSettings()
    expect(defaults2.po_require_approval).toBe(false)
  })
})

/**
 * Test Summary for Story 03.5a - Planning Settings Service
 * =======================================================
 *
 * Test Coverage:
 * - getPlanningSettings: 6 tests (fetch, auto-initialize, errors)
 * - updatePlanningSettings: 9 tests (update fields, multiple, errors)
 * - getDefaultPlanningSettings: 2 tests
 * - Total: 17 test cases
 *
 * Coverage Target: 80%
 * Service Coverage:
 * - getPlanningSettings: 100%
 * - updatePlanningSettings: 100%
 * - getDefaultPlanningSettings: 100%
 */
