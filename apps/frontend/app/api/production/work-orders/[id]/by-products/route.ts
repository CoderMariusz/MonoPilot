/**
 * By-Product Registration API
 * Story 4.14, 04.7c: By-Product Registration
 * POST /api/production/work-orders/:id/by-products
 * GET /api/production/work-orders/:id/by-products
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  registerByProduct as registerByProductLegacy,
  BYPRODUCT_ERROR_CODES,
  calculateExpectedByProductQty,
} from '@/lib/services/byproduct-service'

/**
 * GET - List by-products for a work order (AC-4.14.1, AC-04.7c)
 * Returns all by-products with calculated expected qty, LP counts, and status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id for RLS verification
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get WO and verify org access
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, planned_quantity, output_qty, org_id')
      .eq('id', woId)
      .single()

    if (woError || !wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Cross-tenant check - return 404 for different org (not 403)
    if (wo.org_id !== userRecord.org_id) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Get by-product materials
    const { data: materials } = await supabase
      .from('wo_materials')
      .select(`
        id,
        product_id,
        product_code,
        product_name,
        yield_percent,
        by_product_registered_qty,
        uom
      `)
      .eq('work_order_id', woId)
      .eq('is_by_product', true)
      .order('line_number')

    if (!materials || materials.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Build response with expected qty, LP counts, and status
    const results = []

    for (const material of materials) {
      // Count LPs for this by-product
      const { count: lpCount } = await supabase
        .from('production_outputs')
        .select('id', { count: 'exact', head: true })
        .eq('wo_id', woId)
        .eq('by_product_material_id', material.id)
        .eq('is_by_product', true)

      // Get last registration date
      const { data: lastOutput } = await supabase
        .from('production_outputs')
        .select('produced_at')
        .eq('wo_id', woId)
        .eq('by_product_material_id', material.id)
        .eq('is_by_product', true)
        .order('produced_at', { ascending: false })
        .limit(1)
        .single()

      // Calculate expected qty based on output_qty (current output)
      const expectedQty = calculateExpectedByProductQty(
        wo.output_qty || 0,
        material.yield_percent || 0
      )

      results.push({
        product_id: material.product_id,
        product_name: material.product_name,
        product_code: material.product_code,
        material_id: material.id,
        yield_percent: material.yield_percent || 0,
        expected_qty: expectedQty,
        actual_qty: material.by_product_registered_qty || 0,
        uom: material.uom || 'kg',
        lp_count: lpCount || 0,
        status: (material.by_product_registered_qty || 0) > 0 ? 'registered' : 'not_registered',
        last_registered_at: lastOutput?.produced_at || null,
      })
    }

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Get by-products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Register a by-product output (AC-4.14.3, AC-4.14.10, AC-04.7c)
 * Creates LP with is_by_product = true, copies genealogy from main output
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      by_product_id,
      qty,
      qa_status,
      location_id,
      notes,
      main_output_id,
      main_output_lp_id,
      confirm_zero_qty,
    } = body

    // Validate required fields
    if (!by_product_id) {
      return NextResponse.json(
        { error: 'by_product_id is required' },
        { status: 400 }
      )
    }

    // Validate quantity
    if (typeof qty !== 'number') {
      return NextResponse.json(
        { error: 'qty must be a number' },
        { status: 400 }
      )
    }

    if (qty < 0) {
      return NextResponse.json(
        { error: 'qty cannot be negative' },
        { status: 400 }
      )
    }

    // Zero qty warning - require confirmation
    if (qty === 0 && !confirm_zero_qty) {
      return NextResponse.json(
        { error: 'Zero quantity requires confirmation', warning: 'By-product quantity is 0. Confirm to proceed.' },
        { status: 409 }
      )
    }

    // Get WO and verify status/org access
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, status, wo_number, org_id, production_line_id')
      .eq('id', woId)
      .single()

    if (woError || !wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Cross-tenant check
    if (wo.org_id !== userRecord.org_id) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Verify WO is in progress
    if (wo.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Work order is not in progress' },
        { status: 400 }
      )
    }

    // Get by-product material and verify it's a by-product
    const { data: material, error: matError } = await supabase
      .from('wo_materials')
      .select('id, product_id, is_by_product, yield_percent, uom, product_code, product_name')
      .eq('id', by_product_id)
      .eq('work_order_id', woId)
      .single()

    if (matError || !material) {
      return NextResponse.json(
        { error: 'By-product material not found' },
        { status: 400 }
      )
    }

    if (!material.is_by_product) {
      return NextResponse.json(
        { error: 'Material is not a by-product' },
        { status: 400 }
      )
    }

    // Get product info for shelf life
    const { data: product } = await supabase
      .from('products')
      .select('id, shelf_life_days, default_location_id')
      .eq('id', material.product_id)
      .single()

    // Calculate expiry date
    let expiryDate: string | null = null
    if (product?.shelf_life_days) {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + product.shelf_life_days)
      expiryDate = expiry.toISOString().split('T')[0]
    }

    // Determine location
    let finalLocationId = location_id
    if (!finalLocationId && product?.default_location_id) {
      finalLocationId = product.default_location_id
    }
    if (!finalLocationId && wo.production_line_id) {
      const { data: line } = await supabase
        .from('production_lines')
        .select('default_output_location_id')
        .eq('id', wo.production_line_id)
        .single()
      finalLocationId = line?.default_output_location_id
    }

    // Generate batch number with BP prefix
    const batchNumber = `${wo.wo_number}-BP-${(material.product_code || '').replace(/[^a-zA-Z0-9]/g, '-')}`.slice(0, 50)
    const lpNumber = `BP-${wo.wo_number}-${Date.now().toString(36).toUpperCase()}`

    // Create License Plate with is_by_product = true
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .insert({
        org_id: wo.org_id,
        lp_number: lpNumber,
        product_id: material.product_id,
        quantity: qty,
        current_qty: qty,
        uom: material.uom || 'kg',
        batch_number: batchNumber,
        status: 'available',
        qa_status: qa_status || 'pending',
        location_id: finalLocationId,
        expiry_date: expiryDate,
        is_by_product: true,
        wo_id: woId,
        manufacturing_date: new Date().toISOString().split('T')[0],
        created_by: user.id,
      })
      .select()
      .single()

    if (lpError || !lp) {
      console.error('LP creation error:', lpError)
      return NextResponse.json(
        { error: `Failed to create LP: ${lpError?.message}` },
        { status: 500 }
      )
    }

    // Create production_outputs record
    const { data: outputRecord, error: outputError } = await supabase
      .from('production_outputs')
      .insert({
        wo_id: woId,
        organization_id: wo.org_id,
        product_id: material.product_id,
        lp_id: lp.id,
        quantity: qty,
        uom: material.uom || 'kg',
        qa_status: qa_status || 'pending',
        location_id: finalLocationId,
        is_by_product: true,
        by_product_material_id: by_product_id,
        parent_output_id: main_output_id,
        produced_by_user_id: user.id,
        produced_at: new Date().toISOString(),
        notes,
      })
      .select()
      .single()

    if (outputError || !outputRecord) {
      // Rollback LP creation
      await supabase.from('license_plates').delete().eq('id', lp.id)
      console.error('Output creation error:', outputError)
      return NextResponse.json(
        { error: `Failed to create output record: ${outputError?.message}` },
        { status: 500 }
      )
    }

    // Copy genealogy from main output LP if provided
    let genealogyCount = 0
    if (main_output_lp_id) {
      const { data: mainGenealogy } = await supabase
        .from('lp_genealogy')
        .select('parent_lp_id, quantity_from_parent, uom')
        .eq('child_lp_id', main_output_lp_id)

      if (mainGenealogy && mainGenealogy.length > 0) {
        for (const parentLink of mainGenealogy) {
          const { error: geneError } = await supabase
            .from('lp_genealogy')
            .insert({
              parent_lp_id: parentLink.parent_lp_id,
              child_lp_id: lp.id,
              relationship_type: 'by_product',
              work_order_id: woId,
              quantity_from_parent: qty / mainGenealogy.length,
              uom: material.uom || 'kg',
              created_by: user.id,
            })

          if (!geneError) {
            genealogyCount++
          }
        }
      }
    }

    // Update wo_materials.by_product_registered_qty
    const { data: currentMaterial } = await supabase
      .from('wo_materials')
      .select('by_product_registered_qty')
      .eq('id', by_product_id)
      .single()

    const newRegisteredQty = (currentMaterial?.by_product_registered_qty || 0) + qty
    await supabase
      .from('wo_materials')
      .update({ by_product_registered_qty: newRegisteredQty })
      .eq('id', by_product_id)

    return NextResponse.json({
      success: true,
      data: {
        output: {
          id: outputRecord.id,
          lpId: lp.id,
          lpNumber: lp.lp_number,
          quantity: qty,
        },
        genealogyRecords: genealogyCount,
        warnings: qty === 0 ? ['By-product registered with zero quantity'] : [],
      },
    })
  } catch (error: unknown) {
    console.error('Register by-product error:', error)

    // Handle known error codes
    const err = error as { code?: string; message?: string }
    if (err.code === BYPRODUCT_ERROR_CODES.WO_NOT_IN_PROGRESS) {
      return NextResponse.json(
        { error: err.message || 'Work order is not in progress' },
        { status: 400 }
      )
    }

    if (err.code === BYPRODUCT_ERROR_CODES.BYPRODUCT_NOT_FOUND) {
      return NextResponse.json(
        { error: err.message || 'Material is not a by-product' },
        { status: 400 }
      )
    }

    if (err.code === BYPRODUCT_ERROR_CODES.INVALID_QTY) {
      return NextResponse.json(
        { error: err.message || 'Invalid quantity' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
