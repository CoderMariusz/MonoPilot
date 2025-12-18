import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/settings/stats
 * Aggregate settings statistics for dashboard
 * Story: 1.17 Settings Stats Cards
 * AC-1.17.3: Real-time data from database
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const orgId = userData.org_id

    // Fetch all stats in parallel
    const [
      usersResult,
      invitationsResult,
      warehousesResult,
      locationsResult,
      machinesResult,
      linesResult,
      allergensResult,
      taxCodesResult,
      modulesResult,
      orgResult
    ] = await Promise.all([
      // Users stats
      supabase
        .from('users')
        .select('id, is_active, last_activity_at', { count: 'exact' })
        .eq('org_id', orgId),
      // Pending invitations
      supabase
        .from('user_invitations')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId)
        .eq('status', 'pending'),
      // Warehouses
      supabase
        .from('warehouses')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId),
      // Locations
      supabase
        .from('locations')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId),
      // Machines
      supabase
        .from('machines')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId),
      // Production Lines
      supabase
        .from('production_lines')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId),
      // Allergens (global, no org filter)
      supabase
        .from('allergens')
        .select('id', { count: 'exact' }),
      // Tax Codes (global, no org filter)
      supabase
        .from('tax_codes')
        .select('id', { count: 'exact' }),
      // Active modules
      supabase
        .from('organization_modules')
        .select('id', { count: 'exact' })
        .eq('org_id', orgId)
        .eq('enabled', true),
      // Organization info (includes wizard progress)
      supabase
        .from('organizations')
        .select('name, updated_at, wizard_completed, wizard_progress')
        .eq('id', orgId)
        .single()
    ])

    // Calculate active users and last activity
    const users = usersResult.data || []
    const activeUsers = users.filter(u => u.is_active).length
    const lastActivity = users
      .filter(u => u.last_activity_at)
      .sort((a, b) => new Date(b.last_activity_at!).getTime() - new Date(a.last_activity_at!).getTime())[0]

    // Format last activity time
    const formatLastActivity = (date: string | null) => {
      if (!date) return 'Never'
      const diff = Date.now() - new Date(date).getTime()
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours < 1) return 'Just now'
      if (hours < 24) return `${hours}h ago`
      const days = Math.floor(hours / 24)
      return `${days}d ago`
    }

    // Wizard progress percentage
    const wizardProgressValue = orgResult.data?.wizard_completed
      ? 100
      : Math.round(((orgResult.data?.wizard_progress || 0) / 6) * 100)

    const stats = {
      users: {
        total: usersResult.count || 0,
        active: activeUsers,
        pending: invitationsResult.count || 0,
        lastActivity: formatLastActivity(lastActivity?.last_activity_at || null)
      },
      locations: {
        warehouses: warehousesResult.count || 0,
        locations: locationsResult.count || 0,
        machines: machinesResult.count || 0,
        lines: linesResult.count || 0
      },
      configuration: {
        allergens: allergensResult.count || 0,
        taxCodes: taxCodesResult.count || 0,
        productTypes: 4, // Fixed: RAW, WIP, FG, PACKAGING
        activeModules: `${modulesResult.count || 0}/8`
      },
      system: {
        wizardProgress: `${wizardProgressValue}%`,
        lastUpdated: formatLastActivity(orgResult.data?.updated_at || null),
        organizationName: orgResult.data?.name || 'N/A',
        subscription: 'Pro' // Placeholder
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Settings stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
