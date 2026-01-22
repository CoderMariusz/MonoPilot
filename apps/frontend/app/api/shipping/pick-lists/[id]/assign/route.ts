/**
 * API Route: Assign Picker
 * Story: 07.8 - Pick List Generation + Wave Picking
 *
 * POST /api/shipping/pick-lists/:id/assign - Assign picker to pick list
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'
import {
  assignPickerSchema,
  PICK_LIST_ASSIGN_ROLES,
} from '@/lib/validation/pick-list-schemas'
import { PickListService, PickListError } from '@/lib/services/pick-list-service'
import { ZodError } from 'zod'

/**
 * POST /api/shipping/pick-lists/:id/assign
 * Assign picker to pick list
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check role permissions
    const permissionError = checkPermission(authContext, PICK_LIST_ASSIGN_ROLES)
    if (permissionError) {
      return permissionError
    }

    const { orgId } = authContext

    // Parse and validate request body
    const body = await request.json()
    const validatedData = assignPickerSchema.parse(body)

    // Assign picker
    const result = await PickListService.assignPicker(
      supabase,
      orgId,
      id,
      validatedData.assigned_to
    )

    return NextResponse.json({ pick_list: result })
  } catch (error) {
    console.error('Error in POST /api/shipping/pick-lists/:id/assign:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof PickListError) {
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
