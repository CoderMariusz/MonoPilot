/**
 * API Route: Register By-Product from Scanner
 * Story 04.7b: Output Registration Scanner
 *
 * POST /api/production/output/register-by-product - Create by-product LP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'
import { byProductSchema } from '@/lib/validation/scanner-output'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get org context
    const orgContext = await getOrgContext()
    if (!orgContext?.org_id) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = byProductSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const input = validation.data

    // Get WO and verify it belongs to org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id, uom, status')
      .eq('id', input.wo_id)
      .single()

    if (woError || !wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (wo.org_id !== orgContext.org_id) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (wo.status !== 'in_progress' && wo.status !== 'paused') {
      return NextResponse.json(
        { error: 'Work order is not in progress' },
        { status: 400 }
      )
    }

    // Get product info for by-product
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select('id, name, uom')
      .eq('id', input.by_product_id)
      .single()

    if (prodError || !product) {
      return NextResponse.json({ error: 'By-product not found' }, { status: 404 })
    }

    // Generate LP number for by-product
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const { count: lpCount } = await supabase
      .from('license_plates')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString().slice(0, 10))

    const seq = String((lpCount || 0) + 1).padStart(4, '0')
    const lpNumber = `LP-${dateStr}-${seq}`

    // Create by-product LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .insert({
        org_id: orgContext.org_id,
        lp_number: lpNumber,
        product_id: input.by_product_id,
        quantity: input.quantity,
        current_qty: input.quantity,
        uom: product.uom,
        status: 'available',
        qa_status: input.qa_status,
        batch_number: input.batch_number,
        expiry_date: input.expiry_date,
        location_id: input.location_id,
        source: 'production',
        wo_id: wo.id,
        is_by_product: true,
        manufacturing_date: today.toISOString().split('T')[0],
        created_by: user.id,
      })
      .select()
      .single()

    if (lpError || !lp) {
      return NextResponse.json(
        { error: `Failed to create by-product LP: ${lpError?.message}` },
        { status: 500 }
      )
    }

    // Create genealogy linking by-product to main output
    await supabase.from('lp_genealogy').insert({
      parent_lp_id: input.main_output_lp_id,
      child_lp_id: lp.id,
      relationship_type: 'by_product',
      work_order_id: wo.id,
      created_by: user.id,
    })

    return NextResponse.json({
      lp: {
        id: lp.id,
        lp_number: lp.lp_number,
        qty: input.quantity,
        uom: product.uom,
        batch_number: input.batch_number,
        qa_status: input.qa_status,
      },
      genealogy: {
        main_lp_id: input.main_output_lp_id,
        child_lp_id: lp.id,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/production/output/register-by-product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
