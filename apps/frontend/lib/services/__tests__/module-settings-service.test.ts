/**
 * Module Settings Service Tests
 * Story: 01.7 Module Toggles
 * Epic: 01-settings
 * Type: Unit Tests
 * Status: RED (Tests will fail until implementation exists)
 *
 * Tests business logic for module settings service:
 * - getModules() - List all modules with org-specific enabled state
 * - toggleModule() - Enable/disable module with validation
 * - validateDependencies() - Check dependencies before enable
 * - findDependents() - Find modules that depend on target
 * - cascadeEnable() - Auto-enable dependencies
 * - cascadeDisable() - Auto-disable dependents
 * - isModuleEnabled() - Check if module is enabled for org
 *
 * Related Story: docs/2-MANAGEMENT/epics/current/01-settings/01.7.module-toggles.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ModuleSettingsService } from '@/lib/services/module-settings-service'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Mock Supabase client
 */
const createMockSupabaseClient = () => {
  const mockClient = {
    from: vi.fn(),
    rpc: vi.fn(),
  } as unknown as SupabaseClient

  return mockClient
}

/**
 * Mock module data
 */
const mockModules = [
  {
    id: 'mod-settings-uuid',
    code: 'settings',
    name: 'Settings',
    dependencies: [],
    can_disable: false,
    display_order: 0,
  },
  {
    id: 'mod-technical-uuid',
    code: 'technical',
    name: 'Technical',
    dependencies: [],
    can_disable: true,
    display_order: 1,
  },
  {
    id: 'mod-planning-uuid',
    code: 'planning',
    name: 'Planning',
    dependencies: ['technical'],
    can_disable: true,
    display_order: 2,
  },
  {
    id: 'mod-production-uuid',
    code: 'production',
    name: 'Production',
    dependencies: ['technical', 'planning'],
    can_disable: true,
    display_order: 3,
  },
  {
    id: 'mod-quality-uuid',
    code: 'quality',
    name: 'Quality',
    dependencies: ['production'],
    can_disable: true,
    display_order: 4,
  },
  {
    id: 'mod-warehouse-uuid',
    code: 'warehouse',
    name: 'Warehouse',
    dependencies: ['technical'],
    can_disable: true,
    display_order: 5,
  },
  {
    id: 'mod-shipping-uuid',
    code: 'shipping',
    name: 'Shipping',
    dependencies: ['warehouse'],
    can_disable: true,
    display_order: 6,
  },
]

describe('ModuleSettingsService.getModules()', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  it('should return all 7 modules with enabled status', async () => {
    // GIVEN modules table has 7 modules
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockModules,
          error: null,
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    // WHEN getting modules list
    const result = await ModuleSettingsService.getModules(mockSupabase, 'test-org-uuid')

    // THEN all 7 modules are returned
    expect(result).toHaveLength(7)
    expect(result[0].code).toBe('settings')
    expect(result[1].code).toBe('technical')
    expect(result[6].code).toBe('shipping')
  })

  it('should include org-specific enabled state for each module', async () => {
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === 'modules') {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockModules,
              error: null,
            }),
          }),
        }
      }
      if (table === 'organization_modules') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [
                { module_id: 'mod-settings-uuid', enabled: true },
                { module_id: 'mod-technical-uuid', enabled: true },
                { module_id: 'mod-planning-uuid', enabled: false },
              ],
              error: null,
            }),
          }),
        }
      }
    })
    ;(mockSupabase.from as any) = mockFrom

    const result = await ModuleSettingsService.getModules(mockSupabase, 'test-org-uuid')

    const settingsModule = result.find((m) => m.code === 'settings')
    const technicalModule = result.find((m) => m.code === 'technical')
    const planningModule = result.find((m) => m.code === 'planning')

    expect(settingsModule?.enabled).toBe(true)
    expect(technicalModule?.enabled).toBe(true)
    expect(planningModule?.enabled).toBe(false)
  })

  it('should compute dependents array for each module', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockModules,
          error: null,
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const result = await ModuleSettingsService.getModules(mockSupabase, 'test-org-uuid')

    const technicalModule = result.find((m) => m.code === 'technical')
    expect(technicalModule?.dependents).toContain('planning')
    expect(technicalModule?.dependents).toContain('production')
    expect(technicalModule?.dependents).toContain('warehouse')

    const planningModule = result.find((m) => m.code === 'planning')
    expect(planningModule?.dependents).toContain('production')

    const warehouseModule = result.find((m) => m.code === 'warehouse')
    expect(warehouseModule?.dependents).toContain('shipping')
  })

  it('should throw error if org_id is invalid', async () => {
    await expect(ModuleSettingsService.getModules(mockSupabase, '')).rejects.toThrow(
      'Invalid organization ID'
    )

    await expect(ModuleSettingsService.getModules(mockSupabase, 'not-a-uuid')).rejects.toThrow(
      'Invalid organization ID'
    )
  })

  it('should throw error if database query fails', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    await expect(ModuleSettingsService.getModules(mockSupabase, 'test-org-uuid')).rejects.toThrow()
  })
})

