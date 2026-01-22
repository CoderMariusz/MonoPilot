/**
 * API Route: Customer Address Detail
 * Story: 07.1 - Customers CRUD
 *
 * PUT /api/shipping/customers/:id/addresses/:addressId - Update address
 * DELETE /api/shipping/customers/:id/addresses/:addressId - Delete address
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateAddressSchema } from '@/lib/validation/customer-schemas'
import {
  updateAddress,
  deleteAddress,
} from '@/lib/services/customer-service'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string; addressId: string }>
}

/**
 * PUT /api/shipping/customers/:id/addresses/:addressId
 * Update an address
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, addressId } = await params
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
    const validatedData = updateAddressSchema.parse(body)

    // Update address
    const address = await updateAddress(id, addressId, validatedData)

    return NextResponse.json(address)
  } catch (error) {
    console.error('Error in PUT /api/shipping/customers/:id/addresses/:addressId:', error)

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
        { error: 'Address not found' },
        { status: 404 }
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
 * DELETE /api/shipping/customers/:id/addresses/:addressId
 * Delete an address
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, addressId } = await params
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

    // Delete address
    await deleteAddress(id, addressId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/shipping/customers/:id/addresses/:addressId:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
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
