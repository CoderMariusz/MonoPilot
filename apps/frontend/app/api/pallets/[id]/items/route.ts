import { NextRequest, NextResponse } from 'next/server';
import { PalletsAPI } from '@/lib/api/pallets';

/**
 * EPIC-002 Phase 4: Scanner UX - Pallet Terminal
 * POST /api/pallets/[id]/items - Add LP to pallet
 * DELETE /api/pallets/[id]/items - Remove LP from pallet
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);
    const body = await request.json();
    const { lp_id, quantity } = body;

    if (isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    if (!lp_id) {
      return NextResponse.json(
        { error: 'License plate ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth session
    const userId = '00000000-0000-0000-0000-000000000000';

    const result = await PalletsAPI.addLP({
      pallet_id: palletId,
      lp_id,
      quantity,
      userId
    });

    return NextResponse.json({
      success: true,
      item_id: result.item_id,
      lp_number: result.lp_number
    });

  } catch (error: any) {
    console.error('Error in add LP to pallet API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);
    const body = await request.json();
    const { lp_id } = body;

    if (isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    if (!lp_id) {
      return NextResponse.json(
        { error: 'License plate ID is required' },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth session
    const userId = '00000000-0000-0000-0000-000000000000';

    await PalletsAPI.removeLP({
      pallet_id: palletId,
      lp_id,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'LP removed from pallet'
    });

  } catch (error: any) {
    console.error('Error in remove LP from pallet API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
