/**
 * API Route: Set Default Address
 * Story: 07.1 - Customers CRUD
 *
 * PUT /api/shipping/customers/:id/addresses/:addressId/set-default - Set as default
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { setDefaultAddress } from '@/lib/services/customer-service'

interface RouteParams {
  params: Promise<{ id: string; addressId: string }>
}

/**
 * PUT /api/shipping/customers/:id/addresses/:addressId/set-default
 * Set an address as the default for its type
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

    // Set as default
    const address = await setDefaultAddress(id, addressId)

    return NextResponse.json(address)
  } catch (error) {
    console.error('Error in PUT /api/shipping/customers/:id/addresses/:addressId/set-default:', error)

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
