/**
 * POST /api/shipping/labels/generate-packing-slip
 * Generate Packing Slip PDF (Story 07.13)
 * 
 * Purpose:
 * - Generate packing slip PDF for a shipment
 * - Include line items with product, SKU, quantities, weight, lot number, and BBD
 * - Include carton summary with SSCC and weight
 * - Upload PDF to Supabase Storage
 * 
 * Request:
 *   POST /api/shipping/labels/generate-packing-slip
 *   { shipmentId: string }
 * 
 * Response:
 *   {
 *     pdf_url: string
 *     shipment_number: string
 *     generated_at: ISO string
 *     file_size_kb: number
 *   }
 * 
 * Error Codes:
 *   - SHIPMENT_NOT_FOUND: Shipment doesn't exist
 *   - MISSING_SSCC: Boxes lack SSCC
 *   - MISSING_ADDRESS: Customer address missing
 *   - PDF_GENERATION_ERROR: PDF generation failed
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { PackingSlipContent, LineItem, PackingSlipBox } from '@/lib/services/document-service'
import { DocumentService } from '@/lib/services/document-service'

// =============================================================================
// Type Definitions
// =============================================================================

interface GeneratePackingSlipRequest {
  shipmentId: string
}

interface GeneratePackingSlipResponse {
  pdf_url: string
  shipment_number: string
  generated_at: string
  file_size_kb: number
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as GeneratePackingSlipRequest

    const { shipmentId } = body

    if (!shipmentId) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_SHIPMENT_ID',
            message: 'shipmentId is required',
          },
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServerSupabase()

    // Get user for auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        },
        { status: 401 }
      )
    }

    // Fetch shipment with org_id for RLS
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select(
        `
        id,
        shipment_number,
        sales_order_id,
        org_id,
        status,
        ship_to_address_id,
        ship_from_address_id,
        special_instructions,
        created_at,
        sales_orders (
          sales_order_number
        ),
        addresses!shipments_ship_to_address_id_fk (
          id,
          address_line_1,
          address_line_2,
          city,
          state_province,
          postal_code,
          country,
          contact_name,
          phone,
          email
        )
      `
      )
      .eq('id', shipmentId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        {
          error: {
            code: 'SHIPMENT_NOT_FOUND',
            message: `Shipment ${shipmentId} not found`,
          },
        },
        { status: 404 }
      )
    }

    // Fetch shipment line items with product and weight info
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('shipment_lines')
      .select(
        `
        id,
        product_id,
        quantity_ordered,
        quantity_shipped,
        lot_number,
        best_before_date,
        weight,
        products (
          id,
          name,
          sku
        )
      `
      )
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: true })

    if (lineItemsError) {
      return NextResponse.json(
        {
          error: {
            code: 'LINE_ITEMS_FETCH_ERROR',
            message: 'Failed to fetch line items',
          },
        },
        { status: 500 }
      )
    }

    // Fetch boxes with SSCC
    const { data: boxes, error: boxesError } = await supabase
      .from('boxes')
      .select(
        `
        id,
        box_number,
        sscc,
        weight,
        length,
        width,
        height,
        created_at
      `
      )
      .eq('shipment_id', shipmentId)
      .order('box_number', { ascending: true })

    if (boxesError) {
      return NextResponse.json(
        {
          error: {
            code: 'BOXES_FETCH_ERROR',
            message: 'Failed to fetch boxes',
          },
        },
        { status: 500 }
      )
    }

    // Validate required data
    if (boxes && boxes.length > 0 && boxes.some((box: any) => !box.sscc)) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_SSCC',
            message: 'Some boxes are missing SSCC',
          },
        },
        { status: 400 }
      )
    }

    // Fetch ship-from address
    const { data: shipFromAddress, error: shipFromError } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', shipment.ship_from_address_id)
      .single()

    if (shipFromError || !shipFromAddress) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_ADDRESS',
            message: 'Ship-from address not found',
          },
        },
        { status: 400 }
      )
    }

    // Build line items array
    const buildLineItems: LineItem[] = (lineItems || []).map((item: any) => ({
      product: item.products?.name || 'Unknown Product',
      sku: item.products?.sku || '',
      quantityOrdered: item.quantity_ordered,
      quantityShipped: item.quantity_shipped,
      weight: item.weight || 0,
      lotNumber: item.lot_number || '',
      bestBeforeDate: item.best_before_date ? new Date(item.best_before_date) : undefined,
    }))

    // Build boxes array
    const buildBoxes: PackingSlipBox[] = (boxes || []).map((box: any) => ({
      boxNumber: box.box_number,
      sscc: box.sscc || '',
      weight: box.weight || 0,
      dimensions: {
        length: box.length || 0,
        width: box.width || 0,
        height: box.height || 0,
      },
    }))

    // Build ship-to address
    const shipToAddress = (shipment.addresses as any) || null
    if (!shipToAddress) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_ADDRESS',
            message: 'Ship-to address not found',
          },
        },
        { status: 400 }
      )
    }

    // Build packing slip content
    const packingSlipContent: PackingSlipContent = {
      shipmentNumber: shipment.shipment_number,
      salesOrderNumber: (shipment.sales_orders as any)?.sales_order_number || '',
      date: new Date(shipment.created_at),
      trackingNumber: undefined, // TODO: Get from shipment tracking
      shipTo: {
        name: shipToAddress.contact_name || shipToAddress.company_name || 'Customer',
        contactName: shipToAddress.contact_name,
        address: `${shipToAddress.address_line_1}${shipToAddress.address_line_2 ? ' ' + shipToAddress.address_line_2 : ''}`,
        cityStateZip: `${shipToAddress.city}, ${shipToAddress.state_province} ${shipToAddress.postal_code}`,
        phone: shipToAddress.phone,
        email: shipToAddress.email,
      },
      shipFrom: {
        name: shipFromAddress.contact_name || shipFromAddress.company_name || 'Warehouse',
        address: `${shipFromAddress.address_line_1}${shipFromAddress.address_line_2 ? ' ' + shipFromAddress.address_line_2 : ''}`,
        cityStateZip: `${shipFromAddress.city}, ${shipFromAddress.state_province} ${shipFromAddress.postal_code}`,
      },
      lineItems: buildLineItems,
      boxes: buildBoxes,
      specialInstructions: shipment.special_instructions,
      allergenWarnings: undefined, // TODO: Fetch from products
    }

    // Generate PDF
    const result = await DocumentService.generatePackingSlip(packingSlipContent)

    if (!result.success || !result.pdf_url) {
      return NextResponse.json(
        {
          error: {
            code: 'PDF_GENERATION_ERROR',
            message: result.error || 'Failed to generate packing slip PDF',
          },
        },
        { status: 500 }
      )
    }

    // Return response
    const response: GeneratePackingSlipResponse = {
      pdf_url: result.pdf_url,
      shipment_number: shipment.shipment_number,
      generated_at: result.generated_at || new Date().toISOString(),
      file_size_kb: result.file_size_kb || 0,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error generating packing slip:', error)
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
