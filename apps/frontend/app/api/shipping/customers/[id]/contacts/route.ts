/**
 * API Route: Customer Contacts
 * Story: 07.1 - Customers CRUD
 *
 * GET /api/shipping/customers/:id/contacts - List contacts
 * POST /api/shipping/customers/:id/contacts - Create contact
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createContactSchema } from '@/lib/validation/customer-schemas'
import {
  listContacts,
  createContact,
} from '@/lib/services/customer-service'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/shipping/customers/:id/contacts
 * List contacts for a customer
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

    // Fetch contacts
    const contacts = await listContacts(id)

    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Error in GET /api/shipping/customers/:id/contacts:', error)

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shipping/customers/:id/contacts
 * Create a contact for a customer
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
    const validatedData = createContactSchema.parse(body)

    // Create contact
    const contact = await createContact(id, validatedData)

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/shipping/customers/:id/contacts:', error)

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

    if (errorMessage.includes('already exists')) {
      return NextResponse.json(
        {
          error: 'Conflict',
          message: 'Contact with this email already exists for this customer',
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
