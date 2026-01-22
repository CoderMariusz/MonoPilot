/**
 * API Route: Scanner Pick Confirmation
 * Story: 07.10 - Pick Scanner (Mobile Pick Workflow)
 *
 * POST /api/shipping/scanner/pick - Confirm a pick via scanner
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { scannerPickSchema } from '@/lib/validation/scanner-pick-schema'
import { ScannerPickService, ScannerPickError } from '@/lib/services/scanner-pick-service'
import { ZodError } from 'zod'

// Roles that can confirm picks via scanner
const ALLOWED_ROLES = ['picker', 'supervisor', 'warehouse_manager', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

/**
 * POST /api/shipping/scanner/pick
 * Confirm a pick via scanner with LP validation and auto-advance
 *
 * AC-4: Valid LP scan
 * AC-5: Invalid LP scan
 * AC-7: Quantity confirmation
 * AC-8: Short pick handling
 * AC-12: Auto-advance to next line
 * AC-17: Scanner pick API
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId, orgId, userRole } = authContext

    // Check role permission
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
        { status: 400 }
      )
    }
    const validatedData = scannerPickSchema.parse(body)

    // Check for short_pick without reason (schema should catch this but double-check)
    if (validatedData.short_pick && !validatedData.short_pick_reason) {
      return NextResponse.json(
        { error: { code: 'SHORT_PICK_REASON_REQUIRED', message: 'Short pick reason required when short_pick=true' } },
        { status: 400 }
      )
    }

    // Call service to confirm pick
    const result = await ScannerPickService.confirmPick(
      supabase,
      orgId,
      userId,
      validatedData
    )

    return NextResponse.json(result)
  } catch (error) {
    // Handle ZodError first to avoid serialization issues with console.error
    if (error instanceof ZodError) {
      console.error('Validation error in POST /api/shipping/scanner/pick:', error.message)
      const issues = error.issues || []

      // Check if it's the short_pick_reason refinement error
      const shortPickReasonError = issues.find((e) => e.path?.includes('short_pick_reason'))
      if (shortPickReasonError) {
        return NextResponse.json(
          { error: { code: 'SHORT_PICK_REASON_REQUIRED', message: 'Short pick reason required when short_pick=true' } },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: issues[0]?.message || 'Validation failed',
            details: issues,
          },
        },
        { status: 400 }
      )
    }

    // Log non-Zod errors
    console.error('Error in POST /api/shipping/scanner/pick:', error instanceof Error ? error.message : error)

    if (error instanceof ScannerPickError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }

    // Handle service errors that throw standard Error with code prefix
    if (error instanceof Error) {
      const message = error.message
      if (message.startsWith('LP_MISMATCH:')) {
        return NextResponse.json(
          { error: { code: 'LP_MISMATCH', message: message.replace('LP_MISMATCH: ', '') } },
          { status: 400 }
        )
      }
      if (message.startsWith('QUANTITY_EXCEEDS_AVAILABLE:')) {
        return NextResponse.json(
          { error: { code: 'QUANTITY_EXCEEDS_AVAILABLE', message: message.replace('QUANTITY_EXCEEDS_AVAILABLE: ', '') } },
          { status: 400 }
        )
      }
      if (message.startsWith('NOT_FOUND:')) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: message.replace('NOT_FOUND: ', '') } },
          { status: 404 }
        )
      }
      if (message.startsWith('LINE_ALREADY_PICKED:')) {
        return NextResponse.json(
          { error: { code: 'LINE_ALREADY_PICKED', message: message.replace('LINE_ALREADY_PICKED: ', '') } },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
