/**
 * ASN API Routes - Create from PO (Story 05.8)
 * POST /api/warehouse/asns/from-po/:poId - Create ASN from PO with auto-populated items
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ASNService } from '@/lib/services/asn-service'
import { createASNFromPOSchema } from '@/lib/validation/asn-schemas'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ poId: string }> }
) {
  try {
    const { poId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check feature flag
    const { data: settings } = await supabase
      .from('warehouse_settings')
      .select('enable_asn')
      .single()

    if (!settings?.enable_asn) {
      return NextResponse.json({ error: 'Feature disabled' }, { status: 403 })
    }

    const body = await request.json()

    // Validate input
    const validated = createASNFromPOSchema.parse({
      ...body,
      po_id: poId,
    })

    // Create ASN from PO with created_by
    const asn = await ASNService.createASNFromPO(supabase, validated, user.id)

    return NextResponse.json(asn, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    if (error.message === 'Cannot create ASN for fully received PO') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
