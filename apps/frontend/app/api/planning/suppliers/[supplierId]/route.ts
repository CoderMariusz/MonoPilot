/**
 * API Route: Individual Supplier Operations
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * GET /api/planning/suppliers/:id - Get supplier by ID
 * PUT /api/planning/suppliers/:id - Update supplier
 * DELETE /api/planning/suppliers/:id - Delete supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateSupplierSchema } from '@/lib/validation/supplier-schema'
import {
  getSupplier,
  updateSupplier,
  deleteSupplier,
} from '@/lib/services/supplier-service'
import { ZodError } from 'zod'
import { validateOrigin, createCsrfErrorResponse } from '@/lib/csrf'

/**
 * GET /api/planning/suppliers/:id
 * Get supplier details with tax code
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId: id } = await params
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

    // Fetch supplier
    const supplier = await getSupplier(id)

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUPPLIER_NOT_FOUND',
            message: 'Supplier not found',
          },
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: supplier,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/:id:', error)

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
 * PUT /api/planning/suppliers/:id
 * Update supplier
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    // CSRF Protection: Validate request origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, ...createCsrfErrorResponse() },
        { status: 403 }
      )
    }

    const { supplierId: id } = await params
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
    const validatedData = updateSupplierSchema.parse(body)

    // Update supplier
    const supplier = await updateSupplier(id, validatedData)

    return NextResponse.json({
      success: true,
      data: supplier,
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/suppliers/:id:', error)

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

    if (errorMessage === 'SUPPLIER_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUPPLIER_NOT_FOUND',
            message: 'Supplier not found',
          },
        },
        { status: 404 }
      )
    }

    if (errorMessage === 'SUPPLIER_CODE_LOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUPPLIER_CODE_LOCKED',
            message: 'Cannot change code - supplier has purchase orders',
          },
        },
        { status: 400 }
      )
    }

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

/**
 * DELETE /api/planning/suppliers/:id
 * Delete supplier (if no POs or products)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    // CSRF Protection: Validate request origin
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, ...createCsrfErrorResponse() },
        { status: 403 }
      )
    }

    const { supplierId: id } = await params
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

    // Delete supplier
    await deleteSupplier(id)

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: 'Supplier deleted successfully',
      },
    })
  } catch (error) {
    console.error('Error in DELETE /api/planning/suppliers/:id:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage === 'SUPPLIER_NOT_FOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUPPLIER_NOT_FOUND',
            message: 'Supplier not found',
          },
        },
        { status: 404 }
      )
    }

    if (errorMessage === 'SUPPLIER_HAS_PURCHASE_ORDERS') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUPPLIER_HAS_PURCHASE_ORDERS',
            message: 'Cannot delete supplier with existing purchase orders',
          },
        },
        { status: 400 }
      )
    }

    if (errorMessage === 'SUPPLIER_HAS_PRODUCTS') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SUPPLIER_HAS_PRODUCTS',
            message: 'Cannot delete supplier with assigned products',
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
