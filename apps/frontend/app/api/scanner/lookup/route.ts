/**
 * Scanner Lookup API
 * Universal barcode lookup endpoint
 * Detects entity type and returns details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const searchParams = req.nextUrl.searchParams
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode required' }, { status: 400 })
  }

  try {
    // Get current user's org_id
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    const orgId = userData.org_id

    // Try to identify entity type by searching all tables

    // 1. Try License Plate
    const { data: lpData } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        current_qty,
        product:products(name, code, uom),
        location:locations(code, name)
      `)
      .eq('org_id', orgId)
      .or(`lp_number.ilike.%${barcode}%,barcode.ilike.%${barcode}%`)
      .limit(1)
      .single()

    if (lpData) {
      return NextResponse.json({
        data: {
          type: 'license_plate',
          id: lpData.id,
          details: {
            lp_number: lpData.lp_number,
            product_name: lpData.product?.name || 'Unknown',
            product_code: lpData.product?.code || '',
            quantity: lpData.current_qty,
            uom: lpData.product?.uom || 'EA',
            location_code: lpData.location?.code || 'Unknown',
          },
        },
      })
    }

    // 2. Try Location
    const { data: locationData } = await supabase
      .from('locations')
      .select(`
        id,
        code,
        name,
        type,
        zone,
        barcode,
        warehouse:warehouses(name)
      `)
      .eq('org_id', orgId)
      .or(`code.ilike.%${barcode}%,barcode.ilike.%${barcode}%`)
      .limit(1)
      .single()

    if (locationData) {
      return NextResponse.json({
        data: {
          type: 'location',
          id: locationData.id,
          details: {
            code: locationData.code,
            name: locationData.name || locationData.code,
            type: locationData.type,
            zone: locationData.zone,
            warehouse_name: locationData.warehouse?.name || 'Unknown',
          },
        },
      })
    }

    // 3. Try Product
    const { data: productData } = await supabase
      .from('products')
      .select('id, code, name, type, uom, status')
      .eq('org_id', orgId)
      .or(`code.ilike.%${barcode}%,barcode.ilike.%${barcode}%`)
      .limit(1)
      .single()

    if (productData) {
      return NextResponse.json({
        data: {
          type: 'product',
          id: productData.id,
          details: {
            code: productData.code,
            name: productData.name,
            type: productData.type,
            uom: productData.uom,
            status: productData.status,
          },
        },
      })
    }

    // 4. Try Work Order
    const { data: woData } = await supabase
      .from('work_orders')
      .select(`
        id,
        wo_number,
        planned_quantity,
        produced_quantity,
        status,
        product:products(name, uom)
      `)
      .eq('org_id', orgId)
      .ilike('wo_number', `%${barcode}%`)
      .limit(1)
      .single()

    if (woData) {
      return NextResponse.json({
        data: {
          type: 'work_order',
          id: woData.id,
          details: {
            wo_number: woData.wo_number,
            product_name: woData.product?.name || 'Unknown',
            planned_qty: woData.planned_quantity,
            output_qty: woData.produced_quantity || 0,
            status: woData.status,
          },
        },
      })
    }

    // 5. Try Pallet
    const { data: palletData } = await supabase
      .from('pallets')
      .select(`
        id,
        pallet_number,
        status,
        location:locations(code, name)
      `)
      .eq('org_id', orgId)
      .or(`pallet_number.ilike.%${barcode}%,barcode.ilike.%${barcode}%`)
      .limit(1)
      .single()

    if (palletData) {
      return NextResponse.json({
        data: {
          type: 'pallet',
          id: palletData.id,
          details: {
            pallet_number: palletData.pallet_number,
            status: palletData.status,
            location_code: palletData.location?.code || 'Unknown',
          },
        },
      })
    }

    // Not found
    return NextResponse.json({ error: 'Barcode not found' }, { status: 404 })
  } catch (error) {
    console.error('Scanner lookup error:', error)
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
