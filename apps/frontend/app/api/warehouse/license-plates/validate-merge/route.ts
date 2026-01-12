/**
 * POST /api/warehouse/license-plates/validate-merge
 * Story 05.18: LP Merge Workflow - Validate Merge Eligibility (AC-13, AC-14)
 *
 * Validates if LPs are eligible for merge operation.
 * Returns validation result with errors or summary.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateMergeSchema } from '@/lib/validation/lp-merge-schemas'
import { LicensePlateService } from '@/lib/services/license-plate-service'

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()

    const parseResult = validateMergeSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      )
    }

    const { sourceLpIds } = parseResult.data

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

    // Validate merge eligibility
    const validationResult = await LicensePlateService.validateMerge(
      supabase,
      sourceLpIds
    )

    // Return validation result (AC-13, AC-14)
    return NextResponse.json({
      valid: validationResult.valid,
      errors: validationResult.errors,
      summary: validationResult.summary || null,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Handle specific error types
    if (message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 404 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
