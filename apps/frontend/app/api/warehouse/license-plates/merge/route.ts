/**
 * POST /api/warehouse/license-plates/merge
 * Story 05.18: LP Merge Workflow - Perform Merge Operation (AC-9, AC-10, AC-12)
 *
 * Merges multiple LPs into a single consolidated LP.
 * Returns new LP details on success.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mergeLPSchema } from '@/lib/validation/lp-merge-schemas'
import { LicensePlateService } from '@/lib/services/license-plate-service'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()

    const parseResult = mergeLPSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const { sourceLpIds, targetLocationId } = parseResult.data

    // Create Supabase client
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Perform merge operation
    const result = await LicensePlateService.merge(supabase, {
      sourceLpIds,
      targetLocationId: targetLocationId || undefined,
    })

    // Return success response (AC-9, AC-10)
    return NextResponse.json(
      {
        newLpId: result.newLpId,
        newLpNumber: result.newLpNumber,
        mergedQuantity: result.mergedQuantity,
        sourceLpIds: result.sourceLpIds,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific error types
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    if (message.includes('validation failed')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (message.includes('same product') ||
        message.includes('batch number') ||
        message.includes('expiry date') ||
        message.includes('QA status') ||
        message.includes("status='available'") ||
        message.includes('same warehouse') ||
        message.includes('same UoM') ||
        message.includes('At least 2')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (message.includes('no longer available') ||
        message.includes('status changed')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
