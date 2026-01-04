/**
 * GET /api/v1/settings/audit-logs
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Returns recent audit log entries for the organization.
 * Supports limit query parameter (default 5, max 100).
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 100)

    // Get authenticated user
    const supabase = await createServerClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org context
    const { data: context, error: contextError } = await supabase
      .from('user_org_context')
      .select('org_id')
      .eq('user_id', user.id)
      .single()

    if (contextError || !context) {
      return NextResponse.json(
        { error: 'Could not retrieve organization context' },
        { status: 400 }
      )
    }

    const { org_id } = context

    // Fetch recent audit logs
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('id, user_name, action, created_at')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (logsError) {
      console.error('Error fetching audit logs:', logsError)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    const response = NextResponse.json({ logs: logs || [] }, { status: 200 })
    response.headers.set('Cache-Control', 'max-age=60, private') // 1 minute cache
    return response
  } catch (error) {
    console.error('Audit logs endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
