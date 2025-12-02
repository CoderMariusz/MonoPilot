/**
 * POST /api/production/work-orders/:id/operations/:opId/complete
 * Story 4.5: Complete an operation
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
    let body: { actual_duration_minutes?: number; notes?: string } = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // Empty body is OK
    }

    // Complete the operation
    const result = await completeOperation(
      woId,
      operationId,
      userRecord.id,
      userRecord.role,
      userRecord.org_id,
      body.actual_duration_minutes,
      body.notes,
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
