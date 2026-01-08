/**
 * POST /api/production/work-orders/:id/operations/:opId/complete
 * Story 04.3: Complete an operation with yield capture
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { completeOperation, OperationError } from '@/lib/services/operation-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; opId: string }> },
) {
  try {
    const { id: woId, opId: operationId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Authentication required' }, { status: 401 })
    }

    // Get user details with role and org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'Unauthorized', message: 'User not found' }, { status: 401 })
    }

    // Parse request body
    let body: Record<string, unknown> = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // Empty body is OK - will fail yield validation below
    }

    // Validate yield is provided
    if (body.actual_yield_percent === undefined || body.actual_yield_percent === null) {
      return NextResponse.json(
        { error: 'MISSING_YIELD', message: 'Yield percent is required to complete operation' },
        { status: 400 },
      )
    }

    // Validate yield range (0-100)
    const yieldPercent = Number(body.actual_yield_percent)
    if (isNaN(yieldPercent) || yieldPercent < 0 || yieldPercent > 100) {
      return NextResponse.json(
        { error: 'INVALID_YIELD', message: 'Yield must be between 0 and 100' },
        { status: 400 },
      )
    }

    // Validate notes length if provided
    if (body.notes !== undefined && typeof body.notes === 'string' && body.notes.length > 2000) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Notes must be 2000 characters or less' },
        { status: 400 },
      )
    }

    // Complete the operation
    const result = await completeOperation(
      woId,
      operationId,
      userRecord.id,
      userRecord.role,
      userRecord.org_id,
      body.actual_duration_minutes as number | undefined,
      body.notes as string | undefined,
      yieldPercent,
    )

    return NextResponse.json({
      data: result,
      message: 'Operation completed successfully',
    })
  } catch (error) {
    if (error instanceof OperationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      )
    }

    console.error('Complete operation error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
