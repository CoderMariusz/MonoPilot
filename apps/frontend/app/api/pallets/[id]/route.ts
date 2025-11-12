import { NextRequest, NextResponse } from 'next/server';
import { PalletsAPI } from '@/lib/api/pallets';

/**
 * EPIC-002 Phase 4: Scanner UX - Pallet Terminal
 * GET /api/pallets/[id] - Get pallet by ID with full details
 */

export async function GET(
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

    const result = await PalletsAPI.getById(palletId);

    return NextResponse.json({
      success: true,
      pallet: result.pallet,
      items: result.items
    });

  } catch (error: any) {
    console.error('Error in get pallet by ID API:', error);
    return NextResponse.json(
      { error: error.message || 'Pallet not found' },
      { status: error.message.includes('not found') ? 404 : 500 }
    );
  }
}
