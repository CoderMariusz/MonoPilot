/**
 * GET /api/v1/settings/audit-logs
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Returns recent audit log entries for the organization.
 * Supports limit query parameter (default 5, max 100).
 *
 * NOTE: Returns empty array if audit_logs table doesn't exist yet.
 * The table will be created in a future migration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 100)

    // Get authenticated user
    const supabase = await createClient()
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

    // Fetch recent audit logs - gracefully handle missing table
    const { data: logs, error: logsError } = await supabase
      .from('audit_logs')
      .select('id, user_name, action, created_at')
      .eq('org_id', org_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // If table doesn't exist or other error, return empty array
    // This allows the feature to degrade gracefully
    if (logsError) {
      // Check if it's a "table doesn't exist" error
      if (logsError.code === '42P01' || logsError.message?.includes('does not exist')) {
        console.log('audit_logs table not yet created, returning empty array')
        const response = NextResponse.json({ logs: [] }, { status: 200 })
        response.headers.set('Cache-Control', 'max-age=60, private')
        return response
      }
      console.error('Error fetching audit logs:', logsError)
      // For other errors, still return empty array to not break the UI
      const response = NextResponse.json({ logs: [] }, { status: 200 })
      response.headers.set('Cache-Control', 'max-age=60, private')
      return response
    }

    const response = NextResponse.json({ logs: logs || [] }, { status: 200 })
    response.headers.set('Cache-Control', 'max-age=60, private') // 1 minute cache
    return response
  } catch (error) {
    console.error('Audit logs endpoint error:', error)
    // Return empty logs instead of 500 to not break the UI
    const response = NextResponse.json({ logs: [] }, { status: 200 })
    response.headers.set('Cache-Control', 'max-age=60, private')
    return response
  }
}
