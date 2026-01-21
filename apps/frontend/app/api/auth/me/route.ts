/**
 * API Route: Current User Info
 * GET /api/auth/me - Returns current authenticated user info
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Join with roles table to get role code (users has role_id FK, not role string)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, org_id, roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract role code from joined roles table (handle both array and single object)
    const roleData = user.roles as { code: string } | { code: string }[] | null
    const roleCode = (Array.isArray(roleData) ? roleData[0]?.code : roleData?.code) || 'viewer'

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
        role: roleCode,
        org_id: user.org_id,
      }
    })
  } catch (error) {
    console.error('Error in GET /api/auth/me:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
