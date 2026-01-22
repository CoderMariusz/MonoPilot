/**
 * API Route: RMA Management
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * GET /api/shipping/rma - List RMAs with filters and pagination
 * POST /api/shipping/rma - Create new RMA with lines
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { rmaFormSchema, rmaListParamsSchema } from '@/lib/validation/rma-schemas'
import { listRMAs, createRMA } from '@/lib/services/rma-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

/**
 * GET /api/shipping/rma
 * List RMAs with filters, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      reason_code: searchParams.get('reason_code') ?? undefined,
      customer_id: searchParams.get('customer_id') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      sort_by: searchParams.get('sort_by') ?? undefined,
      sort_order: searchParams.get('sort_order') ?? undefined,
    }

    // Validate query parameters
    const validatedParams = rmaListParamsSchema.parse(queryParams)

    // Get RMAs
    const result = await listRMAs(validatedParams)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/shipping/rma:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: 'Invalid query parameters',
            details: error.errors,
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/rma',
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Organization not found')) {
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
 * POST /api/shipping/rma
 * Create a new RMA with lines
 */
export async function POST(request: NextRequest) {
  try {
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

    // Check role permissions (shipper, manager, admin can create)
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
          path: '/api/shipping/rma',
        },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = rmaFormSchema.parse(body)

    // Create RMA
    const rma = await createRMA(validatedData)

    return NextResponse.json(
      {
        rma,
        lines: rma.lines,
        permissions: rma.permissions,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/shipping/rma:', error instanceof Error ? error.message : 'Unknown error')

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
          path: '/api/shipping/rma',
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Customer not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer does not exist',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/rma',
        },
        { status: 400 }
      )
    }

    if (errorMessage.includes('Product not found')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'One or more products not found',
          },
          timestamp: new Date().toISOString(),
          path: '/api/shipping/rma',
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
