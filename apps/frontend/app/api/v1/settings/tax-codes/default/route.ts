/**
 * API Route: /api/v1/settings/tax-codes/default
 * Story: 01.13 - Tax Codes CRUD
 * Methods: GET (get default)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/tax-codes/default
 * Get default tax code for organization
 *
 * Response: TaxCode | null
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const orgId = userData.org_id

    // Fetch default tax code
    const { data: taxCode, error } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_default', true)
      .eq('is_deleted', false)
      .single()

    if (error || !taxCode) {
      return NextResponse.json({ error: 'No default tax code configured' }, { status: 404 })
    }

    return NextResponse.json(taxCode)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/tax-codes/default:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
