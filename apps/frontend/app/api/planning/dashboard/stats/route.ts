import { createServerSupabase } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Get user's org_id
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData, error: orgError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (orgError || !userData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const org_id = userData.org_id

    // Get Purchase Orders stats
    const { data: poData, error: poError } = await supabase
      .from('purchase_orders')
      .select('status, approval_status')
      .eq('org_id', org_id)

    if (poError) {
      console.error('Error fetching PO stats:', poError)
      return NextResponse.json({ error: 'Failed to fetch PO stats' }, { status: 500 })
    }

    const poStats = {
      total: poData.length,
      draft: poData.filter((po: any) => po.status === 'draft').length,
      pending_approval: poData.filter((po: any) => po.approval_status === 'pending').length,
      confirmed: poData.filter((po: any) => po.status === 'confirmed').length,
      close: poData.filter((po: any) => po.status === 'closed').length,
      receiving_total: poData.filter((po: any) => po.status === 'receiving').length,
    }

    // Get Transfer Orders stats
    const { data: toData, error: toError } = await supabase
      .from('transfer_orders')
      .select('status')
      .eq('org_id', org_id)

    if (toError) {
      console.error('Error fetching TO stats:', toError)
      return NextResponse.json({ error: 'Failed to fetch TO stats' }, { status: 500 })
    }

    const toStats = {
      total: toData.length,
      in_transit: toData.filter((to: any) => to.status === 'in_transit').length,
      pending_receipt: toData.filter((to: any) => to.status === 'released').length,
      completed: toData.filter((to: any) => to.status === 'completed').length,
    }

    // Get Work Orders stats
    const { data: woData, error: woError } = await supabase
      .from('work_orders')
      .select('status, actual_end_date')
      .eq('org_id', org_id)

    if (woError) {
      console.error('Error fetching WO stats:', woError)
      return NextResponse.json({ error: 'Failed to fetch WO stats' }, { status: 500 })
    }

    const today = new Date().toISOString().split('T')[0]
    const woStats = {
      total: woData.length,
      active: woData.filter((wo: any) => wo.status === 'in_progress').length,
      paused: woData.filter((wo: any) => wo.status === 'paused').length,
      completed_today: woData.filter((wo: any) =>
        wo.status === 'completed' &&
        wo.actual_end_date &&
        wo.actual_end_date.startsWith(today)
      ).length,
      released: woData.filter((wo: any) => wo.status === 'released').length,
      total_today: woData.filter((wo: any) =>
        wo.actual_end_date &&
        wo.actual_end_date.startsWith(today)
      ).length,
    }

    return NextResponse.json({
      stats: {
        purchase_orders: poStats,
        transfer_orders: toStats,
        work_orders: woStats,
      }
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