describe('ModuleSettingsService.validateDependencies()', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  it('should return valid when enabling module with no dependencies', async () => {
    const result = await ModuleSettingsService.validateDependencies(
      mockSupabase,
      'test-org-uuid',
      'technical',
      true,
      { technical: false, planning: false }
    )

    expect(result.valid).toBe(true)
    expect(result.missing_dependencies).toBeUndefined()
  })

  it('should return invalid when enabling planning without technical', async () => {
    const result = await ModuleSettingsService.validateDependencies(
      mockSupabase,
      'test-org-uuid',
      'planning',
      true,
      { technical: false, planning: false }
    )

    expect(result.valid).toBe(false)
    expect(result.missing_dependencies).toEqual(['technical'])
    expect(result.warning).toContain('Planning requires Technical')
  })

  it('should return invalid when enabling production without technical and planning', async () => {
    const result = await ModuleSettingsService.validateDependencies(
      mockSupabase,
      'test-org-uuid',
      'production',
      true,
      { technical: false, planning: false, production: false }
    )

    expect(result.valid).toBe(false)
    expect(result.missing_dependencies).toEqual(['technical', 'planning'])
    expect(result.warning).toContain('Production requires')
  })

  it('should return valid when enabling production with technical and planning enabled', async () => {
    const result = await ModuleSettingsService.validateDependencies(
      mockSupabase,
      'test-org-uuid',
      'production',
      true,
      { technical: true, planning: true, production: false }
    )

    expect(result.valid).toBe(true)
  })

  it('should return invalid when disabling technical with planning enabled', async () => {
    const result = await ModuleSettingsService.validateDependencies(
      mockSupabase,
      'test-org-uuid',
      'technical',
      false,
      { technical: true, planning: true }
    )

    expect(result.valid).toBe(false)
    expect(result.active_dependents).toContain('planning')
    expect(result.warning).toContain('Planning depends on Technical')
  })

  it('should return invalid when disabling warehouse with shipping enabled', async () => {
    const result = await ModuleSettingsService.validateDependencies(
      mockSupabase,
      'test-org-uuid',
      'warehouse',
      false,
      { warehouse: true, shipping: true }
    )

    expect(result.valid).toBe(false)
    expect(result.active_dependents).toEqual(['shipping'])
  })

  it('should return valid when disabling module with no active dependents', async () => {
    const result = await ModuleSettingsService.validateDependencies(
      mockSupabase,
      'test-org-uuid',
      'technical',
      false,
      { technical: true, planning: false, production: false, warehouse: false }
    )

    expect(result.valid).toBe(true)
  })
})

describe('ModuleSettingsService.findDependents()', () => {
  it('should find all modules that depend on technical', () => {
    const dependents = ModuleSettingsService.findDependents('technical', mockModules)

    expect(dependents).toContain('planning')
    expect(dependents).toContain('production')
    expect(dependents).toContain('warehouse')
    expect(dependents).toHaveLength(3)
  })

  it('should find modules that depend on planning', () => {
    const dependents = ModuleSettingsService.findDependents('planning', mockModules)

    expect(dependents).toEqual(['production'])
  })

  it('should find modules that depend on production', () => {
    const dependents = ModuleSettingsService.findDependents('production', mockModules)

    expect(dependents).toEqual(['quality'])
  })

  it('should find modules that depend on warehouse', () => {
    const dependents = ModuleSettingsService.findDependents('warehouse', mockModules)

    expect(dependents).toEqual(['shipping'])
  })

  it('should return empty array for modules with no dependents', () => {
    const dependents = ModuleSettingsService.findDependents('quality', mockModules)

    expect(dependents).toEqual([])
  })

  it('should return empty array for shipping (no dependents)', () => {
    const dependents = ModuleSettingsService.findDependents('shipping', mockModules)

    expect(dependents).toEqual([])
  })
})

describe('ModuleSettingsService.cascadeEnable()', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  it('should enable technical when enabling planning', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeEnable(
      mockSupabase,
      'test-org-uuid',
      'planning',
      mockModules
    )

    expect(affectedModules).toContain('technical')
    expect(affectedModules).toContain('planning')
  })

  it('should enable technical and planning when enabling production', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeEnable(
      mockSupabase,
      'test-org-uuid',
      'production',
      mockModules
    )

    expect(affectedModules).toContain('technical')
    expect(affectedModules).toContain('planning')
    expect(affectedModules).toContain('production')
  })

  it('should enable full dependency chain for quality', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeEnable(
      mockSupabase,
      'test-org-uuid',
      'quality',
      mockModules
    )

    expect(affectedModules).toContain('technical')
    expect(affectedModules).toContain('planning')
    expect(affectedModules).toContain('production')
    expect(affectedModules).toContain('quality')
  })

  it('should enable technical and warehouse when enabling shipping', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeEnable(
      mockSupabase,
      'test-org-uuid',
      'shipping',
      mockModules
    )

    expect(affectedModules).toContain('technical')
    expect(affectedModules).toContain('warehouse')
    expect(affectedModules).toContain('shipping')
  })

  it('should only enable target module when no dependencies exist', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeEnable(
      mockSupabase,
      'test-org-uuid',
      'technical',
      mockModules
    )

    expect(affectedModules).toEqual(['technical'])
  })

  it('should throw error if database upsert fails', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    await expect(
      ModuleSettingsService.cascadeEnable(mockSupabase, 'test-org-uuid', 'planning', mockModules)
    ).rejects.toThrow()
  })
})

