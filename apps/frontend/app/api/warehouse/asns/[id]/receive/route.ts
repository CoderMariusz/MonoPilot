/**
 * ASN Receive API Routes (Story 05.9)
 * GET /api/warehouse/asns/:id/receive - Get ASN receive preview
 * POST /api/warehouse/asns/:id/receive - Execute receive (create GRN + LPs)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ASNReceiveService } from '@/lib/services/asn-receive-service'
import { asnReceiveRequestSchema } from '@/lib/validation/asn-receive'
import { ZodError } from 'zod'

/**
 * GET - Receive Preview
 * Returns ASN header + items with remaining quantities
 */
export async function GET(
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

    // Get org_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    // Get receive preview
    const preview = await ASNReceiveService.getASNReceivePreview(
      id,
      profile.org_id,
      supabase
    )

    return NextResponse.json(preview, { status: 200 })
  } catch (error: any) {
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message.includes('already completed')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST - Execute Receive
 * Creates GRN, GRN items, LPs, updates ASN status
 */
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

    // Get org_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = asnReceiveRequestSchema.parse(body)

    // Execute receive
    const result = await ASNReceiveService.receiveFromASN(
      id,
      validatedData,
      profile.org_id,
      user.id,
      supabase
    )

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error.message.includes('tolerance') || error.message.includes('required')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
