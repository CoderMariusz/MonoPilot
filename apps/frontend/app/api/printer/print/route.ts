/**
 * POST /api/printer/print
 * Story 4.13: ZPL Label Printing (AC-4.13.9)
 * Generates ZPL and sends to configured printer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface PrintRequest {
  lp_number: string
  quantity: number
  uom?: string
  product_name?: string
  batch_number?: string
  expiry_date?: string
}

/**
 * Generate ZPL label content (AC-4.13.9)
 */
function generateZPL(data: PrintRequest): string {
  const timestamp = new Date().toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // ZPL label template for 4x6 label (standard shipping label size)
  return `^XA
^MMT
^PW812
^LL406
^LS0
^LH0,0
^LT0
^MNW
^MTT
^BY3,3,100^FO50,50^BC^FD${data.lp_number}^FS
^FO50,170^A0N,28,28^FD${(data.product_name || 'Product').substring(0, 30)}^FS
^FO50,210^A0N,24,24^FD${data.quantity} ${data.uom || 'EA'}^FS
^FO50,250^A0N,20,20^FDBatch: ${data.batch_number || 'N/A'}^FS
^FO50,290^A0N,20,20^FDExp: ${data.expiry_date || 'N/A'}^FS
^FO50,330^A0N,16,16^FD${timestamp}^FS
^XZ`
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: PrintRequest = await request.json()

    if (!body.lp_number) {
      return NextResponse.json(
        { error: 'LP number is required' },
        { status: 400 }
      )
    }

    // Generate ZPL
    const zpl = generateZPL(body)

    // Get printer configuration from production settings
    const { data: settings } = await supabase
      .from('production_settings')
      .select('printer_network_address')
      .eq('organization_id', userRecord.org_id)
      .single()

    const printerAddress = settings?.printer_network_address

    if (!printerAddress) {
      // No printer configured - return ZPL for manual printing
      return NextResponse.json({
        success: true,
        message: 'No printer configured - ZPL generated for manual print',
        zpl,
        printed: false,
      })
    }

    // Attempt to send to printer
    try {
      // Try HTTP POST to printer (many Zebra printers support this)
      const printerResponse = await fetch(`http://${printerAddress}/pstprnt`, {
        method: 'POST',
        body: zpl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })

      if (printerResponse.ok) {
        return NextResponse.json({
          success: true,
          message: 'Label sent to printer',
          printed: true,
        })
      } else {
        throw new Error(`Printer returned status ${printerResponse.status}`)
      }
    } catch (printerError) {
      console.warn('Printer error (may be offline):', printerError)

      // Return success with ZPL - operator can retry or print manually
      return NextResponse.json({
        success: true,
        message: 'Printer unreachable - ZPL generated for manual print',
        zpl,
        printed: false,
        printer_error: printerError instanceof Error ? printerError.message : 'Unknown error',
      })
    }
  } catch (error) {
    console.error('Print API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
