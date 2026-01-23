/**
 * API Route: /api/v1/quality/inspections/by-lp/[lpId]
 * Story: 06.8 Scanner QA Pass/Fail
 * Methods: GET
 * AC-8.2: Scan LP to Load Inspection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    lpId: string
  }>
}

/**
 * GET /api/v1/quality/inspections/by-lp/:lpId
 * Get pending inspection for LP (shortcut for scanner)
 *
 * Path Parameters:
 * - lpId: string (UUID) - License Plate ID
 *
 * Response:
 * - inspection: QualityInspection | null
 * - lp: LicensePlate
 * - has_pending_inspection: boolean
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { lpId } = await params

    // Validate lpId is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(lpId)) {
      return NextResponse.json({ error: 'Invalid LP ID format' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Get LP by ID (RLS enforces org isolation)
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, barcode, product_id, batch_number, quantity, qa_status, org_id')
      .eq('id', lpId)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'LP not found' }, { status: 404 })
    }

    // Verify org_id matches (extra safety, RLS should already filter)
    if (lp.org_id !== userData.org_id) {
      return NextResponse.json({ error: 'LP not found' }, { status: 404 })
    }

    // Get pending inspection for LP
    const { data: inspection, error: inspectionError } = await supabase
      .from('quality_inspections')
      .select(`
        id,
        lp_id,
        inspection_number,
        inspection_type,
        status,
        result,
        product_id,
        batch_number,
        scheduled_date,
        priority,
        created_at
      `)
      .eq('lp_id', lpId)
      .in('status', ['scheduled', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (inspectionError && inspectionError.code !== 'PGRST116') {
      console.error('Failed to fetch inspection:', inspectionError)
      return NextResponse.json({ error: 'Failed to fetch inspection' }, { status: 500 })
    }

    return NextResponse.json({
      inspection: inspection || null,
      lp: {
        id: lp.id,
        barcode: lp.barcode,
        product_id: lp.product_id,
        batch_number: lp.batch_number,
        quantity: lp.quantity,
        qa_status: lp.qa_status,
      },
      has_pending_inspection: !!inspection,
    })
  } catch (error) {
    console.error('Error in GET /api/v1/quality/inspections/by-lp/:lpId:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
