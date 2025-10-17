import { NextRequest, NextResponse } from 'next/server';
import { ConsumeAPI } from '@/lib/api/consume';
import { exportConsumeToExcel, generateExcelFile } from '@/lib/utils/exportHelpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const woId = searchParams.get('woId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const materialId = searchParams.get('materialId');
    const line = searchParams.get('line');

    // Get consumption data
    const consumeData = await ConsumeAPI.getConsumptionData({
      woId: woId ? parseInt(woId) : undefined,
      from,
      to,
      materialId: materialId ? parseInt(materialId) : undefined,
      line
    });

    // Generate Excel file
    const workbook = exportConsumeToExcel(consumeData.data);
    const excelFile = generateExcelFile(workbook, `Consumption_Variance_${new Date().toISOString().split('T')[0]}`);

    return new NextResponse(excelFile.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': excelFile.mimeType,
        'Content-Disposition': `attachment; filename="${excelFile.filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting consumption data:', error);
    return NextResponse.json(
      { error: 'Failed to export consumption data' },
      { status: 500 }
    );
  }
}
