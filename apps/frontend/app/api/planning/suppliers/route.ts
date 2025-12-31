/**
 * API Route: Supplier Management
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * GET /api/planning/suppliers - List suppliers with filters and pagination
 * POST /api/planning/suppliers - Create new supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createSupplierSchema,
  supplierListQuerySchema,
} from '@/lib/validation/supplier-schema'
import {
  listSuppliers,
  createSupplier,
} from '@/lib/services/supplier-service'
import { ZodError } from 'zod'
import { validateOrigin, createCsrfErrorResponse } from '@/lib/csrf'

/**
 * GET /api/planning/suppliers
 * List suppliers with filters, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      status: searchParams.get('status') ?? undefined,
      currency: searchParams.getAll('currency[]') ?? undefined,
      payment_terms: searchParams.get('payment_terms') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      order: searchParams.get('order') ?? undefined,
    }

    // Validate query parameters
    const validatedParams = supplierListQuerySchema.parse(queryParams)

    // Fetch suppliers
    const result = await listSuppliers(validatedParams)

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
          ...(process.env.NODE_ENV === 'development' && {
            debug: error instanceof Error ? error.message : 'Unknown error',
          }),
        },
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/planning/suppliers
 * Create a new supplier
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection: Validate request origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, ...createCsrfErrorResponse() },
        { status: 403 }
      )
    }

    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createSupplierSchema.parse(body)

    // Create supplier
    const supplier = await createSupplier(validatedData)

    return NextResponse.json(
      {
        success: true,
        data: supplier,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/suppliers:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    // Handle business rule errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage === 'SUPPLIER_CODE_EXISTS') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUPPLIER_CODE_EXISTS',
            message: 'Supplier code already exists in organization',
          },
        },
        { status: 400 }
      )
    }

    if (errorMessage === 'TAX_CODE_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TAX_CODE_NOT_FOUND',
            message: 'Tax code not found',
          },
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
          ...(process.env.NODE_ENV === 'development' && {
            debug: errorMessage,
          }),
        },
      },
      { status: 500 }
    )
  }
}
