import { NextRequest, NextResponse } from 'next/server';
import { WorkOrdersAPI } from '@/lib/api/workOrders';
import { exportWorkOrdersToExcel, generateExcelFile } from '@/lib/utils/exportHelpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const line = searchParams.get('line');
    const qa_status = searchParams.get('qa_status');
    const date_bucket = searchParams.get('date_bucket') as 'day' | 'week' | 'month';
    const kpi_scope = searchParams.get('kpi_scope') as 'PR' | 'FG';
    const status = searchParams.get('status');

    // Get work orders data
    const workOrders = await WorkOrdersAPI.getAll({
      line,
      qa_status,
      date_bucket,
      kpi_scope,
      status
    });

    // Generate Excel file
    const workbook = exportWorkOrdersToExcel(workOrders);
    const excelFile = generateExcelFile(workbook, `Work_Orders_${new Date().toISOString().split('T')[0]}`);

    return new NextResponse(excelFile.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': excelFile.mimeType,
        'Content-Disposition': `attachment; filename="${excelFile.filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting work orders:', error);
    return NextResponse.json(
      { error: 'Failed to export work orders data' },
      { status: 500 }
    );
  }
}
