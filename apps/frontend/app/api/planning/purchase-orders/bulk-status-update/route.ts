/**
 * API Route: Bulk Status Update
 * Story 03.6: PO Bulk Operations
 *
 * POST /api/planning/purchase-orders/bulk-status-update
 *
 * Updates the status of multiple POs at once.
 * Supports: approve, reject, cancel, confirm actions.
 *
 * AC-05: Bulk Status Update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { BulkStatusUpdateSchema } from '@/lib/validation/po-bulk-schemas'
import { POBulkService } from '@/lib/services/po-bulk-service'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'
import { ZodError } from 'zod'

/**
 * Map bulk action to required permission
 */
function getRequiredPermission(action: string): 'edit' | 'cancel' {
  switch (action) {
    case 'cancel':
      return 'cancel'
    case 'approve':
    case 'reject':
    case 'confirm':
    default:
      return 'edit'
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Get current user with role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse and validate request body first to get action
    const body = await request.json()
    const validatedData = BulkStatusUpdateSchema.parse(body)

    // Authorization: check appropriate permission based on action
    const requiredPermission = getRequiredPermission(validatedData.action)
    if (!checkPOPermission(currentUser, requiredPermission)) {
      return NextResponse.json(
        {
          error: `Forbidden: ${getPermissionRequirement(requiredPermission)} required to ${validatedData.action} POs`,
          code: 'PERMISSION_DENIED',
        },
        { status: 403 }
      )
    }

    // Check limit (100 POs max)
    if (validatedData.po_ids.length > 100) {
      return NextResponse.json(
        {
          error: 'Cannot update more than 100 POs at once',
          code: 'LIMIT_EXCEEDED',
        },
        { status: 400 }
      )
    }

    // Execute bulk status update
    const result = await POBulkService.bulkUpdateStatus(
      validatedData.po_ids,
      validatedData.action,
      validatedData.reason ?? undefined
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error(
      'Error in POST /api/planning/purchase-orders/bulk-status-update:',
      error
    )

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message === 'UNAUTHORIZED') {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
