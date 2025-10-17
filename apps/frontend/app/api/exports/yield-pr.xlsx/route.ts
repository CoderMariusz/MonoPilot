import { NextRequest, NextResponse } from 'next/server';
import { YieldAPI } from '@/lib/api/yield';
import { exportYieldToExcel, generateExcelFile } from '@/lib/utils/exportHelpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bucket = (searchParams.get('bucket') as 'day' | 'week' | 'month') || 'day';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const line = searchParams.get('line');

    // Get PR yield data
    const yieldData = await YieldAPI.getPRYield({
      bucket,
      from,
      to,
      line
    });

    // Generate Excel file
    const workbook = exportYieldToExcel(yieldData.data, 'PR', bucket);
    const excelFile = generateExcelFile(workbook, `PR_Yield_${bucket}_${new Date().toISOString().split('T')[0]}`);

    return new NextResponse(excelFile.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': excelFile.mimeType,
        'Content-Disposition': `attachment; filename="${excelFile.filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting PR yield:', error);
    return NextResponse.json(
      { error: 'Failed to export PR yield data' },
      { status: 500 }
    );
  }
}
