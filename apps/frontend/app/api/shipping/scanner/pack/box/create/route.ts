/**
 * API Route: Create Shipment Box
 * Story: 07.12 - Packing Scanner Mobile UI
 *
 * POST /api/shipping/scanner/pack/box/create - Create a new box for a shipment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'

// Roles that can create boxes
const ALLOWED_ROLES = ['packer', 'warehouse_packer', 'warehouse_manager', 'supervisor', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

/**
 * POST /api/shipping/scanner/pack/box/create
 * Create a new box for a shipment
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

    const { shipment_id } = body

    if (!shipment_id) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'shipment_id is required' } },
        { status: 400 }
      )
    }

    // Verify shipment exists and belongs to org
    const { data: shipment, error: shipmentError } = await supabase
      .from('shipments')
      .select('id')
      .eq('id', shipment_id)
      .eq('org_id', orgId)
      .single()

    if (shipmentError || !shipment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Shipment not found' } },
        { status: 404 }
      )
    }

    // Get next box number
    const { data: existingBoxes } = await supabase
      .from('shipment_boxes')
      .select('box_number')
      .eq('shipment_id', shipment_id)
      .order('box_number', { ascending: false })
      .limit(1)

    const nextBoxNumber = existingBoxes && existingBoxes.length > 0 
      ? existingBoxes[0].box_number + 1 
      : 1

    // Create box
    const { data: newBox, error: createError } = await supabase
      .from('shipment_boxes')
      .insert({
        org_id: orgId,
        shipment_id: shipment_id,
        box_number: nextBoxNumber,
        status: 'open',
        created_by: userId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating box:', createError)
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: 'Failed to create box' } },
        { status: 500 }
      )
    }

    const formattedBox = {
      id: newBox.id,
      boxNumber: newBox.box_number,
      status: newBox.status,
      weight: newBox.weight,
      length: newBox.length,
      width: newBox.width,
      height: newBox.height,
    }

    return NextResponse.json({ data: formattedBox }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/shipping/scanner/pack/box/create:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
