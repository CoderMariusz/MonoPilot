/**
 * Password Policy API Route (Story 01.15)
 *
 * GET /api/v1/settings/password/policy - Get organization's password policy
 *
 * Authentication: Required
 * Coverage Target: 100%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPasswordPolicy } from '@/lib/services/password-service'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/password/policy
 *
 * Get password policy configuration for the user's organization
 *
 * Returns:
 * {
 *   min_length: number
 *   require_uppercase: boolean
 *   require_lowercase: boolean
 *   require_number: boolean
 *   require_special: boolean
 *   password_expiry_days: number | null
 *   enforce_password_history: boolean
 *   session_timeout_hours: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: user } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get password policy
    const policy = await getPasswordPolicy(supabase, user.org_id)

    return NextResponse.json({ policy }, { status: 200 })
  } catch (error) {
    console.error('[API] Error in GET /api/v1/settings/password/policy:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
