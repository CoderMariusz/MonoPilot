/**
 * POST /api/production/work-orders/:id/operations/:opId/start
 * Story 4.4: Start an operation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { startOperation, OperationError } from '@/lib/services/operation-service'

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

    // Parse optional request body for started_at override
    let startedAt: string | undefined
    try {
      const text = await request.text()
      if (text) {
        const body = JSON.parse(text)
        startedAt = body.started_at
      }
    } catch {
      // Empty body is OK
    }

    // Start the operation
    const result = await startOperation(woId, operationId, userRecord.id, userRecord.role, userRecord.org_id, startedAt)

    return NextResponse.json({
      data: result,
      message: 'Operation started successfully',
    })
  } catch (error) {
    if (error instanceof OperationError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.statusCode },
      )
    }

    console.error('Start operation error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}