describe('ModuleSettingsService.cascadeDisable()', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  it('should disable technical and planning when disabling technical', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeDisable(
      mockSupabase,
      'test-org-uuid',
      'technical',
      mockModules,
      { technical: true, planning: true, production: false }
    )

    expect(affectedModules).toContain('technical')
    expect(affectedModules).toContain('planning')
  })

  it('should disable full chain when disabling technical with all dependents enabled', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeDisable(
      mockSupabase,
      'test-org-uuid',
      'technical',
      mockModules,
      {
        technical: true,
        planning: true,
        production: true,
        quality: true,
        warehouse: true,
        shipping: true,
      }
    )

    expect(affectedModules).toContain('technical')
    expect(affectedModules).toContain('planning')
    expect(affectedModules).toContain('production')
    expect(affectedModules).toContain('quality')
    expect(affectedModules).toContain('warehouse')
    expect(affectedModules).toContain('shipping')
  })

  it('should disable production and quality when disabling production', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeDisable(
      mockSupabase,
      'test-org-uuid',
      'production',
      mockModules,
      { production: true, quality: true }
    )

    expect(affectedModules).toEqual(['production', 'quality'])
  })

  it('should disable warehouse and shipping when disabling warehouse', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeDisable(
      mockSupabase,
      'test-org-uuid',
      'warehouse',
      mockModules,
      { warehouse: true, shipping: true }
    )

    expect(affectedModules).toEqual(['warehouse', 'shipping'])
  })

  it('should only disable target module when no dependents are enabled', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const affectedModules = await ModuleSettingsService.cascadeDisable(
      mockSupabase,
      'test-org-uuid',
      'quality',
      mockModules,
      { quality: true }
    )

    expect(affectedModules).toEqual(['quality'])
  })
})

describe('ModuleSettingsService.isModuleEnabled()', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  it('should return true when module is enabled', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { enabled: true },
              error: null,
            }),
          }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const isEnabled = await ModuleSettingsService.isModuleEnabled(
      mockSupabase,
      'test-org-uuid',
      'technical'
    )

    expect(isEnabled).toBe(true)
  })

  it('should return false when module is disabled', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { enabled: false },
              error: null,
            }),
          }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const isEnabled = await ModuleSettingsService.isModuleEnabled(
      mockSupabase,
      'test-org-uuid',
      'planning'
    )

    expect(isEnabled).toBe(false)
  })

  it('should return false when module record does not exist', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const isEnabled = await ModuleSettingsService.isModuleEnabled(
      mockSupabase,
      'test-org-uuid',
      'production'
    )

    expect(isEnabled).toBe(false)
  })

  it('should always return true for settings module', async () => {
    // Settings module should always be enabled
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { enabled: true },
              error: null,
            }),
          }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const isEnabled = await ModuleSettingsService.isModuleEnabled(
      mockSupabase,
      'test-org-uuid',
      'settings'
    )

    expect(isEnabled).toBe(true)
  })

  it('should throw error if org_id is invalid', async () => {
    await expect(
      ModuleSettingsService.isModuleEnabled(mockSupabase, '', 'technical')
    ).rejects.toThrow('Invalid organization ID')

    await expect(
      ModuleSettingsService.isModuleEnabled(mockSupabase, 'not-a-uuid', 'technical')
    ).rejects.toThrow('Invalid organization ID')
  })
})

describe('ModuleSettingsService.toggleModule()', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  it('should enable technical module successfully', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const result = await ModuleSettingsService.toggleModule(
      mockSupabase,
      'test-org-uuid',
      'mod-technical-uuid',
      true
    )

    expect(result.success).toBe(true)
    expect(result.enabled).toBe(true)
    expect(mockFrom).toHaveBeenCalledWith('organization_modules')
  })

  it('should disable warehouse module successfully', async () => {
    const mockFrom = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    ;(mockSupabase.from as any) = mockFrom

    const result = await ModuleSettingsService.toggleModule(
      mockSupabase,
      'test-org-uuid',
      'mod-warehouse-uuid',
      false
    )

    expect(result.success).toBe(true)
    expect(result.enabled).toBe(false)
  })

  it('should throw error when trying to disable settings module', async () => {
    await expect(
      ModuleSettingsService.toggleModule(mockSupabase, 'test-org-uuid', 'mod-settings-uuid', false)
    ).rejects.toThrow('Settings module cannot be disabled')
  })

  it('should throw error if module_id is invalid', async () => {
    await expect(
      ModuleSettingsService.toggleModule(mockSupabase, 'test-org-uuid', '', true)
    ).rejects.toThrow()
  })

  it('should throw error if org_id is invalid', async () => {
    await expect(
      ModuleSettingsService.toggleModule(mockSupabase, '', 'mod-technical-uuid', true)
    ).rejects.toThrow('Invalid organization ID')
  })
})
