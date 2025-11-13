import { NextRequest, NextResponse } from 'next/server';
import { PalletsAPI } from '@/lib/api/pallets';
import { generatePalletLabelZPL, type PalletLabelData } from '@/lib/utils/zpl';

/**
 * EPIC-002 Phase 4: Scanner UX - Pallet Terminal
 * POST /api/pallets/[id]/label - Generate and return ZPL label code for pallet
 *
 * This endpoint generates ZPL (Zebra Programming Language) code for printing
 * pallet labels on industrial label printers.
 *
 * Returns:
 * - zpl: ZPL code string
 * - download_url: Optional URL to download ZPL file
 *
 * The ZPL can be:
 * 1. Sent directly to a Zebra printer via network (TCP port 9100)
 * 2. Downloaded as .zpl file for manual printing
 * 3. Printed via browser print dialog (as raw text)
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

    // Get pallet details
    const { pallet, items } = await PalletsAPI.getById(palletId);

    if (!pallet) {
      return NextResponse.json(
        { error: 'Pallet not found' },
        { status: 404 }
      );
    }

    // Calculate totals
    const item_count = items.length;
    const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const uom = items.length > 0 ? items[0].uom : '';

    // Prepare label data
    const labelData: PalletLabelData = {
      pallet_number: pallet.pallet_number,
      pallet_type: pallet.pallet_type,
      wo_number: pallet.wo_number,
      product_description: items.length > 0 ? items[0].product_description : null,
      item_count,
      total_quantity,
      uom,
      created_at: pallet.created_at,
      closed_at: pallet.closed_at
    };

    // Generate ZPL code
    const zpl = generatePalletLabelZPL(labelData);

    // Return ZPL code
    // Client can:
    // 1. Send to printer via network request to printer IP
    // 2. Download as file
    // 3. Display in iframe for browser printing
    return NextResponse.json({
      success: true,
      pallet_number: pallet.pallet_number,
      zpl,
      instructions: {
        network_print: 'Send ZPL to printer IP address on port 9100',
        download: 'Save ZPL as .zpl file and drag to Zebra Setup Utilities',
        browser_print: 'Use browser print dialog with raw text mode'
      }
    });

  } catch (error: any) {
    console.error('Error in generate pallet label API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pallets/[id]/label - Download ZPL label as file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const palletId = parseInt(id);

    if (isNaN(palletId)) {
      return new NextResponse('Invalid pallet ID', { status: 400 });
    }

    // Get pallet details
    const { pallet, items } = await PalletsAPI.getById(palletId);

    if (!pallet) {
      return new NextResponse('Pallet not found', { status: 404 });
    }

    // Calculate totals
    const item_count = items.length;
    const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const uom = items.length > 0 ? items[0].uom : '';

    // Prepare label data
    const labelData: PalletLabelData = {
      pallet_number: pallet.pallet_number,
      pallet_type: pallet.pallet_type,
      wo_number: pallet.wo_number,
      product_description: items.length > 0 ? items[0].product_description : null,
      item_count,
      total_quantity,
      uom,
      created_at: pallet.created_at,
      closed_at: pallet.closed_at
    };

    // Generate ZPL code
    const zpl = generatePalletLabelZPL(labelData);

    // Return as downloadable file
    return new NextResponse(zpl, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="pallet_${pallet.pallet_number}.zpl"`
      }
    });

  } catch (error: any) {
    console.error('Error in download pallet label API:', error);
    return new NextResponse(error.message || 'Internal server error', {
      status: 500
    });
  }
}
