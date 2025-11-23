// API Route: Supplier Management
// Epic 3 Batch 3A - Story 3.17: Supplier Management
// GET /api/planning/suppliers - List suppliers
// POST /api/planning/suppliers - Create supplier

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { supplierSchema, type SupplierInput } from '@/lib/validation/planning-schemas'
import { ZodError } from 'zod'

// GET /api/planning/suppliers - List suppliers with filters
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')

    const supabaseAdmin = createServerSupabaseAdmin()

    let query = supabaseAdmin
      .from('suppliers')
      .select('*, tax_codes(code, description, rate)')
      .eq('org_id', currentUser.org_id)
      .order('code', { ascending: true })

    // Apply filters
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching suppliers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      suppliers: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/planning/suppliers - Create new supplier
export async function POST(request: NextRequest) {
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
    const validatedData: SupplierInput = supplierSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // Check if code already exists for this org
    const { data: existingSupplier } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('org_id', currentUser.org_id)
      .eq('code', validatedData.code)
      .maybeSingle()

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier code already exists in your organization' },
        { status: 409 }
      )
    }

    // Create supplier
    const { data: newSupplier, error: insertError } = await supabaseAdmin
      .from('suppliers')
      .insert({
        ...validatedData,
        org_id: currentUser.org_id,
        created_by: session.user.id,
        updated_by: session.user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating supplier:', insertError)

      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 409 }
        )
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        supplier: newSupplier,
        message: 'Supplier created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/suppliers:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
