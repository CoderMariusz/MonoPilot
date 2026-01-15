/**
 * License Plates API Routes
 * Story 05.1: LP Table + CRUD
 * Story 05.5: LP Search & Filters (Enhanced)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LicensePlateService, type LicensePlateListParams } from '@/lib/services/license-plate-service'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams

    // Build params object
    const params: LicensePlateListParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
    }

    // Search params
    const search = searchParams.get('search')
    if (search) params.search = search

    const batch_number = searchParams.get('batch_number')
    if (batch_number) params.batch_number = batch_number

    // Single value filters
    const warehouse_id = searchParams.get('warehouse_id')
    if (warehouse_id) params.warehouse_id = warehouse_id

    const location_id = searchParams.get('location_id')
    if (location_id) params.location_id = location_id

    const product_id = searchParams.get('product_id')
    if (product_id) params.product_id = product_id

    const status = searchParams.get('status')
    if (status) params.status = status as any

    const qa_status = searchParams.get('qa_status')
    if (qa_status) params.qa_status = qa_status as any

    // Multiple value filters (comma-separated)
    const location_ids = searchParams.get('location_ids')
    if (location_ids) params.location_ids = location_ids.split(',')

    const product_ids = searchParams.get('product_ids')
    if (product_ids) params.product_ids = product_ids.split(',')

    const statuses = searchParams.get('statuses')
    if (statuses) params.statuses = statuses.split(',') as any

    const qa_statuses = searchParams.get('qa_statuses')
    if (qa_statuses) params.qa_statuses = qa_statuses.split(',') as any

    // Date range filters
    const expiry_before = searchParams.get('expiry_before')
    if (expiry_before) params.expiry_before = expiry_before

    const expiry_after = searchParams.get('expiry_after')
    if (expiry_after) params.expiry_after = expiry_after

    const created_before = searchParams.get('created_before')
    if (created_before) params.created_before = created_before

    const created_after = searchParams.get('created_after')
    if (created_after) params.created_after = created_after

    // Sort params
    const sort = searchParams.get('sort')
    if (sort) params.sort = sort as any

    const order = searchParams.get('order')
    if (order) params.order = order as any

    // Execute query via service
    const result = await LicensePlateService.list(supabase, params)

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    })
  } catch (error) {
    console.error('License plates GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch license plates',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Basic validation
    if (!body.product_id || !body.quantity || !body.warehouse_id || !body.location_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: product_id, quantity, warehouse_id, location_id',
        },
        { status: 400 }
      )
    }

    // Create LP via service
    const newLP = await LicensePlateService.create(supabase, {
      lp_number: body.lp_number,
      product_id: body.product_id,
      quantity: body.quantity,
      uom: body.uom || 'kg',
      location_id: body.location_id,
      warehouse_id: body.warehouse_id,
      batch_number: body.batch_number,
      supplier_batch_number: body.supplier_batch_number,
      expiry_date: body.expiry_date,
      manufacture_date: body.manufacture_date,
      source: body.source || 'manual',
      po_number: body.po_number,
      grn_id: body.grn_id,
      catch_weight_kg: body.catch_weight_kg,
    })

    return NextResponse.json({
      success: true,
      data: newLP,
    })
  } catch (error) {
    console.error('License plate POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create license plate',
      },
      { status: 500 }
    )
  }
}
