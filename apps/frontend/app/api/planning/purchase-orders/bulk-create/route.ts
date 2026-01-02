/**
 * API Route: Bulk Create POs
 * Story 03.6: PO Bulk Operations
 *
 * POST /api/planning/purchase-orders/bulk-create
 *
 * Creates multiple POs grouped by default supplier from a list of products.
 * Each product is assigned to a PO based on its default supplier.
 *
 * AC-01: Bulk PO Creation from Product List
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { BulkCreatePORequestSchema } from '@/lib/validation/po-bulk-schemas'
import { POBulkService } from '@/lib/services/po-bulk-service'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'
import { ZodError } from 'zod'

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

    // Authorization: check planning:C permission
    if (!checkPOPermission(currentUser, 'create')) {
      return NextResponse.json(
        {
          error: `Forbidden: ${getPermissionRequirement('create')} required`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = BulkCreatePORequestSchema.parse(body)

    // Execute bulk create
    const result = await POBulkService.bulkCreatePOs(validatedData)

    // Return result
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/bulk-create:', error)

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
      if (error.message === 'NO_WAREHOUSE') {
        return NextResponse.json(
          {
            error: 'No active warehouse found. Please configure a warehouse first.',
            code: 'NO_WAREHOUSE',
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
