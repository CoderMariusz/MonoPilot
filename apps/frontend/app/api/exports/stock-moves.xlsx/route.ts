import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client-browser';
import { exportStockMovesToExcel, generateExcelFile } from '@/lib/utils/exportHelpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const move_type = searchParams.get('move_type');
    const status = searchParams.get('status');
    const wo_id = searchParams.get('wo_id');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Build query
    let query = supabase
      .from('stock_moves')
      .select(`
        *,
        license_plates!inner(lp_number),
        work_orders!inner(wo_number)
      `);

    // Apply filters
    if (move_type) query = query.eq('move_type', move_type);
    if (status) query = query.eq('status', status);
    if (wo_id) query = query.eq('wo_id', wo_id);
    if (from) query = query.gte('move_date', from);
    if (to) query = query.lte('move_date', to);

    const { data, error } = await query.order('move_date', { ascending: false });

    if (error) throw error;

    // Format data for export
    const formattedData = (data || []).map(row => ({
      move_number: row.move_number,
      lp_number: row.license_plates?.lp_number || '',
      move_type: row.move_type,
      status: row.status,
      quantity: parseFloat(row.quantity),
      uom: row.uom,
      move_date: row.move_date,
      wo_number: row.work_orders?.wo_number || '',
      source: row.source,
      created_at: row.created_at
    }));

    // Generate Excel file
    const workbook = exportStockMovesToExcel(formattedData);
    const excelFile = generateExcelFile(workbook, `Stock_Moves_${new Date().toISOString().split('T')[0]}`);

    return new NextResponse(excelFile.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': excelFile.mimeType,
        'Content-Disposition': `attachment; filename="${excelFile.filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting stock moves:', error);
    return NextResponse.json(
      { error: 'Failed to export stock moves data' },
      { status: 500 }
    );
  }
}
