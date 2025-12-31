/**
 * API Route: /api/planning/work-orders/[id]/materials
 * Story 03.11a: WO Materials (BOM Snapshot) - GET materials list
 *
 * Returns all wo_materials for a Work Order (BOM snapshot)
 * - Includes denormalized product details
 * - Orders materials by sequence
 * - Provides BOM version and snapshot timestamp
 * - Enforces RLS org isolation (404 not 403)
 */

import { NextRequest } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { handleApiError, successResponse, notFoundResponse } from '@/lib/api/error-handler'
import { getAuthContextOrThrow } from '@/lib/api/auth-helpers'
import { getWOMaterials } from '@/lib/services/wo-snapshot-service'

// GET /api/planning/work-orders/[id]/materials - Get WO materials list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Verify authentication (RLS enforces org isolation)
    await getAuthContextOrThrow(supabase)

    // Verify WO exists and belongs to user's org (RLS handles this)
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, bom_id')
      .eq('id', id)
      .single()

    if (woError || !wo) {
      return notFoundResponse('Work order not found')
    }

    // Get materials with product details
    const materials = await getWOMaterials(supabase, id)

    // Get BOM version from first material (all have same version)
    const bomVersion = materials.length > 0 ? materials[0].bom_version : null
    const snapshotAt = materials.length > 0 ? materials[0].created_at : null

    return successResponse({
      materials,
      total: materials.length,
      bom_version: bomVersion,
      snapshot_at: snapshotAt,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/planning/work-orders/[id]/materials')
  }
}
