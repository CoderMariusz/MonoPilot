/**
 * PATCH /api/v1/settings/modules/:id/toggle
 * Enable/disable module with dependency validation
 * Story: 01.7 - Module Toggles
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ModuleSettingsService } from '@/lib/services/module-settings-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ISSUE 4 FIX: Proper role lookup with correct nested join access
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role_id, roles!inner(id, code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permission (Admin or Owner only)
    const roleCode = userData.roles?.code
    if (!roleCode || !['admin', 'owner'].includes(roleCode)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin or Owner role required.' },
        { status: 403 }
      )
    }

    // Parse request
    const body = await request.json()
    const { enabled, cascade } = body

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request: enabled must be a boolean' },
        { status: 400 }
      )
    }

    // Get all modules first
    const allModules = await ModuleSettingsService.getModules(supabase, userData.org_id)

    // Find the module being toggled
    const targetModule = allModules.find(m => m.id === params.id)
    if (!targetModule) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // ISSUE 2 FIX: Validate dependencies before toggle (if not cascading)
    if (!cascade) {
      // Build current states map
      const currentStates: Record<string, boolean> = {}
      allModules.forEach(m => {
        currentStates[m.code] = m.enabled
      })

      // Validate dependencies
      const validation = await ModuleSettingsService.validateDependencies(
        supabase,
        userData.org_id,
        targetModule.code,
        enabled,
        currentStates
      )

      if (!validation.valid) {
        return NextResponse.json({
          error: validation.warning,
          missing_dependencies: validation.missing_dependencies,
          active_dependents: validation.active_dependents
        }, { status: 400 })
      }
    }

    // If cascade is requested, use cascade enable/disable
    if (cascade) {
      if (enabled) {
        // Cascade enable
        const affectedModules = await ModuleSettingsService.cascadeEnable(
          supabase,
          userData.org_id,
          targetModule.code,
          allModules
        )

        return NextResponse.json(
          { success: true, affected_modules: affectedModules },
          { status: 200 }
        )
      } else {
        // Cascade disable - need current states
        const currentStates: Record<string, boolean> = {}
        allModules.forEach(m => {
          currentStates[m.code] = m.enabled
        })

        const affectedModules = await ModuleSettingsService.cascadeDisable(
          supabase,
          userData.org_id,
          targetModule.code,
          allModules,
          currentStates
        )

        return NextResponse.json(
          { success: true, affected_modules: affectedModules },
          { status: 200 }
        )
      }
    }

    // Regular toggle (no cascade)
    const result = await ModuleSettingsService.toggleModule(
      supabase,
      userData.org_id,
      params.id,
      enabled
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error: any) {
    console.error('Error toggling module:', error)

    // Handle specific errors
    if (error.message.includes('Missing dependencies') || error.message.includes('Active dependents')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.message.includes('cannot be disabled')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error.message.includes('Invalid organization ID') || error.message.includes('Invalid module ID')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: error.message || 'Failed to toggle module' },
      { status: 500 }
    )
  }
}
