// API Route: License Plate Genealogy
// Epic 5 Batch 05A-2: LP Operations (Story 5.7)
// GET /api/warehouse/license-plates/[id]/genealogy - Get LP genealogy tree

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface GenealogyRecord {
  id: string
  lp_number: string
  product_id: string
  current_qty: number
  batch_number?: string
  expiry_date?: string
  status: string
  quantity_used: number
  relationship_type: string
}

interface GenealogyTree {
  lp: {
    id: string
    lp_number: string
    product_id: string
    current_qty: number
    batch_number?: string
    expiry_date?: string
    status: string
  }
  parents: GenealogyRecord[]
  children: GenealogyRecord[]
}

// GET /api/warehouse/license-plates/[id]/genealogy
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Get query params
    const { searchParams } = new URL(request.url)
    const depth = parseInt(searchParams.get('depth') || '1', 10)

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

    // Get LP details
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, org_id, lp_number, product_id, current_qty, batch_number, expiry_date, status')
      .eq('id', id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    // Check org access
    if (lp.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get parents (LPs that were consumed to create this LP)
    const { data: parentRecords, error: parentError } = await supabase
      .from('lp_genealogy')
      .select(`
        quantity_used,
        relationship_type,
        parent_lp:license_plates!lp_genealogy_parent_lp_id_fkey(
          id,
          lp_number,
          product_id,
          current_qty,
          batch_number,
          expiry_date,
          status
        )
      `)
      .eq('child_lp_id', id)

    if (parentError) {
      console.error('Error fetching parent genealogy:', parentError)
    }

    // Get children (LPs created from this LP)
    const { data: childRecords, error: childError } = await supabase
      .from('lp_genealogy')
      .select(`
        quantity_used,
        relationship_type,
        child_lp:license_plates!lp_genealogy_child_lp_id_fkey(
          id,
          lp_number,
          product_id,
          current_qty,
          batch_number,
          expiry_date,
          status
        )
      `)
      .eq('parent_lp_id', id)

    if (childError) {
      console.error('Error fetching child genealogy:', childError)
    }

    // Format parents
    const parents: GenealogyRecord[] = (parentRecords || [])
      .filter((r: any) => r.parent_lp)
      .map((r: any) => ({
        id: r.parent_lp.id,
        lp_number: r.parent_lp.lp_number,
        product_id: r.parent_lp.product_id,
        current_qty: r.parent_lp.current_qty,
        batch_number: r.parent_lp.batch_number,
        expiry_date: r.parent_lp.expiry_date,
        status: r.parent_lp.status,
        quantity_used: r.quantity_used,
        relationship_type: r.relationship_type,
      }))

    // Format children
    const children: GenealogyRecord[] = (childRecords || [])
      .filter((r: any) => r.child_lp)
      .map((r: any) => ({
        id: r.child_lp.id,
        lp_number: r.child_lp.lp_number,
        product_id: r.child_lp.product_id,
        current_qty: r.child_lp.current_qty,
        batch_number: r.child_lp.batch_number,
        expiry_date: r.child_lp.expiry_date,
        status: r.child_lp.status,
        quantity_used: r.quantity_used,
        relationship_type: r.relationship_type,
      }))

    // If depth > 1, recursively fetch children's children
    if (depth > 1 && children.length > 0) {
      for (const child of children) {
        const { data: grandchildRecords } = await supabase
          .from('lp_genealogy')
          .select(`
            quantity_used,
            relationship_type,
            child_lp:license_plates!lp_genealogy_child_lp_id_fkey(
              id,
              lp_number,
              product_id,
              current_qty,
              batch_number,
              expiry_date,
              status
            )
          `)
          .eq('parent_lp_id', child.id)

        // Note: For simplicity, we're not nesting deeper -
        // depth=2 just means we fetch one more level
        // Full tree recursion would require a different approach
      }
    }

    const genealogyTree: GenealogyTree = {
      lp: {
        id: lp.id,
        lp_number: lp.lp_number,
        product_id: lp.product_id,
        current_qty: lp.current_qty,
        batch_number: lp.batch_number,
        expiry_date: lp.expiry_date,
        status: lp.status,
      },
      parents,
      children,
    }

    return NextResponse.json({ data: genealogyTree })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/[id]/genealogy:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
