/**
 * API Route: Pick Lists
 * Story: 07.8 - Pick List Generation + Wave Picking
 *
 * GET /api/shipping/pick-lists - List pick lists with filters and pagination
 * POST /api/shipping/pick-lists - Create pick list from sales orders
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'
import {
  createPickListSchema,
  pickListFiltersSchema,
  PICK_LIST_CREATE_ROLES,
} from '@/lib/validation/pick-list-schemas'
import { PickListService, PickListError } from '@/lib/services/pick-list-service'
import { ZodError } from 'zod'

/**
 * GET /api/shipping/pick-lists
 * List pick lists with filters, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      status: searchParams.get('status') ?? undefined,
      assigned_to: searchParams.get('assigned_to') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      date_from: searchParams.get('date_from') ?? undefined,
      date_to: searchParams.get('date_to') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort_by: searchParams.get('sort_by') ?? undefined,
      sort_order: searchParams.get('sort_order') ?? undefined,
    }

    // Validate query parameters
    const filters = pickListFiltersSchema.parse(queryParams)

    // List pick lists
    const result = await PickListService.listPickLists(supabase, orgId, filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/shipping/pick-lists:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof PickListError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shipping/pick-lists
 * Create a new pick list from sales orders
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

    // Check role permissions
    const permissionError = checkPermission(authContext, PICK_LIST_CREATE_ROLES)
    if (permissionError) {
      return permissionError
    }

    const { userId, orgId } = authContext

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createPickListSchema.parse(body)

    // Create pick list
    const result = await PickListService.createPickList(
      supabase,
      orgId,
      userId,
      validatedData
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/shipping/pick-lists:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors[0]?.message || 'Validation failed',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof PickListError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
