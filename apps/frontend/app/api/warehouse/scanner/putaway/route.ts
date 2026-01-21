/**
 * Scanner Putaway API Route (Story 05.21)
 * POST /api/warehouse/scanner/putaway - Execute putaway transaction
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { scannerPutawaySchema } from '@/lib/validation/scanner-putaway'
import { ScannerPutawayService } from '@/lib/services/scanner-putaway-service'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

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
    const validated = scannerPutawaySchema.parse(body)

    // Pre-validate putaway
    const validation = await ScannerPutawayService.validatePutaway(supabase, {
      lpId: validated.lp_id,
      locationId: validated.location_id,
      suggestedLocationId: validated.suggested_location_id || undefined,
    })

    if (!validation.valid) {
      const firstError = validation.errors[0]

      // Determine specific error type
      if (firstError.message.includes('not found')) {
        if (firstError.field === 'lp_id') {
          return NextResponse.json({ error: firstError.message }, { status: 404 })
        }
        return NextResponse.json({ error: firstError.message }, { status: 400 })
      }

      if (firstError.message.includes('not available')) {
        return NextResponse.json({ error: firstError.message }, { status: 400 })
      }

      if (firstError.message.includes('warehouse')) {
        return NextResponse.json({ error: firstError.message }, { status: 400 })
      }

      return NextResponse.json({ error: firstError.message }, { status: 400 })
    }

    // Process putaway
    const result = await ScannerPutawayService.processPutaway(supabase, {
      lpId: validated.lp_id,
      locationId: validated.location_id,
      suggestedLocationId: validated.suggested_location_id || undefined,
      override: validated.override,
      overrideReason: validated.override_reason || undefined,
    })

    return NextResponse.json(
      {
        stock_move: result.stockMove,
        lp: result.lp,
        override_applied: result.overrideApplied,
        suggested_location_code: result.suggestedLocationCode,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('LP not found')) {
      return NextResponse.json({ error: 'LP not found' }, { status: 404 })
    }

    if (errorMessage.includes('not available')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (errorMessage.includes('Location not found')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    console.error('Scanner putaway error:', error)
    return NextResponse.json(
      { error: 'Failed to process putaway' },
      { status: 500 }
    )
  }
}
