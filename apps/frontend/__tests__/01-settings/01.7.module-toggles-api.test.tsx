/**
 * Module Toggles API Tests
 * Story: 01.7 Module Toggles
 * Epic: 01-settings
 * Type: API Integration Tests
 * Status: RED (Tests will fail until implementation exists)
 *
 * Tests API endpoints for module activation/deactivation:
 * - GET /api/v1/settings/modules (list all modules with status)
 * - PATCH /api/v1/settings/modules/:id/toggle (enable/disable)
 * - Dependency validation
 * - Cascade enable/disable
 * - Permission enforcement
 *
 * Related Story: docs/2-MANAGEMENT/epics/current/01-settings/01.7.module-toggles.md
 * Related Wireframes: SET-022
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

/**
 * Mock data - 7 modules as per story requirements
 */
const mockModules = [
  {
    id: 'mod-settings-uuid',
    code: 'settings',
    name: 'Settings',
    description: 'Organization and user management',
    dependencies: [],
    can_disable: false,
    display_order: 0,
  },
  {
    id: 'mod-technical-uuid',
    code: 'technical',
    name: 'Technical',
    description: 'Products, BOMs, Routings',
    dependencies: [],
    can_disable: true,
    display_order: 1,
  },
  {
    id: 'mod-planning-uuid',
    code: 'planning',
    name: 'Planning',
    description: 'Work Orders, Purchase Orders',
    dependencies: ['technical'],
    can_disable: true,
    display_order: 2,
  },
  {
    id: 'mod-production-uuid',
    code: 'production',
    name: 'Production',
    description: 'Work Order Execution',
    dependencies: ['technical', 'planning'],
    can_disable: true,
    display_order: 3,
  },
  {
    id: 'mod-quality-uuid',
    code: 'quality',
    name: 'Quality',
    description: 'QC Holds, Inspections',
    dependencies: ['production'],
    can_disable: true,
    display_order: 4,
  },
  {
    id: 'mod-warehouse-uuid',
    code: 'warehouse',
    name: 'Warehouse',
    description: 'License Plates, Inventory',
    dependencies: ['technical'],
    can_disable: true,
    display_order: 5,
  },
  {
    id: 'mod-shipping-uuid',
    code: 'shipping',
    name: 'Shipping',
    description: 'Sales Orders, Picking',
    dependencies: ['warehouse'],
    can_disable: true,
    display_order: 6,
  },
]

/**
 * Mock organization modules (org-specific state)
 */
const mockOrgModulesDefault = [
  { org_id: 'test-org-uuid', module_id: 'mod-settings-uuid', enabled: true },
  { org_id: 'test-org-uuid', module_id: 'mod-technical-uuid', enabled: true },
  { org_id: 'test-org-uuid', module_id: 'mod-planning-uuid', enabled: false },
  { org_id: 'test-org-uuid', module_id: 'mod-production-uuid', enabled: false },
  { org_id: 'test-org-uuid', module_id: 'mod-quality-uuid', enabled: false },
  { org_id: 'test-org-uuid', module_id: 'mod-warehouse-uuid', enabled: false },
  { org_id: 'test-org-uuid', module_id: 'mod-shipping-uuid', enabled: false },
]

/**
 * Mock fetch for API calls
 */
const mockFetch = vi.fn()

