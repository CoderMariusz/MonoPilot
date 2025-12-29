import { NextRequest, NextResponse } from 'next/server'
import { updateTaxCode, deleteTaxCode } from '@/lib/services/tax-code-service'
import { updateTaxCodeSchema } from '@/lib/validation/tax-code-schemas'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

/**
 * PUT /api/settings/tax-codes/[id]
 * Update an existing tax code
 * AC-009.5: Edit tax code
 *
 * Body: { code?, description?, rate? }
 *
 * Auth: Admin only
 *
 * Rate change warning:
 * - If rate is changed and tax code is used in PO lines
 * - Returns warning in response
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role using admin client to bypass RLS
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Tax Code ID API PUT] User not found:', { userId: user.id, userError })
      return NextResponse.json(
        {
          error: 'User role not found',
          details: userError?.message || 'No user record found in public.users',
          code: userError?.code
        },
        { status: 403 }
      )
    }

    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()
    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateTaxCodeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Update tax code
    const result = await updateTaxCode(id, validationResult.data)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        )
      }

      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error },
          { status: 409 } // Conflict
        )
      }

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Return updated tax code with optional warning
    const response: any = { tax_code: result.data }
    if (result.warning) {
      response.warning = result.warning
      response.usageCount = result.usageCount
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in PUT /api/settings/tax-codes/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/settings/tax-codes/[id]
 * Delete a tax code
 * AC-009.4: Cannot delete tax code if used in POs
 *
 * Auth: Admin only
 *
 * Error handling:
 * - If tax code is used in PO lines → 409 Conflict
 * - Recommendation: archive instead of delete
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role using admin client to bypass RLS
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Tax Code ID API DELETE] User not found:', { userId: user.id, userError })
      return NextResponse.json(
        {
          error: 'User role not found',
          details: userError?.message || 'No user record found in public.users',
          code: userError?.code
        },
        { status: 403 }
      )
    }

    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()
    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Delete tax code
    const result = await deleteTaxCode(id)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error },
          { status: 404 }
        )
      }

      if (result.code === 'IN_USE') {
        // AC-009.4: Tax code is used in PO lines
        return NextResponse.json(
          {
            error: result.error,
            usageCount: result.usageCount,
            recommendation: 'Archive this tax code instead of deleting it',
          },
          { status: 409 } // Conflict
        )
      }

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/settings/tax-codes/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
