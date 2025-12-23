/**
 * Roles API Route
 * Story: 01.6 - System Roles (dependency for 01.5a)
 *
 * GET /api/v1/settings/roles - List all system roles
 */



import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/roles
 * List all system roles for dropdown
 *
 * Response: Array of roles [{id, code, name, description}]
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase()

    // Verify authentication
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all system roles
    const { data: roles, error } = await supabase
      .from('roles')
      .select('id, code, name, description, display_order')
      .eq('is_system', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching roles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(roles || [], { status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in GET /api/v1/settings/roles:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
