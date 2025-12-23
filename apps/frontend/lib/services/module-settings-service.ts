/**
 * Module Settings Service
 * Story: 01.7 - Module Toggles
 *
 * Handles module enable/disable with dependency validation
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface Module {
  id: string
  code: string
  name: string
  description?: string
  dependencies: string[]
  can_disable: boolean
  display_order: number
  enabled: boolean  // org-specific state
  dependents?: string[]  // computed field
}

interface ValidationResult {
  valid: boolean
  missing_dependencies?: string[]
  active_dependents?: string[]
  warning?: string
}

interface ToggleResult {
  success: boolean
  enabled: boolean
  affected_modules?: string[]
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export class ModuleSettingsService {
  /**
   * Module definitions for dependency resolution
   */
  private static readonly MODULE_DEFINITIONS = [
    {
      code: 'settings',
      dependencies: [],
    },
    {
      code: 'technical',
      dependencies: [],
    },
    {
      code: 'planning',
      dependencies: ['technical'],
    },
    {
      code: 'production',
      dependencies: ['technical', 'planning'],
    },
    {
      code: 'quality',
      dependencies: ['production'],
    },
    {
      code: 'warehouse',
      dependencies: ['technical'],
    },
    {
      code: 'shipping',
      dependencies: ['warehouse'],
    },
  ]

  /**
   * Get all modules with org-specific enabled state
   */
  static async getModules(supabase: SupabaseClient, orgId: string): Promise<Module[]> {
    if (!orgId || !isValidUUID(orgId)) {
      throw new Error('Invalid organization ID')
    }

    // Get all modules
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .order('display_order')

    if (modulesError || !modules) {
      throw new Error('Failed to fetch modules')
    }

    // Get org-specific enabled state
    const { data: orgModules, error: orgError } = await supabase
      .from('organization_modules')
      .select('module_id, enabled')
      .eq('org_id', orgId)

    if (orgError) {
      throw new Error('Failed to fetch org modules')
    }

    // Merge enabled state
    const enabledMap = new Map(orgModules?.map(om => [om.module_id, om.enabled]) || [])

    // Compute dependents for each module
    const modulesWithDependents = modules.map(m => {
      const dependents = this.findDependents(m.code, modules)
      return {
        ...m,
        enabled: m.code === 'settings' ? true : (enabledMap.get(m.id) || false),
        dependents,
      }
    })

    return modulesWithDependents
  }

  /**
   * Find all modules that depend on the given module code
   */
  static findDependents(moduleCode: string, allModules: any[]): string[] {
    return allModules
      .filter(m => m.dependencies && m.dependencies.includes(moduleCode))
      .map(m => m.code)
  }

  /**
   * Check if module is enabled for org
   */
  static async isModuleEnabled(
    supabase: SupabaseClient,
    orgId: string,
    moduleCode: string
  ): Promise<boolean> {
    if (!orgId || !isValidUUID(orgId)) {
      throw new Error('Invalid organization ID')
    }

    // Settings always enabled
    if (moduleCode === 'settings') return true

    const { data, error } = await supabase
      .from('organization_modules')
      .select('enabled, modules!inner(code)')
      .eq('org_id', orgId)
      .eq('modules.code', moduleCode)
      .single()

    if (error || !data) return false
    return data?.enabled || false
  }

  /**
   * Validate dependencies before enabling/disabling a module
   */
  static async validateDependencies(
    supabase: SupabaseClient,
    orgId: string,
    moduleCode: string,
    enable: boolean,
    currentStates: Record<string, boolean>
  ): Promise<ValidationResult> {
    const moduleDef = this.MODULE_DEFINITIONS.find(m => m.code === moduleCode)
    if (!moduleDef) {
      return { valid: false, warning: 'Module not found' }
    }

    if (enable) {
      // Enabling: check dependencies are enabled
      const missingDeps = moduleDef.dependencies.filter(dep => !currentStates[dep])
      if (missingDeps.length > 0) {
        const moduleNames = missingDeps.map(code => {
          const def = this.MODULE_DEFINITIONS.find(m => m.code === code)
          return def ? code.charAt(0).toUpperCase() + code.slice(1) : code
        })
        return {
          valid: false,
          missing_dependencies: missingDeps,
          warning: `${moduleCode.charAt(0).toUpperCase() + moduleCode.slice(1)} requires ${moduleNames.join(', ')}. Enable them first?`
        }
      }
    } else {
      // Disabling: check dependents are disabled
      const activeDependents = this.MODULE_DEFINITIONS
        .filter(m => m.dependencies.includes(moduleCode) && currentStates[m.code])
        .map(m => m.code)

      if (activeDependents.length > 0) {
        const dependentNames = activeDependents.map(code =>
          code.charAt(0).toUpperCase() + code.slice(1)
        )
        return {
          valid: false,
          active_dependents: activeDependents,
          warning: `${dependentNames.join(', ')} depends on ${moduleCode.charAt(0).toUpperCase() + moduleCode.slice(1)}. Disable them also?`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Cascade enable - enable module and all dependencies
   */
  static async cascadeEnable(
    supabase: SupabaseClient,
    orgId: string,
    moduleCode: string,
    allModules: any[]
  ): Promise<string[]> {
    const affectedModules: string[] = []
    const modulesToEnable = new Set<string>()

    // Find module definition
    const moduleDef = this.MODULE_DEFINITIONS.find(m => m.code === moduleCode)
    if (!moduleDef) {
      throw new Error('Module not found')
    }

    // Recursively collect all dependencies
    const collectDependencies = (code: string) => {
      const def = this.MODULE_DEFINITIONS.find(m => m.code === code)
      if (!def) return

      modulesToEnable.add(code)
      def.dependencies.forEach(dep => collectDependencies(dep))
    }

    collectDependencies(moduleCode)

    // Enable all modules
    const timestamp = new Date().toISOString()
    for (const code of Array.from(modulesToEnable)) {
      const moduleData = allModules.find(m => m.code === code)
      if (!moduleData) continue
      const { error } = await supabase
        .from('organization_modules')
        .upsert({
          org_id: orgId,
          module_id: moduleData.id,
          enabled: true,
          enabled_at: timestamp,
        }, {
          onConflict: 'org_id,module_id'
        })

      if (error) {
        throw new Error(`Failed to enable module ${code}`)
      }

      affectedModules.push(code)
    }

    return affectedModules
  }

  /**
   * Cascade disable - disable module and all dependents
   */
  static async cascadeDisable(
    supabase: SupabaseClient,
    orgId: string,
    moduleCode: string,
    allModules: any[],
    currentStates: Record<string, boolean>
  ): Promise<string[]> {
    const affectedModules: string[] = []
    const modulesToDisable = new Set<string>()

    // Recursively collect all dependents
    const collectDependents = (code: string) => {
      modulesToDisable.add(code)

      const dependents = this.MODULE_DEFINITIONS
        .filter(m => m.dependencies.includes(code) && currentStates[m.code])
        .map(m => m.code)

      dependents.forEach(dep => collectDependents(dep))
    }

    collectDependents(moduleCode)

    // Disable all modules
    const timestamp = new Date().toISOString()
    for (const code of Array.from(modulesToDisable)) {
      const moduleData = allModules.find(m => m.code === code)
      if (!moduleData) continue

      const { error } = await supabase
        .from('organization_modules')
        .update({
          enabled: false,
          disabled_at: timestamp,
        })
        .eq('org_id', orgId)
        .eq('module_id', moduleData.id)

      if (error) {
        throw new Error(`Failed to disable module ${code}`)
      }

      affectedModules.push(code)
    }

    return affectedModules
  }

  /**
   * Toggle module (enable/disable) with dependency validation
   */
  static async toggleModule(
    supabase: SupabaseClient,
    orgId: string,
    moduleId: string,
    enabled: boolean
  ): Promise<ToggleResult> {
    if (!orgId || !isValidUUID(orgId)) {
      throw new Error('Invalid organization ID')
    }

    if (!moduleId || !isValidUUID(moduleId)) {
      throw new Error('Invalid module ID')
    }

    // Get module info
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('*')
      .eq('id', moduleId)
      .single()

    if (moduleError || !moduleData) {
      throw new Error('Module not found')
    }

    // ISSUE 3 FIX: Explicit Settings check first
    if (moduleData.code === 'settings') {
      throw new Error('Settings module cannot be disabled')
    }

    // Then check can_disable flag as secondary validation
    if (!moduleData.can_disable) {
      throw new Error('Module cannot be disabled')
    }

    // Update or insert organization_modules
    const timestamp = new Date().toISOString()
    const updateData = enabled
      ? { enabled: true, enabled_at: timestamp }
      : { enabled: false, disabled_at: timestamp }

    if (enabled) {
      const { error } = await supabase
        .from('organization_modules')
        .upsert({
          org_id: orgId,
          module_id: moduleId,
          ...updateData
        }, {
          onConflict: 'org_id,module_id'
        })

      if (error) {
        throw new Error('Failed to update module state')
      }
    } else {
      const { error } = await supabase
        .from('organization_modules')
        .update(updateData)
        .eq('org_id', orgId)
        .eq('module_id', moduleId)

      if (error) {
        throw new Error('Failed to update module state')
      }
    }

    return { success: true, enabled }
  }
}
