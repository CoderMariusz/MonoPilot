/**
 * API Route: Export Expiring Inventory to CSV
 * Story: 05.28 - Expiry Alerts Dashboard
 * Extended for: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * GET /api/warehouse/inventory/expiring/export - Export expiring items to CSV
 *
 * Query Parameters:
 * - days: number (default: 30, min: 1, max: 365) - threshold for expiring items
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { exportExpiringToCSV } from '@/lib/services/expiry-alert-service'
import { z } from 'zod'

const exportQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
})

/**
 * GET /api/warehouse/inventory/expiring/export
 * Returns CSV file with all expiring items
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id and org_name
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('org_id, organizations!inner(name)')
      .eq('id', user.id)
      .single()

    if (orgError || !userData?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const orgId = userData.org_id
    const orgName = (userData.organizations as any)?.name || 'organization'

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      days: searchParams.get('days'),
    }

    const validationResult = exportQuerySchema.safeParse(queryParams)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { days } = validationResult.data

    // Generate CSV content
    const csvContent = await exportExpiringToCSV(orgId, days)

    // Generate filename with org name and date
    const date = new Date().toISOString().split('T')[0]
    const filename = `expiring-inventory-${orgName.toLowerCase().replace(/\s+/g, '-')}-${date}.csv`

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/inventory/expiring/export:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && {
          debug: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 }
    )
  }
}

/**
 * POST method not allowed
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  )
}
