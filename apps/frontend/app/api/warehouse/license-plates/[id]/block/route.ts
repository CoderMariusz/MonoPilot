/**
 * Block License Plate API Route (Story 05.6)
 * PUT /api/warehouse/license-plates/:id/block
 *
 * Block an LP with mandatory reason
 *
 * Request Body:
 * - reason: string (required, max 500 chars)
 *
 * Business Rules:
 * - Reason is mandatory
 * - LP must be available to block
 * - Creates audit transaction entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { blockLP } from '@/lib/services/license-plate-detail-service'
import { ZodError } from 'zod'
import { z } from 'zod'

const blockLPSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be 500 characters or less'),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lpId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = blockLPSchema.parse(body)

    // Block LP using service
    const updatedLP = await blockLP(supabase, {
      lpId,
      reason: validatedData.reason,
    })

    return NextResponse.json({
      id: updatedLP.id,
      lp_number: updatedLP.lp_number,
      status: updatedLP.status,
      updated_at: updatedLP.updated_at,
      message: 'LP blocked successfully',
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('Reason is required')) {
        return NextResponse.json(
          { error: error.message, code: 'REASON_REQUIRED' },
          { status: 400 }
        )
      }
      if (error.message.includes('Reason must be 500')) {
        return NextResponse.json(
          { error: error.message, code: 'REASON_TOO_LONG' },
          { status: 400 }
        )
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'License Plate not found', code: 'LP_NOT_FOUND' },
          { status: 404 }
        )
      }
      if (error.message.includes('cannot be blocked')) {
        return NextResponse.json(
          { error: error.message, code: 'INVALID_STATUS' },
          { status: 400 }
        )
      }
    }

    console.error('Error in PUT /api/warehouse/license-plates/:id/block:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
