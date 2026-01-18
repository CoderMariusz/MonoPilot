/**
 * API Route: Bulk Actions for Expiring Inventory
 * Story: 05.28 - Expiry Alerts Dashboard
 * Extended for: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * POST /api/warehouse/inventory/expiring/bulk-actions - Execute bulk actions
 *
 * Supported Actions:
 * - 'quarantine': Move selected LPs to quarantine status
 * - 'adjust': Create stock adjustments for selected LPs
 * - 'print_labels': Generate print-ready labels for selected LPs
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { bulkExpiryActionSchema } from '@/lib/validation/expiry-alert-schema'

/**
 * POST /api/warehouse/inventory/expiring/bulk-actions
 * Execute bulk action on selected expiring LPs
 */
export async function POST(request: NextRequest) {
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

    // Get user's org_id
    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (orgError || !userData?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const orgId = userData.org_id

    // Parse and validate request body
    const body = await request.json()
    const validationResult = bulkExpiryActionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { action, lp_ids } = validationResult.data

    // Verify all LPs belong to the user's organization
    const { data: lpData, error: lpError } = await supabase
      .from('license_plates')
      .select('id, lp_number, status, qa_status')
      .eq('org_id', orgId)
      .in('id', lp_ids)

    if (lpError) {
      throw lpError
    }

    if (!lpData || lpData.length !== lp_ids.length) {
      return NextResponse.json(
        { error: 'Some license plates not found or not accessible' },
        { status: 404 }
      )
    }

    // Execute action based on type
    let result: any = {}

    switch (action) {
      case 'quarantine':
        // Update LPs to quarantine status
        const { data: quarantineData, error: quarantineError } = await supabase
          .from('license_plates')
          .update({
            status: 'blocked',
            qa_status: 'quarantine',
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          })
          .eq('org_id', orgId)
          .in('id', lp_ids)
          .select('id, lp_number')

        if (quarantineError) {
          throw quarantineError
        }

        result = {
          action: 'quarantine',
          success: true,
          updated_count: quarantineData?.length ?? 0,
          lp_numbers: quarantineData?.map((lp) => lp.lp_number) ?? [],
        }
        break

      case 'adjust':
        // For adjust action, return LPs that can be adjusted
        // Actual adjustment creation would be done in separate endpoint
        result = {
          action: 'adjust',
          success: true,
          lp_count: lpData.length,
          lp_ids: lp_ids,
          message: 'Ready for adjustment. Use adjustment creation endpoint to complete.',
        }
        break

      case 'print_labels':
        // For print action, return LP data for label generation
        result = {
          action: 'print_labels',
          success: true,
          lp_count: lpData.length,
          lp_ids: lp_ids,
          message: 'Ready for label printing. Use print endpoint to generate labels.',
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/warehouse/inventory/expiring/bulk-actions:', error)

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
 * GET method not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  )
}
