/**
 * API Route: Customer Contact Detail
 * Story: 07.1 - Customers CRUD
 *
 * PUT /api/shipping/customers/:id/contacts/:contactId - Update contact
 * DELETE /api/shipping/customers/:id/contacts/:contactId - Delete contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateContactSchema } from '@/lib/validation/customer-schemas'
import {
  updateContact,
  deleteContact,
} from '@/lib/services/customer-service'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string; contactId: string }>
}

/**
 * PUT /api/shipping/customers/:id/contacts/:contactId
 * Update a contact
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, contactId } = await params
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
    const validatedData = updateContactSchema.parse(body)

    // Update contact
    const contact = await updateContact(id, contactId, validatedData)

    return NextResponse.json(contact)
  } catch (error) {
    console.error('Error in PUT /api/shipping/customers/:id/contacts/:contactId:', error)

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
        { error: 'Contact not found' },
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
 * DELETE /api/shipping/customers/:id/contacts/:contactId
 * Delete a contact
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, contactId } = await params
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

    // Delete contact
    await deleteContact(id, contactId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/shipping/customers/:id/contacts/:contactId:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('not found')) {
      return NextResponse.json(
        { error: 'Contact not found' },
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
