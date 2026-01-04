/**
 * ASN API Routes - ASN Items (Story 05.8)
 * POST /api/warehouse/asns/:id/items - Add item to ASN
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ASNService } from '@/lib/services/asn-service'
import { asnItemSchema } from '@/lib/validation/asn-schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validated = asnItemSchema.parse(body)

    const item = await ASNService.addASNItem(supabase, id, validated)

    return NextResponse.json(item, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
