/**
 * API Route: LP Barcode Lookup for Scanner
 * Story 04.6b: Material Consumption Scanner
 *
 * GET /api/warehouse/license-plates/barcode/:barcode - Lookup LP by barcode
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  LP_NOT_FOUND: 'LP_NOT_FOUND',
  LP_NOT_AVAILABLE: 'LP_NOT_AVAILABLE',
  PRODUCT_MISMATCH: 'PRODUCT_MISMATCH',
  UOM_MISMATCH: 'UOM_MISMATCH',
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params
    const url = new URL(request.url)
    const materialId = url.searchParams.get('material_id')

    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Get org context for multi-tenant filtering
    const orgContext = await getOrgContext()
    if (!orgContext?.org_id) {
      return NextResponse.json(
        { error: 'Organization context not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Query license plate by lp_number (barcode), filtering by org_id
    const { data: licensePlate, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        batch_number,
        expiry_date,
        status,
        location_id,
        products (
          id,
          name,
          sku
        ),
        locations (
          name,
          code
        )
      `)
      .eq('lp_number', barcode)
      .eq('org_id', orgContext.org_id)
      .single()

    if (lpError || !licensePlate) {
      return NextResponse.json(
        {
          error: ERROR_CODES.LP_NOT_FOUND,
          message: `License plate with barcode ${barcode} not found`,
        },
        { status: 404 }
      )
    }

    // Build validation object
    const isAvailable = licensePlate.status === 'available'
    let productMatch = true
    let uomMatch = true
    let errorCode: string | null = null
    let errorMessage: string | null = null

    // If material_id provided, validate product and UOM match
    let materialProduct: { name: string } | null = null
    if (materialId) {
      const { data: material } = await supabase
        .from('wo_bom_items')
        .select(`
          id,
          product_id,
          uom,
          products (
            name
          )
        `)
        .eq('id', materialId)
        .single()

      if (material) {
        materialProduct = material.products as unknown as { name: string } | null
        productMatch = licensePlate.product_id === material.product_id
        uomMatch = licensePlate.uom === material.uom

        if (!productMatch) {
          errorCode = ERROR_CODES.PRODUCT_MISMATCH
          const lpProduct = licensePlate.products as unknown as { name: string } | null
          errorMessage = `Product mismatch: LP contains ${lpProduct?.name || 'Unknown'}, material requires ${materialProduct?.name || 'Unknown'}`
        } else if (!uomMatch) {
          errorCode = ERROR_CODES.UOM_MISMATCH
          errorMessage = `UOM mismatch: LP has ${licensePlate.uom}, material requires ${material.uom}`
        }
      }
    }

    // Check availability status
    if (!isAvailable && !errorCode) {
      errorCode = ERROR_CODES.LP_NOT_AVAILABLE
      errorMessage = `License plate is not available (status: ${licensePlate.status})`
    }

    // Transform response
    const products = licensePlate.products as unknown as { id: string; name: string; sku: string } | null
    const locations = licensePlate.locations as unknown as { name: string; code: string } | null

    const lpResponse = {
      id: licensePlate.id,
      lp_number: licensePlate.lp_number,
      product_id: licensePlate.product_id,
      product_name: products?.name || '',
      quantity: Number(licensePlate.quantity) || 0,
      uom: licensePlate.uom || '',
      batch_number: licensePlate.batch_number || '',
      expiry_date: licensePlate.expiry_date || null,
      location_name: locations?.name || '',
      status: licensePlate.status,
    }

    const validationResponse = {
      is_available: isAvailable,
      product_match: productMatch,
      uom_match: uomMatch,
      error_code: errorCode,
      error_message: errorMessage,
    }

    return NextResponse.json({
      lp: lpResponse,
      validation: validationResponse,
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/barcode/:barcode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
