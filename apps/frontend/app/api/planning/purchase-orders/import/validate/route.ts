/**
 * API Route: Import Validate
 * Story 03.6: PO Bulk Operations
 *
 * POST /api/planning/purchase-orders/import/validate
 *
 * Parses and validates an import file without creating POs.
 * Returns a preview with validation results per row.
 *
 * AC-02: Excel/CSV Import with Validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { POBulkService } from '@/lib/services/po-bulk-service'
import { MAX_FILE_SIZE_BYTES } from '@/lib/services/excel-service'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'

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

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          error: 'No file provided',
          code: 'MISSING_FILE',
        },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: 'File exceeds 5MB limit',
          code: 'FILE_TOO_LARGE',
        },
        { status: 400 }
      )
    }

    // Parse file
    let parsedData
    try {
      parsedData = await POBulkService.parseImportFile(file)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'INVALID_FILE_FORMAT') {
          return NextResponse.json(
            {
              error: 'Invalid file format. Please upload .xlsx or .csv file.',
              code: 'INVALID_FILE_FORMAT',
            },
            { status: 400 }
          )
        }
        if (error.message.startsWith('MISSING_COLUMNS:')) {
          const missingCols = error.message.replace('MISSING_COLUMNS:', '')
          return NextResponse.json(
            {
              error: `Missing required column: ${missingCols}`,
              code: 'MISSING_COLUMNS',
              missing: missingCols.split(','),
            },
            { status: 400 }
          )
        }
        if (error.message === 'EMPTY_FILE') {
          return NextResponse.json(
            {
              error: 'File is empty or has no data rows',
              code: 'EMPTY_FILE',
            },
            { status: 400 }
          )
        }
      }
      throw error
    }

    // Check row limit (500)
    if (parsedData.rows.length > 500) {
      return NextResponse.json(
        {
          error: 'File exceeds 500 row limit. Please split into smaller files.',
          code: 'ROW_LIMIT_EXCEEDED',
          row_count: parsedData.rows.length,
        },
        { status: 400 }
      )
    }

    // Validate data
    const validationResult = await POBulkService.validateImportData(parsedData.rows)

    return NextResponse.json(validationResult, { status: 200 })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/import/validate:', error)

    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
