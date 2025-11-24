// API Route: Supplier-Product Assignments
// Epic 3 Batch 3A - Story 3.17: Supplier Management
// GET /api/planning/suppliers/:id/products - Get supplier's assigned products
// PUT /api/planning/suppliers/:id/products - Update supplier-product assignments

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { supplierProductSchema, type SupplierProductInput } from '@/lib/validation/planning-schemas'
import { ZodError, z } from 'zod'

// GET /api/planning/suppliers/:id/products - Get assigned products
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

    // Fetch supplier-product assignments
    const { data, error } = await supabaseAdmin
      .from('supplier_products')
      .select(`
        *,
        products(id, code, name, uom)
      `)
      .eq('supplier_id', id)
      .eq('org_id', currentUser.org_id)
      .order('is_default', { ascending: false })

    if (error) {
      console.error('Error fetching supplier products:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      assignments: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/:id/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/planning/suppliers/:id/products - Update assignments
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
        { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const assignmentsSchema = z.object({
      assignments: z.array(supplierProductSchema),
    })
    const { assignments } = assignmentsSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if supplier exists
    const { data: supplier } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Transaction: Delete existing assignments, insert new ones
    // Step 1: Delete existing assignments
    const { error: deleteError } = await supabaseAdmin
      .from('supplier_products')
      .delete()
      .eq('supplier_id', id)
      .eq('org_id', currentUser.org_id)

    if (deleteError) {
      console.error('Error deleting existing assignments:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Step 2: Insert new assignments (if any)
    if (assignments.length > 0) {
      const assignmentsData = assignments.map(assignment => ({
        ...assignment,
        supplier_id: id,
        org_id: currentUser.org_id,
      }))

      const { data, error: insertError } = await supabaseAdmin
        .from('supplier_products')
        .insert(assignmentsData)
        .select()

      if (insertError) {
        console.error('Error inserting assignments:', insertError)

        // Handle unique constraint violation (duplicate default)
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: 'Only one default supplier allowed per product' },
            { status: 409 }
          )
        }

        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      return NextResponse.json({
        assignments: data,
        message: 'Supplier-product assignments updated successfully',
      })
    }

    return NextResponse.json({
      assignments: [],
      message: 'All assignments removed',
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/suppliers/:id/products:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
