/**
 * API Route: Assign LPs to TO Line
 * Story: 03.9b - TO License Plate Pre-selection
 *
 * POST /api/planning/transfer-orders/:id/lines/:lineId/assign-lps
 *
 * Assigns License Plates to a Transfer Order line.
 *
 * Request Body:
 * {
 *   lps: Array<{ lp_id: string, quantity: number }>
 * }
 *
 * Response (200):
 * {
 *   success: true,
 *   data: {
 *     assignments: Array<TOLineLPAssignment>,
 *     total_assigned: number,
 *     total_required: number,
 *     is_complete: boolean
 *   },
 *   message: "X License Plates assigned successfully"
 * }
 *
 * Errors:
 * - 400: Validation error, business rule violation
 * - 401: Not authenticated
 * - 404: TO or TO line not found
 * - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { AssignLPsRequestSchema } from '@/lib/validation/to-lp-validation'
import { assignLPsToTOLine, TOLPErrorCode } from '@/lib/services/to-lp-service'
import { ZodError } from 'zod'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: toId, lineId: toLineId } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = AssignLPsRequestSchema.parse(body)

    // Call service method
    const result = await assignLPsToTOLine(toId, toLineId, validatedData.lps)

    if (!result.success) {
      // Determine appropriate status code
      let status = 400

      switch (result.code) {
        case TOLPErrorCode.TO_NOT_FOUND:
        case TOLPErrorCode.TO_LINE_NOT_FOUND:
        case TOLPErrorCode.LP_NOT_FOUND:
          status = 404
          break
        case TOLPErrorCode.INVALID_STATUS:
        case TOLPErrorCode.LP_NOT_IN_WAREHOUSE:
        case TOLPErrorCode.LP_PRODUCT_MISMATCH:
        case TOLPErrorCode.INSUFFICIENT_QUANTITY:
        case TOLPErrorCode.DUPLICATE_ASSIGNMENT:
        case TOLPErrorCode.QUANTITY_MISMATCH:
          status = 400
          break
        default:
          status = 500
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.code,
            message: result.error,
          },
        },
        { status }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          assignments: result.data?.assignments,
          total_assigned: result.data?.total_assigned,
          total_required: result.data?.total_required,
          is_complete: result.data?.is_complete,
        },
        message: result.data?.message,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/lines/:lineId/assign-lps:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Invalid request data',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
