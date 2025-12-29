/**
 * Routing BOM Usage API Route - Story 02.7
 *
 * GET /api/v1/technical/routings/:id/boms - Get BOMs using this routing
 *
 * Auth: Required
 * Used by: DeleteRoutingDialog to check usage before delete
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// ============================================================================
// GET /api/v1/technical/routings/:id/boms - Get Routing BOM Usage
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    // Verify routing exists and belongs to user's org
    const { data: routing, error: routingError } = await supabase
      .from('routings')
      .select('id')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (routingError || !routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    // Get BOMs using this routing with product info
    const { data: boms, error: bomsError, count } = await supabase
      .from('boms')
      .select(`
        id,
        version,
        status,
        effective_from,
        effective_to,
        product:products (
          id,
          code,
          name
        )
      `, { count: 'exact' })
      .eq('routing_id', id)
      .order('effective_from', { ascending: false })
      .limit(10)

    if (bomsError) {
      console.error('Query error:', bomsError)
      return NextResponse.json({ error: 'Failed to fetch BOM usage' }, { status: 500 })
    }

    // Format response
    const formattedBoms = (boms || []).map(bom => {
      // Product is a single object from the FK relation
      const product = bom.product as unknown as { id: string; code: string; name: string } | null
      return {
        id: bom.id,
        code: product?.code || 'Unknown',
        product_name: product?.name || 'Unknown Product',
        version: bom.version,
        is_active: bom.status === 'active',
        effective_from: bom.effective_from,
        effective_to: bom.effective_to,
      }
    })

    return NextResponse.json({
      data: {
        boms: formattedBoms,
        count: count || 0,
      },
    })
  } catch (error) {
    console.error('GET routing boms error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
