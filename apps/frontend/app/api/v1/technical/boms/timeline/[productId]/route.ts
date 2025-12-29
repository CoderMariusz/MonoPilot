/**
 * BOM Timeline API Route (Story 02.4 - Track C)
 *
 * GET /api/v1/technical/boms/timeline/:productId - Get all BOM versions for a product
 *
 * Auth: Required
 * RBAC: Read-only access allowed for ALL authenticated users within organization
 *
 * SECURITY MODEL (MAJ-3 Resolution):
 * - Authentication: Required (verified via supabase.auth.getUser())
 * - Authorization: RLS policies enforce org_id isolation at database level
 * - No RBAC permission check needed for READ operations (view-only data)
 * - This follows the pattern established in GET /api/v1/technical/boms/:id
 * - Users can view BOM timeline data within their organization
 * - Users CANNOT modify BOMs without appropriate Technical permissions (U/D)
 *
 * RATIONALE:
 * Timeline data is informational and helps users understand product history.
 * Read access is intentionally open to all organization members.
 * Write operations (PUT/DELETE) enforce strict RBAC at the route level.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import type { BOMTimelineResponse, BOMTimelineVersion } from '@/lib/types/bom'
import { DB_TO_API_STATUS } from '@/lib/validation/bom-schema'

/**
 * GET /api/v1/technical/boms/timeline/:productId
 * Get all BOM versions for timeline visualization
 *
 * Security: Authentication required, RLS enforces org isolation
 * No RBAC check - READ access allowed for all authenticated users
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth check - Required for all operations
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user org_id for multi-tenant isolation (Defense in Depth)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // NOTE: No RBAC permission check here. This is INTENTIONAL (MAJ-3 resolution).
    // READ operations on BOMs are allowed for all authenticated users.
    // RLS policies enforce org_id isolation at the database level.
    // This follows the same pattern as GET /api/v1/technical/boms/:id (line 11)

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name')
      .eq('id', params.productId)
      .eq('org_id', userData.org_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Product not found' },
        { status: 404 }
      )
    }

    // Get all BOMs for the product
    const { data: boms, error: bomsError } = await supabase
      .from('boms')
      .select('id, version, status, effective_from, effective_to, output_qty, output_uom, notes')
      .eq('product_id', params.productId)
      .eq('org_id', userData.org_id)
      .order('version', { ascending: true })

    if (bomsError) {
      return NextResponse.json({ error: bomsError.message }, { status: 500 })
    }

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Calculate which BOMs are currently active and check for overlaps
    const versions: BOMTimelineVersion[] = (boms || []).map((bom: any) => {
      const effectiveFrom = new Date(bom.effective_from)
      const effectiveTo = bom.effective_to ? new Date(bom.effective_to) : null

      // Check if currently active: effective_from <= today AND (effective_to IS NULL OR effective_to >= today)
      const isCurrentlyActive = effectiveFrom <= today && (!effectiveTo || effectiveTo >= today)

      // Map database status to API format using shared constant (DRY)
      const status = DB_TO_API_STATUS[bom.status] || bom.status.toLowerCase().replace(' ', '_')

      return {
        id: bom.id,
        version: bom.version,
        status: status as any,
        effective_from: bom.effective_from,
        effective_to: bom.effective_to,
        output_qty: bom.output_qty,
        output_uom: bom.output_uom,
        notes: bom.notes,
        is_currently_active: isCurrentlyActive,
        has_overlap: false, // Will be calculated below
      }
    })

    // Check for date overlaps between BOMs
    for (let i = 0; i < versions.length; i++) {
      for (let j = i + 1; j < versions.length; j++) {
        const v1 = versions[i]
        const v2 = versions[j]

        const v1From = new Date(v1.effective_from)
        const v1To = v1.effective_to ? new Date(v1.effective_to) : null
        const v2From = new Date(v2.effective_from)
        const v2To = v2.effective_to ? new Date(v2.effective_to) : null

        // Check overlap
        const v1EndsBeforeV2 = v1To && v1To < v2From
        const v1StartsAfterV2 = v2To && v1From > v2To

        if (!v1EndsBeforeV2 && !v1StartsAfterV2) {
          versions[i].has_overlap = true
          versions[j].has_overlap = true
        }
      }
    }

    const response: BOMTimelineResponse = {
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
      },
      versions,
      current_date: todayStr,
    }

    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
