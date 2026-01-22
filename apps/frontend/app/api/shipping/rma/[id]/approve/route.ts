/**
 * API Route: RMA Approval
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * POST /api/shipping/rma/:id/approve - Approve RMA (MANAGER+ only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { rmaApproveSchema } from '@/lib/validation/rma-schemas'
import { approveRMA } from '@/lib/services/rma-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/shipping/rma/:id/approve
 * Approve an RMA (pending -> approved, MANAGER+ only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Check role permissions (MANAGER+ only)
    const allowedRoles = ['owner', 'admin', 'manager']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only MANAGER+ can approve',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = rmaApproveSchema.parse(body)

    if (!validatedData.confirmation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Confirmation is required',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 400 }
      )
    }

    // Approve RMA
    const rma = await approveRMA(id)

    return NextResponse.json({
      rma,
      lines: rma.lines,
      permissions: rma.permissions,
    })
  } catch (error) {
    console.error('Error in POST /api/shipping/rma/:id/approve:', error instanceof Error ? error.message : 'Unknown error')

    const { id } = await params

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('RMA not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'RMA not found',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('RMA is not pending')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'RMA is not pending',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 400 }
      )
    }

    if (errorMessage.includes('RMA must have at least one line')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_LINES',
            message: 'RMA must have at least one line',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 400 }
      )
    }

    if (errorMessage.includes('Only MANAGER+ can approve')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only MANAGER+ can approve',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 403 }
      )
    }

    if (errorMessage.includes('Organization not found') || errorMessage.includes('User not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/approve`,
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
        timestamp: new Date().toISOString(),
        path: `/api/shipping/rma/${id}/approve`,
      },
      { status: 500 }
    )
  }
}
