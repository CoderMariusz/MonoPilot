import { NextRequest, NextResponse } from 'next/server';
import { PalletsAPI } from '@/lib/api/pallets';

/**
 * EPIC-002 Phase 4: Scanner UX - Pallet Terminal
 * POST /api/pallets/[id]/ship - Mark pallet as shipped
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);

    if (isNaN(palletId)) {
      return NextResponse.json(
        { error: 'Invalid pallet ID' },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth session
    const userId = '00000000-0000-0000-0000-000000000000';

    await PalletsAPI.markShipped({
      pallet_id: palletId,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Pallet marked as shipped'
    });

  } catch (error: any) {
    console.error('Error in ship pallet API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