describe('Story 01.7: Module Toggles API - GET /api/v1/settings/modules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * AC-01: List all modules with status
   */
  describe('AC-01: List All Modules', () => {
    it('should return all 7 modules with current enabled status', async () => {
      // GIVEN API returns modules list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          modules: [
            { ...mockModules[0], enabled: true },
            { ...mockModules[1], enabled: true },
            { ...mockModules[2], enabled: false },
            { ...mockModules[3], enabled: false },
            { ...mockModules[4], enabled: false },
            { ...mockModules[5], enabled: false },
            { ...mockModules[6], enabled: false },
          ],
        }),
      })

      // WHEN fetching modules list
      const response = await fetch('/api/v1/settings/modules')
      const data = await response.json()

      // THEN all 7 modules are returned
      expect(response.ok).toBe(true)
      expect(data.modules).toHaveLength(7)
      expect(data.modules[0].code).toBe('settings')
      expect(data.modules[1].code).toBe('technical')
      expect(data.modules[2].code).toBe('planning')
    })

    it('should include dependencies array for each module', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          modules: mockModules.map((m, i) => ({
            ...m,
            enabled: i <= 1, // Settings and Technical enabled
          })),
        }),
      })

      const response = await fetch('/api/v1/settings/modules')
      const data = await response.json()

      expect(data.modules.find((m: any) => m.code === 'production').dependencies).toEqual([
        'technical',
        'planning',
      ])
      expect(data.modules.find((m: any) => m.code === 'quality').dependencies).toEqual(['production'])
      expect(data.modules.find((m: any) => m.code === 'shipping').dependencies).toEqual(['warehouse'])
    })

    it('should include dependents array for each module', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          modules: mockModules.map((m, i) => ({
            ...m,
            enabled: i <= 1,
            dependents:
              m.code === 'technical'
                ? ['planning', 'warehouse']
                : m.code === 'planning'
                  ? ['production']
                  : m.code === 'production'
                    ? ['quality']
                    : m.code === 'warehouse'
                      ? ['shipping']
                      : [],
          })),
        }),
      })

      const response = await fetch('/api/v1/settings/modules')
      const data = await response.json()

      const technicalModule = data.modules.find((m: any) => m.code === 'technical')
      expect(technicalModule.dependents).toContain('planning')
      expect(technicalModule.dependents).toContain('warehouse')

      const productionModule = data.modules.find((m: any) => m.code === 'production')
      expect(productionModule.dependents).toContain('quality')
    })

    it('should mark settings module as can_disable: false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          modules: mockModules.map((m) => ({ ...m, enabled: true })),
        }),
      })

      const response = await fetch('/api/v1/settings/modules')
      const data = await response.json()

      const settingsModule = data.modules.find((m: any) => m.code === 'settings')
      expect(settingsModule.can_disable).toBe(false)
    })

    it('should mark all other modules as can_disable: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          modules: mockModules.map((m) => ({ ...m, enabled: true })),
        }),
      })

      const response = await fetch('/api/v1/settings/modules')
      const data = await response.json()

      const toggleableModules = data.modules.filter((m: any) => m.code !== 'settings')
      toggleableModules.forEach((module: any) => {
        expect(module.can_disable).toBe(true)
      })
    })

    it('should enforce RLS - only return modules for current org', async () => {
      // GIVEN user from test-org-uuid
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          modules: mockModules.map((m) => ({
            ...m,
            enabled: m.code === 'settings' || m.code === 'technical',
          })),
        }),
      })

      const response = await fetch('/api/v1/settings/modules')
      const data = await response.json()

      // THEN all modules have org-specific enabled state
      expect(data.modules).toHaveLength(7)
      // Settings and Technical should be enabled for this org
      expect(data.modules.find((m: any) => m.code === 'settings').enabled).toBe(true)
      expect(data.modules.find((m: any) => m.code === 'technical').enabled).toBe(true)
    })

    it('should return 401 for unauthenticated users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Authentication required' }),
      })

      const response = await fetch('/api/v1/settings/modules')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should return modules sorted by display_order', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          modules: mockModules.map((m) => ({ ...m, enabled: false })),
        }),
      })

      const response = await fetch('/api/v1/settings/modules')
      const data = await response.json()

      // Verify order: settings, technical, planning, production, quality, warehouse, shipping
      expect(data.modules[0].code).toBe('settings')
      expect(data.modules[1].code).toBe('technical')
      expect(data.modules[2].code).toBe('planning')
      expect(data.modules[3].code).toBe('production')
      expect(data.modules[4].code).toBe('quality')
      expect(data.modules[5].code).toBe('warehouse')
      expect(data.modules[6].code).toBe('shipping')
    })
  })

  /**
   * AC-02: Enable module (no dependencies)
   */
  describe('AC-02: Enable Module Without Dependencies', () => {
    it('should enable technical module successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-technical-uuid',
          enabled: true,
          affected_modules: ['technical'],
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.enabled).toBe(true)
      expect(data.affected_modules).toEqual(['technical'])
    })

    it('should enable warehouse module successfully', async () => {
      // GIVEN technical is already enabled
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-warehouse-uuid',
          enabled: true,
          affected_modules: ['warehouse'],
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-warehouse-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
    })
  })

  /**
   * AC-03: Enable module with missing dependencies
   */
  describe('AC-03: Enable With Missing Dependencies', () => {
    it('should fail to enable planning when technical is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required dependencies',
          missing_dependencies: ['technical'],
          warning: 'Planning requires Technical. Enable Technical first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-planning-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required dependencies')
      expect(data.missing_dependencies).toEqual(['technical'])
    })

    it('should fail to enable production when technical and planning are disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required dependencies',
          missing_dependencies: ['technical', 'planning'],
          warning: 'Production requires Technical, Planning. Enable them first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-production-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.missing_dependencies).toEqual(['technical', 'planning'])
    })

    it('should fail to enable quality when production is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required dependencies',
          missing_dependencies: ['production'],
          warning: 'Quality requires Production. Enable Production first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-quality-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.missing_dependencies).toEqual(['production'])
    })

    it('should fail to enable shipping when warehouse is disabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Missing required dependencies',
          missing_dependencies: ['warehouse'],
          warning: 'Shipping requires Warehouse. Enable Warehouse first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-shipping-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.missing_dependencies).toEqual(['warehouse'])
    })
  })

  /**
   * AC-04: Cascade enable with dependencies
   */
  describe('AC-04: Cascade Enable Dependencies', () => {
    it('should enable planning and technical together when cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-planning-uuid',
          enabled: true,
          affected_modules: ['technical', 'planning'],
          warning: 'Also enabled required dependencies: Technical',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-planning-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, cascade: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.affected_modules).toEqual(['technical', 'planning'])
    })

    it('should enable production, planning, and technical together when cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-production-uuid',
          enabled: true,
          affected_modules: ['technical', 'planning', 'production'],
          warning: 'Also enabled required dependencies: Technical, Planning',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-production-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, cascade: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.affected_modules).toEqual(['technical', 'planning', 'production'])
    })

    it('should enable quality, production, planning, and technical when cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-quality-uuid',
          enabled: true,
          affected_modules: ['technical', 'planning', 'production', 'quality'],
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-quality-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, cascade: true }),
      })

      const data = await response.json()

      expect(data.affected_modules).toHaveLength(4)
      expect(data.affected_modules).toContain('technical')
      expect(data.affected_modules).toContain('planning')
      expect(data.affected_modules).toContain('production')
      expect(data.affected_modules).toContain('quality')
    })

    it('should enable shipping and warehouse (and technical) when cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-shipping-uuid',
          enabled: true,
          affected_modules: ['technical', 'warehouse', 'shipping'],
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-shipping-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true, cascade: true }),
      })

      const data = await response.json()

      expect(data.affected_modules).toEqual(['technical', 'warehouse', 'shipping'])
    })
  })

  /**
   * AC-05: Disable module with active dependents
   */
  describe('AC-05: Disable With Active Dependents', () => {
    it('should fail to disable technical when planning is enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Active dependents exist',
          active_dependents: ['planning'],
          warning: 'Planning depends on Technical. Disable Planning first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(data.error).toBe('Active dependents exist')
      expect(data.active_dependents).toEqual(['planning'])
    })

    it('should fail to disable technical when production is enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Active dependents exist',
          active_dependents: ['planning', 'production'],
          warning: 'Planning, Production depend on Technical. Disable them first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.active_dependents).toContain('planning')
      expect(data.active_dependents).toContain('production')
    })

    it('should fail to disable planning when production is enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Active dependents exist',
          active_dependents: ['production'],
          warning: 'Production depends on Planning. Disable Production first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-planning-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.active_dependents).toEqual(['production'])
    })

    it('should fail to disable production when quality is enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Active dependents exist',
          active_dependents: ['quality'],
          warning: 'Quality depends on Production. Disable Quality first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-production-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.active_dependents).toEqual(['quality'])
    })

    it('should fail to disable warehouse when shipping is enabled', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Active dependents exist',
          active_dependents: ['shipping'],
          warning: 'Shipping depends on Warehouse. Disable Shipping first?',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-warehouse-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.active_dependents).toEqual(['shipping'])
    })
  })

  /**
   * AC-06: Cascade disable dependents
   */
  describe('AC-06: Cascade Disable Dependents', () => {
    it('should disable technical and planning together when cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-technical-uuid',
          enabled: false,
          affected_modules: ['technical', 'planning'],
          warning: 'Also disabled dependent modules: Planning',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false, cascade: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.success).toBe(true)
      expect(data.affected_modules).toContain('technical')
      expect(data.affected_modules).toContain('planning')
    })

    it('should disable technical, planning, production, quality when cascade: true', async () => {
      // GIVEN all modules enabled
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-technical-uuid',
          enabled: false,
          affected_modules: ['technical', 'planning', 'production', 'quality'],
          warning: 'Also disabled dependent modules: Planning, Production, Quality',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false, cascade: true }),
      })

      const data = await response.json()

      expect(data.affected_modules).toHaveLength(4)
      expect(data.affected_modules).toContain('technical')
      expect(data.affected_modules).toContain('planning')
      expect(data.affected_modules).toContain('production')
      expect(data.affected_modules).toContain('quality')
    })

    it('should disable production and quality together when cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-production-uuid',
          enabled: false,
          affected_modules: ['production', 'quality'],
          warning: 'Also disabled dependent modules: Quality',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-production-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false, cascade: true }),
      })

      const data = await response.json()

      expect(data.affected_modules).toEqual(['production', 'quality'])
    })

    it('should disable warehouse and shipping together when cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-warehouse-uuid',
          enabled: false,
          affected_modules: ['warehouse', 'shipping'],
          warning: 'Also disabled dependent modules: Shipping',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-warehouse-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false, cascade: true }),
      })

      const data = await response.json()

      expect(data.affected_modules).toEqual(['warehouse', 'shipping'])
    })
  })

  /**
   * AC-07: Settings module cannot be disabled
   */
  describe('AC-07: Settings Module Always Enabled', () => {
    it('should fail to disable settings module', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Settings module cannot be disabled',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-settings-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
      expect(data.error).toBe('Settings module cannot be disabled')
    })

    it('should fail to disable settings even with cascade: true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Settings module cannot be disabled',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-settings-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false, cascade: true }),
      })

      const data = await response.json()

      expect(response.ok).toBe(false)
      expect(data.error).toBe('Settings module cannot be disabled')
    })
  })

  /**
   * AC-08: Permission enforcement (Admin+ only)
   */
  describe('AC-08: Permission Enforcement', () => {
    it('should allow admin to toggle modules', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-technical-uuid',
          enabled: true,
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      expect(response.ok).toBe(true)
    })

    it('should allow owner to toggle modules', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          module_id: 'mod-warehouse-uuid',
          enabled: true,
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-warehouse-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      expect(response.ok).toBe(true)
    })

    it('should block viewer from toggling modules', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: "You don't have permission to perform this action",
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })

    it('should block production_operator from toggling modules', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: "You don't have permission to perform this action",
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-production-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })

    it('should block planner from toggling modules', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: "You don't have permission to perform this action",
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-planning-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(403)
    })
  })

  /**
   * AC-09: Error handling
   */
  describe('AC-09: Error Handling', () => {
    it('should return 404 for non-existent module ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'Module not found',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/non-existent-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid request body',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'field' }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it('should return 400 when enabled field is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'enabled field is required',
        }),
      })

      const response = await fetch('/api/v1/settings/modules/mod-technical-uuid/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })
})
