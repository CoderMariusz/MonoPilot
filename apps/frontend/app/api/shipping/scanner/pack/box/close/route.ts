/**
 * API Route: Close Shipment Box
 * Story: 07.12 - Packing Scanner Mobile UI
 *
 * POST /api/shipping/scanner/pack/box/close - Close and seal a box
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'

// Roles that can close boxes
const ALLOWED_ROLES = ['packer', 'warehouse_packer', 'warehouse_manager', 'supervisor', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

/**
 * POST /api/shipping/scanner/pack/box/close
 * Close a box (seal and finalize)
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId, orgId, userRole } = authContext

    // Check role permission
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body' } },
        { status: 400 }
      )
    }

    const { box_id, weight, length, width, height } = body

    if (!box_id) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'box_id is required' } },
        { status: 400 }
      )
    }

    // Verify box exists and belongs to org
    const { data: box, error: boxError } = await supabase
      .from('shipment_boxes')
      .select('id, box_number')
      .eq('id', box_id)
      .eq('org_id', orgId)
      .single()

    if (boxError || !box) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Box not found' } },
        { status: 404 }
      )
    }

    // Update box status to closed
    const updateData: any = {
      status: 'closed',
      closed_at: new Date().toISOString(),
      closed_by: userId,
    }

    if (weight !== undefined) updateData.weight = weight
    if (length !== undefined) updateData.length = length
    if (width !== undefined) updateData.width = width
    if (height !== undefined) updateData.height = height

    const { data: updatedBox, error: updateError } = await supabase
      .from('shipment_boxes')
      .update(updateData)
      .eq('id', box_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error closing box:', updateError)
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: 'Failed to close box' } },
        { status: 500 }
      )
    }

    const formattedBox = {
      id: updatedBox.id,
      boxNumber: updatedBox.box_number,
      status: updatedBox.status,
      weight: updatedBox.weight,
      length: updatedBox.length,
      width: updatedBox.width,
      height: updatedBox.height,
    }

    return NextResponse.json({ data: formattedBox })
  } catch (error) {
    console.error('Error in POST /api/shipping/scanner/pack/box/close:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
