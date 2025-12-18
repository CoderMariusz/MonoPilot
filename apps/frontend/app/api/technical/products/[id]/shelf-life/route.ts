/**
 * API Route: /api/technical/products/[id]/shelf-life
 * Issue: P1-1 - Shelf life calculation
 * PRD Section 5.8: Default = min(ingredient shelf lives)
 *
 * GET - Calculate/retrieve shelf life for product
 * POST - Override shelf life manually
 * DELETE - Clear override (return to auto-calculation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  calculateProductShelfLife,
  overrideProductShelfLife,
  clearShelfLifeOverride
} from '@/lib/services/shelf-life-service'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/technical/products/[id]/shelf-life - Calculate shelf life
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Optional bomId query parameter
    const bomId = req.nextUrl.searchParams.get('bomId') || undefined

    const result = await calculateProductShelfLife(id, bomId)

    return NextResponse.json({
      ...result,
      product: {
        id: product.id,
        code: product.code,
        name: product.name
      }
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/technical/products/[id]/shelf-life:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/technical/products/[id]/shelf-life - Override shelf life
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await req.json()

    if (!body.overrideDays || typeof body.overrideDays !== 'number' || body.overrideDays <= 0) {
      return NextResponse.json(
        { error: 'overrideDays must be a positive number' },
        { status: 400 }
      )
    }

    await overrideProductShelfLife(
      id,
      body.overrideDays,
      body.storageConditions
    )

    // Return updated calculation
    const result = await calculateProductShelfLife(id)

    return NextResponse.json(result)

  } catch (error) {
    console.error('Unexpected error in POST /api/technical/products/[id]/shelf-life:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/technical/products/[id]/shelf-life - Clear override
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    await clearShelfLifeOverride(id)

    // Return updated calculation
    const result = await calculateProductShelfLife(id)

    return NextResponse.json({
      success: true,
      message: 'Override cleared, using auto-calculated shelf life',
      ...result
    })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/technical/products/[id]/shelf-life:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
