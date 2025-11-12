import { NextRequest, NextResponse } from 'next/server';
import { PalletsAPI } from '@/lib/api/pallets';

/**
 * EPIC-002 Phase 4: Scanner UX - Pallet Terminal
 * POST /api/pallets - Create new pallet
 * GET /api/pallets - Get all pallets with filters
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pallet_type, wo_id, line, location_id, target_boxes } = body;

    if (!pallet_type) {
      return NextResponse.json(
        { error: 'Pallet type is required' },
        { status: 400 }
      );
    }

    // TODO: Get userId from auth session
    const userId = '00000000-0000-0000-0000-000000000000';

    const result = await PalletsAPI.create({
      pallet_type,
      wo_id,
      line,
      location_id,
      target_boxes,
      userId
    });

    return NextResponse.json({
      success: true,
      pallet: result
    });

  } catch (error: any) {
    console.error('Error in create pallet API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'open' | 'closed' | 'shipped' | undefined;
    const location_id = searchParams.get('location_id');
    const wo_id = searchParams.get('wo_id');
    const pallet_type = searchParams.get('pallet_type');

    const filters: any = {};
    if (status) filters.status = status;
    if (location_id) filters.location_id = parseInt(location_id);
    if (wo_id) filters.wo_id = parseInt(wo_id);
    if (pallet_type) filters.pallet_type = pallet_type;

    const result = await PalletsAPI.getAll(filters);

    return NextResponse.json({
      success: true,
      data: result.data,
      summary: result.summary
    });

  } catch (error: any) {
    console.error('Error in get pallets API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
