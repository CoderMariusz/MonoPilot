/**
 * GET /api/v1/settings/dashboard/stats
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Returns dashboard statistics for the settings module.
 * Filters stats based on user role and permissions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Role-based stat visibility mapping
const ROLE_STAT_MAP: Record<string, string[]> = {
  admin: ['users', 'infrastructure', 'master_data', 'integrations', 'system', 'security'],
  super_admin: ['users', 'infrastructure', 'master_data', 'integrations', 'system', 'security'],
  warehouse_manager: ['infrastructure'],
  production_manager: ['infrastructure', 'master_data'],
  quality_manager: ['master_data'],
  viewer: [],
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org context (role)
    const { data: context, error: contextError } = await supabase
      .from('user_org_context')
      .select('org_id, role_code')
      .eq('user_id', user.id)
      .single()

    if (contextError || !context) {
      return NextResponse.json(
        { error: 'Could not retrieve organization context' },
        { status: 400 }
      )
    }

    const { org_id, role_code } = context
    const allowedStats = ROLE_STAT_MAP[role_code as string] || []

    // Build response object with filtered stats
    const stats: Record<string, any> = {}

    try {
      // Get user stats
      if (allowedStats.includes('users')) {
        const userCountResult = await supabase
          .from('users')
          .select('id, is_active', { count: 'exact' })
          .eq('org_id', org_id)

        // Count active users
        const activeUsersCount = (userCountResult.data || []).filter(u => u.is_active).length

        // Get invitation count - gracefully handle if table doesn't exist
        let invitationCount = 0
        try {
          const invitationCountResult = await supabase
            .from('user_invitations')
            .select('id', { count: 'exact' })
            .eq('org_id', org_id)
            .eq('status', 'pending')
          invitationCount = invitationCountResult.count || 0
        } catch {
          // Table doesn't exist yet
        }

        stats.users = {
          total: userCountResult.count || 0,
          active_users: activeUsersCount,
          pending_invitations: invitationCount,
        }
      }

      // Get infrastructure stats
      if (allowedStats.includes('infrastructure')) {
        const warehouses = await supabase
          .from('warehouses')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        const machines = await supabase
          .from('machines')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        const productionLines = await supabase
          .from('production_lines')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        stats.infrastructure = {
          warehouses: warehouses.count || 0,
          machines: machines.count || 0,
          production_lines: productionLines.count || 0,
        }
      }

      // Get master data stats
      if (allowedStats.includes('master_data')) {
        const allergens = await supabase
          .from('allergens')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        const taxCodes = await supabase
          .from('tax_codes')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        stats.master_data = {
          allergens: allergens.count || 0,
          tax_codes: taxCodes.count || 0,
        }
      }

      // Get integrations stats - tables may not exist yet
      if (allowedStats.includes('integrations')) {
        let apiKeysCount = 0
        let webhooksCount = 0

        try {
          const apiKeys = await supabase
            .from('api_keys')
            .select('id', { count: 'exact' })
            .eq('org_id', org_id)
          apiKeysCount = apiKeys.count || 0
        } catch {
          // Table doesn't exist yet
        }

        try {
          const webhooks = await supabase
            .from('webhooks')
            .select('id', { count: 'exact' })
            .eq('org_id', org_id)
          webhooksCount = webhooks.count || 0
        } catch {
          // Table doesn't exist yet
        }

        stats.integrations = {
          api_keys: apiKeysCount,
          webhooks: webhooksCount,
        }
      }

      // Get system stats - tables may not exist yet
      if (allowedStats.includes('system')) {
        let enabledModulesCount = 0
        let auditLogsCount = 0

        try {
          const enabledModules = await supabase
            .from('module_access')
            .select('id', { count: 'exact' })
            .eq('org_id', org_id)
          enabledModulesCount = enabledModules.count || 0
        } catch {
          // Table doesn't exist yet
        }

        try {
          const auditLogs = await supabase
            .from('audit_logs')
            .select('id', { count: 'exact' })
            .eq('org_id', org_id)
          auditLogsCount = auditLogs.count || 0
        } catch {
          // Table doesn't exist yet
        }

        stats.system = {
          enabled_modules: enabledModulesCount,
          audit_log_entries: auditLogsCount,
        }
      }

      // Get security stats (last login from auth logs) - table may not exist
      if (allowedStats.includes('security')) {
        let lastLoginDate = null

        try {
          const lastLoginResult = await supabase
            .from('audit_logs')
            .select('created_at')
            .eq('org_id', org_id)
            .order('created_at', { ascending: false })
            .limit(1)

          lastLoginDate = lastLoginResult?.data?.[0]?.created_at || null
        } catch {
          // Table doesn't exist yet
        }

        stats.security = {
          last_login: lastLoginDate,
          session_status: 'active',
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Set cache headers (5 minutes)
    const response = NextResponse.json(stats, { status: 200 })
    response.headers.set('Cache-Control', 'max-age=300, private')
    return response
  } catch (error) {
    console.error('Dashboard stats endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
