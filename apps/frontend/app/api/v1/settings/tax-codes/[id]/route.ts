/**
 * API Route: /api/v1/settings/tax-codes/[id]
 * Story: 01.13 - Tax Codes CRUD
 * Methods: GET (single), PUT (update), DELETE (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { taxCodeUpdateSchema } from '@/lib/validation/tax-code-schemas'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/tax-codes/[id]
 * Get single tax code by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Fetch tax code
    const { data: taxCode, error } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('id', (await params).id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (error || !taxCode) {
      return NextResponse.json({ error: 'Tax code not found' }, { status: 404 })
    }

    return NextResponse.json(taxCode)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/tax-codes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/settings/tax-codes/[id]
 * Update existing tax code
 *
 * Request Body: Partial<CreateTaxCodeInput>
 * - code immutable if referenced
 * - all fields optional
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check permissions - use lowercase role codes as stored in DB
    if (!['owner', 'admin'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if tax code exists
    const { data: existingTaxCode, error: fetchError } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('id', (await params).id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingTaxCode) {
      return NextResponse.json({ error: 'Tax code not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()

    let validatedData
    try {
      validatedData = taxCodeUpdateSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Check if code or country_code is being changed
    if (
      (validatedData.code && validatedData.code.toUpperCase() !== existingTaxCode.code) ||
      (validatedData.country_code && validatedData.country_code.toUpperCase() !== existingTaxCode.country_code)
    ) {
      // Check if tax code is referenced
      const { data: refCount, error: refError } = await supabase.rpc('get_tax_code_reference_count', {
        tax_code_id: (await params).id,
      })

      if (refError) {
        console.error('Failed to check tax code references:', refError)
        // Continue anyway - immutability check is advisory
      }

      if (refCount && refCount > 0) {
        return NextResponse.json(
          { error: 'Cannot change code for referenced tax code' },
          { status: 400 }
        )
      }
    }

    // Build update payload
    const updatePayload: any = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    if (validatedData.code !== undefined) {
      updatePayload.code = validatedData.code.toUpperCase()
    }
    if (validatedData.name !== undefined) {
      updatePayload.name = validatedData.name
    }
    if (validatedData.rate !== undefined) {
      updatePayload.rate = validatedData.rate
    }
    if (validatedData.country_code !== undefined) {
      updatePayload.country_code = validatedData.country_code.toUpperCase()
    }
    if (validatedData.valid_from !== undefined) {
      updatePayload.valid_from = validatedData.valid_from
    }
    if (validatedData.valid_to !== undefined) {
      updatePayload.valid_to = validatedData.valid_to
    }
    if (validatedData.is_default !== undefined) {
      updatePayload.is_default = validatedData.is_default
    }

    // Update tax code
    const { data: taxCode, error: updateError } = await supabase
      .from('tax_codes')
      .update(updatePayload)
      .eq('id', (await params).id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update tax code:', updateError)
      return NextResponse.json({ error: 'Failed to update tax code' }, { status: 500 })
    }

    return NextResponse.json(taxCode)
  } catch (error) {
    console.error('Error in PUT /api/v1/settings/tax-codes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/settings/tax-codes/[id]
 * Soft delete tax code
 *
 * Checks:
 * - Tax code not referenced by other entities
 * - Soft delete (is_deleted=true)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check permissions - use lowercase role codes as stored in DB
    if (!['owner', 'admin'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if tax code exists
    const { data: existingTaxCode, error: fetchError } = await supabase
      .from('tax_codes')
      .select('*')
      .eq('id', (await params).id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingTaxCode) {
      return NextResponse.json({ error: 'Tax code not found' }, { status: 404 })
    }

    // Check for references
    const { data: refCount, error: refError } = await supabase.rpc('get_tax_code_reference_count', {
      tax_code_id: (await params).id,
    })

    if (refError) {
      console.error('Failed to check tax code references:', refError)
      return NextResponse.json({ error: 'Failed to check references' }, { status: 500 })
    }

    if (refCount && refCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete tax code referenced by ${refCount} suppliers` },
        { status: 400 }
      )
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('tax_codes')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', (await params).id)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Failed to delete tax code:', deleteError)
      return NextResponse.json({ error: 'Failed to delete tax code' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/v1/settings/tax-codes/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
