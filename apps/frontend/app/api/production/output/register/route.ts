/**
 * API Route: Register Output from Scanner
 * Story 04.7b: Output Registration Scanner
 *
 * POST /api/production/output/register - Create LP from scanner
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'
import { scannerOutputSchema } from '@/lib/validation/scanner-output'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get org context
    const orgContext = await getOrgContext()
    if (!orgContext?.org_id) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = scannerOutputSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const input = validation.data

    // Get WO and verify it belongs to org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select(
        `
        id,
        wo_number,
        org_id,
        product_id,
        planned_qty,
        output_qty,
        uom,
        status,
        products!inner(id, name, uom)
      `
      )
      .eq('id', input.wo_id)
      .single()

    if (woError || !wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (wo.org_id !== orgContext.org_id) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (wo.status !== 'in_progress' && wo.status !== 'paused') {
      return NextResponse.json(
        { error: 'Work order is not in progress' },
        { status: 400 }
      )
    }

    // Generate LP number
    const today = new Date()
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
    const { count: lpCount } = await supabase
      .from('license_plates')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', today.toISOString().slice(0, 10))

    const seq = String((lpCount || 0) + 1).padStart(4, '0')
    const lpNumber = `LP-${dateStr}-${seq}`

    // Create LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .insert({
        org_id: orgContext.org_id,
        lp_number: lpNumber,
        product_id: wo.product_id,
        quantity: input.quantity,
        current_qty: input.quantity,
        uom: wo.uom,
        status: 'available',
        qa_status: input.qa_status,
        batch_number: input.batch_number,
        expiry_date: input.expiry_date,
        location_id: input.location_id,
        source: 'production',
        wo_id: wo.id,
        manufacturing_date: today.toISOString().split('T')[0],
        created_by: user.id,
      })
      .select()
      .single()

    if (lpError || !lp) {
      return NextResponse.json(
        { error: `Failed to create LP: ${lpError?.message}` },
        { status: 500 }
      )
    }

    // Create production output record
    await supabase.from('production_outputs').insert({
      wo_id: wo.id,
      organization_id: orgContext.org_id,
      product_id: wo.product_id,
      lp_id: lp.id,
      quantity: input.quantity,
      uom: wo.uom,
      qa_status: input.qa_status,
      location_id: input.location_id,
      produced_at: new Date().toISOString(),
      produced_by_user_id: user.id,
      notes: input.operator_badge ? `Scanner badge: ${input.operator_badge}` : null,
    })

    // Get consumed LPs for genealogy
    const { data: consumptions } = await supabase
      .from('wo_consumption')
      .select('lp_id')
      .eq('wo_id', wo.id)
      .eq('status', 'consumed')

    // Create genealogy records
    let parentCount = 0
    if (consumptions && consumptions.length > 0) {
      const genealogyRecords = consumptions.map((c) => ({
        parent_lp_id: c.lp_id,
        child_lp_id: lp.id,
        relationship_type: 'production',
        work_order_id: wo.id,
        created_by: user.id,
      }))

      await supabase.from('lp_genealogy').insert(genealogyRecords)
      parentCount = genealogyRecords.length
    }

    // Update WO output_qty
    const newOutputQty = Number(wo.output_qty || 0) + input.quantity
    const plannedQty = Number(wo.planned_qty)
    const progressPercent = plannedQty > 0 ? Math.round((newOutputQty / plannedQty) * 100) : 0

    await supabase
      .from('work_orders')
      .update({
        output_qty: newOutputQty,
        progress_percent: progressPercent,
      })
      .eq('id', wo.id)

    return NextResponse.json({
      lp: {
        id: lp.id,
        lp_number: lp.lp_number,
        qty: input.quantity,
        uom: wo.uom,
        batch_number: input.batch_number,
        qa_status: input.qa_status,
        expiry_date: input.expiry_date,
      },
      wo_progress: {
        output_qty: newOutputQty,
        progress_percent: progressPercent,
        remaining_qty: plannedQty - newOutputQty,
      },
      genealogy: {
        parent_count: parentCount,
        child_lp_id: lp.id,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/production/output/register:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
