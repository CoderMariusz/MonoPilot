/**
 * API Route: Import Execute
 * Story 03.6: PO Bulk Operations
 *
 * POST /api/planning/purchase-orders/import/execute
 *
 * Creates POs from validated import data.
 * Uses transaction per supplier group for partial success.
 *
 * AC-02: Import Execution
 * AC-06: Batch Processing & Transaction Safety
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ImportExecuteRequestSchema } from '@/lib/validation/po-bulk-schemas'
import { POBulkService } from '@/lib/services/po-bulk-service'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'
import { ZodError } from 'zod'

// Timeout: 60 seconds
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const startTime = Date.now()

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
    const validatedData = ImportExecuteRequestSchema.parse(body)

    // Check row limit (500)
    if (validatedData.rows.length > 500) {
      return NextResponse.json(
        {
          error: 'Request exceeds 500 row limit. Please split into smaller batches.',
          code: 'ROW_LIMIT_EXCEEDED',
          row_count: validatedData.rows.length,
        },
        { status: 400 }
      )
    }

    // Execute import with timeout check
    const result = await POBulkService.executeImport(validatedData.rows, {
      default_warehouse_id: validatedData.default_warehouse_id,
    })

    const duration = Date.now() - startTime

    // Check if we're close to timeout (warn if > 50 seconds)
    if (duration > 50000) {
      console.warn(`Import execution took ${duration}ms - approaching timeout`)
    }

    return NextResponse.json(
      {
        ...result,
        processing_time_ms: duration,
      },
      { status: 200 }
    )
  } catch (error) {
    const duration = Date.now() - startTime

    // Check if this was a timeout
    if (duration >= 58000) {
      return NextResponse.json(
        {
          error: 'Import timed out. Please split file into smaller batches (<500 rows).',
          code: 'IMPORT_TIMEOUT',
        },
        { status: 408 }
      )
    }

    console.error('Error in POST /api/planning/purchase-orders/import/execute:', error)

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
