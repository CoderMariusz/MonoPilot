// API Route: Individual Supplier Operations
// Epic 3 Batch 3A - Story 3.17: Supplier Management
// GET /api/planning/suppliers/:id - Get supplier by ID
// PUT /api/planning/suppliers/:id - Update supplier
// DELETE /api/planning/suppliers/:id - Delete supplier

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { updateSupplierSchema, type UpdateSupplierInput } from '@/lib/validation/planning-schemas'
import { ZodError } from 'zod'

// GET /api/planning/suppliers/:id - Get supplier details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch supplier with RLS (org_id check)
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('*, tax_codes(code, description, rate)')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json({ supplier: data })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/planning/suppliers/:id - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Purchasing, Manager, Admin
    if (!['purchasing', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Purchasing role or higher required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: UpdateSupplierInput = updateSupplierSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if supplier exists and belongs to user's org
    const { data: existingSupplier } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Update supplier
    const { data, error: updateError } = await supabaseAdmin
      .from('suppliers')
      .update({
        ...validatedData,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating supplier:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      supplier: data,
      message: 'Supplier updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/suppliers/:id:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/planning/suppliers/:id - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Manager, Admin only
    if (!['manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required' },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if supplier has active purchase orders
    // Note: This will fail with FK constraint if purchase_orders table doesn't exist yet
    // We'll handle this error gracefully

    // Try to delete supplier
    const { error: deleteError } = await supabaseAdmin
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('org_id', currentUser.org_id)

    if (deleteError) {
      console.error('Error deleting supplier:', deleteError)

      // Handle foreign key constraint (has active POs)
      if (deleteError.code === '23503') {
        return NextResponse.json(
          { error: 'Cannot delete supplier with active purchase orders' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/planning/suppliers/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
