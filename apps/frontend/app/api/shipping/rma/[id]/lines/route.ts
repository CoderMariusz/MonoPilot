/**
 * API Route: RMA Line Management
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * POST /api/shipping/rma/:id/lines - Add line to RMA (pending only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { rmaLineSchema } from '@/lib/validation/rma-schemas'
import { addRMALine } from '@/lib/services/rma-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/shipping/rma/:id/lines
 * Add a line to an RMA (pending status only)
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

    // Check role permissions
    const allowedRoles = ['shipper', 'owner', 'admin', 'manager', 'sales']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/lines`,
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = rmaLineSchema.parse(body)

    // Add line
    const line = await addRMALine(id, validatedData)

    return NextResponse.json(line, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/shipping/rma/:id/lines:', error instanceof Error ? error.message : 'Unknown error')

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
          path: `/api/shipping/rma/${id}/lines`,
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
            code: 'RMA_NOT_FOUND',
            message: 'RMA not found',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/lines`,
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('Product not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/lines`,
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('Cannot modify non-pending RMA')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot modify non-pending RMA',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/lines`,
        },
        { status: 400 }
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
          path: `/api/shipping/rma/${id}/lines`,
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
        path: `/api/shipping/rma/${id}/lines`,
      },
      { status: 500 }
    )
  }
}
