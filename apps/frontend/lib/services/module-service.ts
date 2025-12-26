import { createServerSupabase, createServerSupabaseAdmin } from '../supabase/server'
import { MODULES } from '../config/modules'

/**
 * Module Service
 * Story: 1.11 Module Activation
 */

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabase>>

export interface ModuleServiceResult {
  success: boolean
  data?: any
  error?: string
  affectedCount?: number
}

async function getCurrentOrgId(): Promise<string | null> {
  const supabase = await createServerSupabase()
  const supabaseAdmin = createServerSupabaseAdmin()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  return userData?.org_id || null
}

/**
 * Get enabled modules for organization
 * AC-010.1: Retrieve modules_enabled array
 */
export async function getEnabledModules(): Promise<ModuleServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' }
    }

    const { data, error } = await supabaseAdmin
      .from('organizations')
      .select('modules_enabled')
      .eq('id', orgId)
      .single()

    if (error || !data) {
      console.error('Error fetching modules:', error)
      return { success: false, error: `Failed to fetch modules: ${error?.message || 'No data found'}` }
    }

    // Return modules with full config
    const enabledCodes = data.modules_enabled || []
    const modules = MODULES.map(m => ({
      ...m,
      enabled: enabledCodes.includes(m.code),
    }))

    return { success: true, data: { modules, enabledCodes } }
  } catch (error: any) {
    console.error('Unexpected error in getEnabledModules:', error)
    return { success: false, error: `Unknown error: ${error?.message}` }
  }
}

/**
 * Toggle a module on/off
 * AC-010.5: Enable/disable module with confirmation
 */
export async function toggleModule(
  moduleCode: string,
  enabled: boolean
): Promise<ModuleServiceResult> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) {
      return { success: false, error: 'Organization ID not found' }
    }

    // Get current modules
    const { data: org, error: fetchError } = await supabaseAdmin
      .from('organizations')
      .select('modules_enabled')
      .eq('id', orgId)
      .single()

    if (fetchError || !org) {
      console.error('Error fetching org for toggle:', fetchError)
      return { success: false, error: `Organization not found: ${fetchError?.message}` }
    }

    let newModules = [...(org.modules_enabled || [])]

    if (enabled) {
      // Add module if not already present
      if (!newModules.includes(moduleCode)) {
        newModules.push(moduleCode)
      }
    } else {
      // Remove module
      newModules = newModules.filter(m => m !== moduleCode)

      // Ensure at least one module remains
      if (newModules.length === 0) {
        return { success: false, error: 'At least one module must be enabled' }
      }
    }

    // Update organization
    const { error: updateError } = await supabaseAdmin
      .from('organizations')
      .update({ modules_enabled: newModules })
      .eq('id', orgId)

    if (updateError) {
      console.error('Error updating modules:', updateError)
      return { success: false, error: updateError.message }
    }

    // TODO Epic 2-8: Query affected entities count
    // For now, return 0
    return { success: true, data: { modules: newModules }, affectedCount: 0 }
  } catch (error: any) {
    console.error('Unexpected error in toggleModule:', error)
    return { success: false, error: `Unknown error: ${error?.message}` }
  }
}

/**
 * Check if module is active for current org
 * AC-010.4: Module check for API middleware
 */
export async function checkModuleActive(moduleCode: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()
    const orgId = await getCurrentOrgId()

    if (!orgId) return false

    const { data } = await supabase.rpc('is_module_enabled', {
      p_org_id: orgId,
      p_module_code: moduleCode,
    })

    return data === true
  } catch (error) {
    return false
  }
}
