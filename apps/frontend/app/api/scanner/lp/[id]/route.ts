import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET /api/scanner/lp/[id]/composition - Get LP composition trace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lpId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const direction = searchParams.get('direction') || 'backward';

    if (isNaN(lpId)) {
      return NextResponse.json(
        { error: 'Invalid LP ID' },
        { status: 400 }
      );
    }

    // Get LP details
    const { data: licensePlate, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        qa_status,
        stage_suffix,
        origin_type,
        origin_ref,
        product:products(part_number, description, uom)
      `)
      .eq('id', lpId)
      .single();

    if (lpError || !licensePlate) {
      return NextResponse.json(
        { error: 'License plate not found' },
        { status: 404 }
      );
    }

    // Get composition trace
    const { data: compositionTrace, error: traceError } = await supabase
      .rpc('trace_lp_composition', {
        lp_id_param: lpId,
        direction: direction
      });

    if (traceError) {
      console.error('Failed to get composition trace:', traceError);
      return NextResponse.json(
        { error: 'Failed to get composition trace' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      lp: licensePlate,
      trace: compositionTrace || [],
      trace_direction: direction
    });

  } catch (error) {
    console.error('Error in LP composition API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/scanner/lp/[id]/split - Split LP
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lpId = parseInt(params.id);
    const body = await request.json();
    const { splits } = body; // Array of { quantity, reason }

    if (isNaN(lpId)) {
      return NextResponse.json(
        { error: 'Invalid LP ID' },
        { status: 400 }
      );
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      return NextResponse.json(
        { error: 'Splits array is required' },
        { status: 400 }
      );
    }

    // Get LP details
    const { data: licensePlate, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        qa_status,
        location_id,
        product:products(part_number, description, uom)
      `)
      .eq('id', lpId)
      .single();

    if (lpError || !licensePlate) {
      return NextResponse.json(
        { error: 'License plate not found' },
        { status: 404 }
      );
    }

    // Validate splits
    const totalSplitQuantity = splits.reduce((sum, split) => sum + split.quantity, 0);
    if (totalSplitQuantity >= licensePlate.quantity) {
      return NextResponse.json(
        { error: 'Split quantities must be less than total LP quantity' },
        { status: 400 }
      );
    }

    // Check reservations (cannot split reserved quantity)
    const { data: availableQty } = await supabase
      .rpc('get_available_quantity', { lp_id_param: lpId });

    if (availableQty < totalSplitQuantity) {
      return NextResponse.json(
        { error: 'Cannot split more than available quantity (considering reservations)' },
        { status: 400 }
      );
    }

    // Create child LPs
    const childLPs = [];
    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];
      const childLPNumber = `${licensePlate.lp_number}-SPLIT${i + 1}`;
      
      const { data: childLP, error: childError } = await supabase
        .from('license_plates')
        .insert({
          lp_number: childLPNumber,
          product_id: licensePlate.product_id,
          location_id: licensePlate.location_id,
          quantity: split.quantity,
          qa_status: licensePlate.qa_status,
          parent_lp_id: lpId,
          parent_lp_number: licensePlate.lp_number,
          origin_type: 'SPLIT',
          origin_ref: {
            parent_lp_id: lpId,
            split_reason: split.reason || 'Split operation'
          }
        })
        .select('id, lp_number')
        .single();

      if (childError) {
        return NextResponse.json(
          { error: `Failed to create child LP ${i + 1}`, details: childError.message },
          { status: 500 }
        );
      }

      childLPs.push(childLP);
    }

    // Update parent LP quantity
    const newParentQuantity = licensePlate.quantity - totalSplitQuantity;
    const { error: updateError } = await supabase
      .from('license_plates')
      .update({ quantity: newParentQuantity })
      .eq('id', lpId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update parent LP quantity' },
        { status: 500 }
      );
    }

    // Create stock moves for splits (ADJUST)
    for (const childLP of childLPs) {
      await supabase
        .from('stock_moves')
        .insert({
          move_number: `SM-SPLIT-${Date.now()}-${childLP.lp_number}`,
          lp_id: childLP.id,
          from_location_id: licensePlate.location_id,
          to_location_id: licensePlate.location_id,
          quantity: childLP.quantity,
          reason: 'LP Split',
          status: 'completed',
          move_date: new Date().toISOString(),
          move_type: 'ADJUST',
          source: 'scanner',
          meta: {
            parent_lp_id: lpId,
            split_operation: true
          }
        });
    }

    return NextResponse.json({
      success: true,
      parent_lp: {
        id: lpId,
        lp_number: licensePlate.lp_number,
        new_quantity: newParentQuantity
      },
      child_lps: childLPs,
      total_split_quantity: totalSplitQuantity
    });

  } catch (error) {
    console.error('Error in LP split API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/scanner/lp/[id]/move - Move LP
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lpId = parseInt(params.id);
    const body = await request.json();
    const { to_location_id, qty } = body;

    if (isNaN(lpId)) {
      return NextResponse.json(
        { error: 'Invalid LP ID' },
        { status: 400 }
      );
    }

    if (!to_location_id) {
      return NextResponse.json(
        { error: 'Target location ID is required' },
        { status: 400 }
      );
    }

    // Get LP details
    const { data: licensePlate, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        location_id,
        product:products(part_number, description, uom)
      `)
      .eq('id', lpId)
      .single();

    if (lpError || !licensePlate) {
      return NextResponse.json(
        { error: 'License plate not found' },
        { status: 404 }
      );
    }

    // Validate quantity
    const moveQuantity = qty || licensePlate.quantity;
    if (moveQuantity <= 0 || moveQuantity > licensePlate.quantity) {
      return NextResponse.json(
        { error: 'Invalid move quantity' },
        { status: 400 }
      );
    }

    // Check reservations (cannot move reserved quantity)
    const { data: availableQty } = await supabase
      .rpc('get_available_quantity', { lp_id_param: lpId });

    if (availableQty < moveQuantity) {
      return NextResponse.json(
        { error: 'Cannot move more than available quantity (considering reservations)' },
        { status: 400 }
      );
    }

    // Verify target location exists
    const { data: targetLocation, error: locationError } = await supabase
      .from('locations')
      .select('id, code, name')
      .eq('id', to_location_id)
      .single();

    if (locationError || !targetLocation) {
      return NextResponse.json(
        { error: 'Target location not found' },
        { status: 404 }
      );
    }

    // Update LP location
    const { error: updateError } = await supabase
      .from('license_plates')
      .update({ 
        location_id: to_location_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', lpId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update LP location' },
        { status: 500 }
      );
    }

    // Create stock move (TRANSFER)
    await supabase
      .from('stock_moves')
      .insert({
        move_number: `SM-TRANSFER-${Date.now()}-${licensePlate.lp_number}`,
        lp_id: lpId,
        from_location_id: licensePlate.location_id,
        to_location_id: to_location_id,
        quantity: moveQuantity,
        reason: 'LP Transfer',
        status: 'completed',
        move_date: new Date().toISOString(),
        move_type: 'TRANSFER',
        source: 'scanner',
        meta: {
          transfer_operation: true
        }
      });

    return NextResponse.json({
      success: true,
      lp: {
        id: lpId,
        lp_number: licensePlate.lp_number,
        new_location_id: to_location_id,
        location_name: targetLocation.name,
        quantity_moved: moveQuantity
      }
    });

  } catch (error) {
    console.error('Error in LP move API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/scanner/lp/[id]/qa - Change QA status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lpId = parseInt(params.id);
    const body = await request.json();
    const { status, reason, pin } = body;

    if (isNaN(lpId)) {
      return NextResponse.json(
        { error: 'Invalid LP ID' },
        { status: 400 }
      );
    }

    if (!status || !reason || !pin) {
      return NextResponse.json(
        { error: 'Status, reason, and PIN are required' },
        { status: 400 }
      );
    }

    if (!['Passed', 'Failed', 'Pending', 'Quarantine'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid QA status' },
        { status: 400 }
      );
    }

    // Get LP details
    const { data: licensePlate, error: lpError } = await supabase
      .from('license_plates')
      .select('id, lp_number, qa_status')
      .eq('id', lpId)
      .single();

    if (lpError || !licensePlate) {
      return NextResponse.json(
        { error: 'License plate not found' },
        { status: 404 }
      );
    }

    // Validate QA override using database function
    const { data: overrideResult, error: overrideError } = await supabase
      .rpc('validate_qa_override', {
        lp_id_param: lpId,
        new_status: status,
        reason_param: reason,
        pin_param: pin,
        override_by_param: '00000000-0000-0000-0000-000000000000' // TODO: Get from auth context
      });

    if (overrideError) {
      return NextResponse.json(
        { error: overrideError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      lp: {
        id: lpId,
        lp_number: licensePlate.lp_number,
        old_status: licensePlate.qa_status,
        new_status: status
      },
      override_logged: true
    });

  } catch (error) {
    console.error('Error in LP QA change API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
