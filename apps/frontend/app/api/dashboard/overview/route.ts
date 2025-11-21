import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Dashboard Overview API Route
 * Story: 1.13 Main Dashboard
 * Task 3: API Endpoints
 *
 * GET /api/dashboard/overview - Get module statistics
 */

export interface DashboardModuleStats {
  settings: {
    total_users: number
    active_users: number
    pending_invitations: number
  }
  technical: {
    total_products: number
    total_boms: number
    total_routings: number
  }
  planning: {
    active_work_orders: number
    pending_purchase_orders: number
    pending_transfer_orders: number
  }
  production: {
    active_work_orders: number
    paused_work_orders: number
    completed_today: number
  }
  warehouse: {
    total_license_plates: number
    pending_receipts: number
    low_stock_alerts: number
  }
  quality: {
    pending_qa_holds: number
    open_ncrs: number
    pending_inspections: number
  }
  shipping: {
    open_sales_orders: number
    pending_shipments: number
    shipped_today: number
  }
  npd: {
    active_projects: number
    pending_approvals: number
    completed_this_month: number
  }
}

export interface DashboardOverviewResponse {
  modules: DashboardModuleStats
  setup_completed: boolean
  enabled_modules: string[]
}

// ============================================================================
// GET /api/dashboard/overview - Get Module Statistics (AC-012.2)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get organization setup status
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('setup_completed, enabled_modules')
      .eq('id', currentUser.org_id)
      .single()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Initialize module stats
    const moduleStats: DashboardModuleStats = {
      settings: {
        total_users: 0,
        active_users: 0,
        pending_invitations: 0,
      },
      technical: {
        total_products: 0,
        total_boms: 0,
        total_routings: 0,
      },
      planning: {
        active_work_orders: 0,
        pending_purchase_orders: 0,
        pending_transfer_orders: 0,
      },
      production: {
        active_work_orders: 0,
        paused_work_orders: 0,
        completed_today: 0,
      },
      warehouse: {
        total_license_plates: 0,
        pending_receipts: 0,
        low_stock_alerts: 0,
      },
      quality: {
        pending_qa_holds: 0,
        open_ncrs: 0,
        pending_inspections: 0,
      },
      shipping: {
        open_sales_orders: 0,
        pending_shipments: 0,
        shipped_today: 0,
      },
      npd: {
        active_projects: 0,
        pending_approvals: 0,
        completed_this_month: 0,
      },
    }

    // ========================================================================
    // Query Settings Module Stats (Always available)
    // ========================================================================

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', currentUser.org_id)

    moduleStats.settings.total_users = totalUsers || 0

    // Active users
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', currentUser.org_id)
      .eq('status', 'active')

    moduleStats.settings.active_users = activeUsers || 0

    // Pending invitations
    const { count: pendingInvitations } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', currentUser.org_id)
      .eq('status', 'invited')

    moduleStats.settings.pending_invitations = pendingInvitations || 0

    // ========================================================================
    // Query Other Module Stats (Only if tables exist - graceful degradation)
    // ========================================================================

    // Note: Since we're in Epic 1 and other modules don't have tables yet,
    // we'll keep stats at 0. When those epics are implemented, uncomment
    // the relevant queries below.

    // Example for Technical Module (Epic 2):
    // if (organization.enabled_modules?.includes('technical')) {
    //   const { count: totalProducts } = await supabase
    //     .from('products')
    //     .select('*', { count: 'exact', head: true })
    //     .eq('org_id', currentUser.org_id)
    //   moduleStats.technical.total_products = totalProducts || 0
    // }

    // Example for Planning Module (Epic 3):
    // if (organization.enabled_modules?.includes('planning')) {
    //   const { count: pendingPOs } = await supabase
    //     .from('purchase_orders')
    //     .select('*', { count: 'exact', head: true })
    //     .eq('org_id', currentUser.org_id)
    //     .eq('status', 'pending')
    //   moduleStats.planning.pending_purchase_orders = pendingPOs || 0
    // }

    // Prepare response
    const response: DashboardOverviewResponse = {
      modules: moduleStats,
      setup_completed: organization.setup_completed || false,
      enabled_modules: organization.enabled_modules || [],
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/dashboard/overview:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
