// API Route: Movement Statistics
// Epic 5 Batch 05B-1: Stock Moves (Story 5.15b)
// GET /api/warehouse/movements/stats - Get movement statistics

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const warehouseId = searchParams.get('warehouse_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build base query
    let query = supabase
      .from('lp_movements')
      .select(
        `
        id,
        movement_type,
        created_at,
        lp:license_plates!lp_id(warehouse_id, warehouse:warehouses(id, code, name))
      `,
        { count: 'exact' }
      )
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data: movements, count, error: movementsError } = await query

    if (movementsError) {
      throw new Error(`Failed to fetch movements: ${movementsError.message}`)
    }

    // Filter by warehouse if specified (after fetch due to nested relation)
    let filteredMovements = movements || []
    if (warehouseId) {
      filteredMovements = filteredMovements.filter(
        (m: any) => m.lp?.warehouse_id === warehouseId
      )
    }

    // AC-5.15b.1: Calculate total_moves
    const totalMoves = filteredMovements.length

    // AC-5.15b.2: Calculate moves_by_type
    const movesByType = filteredMovements.reduce(
      (acc: Record<string, number>, movement: any) => {
        const type = movement.movement_type
        acc[type] = (acc[type] || 0) + 1
        return acc
      },
      {}
    )

    // AC-5.15b.3: Calculate moves_by_warehouse
    const movesByWarehouse = filteredMovements.reduce(
      (acc: Record<string, { count: number; warehouse_code?: string; warehouse_name?: string }>, movement: any) => {
        const warehouseId = movement.lp?.warehouse_id
        if (warehouseId) {
          if (!acc[warehouseId]) {
            acc[warehouseId] = {
              count: 0,
              warehouse_code: movement.lp?.warehouse?.code,
              warehouse_name: movement.lp?.warehouse?.name,
            }
          }
          acc[warehouseId].count += 1
        }
        return acc
      },
      {}
    )

    return NextResponse.json({
      data: {
        total_moves: totalMoves,
        moves_by_type: movesByType,
        moves_by_warehouse: movesByWarehouse,
        filters: {
          warehouse_id: warehouseId,
          date_from: dateFrom,
          date_to: dateTo,
        },
      },
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/movements/stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
