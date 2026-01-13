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
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        const invitationCountResult = await supabase
          .from('invitations')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        stats.users = {
          total: userCountResult.count || 0,
          pending_invitations: invitationCountResult.count || 0,
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

      // Get integrations stats
      if (allowedStats.includes('integrations')) {
        const apiKeys = await supabase
          .from('api_keys')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        const webhooks = await supabase
          .from('webhooks')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        stats.integrations = {
          api_keys: apiKeys.count || 0,
          webhooks: webhooks.count || 0,
        }
      }

      // Get system stats
      if (allowedStats.includes('system')) {
        const enabledModules = await supabase
          .from('module_access')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        const auditLogs = await supabase
          .from('audit_logs')
          .select('id', { count: 'exact' })
          .eq('org_id', org_id)

        stats.system = {
          enabled_modules: enabledModules.count || 0,
          audit_log_entries: auditLogs.count || 0,
        }
      }

      // Get security stats (last login from auth logs)
      if (allowedStats.includes('security')) {
        const lastLoginResult = await supabase
          .from('audit_logs')
          .select('created_at')
          .eq('org_id', org_id)

        // Get the most recent entry (filtering in code)
        const lastLoginDate = lastLoginResult?.data?.[0]?.created_at || null

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
