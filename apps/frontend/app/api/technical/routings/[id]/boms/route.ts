import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Routing BOMs Usage API Route - Story 02.7
 *
 * GET /api/technical/routings/:id/boms
 * Returns list of BOMs using this routing
 *
 * AC-02.7.23: Delete with BOM usage check
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routingId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user's org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if routing exists and belongs to user's org
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .select('id')
      .eq('id', routingId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (routingError || !routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    // Query BOMs using this routing
    // Note: routing_id column will be added in Story 2.25, but we handle gracefully
    try {
      const { data: boms, error: bomsError } = await supabase
        .from('boms')
        .select('id, code, product_name, is_active')
        .eq('routing_id', routingId)
        .eq('org_id', currentUser.org_id)
        .order('code', { ascending: true })

      if (bomsError) {
        // If column doesn't exist yet, return empty list
        if (bomsError.code === '42703') {
          return NextResponse.json(
            {
              success: true,
              data: { boms: [], count: 0 },
            },
            { status: 200 }
          )
        }
        throw bomsError
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            boms: boms || [],
            count: boms?.length || 0,
          },
        },
        { status: 200 }
      )
    } catch (error) {
      // Gracefully handle if routing_id column doesn't exist yet
      return NextResponse.json(
        {
          success: true,
          data: { boms: [], count: 0 },
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/technical/routings/:id/boms:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
