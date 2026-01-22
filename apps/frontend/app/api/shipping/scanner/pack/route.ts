/**
 * API Route: Scanner Pack - Add Item to Box
 * Story: 07.12 - Packing Scanner Mobile UI
 *
 * POST /api/shipping/scanner/pack - Add item to box
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { packItemSchema } from '@/lib/validation/packing-scanner'
import { PackingScannerService, PackingScannerError } from '@/lib/services/packing-scanner-service'
import { ZodError } from 'zod'

// Roles that can pack via scanner
const ALLOWED_ROLES = ['packer', 'warehouse_packer', 'warehouse_manager', 'supervisor', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

/**
 * POST /api/shipping/scanner/pack
 * Add item to box - main packing transaction
 *
 * FR-7.37: Pack item with LP validation
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
    const validatedData = packItemSchema.parse(body)

    // Call service to add item to box
    const result = await PackingScannerService.addItemToBox(
      supabase,
      orgId,
      userId,
      validatedData
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/shipping/scanner/pack:', error)

    if (error instanceof ZodError) {
      const errors = error.errors || []
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: errors[0]?.message || 'Validation failed',
            details: errors,
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof PackingScannerError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
