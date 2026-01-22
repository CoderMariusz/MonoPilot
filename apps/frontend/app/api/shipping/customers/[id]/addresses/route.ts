/**
 * API Route: Customer Addresses
 * Story: 07.1 - Customers CRUD
 *
 * GET /api/shipping/customers/:id/addresses - List addresses
 * POST /api/shipping/customers/:id/addresses - Create address
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAddressSchema } from '@/lib/validation/customer-schemas'
import {
  listAddresses,
  createAddress,
} from '@/lib/services/customer-service'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shipping/customers/:id/addresses
 * List addresses for a customer
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

    // Fetch addresses
    const addresses = await listAddresses(id)

    return NextResponse.json(addresses)
  } catch (error) {
    console.error('Error in GET /api/shipping/customers/:id/addresses:', error)

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shipping/customers/:id/addresses
 * Create an address for a customer
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const validatedData = createAddressSchema.parse(body)

    // Create address
    const address = await createAddress(id, validatedData)

    return NextResponse.json(address, { status: 201 })
  } catch (error) {
    // Safely log error (Zod errors may have non-serializable properties)
    console.error('Error in POST /api/shipping/customers/:id/addresses:', error instanceof Error ? error.message : 'Unknown error')

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
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
