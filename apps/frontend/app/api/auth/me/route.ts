/**
 * API Route: Current User Info
 * GET /api/auth/me - Returns current authenticated user info
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Try getUser() first (more reliable in server context)
    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !authUser) {
      console.warn('[Auth/Me] User not found:', userError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Auth/Me] Authenticated user:', authUser.id)

    // Join with roles table to get role code (users has role_id FK, not role string)
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, org_id, roles(code)')
      .eq('id', authUser.id)
      .single()

    if (dbError || !user) {
      console.error('[Auth/Me] Database error:', dbError?.message)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract role code from joined roles table (handle both array and single object)
    const roleData = user.roles as { code: string } | { code: string }[] | null
    const roleCode = (Array.isArray(roleData) ? roleData[0]?.code : roleData?.code) || 'viewer'

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
          role: roleCode,
          org_id: user.org_id,
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    )
  } catch (error) {
    console.error('[Auth/Me] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
