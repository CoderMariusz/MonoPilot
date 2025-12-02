/**
 * API Route: Start Work Order
 * Epic 4 Story 4.2 - AC-4.2.5
 * POST /api/production/work-orders/:id/start
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { startWorkOrder, WOStartError } from '@/lib/services/wo-start-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Not logged in' }, { status: 401 })
    }

    // Get current user with role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // AC-4.2.7: Role-based authorization
    const allowedRoles = ['admin', 'manager', 'production_manager', 'operator']
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Insufficient permissions to start work orders',
        },
        { status: 403 },
      )
    }

    // Start the WO
    const startedWO = await startWorkOrder(woId, currentUser.id, currentUser.org_id)

    return NextResponse.json(
      {
        data: startedWO,
        message: 'Work order started successfully',
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof WOStartError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode },
      )
    }

    console.error('Error in POST /api/production/work-orders/:id/start:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to start WO. Please try again.' },
      { status: 500 },
    )
  }
}
