/**
 * API Route: /api/planning/work-orders/[id]/availability
 * Story 03.13: WO Material Availability Check - GET availability status
 *
 * Returns material availability status for a Work Order:
 * - Coverage percentage calculation (available / required * 100)
 * - Traffic light indicators (sufficient/low_stock/shortage/no_stock)
 * - Expiry-aware filtering (excludes expired LPs)
 * - Reservation deduction from other WOs
 * - 30 second caching for performance
 * - Enforces RLS org isolation (404 not 403)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  handleApiError,
  successResponse,
  notFoundResponse,
} from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'
import { MaterialAvailabilityService } from '@/lib/services/material-availability-service'

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * GET /api/planning/work-orders/[id]/availability
 * Returns material availability status for Work Order
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createClient()

    // Validate WO ID format
    if (!UUID_REGEX.test(woId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid work order ID format',
          },
        },
        { status: 400 }
      )
    }

    // Verify authentication and get org context
    const authContext = await getAuthContextOrThrow(supabase)

    // Check if availability checking is enabled (from settings)
    // Default to enabled if setting not found
    const { data: settings } = await supabase
      .from('planning_settings')
      .select('wo_material_check')
      .eq('org_id', authContext.orgId)
      .single()

    const settingEnabled = settings?.wo_material_check !== false

    // Check availability using service
    const result = await MaterialAvailabilityService.checkWOAvailability(
      supabase,
      woId,
      authContext.orgId,
      { settingEnabled }
    )

    // Return result directly (already has correct structure)
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') {
        return notFoundResponse('Work order not found')
      }
      if (error.message === 'INVALID_ID') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ID',
              message: 'Invalid ID format',
            },
          },
          { status: 400 }
        )
      }
    }

    return handleApiError(error, 'GET /api/planning/work-orders/[id]/availability')
  }
}
