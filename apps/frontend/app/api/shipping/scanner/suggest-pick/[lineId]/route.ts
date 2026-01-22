/**
 * API Route: Pick Suggestion for Scanner
 * Story: 07.10 - Pick Scanner (Mobile Pick Workflow)
 *
 * GET /api/shipping/scanner/suggest-pick/:lineId - Get suggested LP for pick line (FIFO/FEFO)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'
import { ScannerPickService, ScannerPickError } from '@/lib/services/scanner-pick-service'
import { pickSuggestionSchema } from '@/lib/validation/scanner-pick-schema'

// Roles that can get pick suggestions via scanner
const ALLOWED_ROLES = ['picker', 'supervisor', 'warehouse_manager', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

/**
 * GET /api/shipping/scanner/suggest-pick/:lineId
 * Get suggested LP based on FIFO/FEFO compliance
 *
 * AC-15: FIFO/FEFO warning
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const { lineId } = await params

    // Validate lineId is a UUID
    const validationResult = pickSuggestionSchema.safeParse({ lineId })
    if (!validationResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid line ID format' } },
        { status: 400 }
      )
    }

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

    // Call service to get suggestion
    const result = await ScannerPickService.suggestPick(supabase, orgId, lineId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/shipping/scanner/suggest-pick/:lineId:', error)

    if (error instanceof ScannerPickError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }

    // Handle service errors that throw standard Error with code prefix
    if (error instanceof Error) {
      const message = error.message
      if (message.startsWith('NOT_FOUND:')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: message.replace('NOT_FOUND: ', '') } },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
