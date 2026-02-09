/**
 * POST /api/shipping/labels/generate-invoice
 * Generate Invoice PDF (Story 07.15)
 * 
 * Purpose:
 * - Generate invoice PDF for a sales order/shipment
 * - Include line items with product, SKU, quantities, unit prices, discounts
 * - Include totals: subtotal, tax, shipping, grand total
 * - Include customer and company billing information
 * - Upload PDF to Supabase Storage
 * 
 * Request:
 *   POST /api/shipping/labels/generate-invoice
 *   { salesOrderId: string }
 * 
 * Response:
 *   {
 *     pdf_url: string
 *     invoice_number: string
 *     sales_order_number: string
 *     generated_at: ISO string
 *     file_size_kb: number
 *     total_amount: number
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { DocumentService } from '@/lib/services/document-service'

// =============================================================================
// Type Definitions
// =============================================================================

interface GenerateInvoiceRequest {
  salesOrderId: string
}

interface InvoiceLineItem {
  product_name: string
  sku: string
  quantity: number
  unit_price: number
  discount_type?: string
  discount_value?: number
  line_total: number
}

interface InvoiceContent {
  invoice_number: string
  sales_order_number: string
  date: Date
  customer: {
    name: string
    contact_name?: string
    email?: string
    phone?: string
  }
  billing_address: {
    address_line_1: string
    address_line_2?: string
    city: string
    state_province: string
    postal_code: string
    country: string
  }
  line_items: InvoiceLineItem[]
  subtotal: number
  discount_total: number
  tax_amount: number
  shipping_amount: number
  grand_total: number
  notes?: string
}

interface GenerateInvoiceResponse {
  pdf_url: string
  invoice_number: string
  sales_order_number: string
  generated_at: string
  file_size_kb: number
  total_amount: number
}

// =============================================================================
// Helper: Generate Invoice Number
// =============================================================================

function generateInvoiceNumber(): string {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `INV-${new Date().getFullYear()}-${timestamp}${random}`
}

// =============================================================================
// POST Handler
// =============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = (await request.json()) as GenerateInvoiceRequest
    const { salesOrderId } = body

    if (!salesOrderId) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_SALES_ORDER_ID',
            message: 'salesOrderId is required',
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

    // Fetch sales order with customer and line items
    const { data: salesOrder, error: soError } = await supabase
      .from('sales_orders')
      .select(
        `
        id,
        order_number,
        customer_id,
        billing_address_id,
        total_amount,
        subtotal,
        discount_total,
        tax_amount,
        shipping_amount,
        notes,
        created_at,
        customers (
          id,
          name,
          email,
          phone
        ),
        addresses!sales_orders_billing_address_id_fk (
          address_line_1,
          address_line_2,
          city,
          state_province,
          postal_code,
          country,
          contact_name
        )
      `
      )
      .eq('id', salesOrderId)
      .single()

    if (soError || !salesOrder) {
      return NextResponse.json(
        {
          error: {
            code: 'SALES_ORDER_NOT_FOUND',
            message: `Sales Order ${salesOrderId} not found`,
          },
        },
        { status: 404 }
      )
    }

    // Fetch sales order line items with product information
    const { data: lineItems, error: lineItemsError } = await supabase
      .from('sales_order_lines')
      .select(
        `
        id,
        product_id,
        quantity_ordered,
        unit_price,
        discount_type,
        discount_value,
        products (
          name,
          sku
        )
      `
      )
      .eq('sales_order_id', salesOrderId)
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

    // Validate required data
    const customer = (salesOrder.customers as any) || null
    if (!customer) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_CUSTOMER',
            message: 'Customer information not found',
          },
        },
        { status: 400 }
      )
    }

    const billingAddress = (salesOrder.addresses as any) || null
    if (!billingAddress) {
      return NextResponse.json(
        {
          error: {
            code: 'MISSING_ADDRESS',
            message: 'Billing address not found',
          },
        },
        { status: 400 }
      )
    }

    // Calculate line totals and validate data
    const buildLineItems: InvoiceLineItem[] = (lineItems || []).map((item: any) => {
      const qty = item.quantity_ordered || 0
      const unitPrice = item.unit_price || 0
      const discountType = item.discount_type || null
      const discountValue = item.discount_value || 0

      let discount = 0
      if (discountType === 'percentage') {
        discount = (unitPrice * qty * discountValue) / 100
      } else if (discountType === 'fixed') {
        discount = discountValue * qty
      }

      const lineTotal = unitPrice * qty - discount

      return {
        product_name: item.products?.name || 'Unknown Product',
        sku: item.products?.sku || '',
        quantity: qty,
        unit_price: unitPrice,
        discount_type: discountType || undefined,
        discount_value: discountValue || undefined,
        line_total: Math.max(0, lineTotal),
      }
    })

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber()

    // Build invoice content
    const invoiceContent: InvoiceContent = {
      invoice_number: invoiceNumber,
      sales_order_number: salesOrder.order_number,
      date: new Date(salesOrder.created_at),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        contact_name: billingAddress.contact_name,
      },
      billing_address: {
        address_line_1: billingAddress.address_line_1,
        address_line_2: billingAddress.address_line_2,
        city: billingAddress.city,
        state_province: billingAddress.state_province,
        postal_code: billingAddress.postal_code,
        country: billingAddress.country,
      },
      line_items: buildLineItems,
      subtotal: salesOrder.subtotal || 0,
      discount_total: salesOrder.discount_total || 0,
      tax_amount: salesOrder.tax_amount || 0,
      shipping_amount: salesOrder.shipping_amount || 0,
      grand_total: salesOrder.total_amount || 0,
      notes: salesOrder.notes,
    }

    // Generate PDF using DocumentService
    const result = await DocumentService.generateInvoice(invoiceContent)

    if (!result.success || !result.pdf_url) {
      return NextResponse.json(
        {
          error: {
            code: 'PDF_GENERATION_ERROR',
            message: result.error || 'Failed to generate invoice PDF',
          },
        },
        { status: 500 }
      )
    }

    // Return response
    const response: GenerateInvoiceResponse = {
      pdf_url: result.pdf_url,
      invoice_number: invoiceNumber,
      sales_order_number: salesOrder.order_number,
      generated_at: result.generated_at || new Date().toISOString(),
      file_size_kb: result.file_size_kb || 0,
      total_amount: invoiceContent.grand_total,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error generating invoice:', error)
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
