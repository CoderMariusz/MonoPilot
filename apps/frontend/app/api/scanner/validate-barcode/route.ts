// API Route: Validate Barcode
// Epic 5 Story 5.24: Barcode Validation
// POST /api/scanner/validate-barcode

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

type BarcodeType = 'lp' | 'location' | 'product' | 'pallet' | 'po' | 'wo' | 'asn'

interface BarcodeValidationResult {
  success: boolean
  message: string
  sound: 'success' | 'error' | 'warning'
  vibrate: boolean
  data?: {
    type: BarcodeType
    entity_id: string
    entity_data: any
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized',
          sound: 'error',
          vibrate: false,
        },
        { status: 401 }
      )
    }

    // Get user org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found',
          sound: 'error',
          vibrate: false,
        },
        { status: 404 }
      )
    }

    // Parse body
    const body = await request.json()
    const { barcode, expected_type } = body as {
      barcode: string
      expected_type?: BarcodeType
    }

    if (!barcode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Barcode is required',
          sound: 'error',
          vibrate: false,
        },
        { status: 400 }
      )
    }

    // Parse barcode format
    let type: BarcodeType | null = null
    let entityId: string | null = null

    if (barcode.startsWith('LP-')) {
      type = 'lp'
      entityId = barcode
    } else if (barcode.startsWith('LOC-')) {
      type = 'location'
      entityId = barcode
    } else if (barcode.startsWith('PRD-')) {
      type = 'product'
      entityId = barcode
    } else if (barcode.startsWith('PLT-')) {
      type = 'pallet'
      entityId = barcode
    } else if (barcode.startsWith('PO-')) {
      type = 'po'
      entityId = barcode
    } else if (barcode.startsWith('WO-')) {
      type = 'wo'
      entityId = barcode
    } else if (barcode.startsWith('ASN-')) {
      type = 'asn'
      entityId = barcode
    }

    if (!type || !entityId) {
      return NextResponse.json({
        success: false,
        message: 'Invalid barcode format',
        sound: 'error',
        vibrate: true,
      })
    }

    // Check expected type
    if (expected_type && type !== expected_type) {
      return NextResponse.json({
        success: false,
        message: `Expected ${expected_type.toUpperCase()} barcode, scanned ${type.toUpperCase()}`,
        sound: 'error',
        vibrate: true,
      })
    }

    // Fetch entity data from database
    let entityData: any = null

    try {
      switch (type) {
        case 'lp': {
          const { data, error } = await supabase
            .from('license_plates')
            .select(
              `
              id,
              lp_number,
              product_id,
              current_qty,
              uom,
              status,
              qa_status,
              location_id,
              batch_number,
              expiry_date,
              products (
                id,
                code,
                name,
                type
              ),
              locations (
                id,
                code,
                name,
                type
              )
            `
            )
            .eq('lp_number', barcode)
            .eq('org_id', currentUser.org_id)
            .single()

          if (error) throw error
          entityData = data
          break
        }

        case 'location': {
          const { data, error } = await supabase
            .from('locations')
            .select(
              `
              id,
              code,
              name,
              type,
              zone,
              warehouse_id,
              warehouses (
                id,
                code,
                name
              )
            `
            )
            .eq('barcode', barcode)
            .eq('org_id', currentUser.org_id)
            .eq('is_active', true)
            .single()

          if (error) throw error
          entityData = data
          break
        }

        case 'product': {
          // Extract product code from barcode (PRD-{code})
          const productCode = barcode.substring(4)
          const { data, error } = await supabase
            .from('products')
            .select(
              `
              id,
              code,
              name,
              type,
              uom,
              status,
              version
            `
            )
            .eq('code', productCode)
            .eq('org_id', currentUser.org_id)
            .eq('status', 'active')
            .single()

          if (error) throw error
          entityData = data
          break
        }

        case 'pallet': {
          // TODO: Implement pallet lookup when pallet table exists
          entityData = { id: entityId, pallet_number: barcode }
          break
        }

        case 'po': {
          // TODO: Implement PO lookup
          entityData = { id: entityId, po_number: barcode }
          break
        }

        case 'wo': {
          const { data, error } = await supabase
            .from('work_orders')
            .select(
              `
              id,
              wo_number,
              product_id,
              planned_quantity,
              status,
              products (
                id,
                code,
                name
              )
            `
            )
            .eq('wo_number', barcode)
            .eq('org_id', currentUser.org_id)
            .single()

          if (error) throw error
          entityData = data
          break
        }

        case 'asn': {
          const { data, error } = await supabase
            .from('asn')
            .select(
              `
              id,
              asn_number,
              status,
              expected_arrival_date,
              warehouse_id
            `
            )
            .eq('asn_number', barcode)
            .eq('org_id', currentUser.org_id)
            .single()

          if (error) throw error
          entityData = data
          break
        }
      }
    } catch (dbError: any) {
      if (dbError.code === 'PGRST116') {
        return NextResponse.json({
          success: false,
          message: `${type.toUpperCase()} not found: ${barcode}`,
          sound: 'error',
          vibrate: true,
        })
      }
      throw dbError
    }

    return NextResponse.json({
      success: true,
      message: `Valid ${type.toUpperCase()} scanned`,
      sound: 'success',
      vibrate: true,
      data: {
        type,
        entity_id: entityId,
        entity_data: entityData,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/scanner/validate-barcode:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        sound: 'error',
        vibrate: false,
      },
      { status: 500 }
    )
  }
}
