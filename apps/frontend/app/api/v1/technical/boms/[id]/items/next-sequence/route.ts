/**
 * BOM Items Next Sequence API Route (Story 02.5a)
 *
 * GET /api/v1/technical/boms/:id/items/next-sequence - Get next sequence number
 *
 * Returns max(sequence) + 10, or 10 for empty BOM
 *
 * Auth: Required
 * Roles: All authenticated users (technical.R)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { NextSequenceResponse } from '@/lib/types/bom-items'

/**
 * GET /api/v1/technical/boms/:id/items/next-sequence
 * Get next available sequence number for a BOM
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bomId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify BOM exists (RLS enforces org isolation)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Get max sequence
    const { data: maxSeqItem, error: seqError } = await supabase
      .from('bom_items')
      .select('sequence')
      .eq('bom_id', bomId)
      .order('sequence', { ascending: false })
      .limit(1)
      .single()

    // Calculate next sequence (max + 10, or 10 if empty)
    const nextSequence = seqError || !maxSeqItem ? 10 : maxSeqItem.sequence + 10

    const response: NextSequenceResponse = {
      next_sequence: nextSequence,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('GET /api/v1/technical/boms/[id]/items/next-sequence error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
