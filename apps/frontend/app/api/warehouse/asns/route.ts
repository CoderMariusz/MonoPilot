/**
 * ASN API Routes - List and Create (Story 05.8)
 * GET /api/warehouse/asns - List ASNs with filters
 * POST /api/warehouse/asns - Create ASN
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ASNService } from '@/lib/services/asn-service'
import { createASNSchema } from '@/lib/validation/asn-schemas'

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

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const statusParam = searchParams.get('status')
    const filters = {
      search: searchParams.get('search') || undefined,
      status: (statusParam && ['pending', 'partial', 'received', 'cancelled'].includes(statusParam)
        ? statusParam as 'pending' | 'partial' | 'received' | 'cancelled'
        : undefined),
      supplier_id: searchParams.get('supplier_id') || undefined,
      po_id: searchParams.get('po_id') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: (searchParams.get('order') || 'desc') as 'asc' | 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    }

    const asns = await ASNService.listASNs(supabase, filters)

    // Get total count for pagination
    const { count } = await supabase
      .from('asns')
      .select('*', { count: 'exact', head: true })

    const total = count || 0
    const limit = filters.limit || 20
    const page = filters.page || 1
    const pages = Math.ceil(total / limit)

    return NextResponse.json(
      {
        data: asns,
        meta: {
          page,
          limit,
          total,
          pages,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()

    // Extract header and items from body
    const { items, ...headerData } = body

    // Validate input
    const validated = createASNSchema.parse({ header: headerData, items: items || [] })

    // Create ASN with created_by
    const asn = await ASNService.createASN(supabase, {
      ...validated.header,
      items: validated.items,
    }, user.id)

    return NextResponse.json(asn, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
