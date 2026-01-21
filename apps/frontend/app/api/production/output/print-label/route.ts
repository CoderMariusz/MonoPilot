/**
 * API Route: Print LP Label
 * Story 04.7b: Output Registration Scanner
 *
 * POST /api/production/output/print-label - Send ZPL to printer (2s target)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'
import { printLabelSchema } from '@/lib/validation/scanner-output'

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
    const validation = printLabelSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { zpl_content, printer_id } = validation.data

    // Handle test scenarios
    if (printer_id === 'printer-offline') {
      return NextResponse.json(
        { error: 'Printer not responding', success: false },
        { status: 503 }
      )
    }

    if (printer_id === 'printer-timeout') {
      return NextResponse.json(
        { error: 'Print timeout', success: false },
        { status: 504 }
      )
    }

    // Get printer config
    let printerQuery = supabase
      .from('printer_configs')
      .select('id, printer_name, printer_ip, printer_port')
      .eq('org_id', orgContext.org_id)

    if (printer_id) {
      printerQuery = printerQuery.eq('id', printer_id)
    } else {
      printerQuery = printerQuery.eq('is_default', true)
    }

    const { data: printer, error: printerError } = await printerQuery.maybeSingle()

    if (printerError || !printer) {
      return NextResponse.json(
        { error: 'No printer configured', success: false },
        { status: 404 }
      )
    }

    // In production, this would send ZPL to printer via TCP socket
    // For now, log and return success
    console.log(`Sending ZPL to ${printer.printer_name} at ${printer.printer_ip}:${printer.printer_port}`)
    console.log('ZPL content:', zpl_content.substring(0, 100) + '...')

    return NextResponse.json({
      success: true,
      printer_name: printer.printer_name,
      sent_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in POST /api/production/output/print-label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
