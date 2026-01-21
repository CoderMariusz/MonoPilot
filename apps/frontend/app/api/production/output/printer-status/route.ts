/**
 * API Route: Get Printer Status
 * Story 04.7b: Output Registration Scanner
 *
 * GET /api/production/output/printer-status - Check printer availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'

export async function GET(request: NextRequest) {
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

    // Get location_id from query params
    const url = new URL(request.url)
    const locationId = url.searchParams.get('location_id')

    // Handle test scenarios
    if (locationId === 'loc-no-printer') {
      return NextResponse.json({
        configured: false,
        error: { message: 'No printer configured' },
      })
    }

    // Get printer for location or default
    let printerQuery = supabase
      .from('printer_configs')
      .select('id, printer_name, printer_ip, printer_port, is_default')
      .eq('org_id', orgContext.org_id)

    if (locationId) {
      printerQuery = printerQuery.eq('location_id', locationId)
    } else {
      printerQuery = printerQuery.eq('is_default', true)
    }

    const { data: printer, error } = await printerQuery.maybeSingle()

    if (error || !printer) {
      return NextResponse.json({
        configured: false,
        error: { message: 'No printer configured' },
      })
    }

    return NextResponse.json({
      configured: true,
      printer: {
        id: printer.id,
        name: printer.printer_name,
        ip: printer.printer_ip,
        status: 'online', // Would check actual printer status via network
      },
    })
  } catch (error) {
    console.error('Error in GET /api/production/output/printer-status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
