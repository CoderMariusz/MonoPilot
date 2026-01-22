/**
 * API Route: RMA Line Detail Management
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * PUT /api/shipping/rma/:id/lines/:lineId - Update line (pending RMA only)
 * DELETE /api/shipping/rma/:id/lines/:lineId - Delete line (pending RMA only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { rmaLineSchema } from '@/lib/validation/rma-schemas'
import { updateRMALine, deleteRMALine } from '@/lib/services/rma-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

interface RouteParams {
  params: Promise<{ id: string; lineId: string }>
}

/**
 * PUT /api/shipping/rma/:id/lines/:lineId
 * Update an RMA line (pending RMA only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, lineId } = await params

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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    // Use partial validation (exclude product_id which cannot be changed)
    const updateSchema = rmaLineSchema.partial().omit({ product_id: true })
    const validatedData = updateSchema.parse(body)

    // Update line
    const line = await updateRMALine(id, lineId, validatedData)

    return NextResponse.json(line)
  } catch (error) {
    console.error('Error in PUT /api/shipping/rma/:id/lines/:lineId:', error instanceof Error ? error.message : 'Unknown error')

    const { id, lineId } = await params

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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('RMA line not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'RMA line not found',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
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
        path: `/api/shipping/rma/${id}/lines/${lineId}`,
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shipping/rma/:id/lines/:lineId
 * Delete an RMA line (pending RMA only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, lineId } = await params

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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
        },
        { status: 403 }
      )
    }

    // Delete line
    await deleteRMALine(id, lineId)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/shipping/rma/:id/lines/:lineId:', error instanceof Error ? error.message : 'Unknown error')

    const { id, lineId } = await params
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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
        },
        { status: 404 }
      )
    }

    if (errorMessage.includes('RMA line not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'RMA line not found',
          },
          timestamp: new Date().toISOString(),
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
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
          path: `/api/shipping/rma/${id}/lines/${lineId}`,
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
        path: `/api/shipping/rma/${id}/lines/${lineId}`,
      },
      { status: 500 }
    )
  }
}
