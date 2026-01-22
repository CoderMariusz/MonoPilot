/**
 * API Route: RMA Detail Management
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * GET /api/shipping/rma/:id - Get RMA detail with lines
 * PUT /api/shipping/rma/:id - Update RMA (pending only)
 * DELETE /api/shipping/rma/:id - Delete RMA (pending only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { rmaUpdateSchema } from '@/lib/validation/rma-schemas'
import { getRMA, updateRMA, deleteRMA } from '@/lib/services/rma-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shipping/rma/:id
 * Get RMA detail with lines and permissions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Get RMA
    const rma = await getRMA(id)

    if (!rma) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'RMA not found',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      rma,
      lines: rma.lines,
      permissions: rma.permissions,
    })
  } catch (error) {
    console.error('Error in GET /api/shipping/rma/:id:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Organization not found') || errorMessage.includes('User not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/rma',
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
        path: '/api/shipping/rma',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/shipping/rma/:id
 * Update RMA (pending status only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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
          path: `/api/shipping/rma/${id}`,
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = rmaUpdateSchema.parse(body)

    // Update RMA
    const rma = await updateRMA(id, validatedData)

    return NextResponse.json({
      rma,
      lines: rma.lines,
      permissions: rma.permissions,
    })
  } catch (error) {
    console.error('Error in PUT /api/shipping/rma/:id:', error instanceof Error ? error.message : 'Unknown error')

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
          path: `/api/shipping/rma/${id}`,
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
          path: `/api/shipping/rma/${id}`,
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('Cannot edit non-pending RMA')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot edit non-pending RMA',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}`,
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
          path: `/api/shipping/rma/${id}`,
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
        path: `/api/shipping/rma/${id}`,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shipping/rma/:id
 * Delete RMA (pending status only, cascade deletes lines)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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
          path: `/api/shipping/rma/${id}`,
        },
        { status: 403 }
      )
    }

    // Delete RMA
    await deleteRMA(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/shipping/rma/:id:', error instanceof Error ? error.message : 'Unknown error')

    const { id } = await params
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
          path: `/api/shipping/rma/${id}`,
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('Cannot delete non-pending RMA')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot delete non-pending RMA',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}`,
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
          path: `/api/shipping/rma/${id}`,
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
        path: `/api/shipping/rma/${id}`,
      },
      { status: 500 }
    )
  }
}
