/**
 * API Route: LP Lookup for Scanner
 * Story: 07.10 - Pick Scanner (Mobile Pick Workflow)
 *
 * GET /api/shipping/scanner/lookup/lp/:barcode - Quick LP lookup for scanner validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'
import { ScannerPickService } from '@/lib/services/scanner-pick-service'

// Roles that can lookup LPs via scanner
const ALLOWED_ROLES = ['picker', 'supervisor', 'warehouse_manager', 'warehouse', 'manager', 'admin', 'owner', 'super_admin', 'viewer']

/**
 * GET /api/shipping/scanner/lookup/lp/:barcode
 * Fast LP lookup for scanner validation
 *
 * AC-6: LP not found
 * AC-16: LP lookup API
 * AC-20: RLS enforcement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId, userRole } = authContext

    // Check role permission
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    // Decode barcode (may contain special characters)
    const decodedBarcode = decodeURIComponent(barcode)

    // Call service to lookup LP
    const result = await ScannerPickService.lookupLP(supabase, orgId, decodedBarcode)

    if (!result) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'LP not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/shipping/scanner/lookup/lp/:barcode:', error)

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
