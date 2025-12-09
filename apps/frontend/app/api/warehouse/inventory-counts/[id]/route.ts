/**
 * API Route: Inventory Count Detail
 * Story 5.35: Inventory Count
 * GET /api/warehouse/inventory-counts/:id - Get count details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getCount, getCountItems } from '@/lib/services/inventory-count-service'

// GET /api/warehouse/inventory-counts/:id - Get count details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const count = await getCount(id)

    if (!count) {
      return NextResponse.json({ error: 'Count not found' }, { status: 404 })
    }

    // Verify org_id matches
    if (count.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const items = await getCountItems(id)

    return NextResponse.json({
      data: {
        ...count,
        items,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/inventory-counts/:id:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
