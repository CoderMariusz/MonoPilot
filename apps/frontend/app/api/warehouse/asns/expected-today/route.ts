/**
 * ASN API Routes - Expected Today (Story 05.8)
 * GET /api/warehouse/asns/expected-today - Get ASNs expected today for dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ASNService } from '@/lib/services/asn-service'

export async function GET(request: NextRequest) {
  try {
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

    const asns = await ASNService.getExpectedTodayASNs(supabase)

    return NextResponse.json({ asns }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
