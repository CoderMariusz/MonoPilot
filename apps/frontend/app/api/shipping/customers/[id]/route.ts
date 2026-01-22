/**
 * API Route: Customer Detail
 * Story: 07.1 - Customers CRUD
 *
 * GET /api/shipping/customers/:id - Get customer with contacts/addresses
 * PUT /api/shipping/customers/:id - Update customer
 * DELETE /api/shipping/customers/:id - Archive customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateCustomerSchema } from '@/lib/validation/customer-schemas'
import {
  getCustomer,
  updateCustomer,
  archiveCustomer,
} from '@/lib/services/customer-service'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shipping/customers/:id
 * Get customer with contacts and addresses
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch customer
    const customer = await getCustomer(id)

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error in GET /api/shipping/customers/:id:', error)

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/shipping/customers/:id
 * Update customer
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    // Check if customer_code is being changed (not allowed)
    if (body.customer_code !== undefined) {
      return NextResponse.json(
        {
          error: 'Bad Request',
          message: 'Cannot modify customer_code',
        },
        { status: 400 }
      )
    }

    const validatedData = updateCustomerSchema.parse(body)

    // Update customer
    const customer = await updateCustomer(id, validatedData)

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error in PUT /api/shipping/customers/:id:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (errorMessage.includes('open orders')) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Cannot deactivate customer with open orders',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/shipping/customers/:id
 * Archive customer (set is_active=false)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Archive customer
    const customer = await archiveCustomer(id)

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error in DELETE /api/shipping/customers/:id:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    if (errorMessage.includes('open orders')) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Cannot archive customer with open orders',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
