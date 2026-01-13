/**
 * API Route: Export POs to Excel
 * Story 03.6: PO Bulk Operations
 *
 * POST /api/planning/purchase-orders/export
 *
 * Exports POs to Excel with 3 sheets: Summary, Lines, Metadata.
 * Can export by PO IDs or by filters.
 *
 * AC-04: Excel Export (3 Sheets)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { POExportRequestSchema } from '@/lib/validation/po-bulk-schemas'
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

    // Authorization: check planning:R permission (view is enough for export)
    if (!checkPOPermission(currentUser, 'view')) {
      return NextResponse.json(
        {
          error: `Forbidden: ${getPermissionRequirement('view')} required`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = POExportRequestSchema.parse(body)

    // Check export limit (1000 POs)
    if (validatedData.po_ids && validatedData.po_ids.length > 1000) {
      return NextResponse.json(
        {
          error: 'Export limited to 1000 POs. Please refine your selection.',
          code: 'EXPORT_LIMIT_EXCEEDED',
        },
        { status: 400 }
      )
    }

    // Generate Excel file
    let excelBuffer: Buffer
    try {
      excelBuffer = await POBulkService.exportPOsToExcel(
        validatedData.po_ids ?? undefined,
        validatedData.filters ?? undefined
      )
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'NO_DATA') {
          return NextResponse.json(
            {
              error: 'No POs found matching the criteria',
              code: 'NO_DATA',
            },
            { status: 404 }
          )
        }
        if (error.message === 'EXPORT_LIMIT_EXCEEDED') {
          return NextResponse.json(
            {
              error: 'Export limited to 1000 POs. Please refine your selection.',
              code: 'EXPORT_LIMIT_EXCEEDED',
            },
            { status: 400 }
          )
        }
      }
      throw error
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `POs_Export_${timestamp}.xlsx`

    // Return Excel file - convert Buffer to Uint8Array for BodyInit compatibility
    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${filename}`,
        'Content-Length': excelBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/export:', error)

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
