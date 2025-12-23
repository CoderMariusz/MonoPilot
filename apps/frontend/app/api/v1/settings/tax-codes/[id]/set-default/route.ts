/**
 * API Route: /api/v1/settings/tax-codes/[id]/set-default
 * Story: 01.13 - Tax Codes CRUD
 * Methods: PATCH (set as default)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * PATCH /api/v1/settings/tax-codes/[id]/set-default
 * Set tax code as default for organization
 *
 * Atomicity:
 * - Database trigger handles unsetting previous default
 * - Only one default tax code per org at any time
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const orgId = userData.org_id
    const roleCode = (userData.role as any)?.code

    // Check permissions (ADMIN or SUPER_ADMIN only)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(roleCode)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if tax code exists
    const { data: existingTaxCode, error: fetchError } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingTaxCode) {
      return NextResponse.json({ error: 'Tax code not found' }, { status: 404 })
    }

    // Set as default (trigger will handle atomicity)
    const { data: taxCode, error: updateError } = await supabase
      .from('tax_codes')
      .update({
        is_default: true,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to set default tax code:', updateError)
      return NextResponse.json({ error: 'Failed to set default tax code' }, { status: 500 })
    }

    return NextResponse.json(taxCode)
  } catch (error) {
    console.error('Error in PATCH /api/v1/settings/tax-codes/[id]/set-default:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
