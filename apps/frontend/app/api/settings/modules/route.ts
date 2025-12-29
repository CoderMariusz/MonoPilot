import { NextRequest, NextResponse } from 'next/server'
import { getEnabledModules, toggleModule } from '@/lib/services/module-service'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/settings/modules
 * Get enabled modules for organization
 * AC-010.1: Retrieve modules configuration
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getEnabledModules()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/settings/modules/toggle
 * Toggle a module on/off
 * AC-010.5: Enable/disable module
 *
 * Body: { module: string, enabled: boolean }
 * Auth: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role using admin client to bypass RLS
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Modules API] Error fetching user role:', {
        userId: user.id,
        userError,
        hasData: !!userData
      })
      return NextResponse.json(
        {
          error: 'User role not found',
          details: userError?.message || 'No user record found in public.users',
          code: userError?.code
        },
        { status: 403 }
      )
    }

    // Role can be a string (denormalized), an object, or an array of objects (from relationship)
    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()

    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { module, enabled } = body

    if (!module || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request - module and enabled required' },
        { status: 400 }
      )
    }

    const result = await toggleModule(module, enabled)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      modules: result.data.modules,
      affectedCount: result.affectedCount,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
