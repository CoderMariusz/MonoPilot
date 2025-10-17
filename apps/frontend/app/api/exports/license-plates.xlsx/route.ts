import { NextRequest, NextResponse } from 'next/server';
import { LicensePlatesAPI } from '@/lib/api/licensePlates';
import { exportLicensePlatesToExcel, generateExcelFile } from '@/lib/utils/exportHelpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const qa_status = searchParams.get('qa_status') as 'Pending' | 'Passed' | 'Failed' | 'Quarantine';
    const location = searchParams.get('location');
    const product_id = searchParams.get('product_id');
    const stage_suffix = searchParams.get('stage_suffix');
    const origin_type = searchParams.get('origin_type');
    const has_reservations = searchParams.get('has_reservations');

    // Get license plates data
    const lpData = await LicensePlatesAPI.getAll({
      qa_status,
      location,
      product_id: product_id ? parseInt(product_id) : undefined,
      stage_suffix,
      origin_type,
      has_reservations: has_reservations ? has_reservations === 'true' : undefined
    });

    // Generate Excel file
    const workbook = exportLicensePlatesToExcel(lpData.data);
    const excelFile = generateExcelFile(workbook, `License_Plates_${new Date().toISOString().split('T')[0]}`);

    return new NextResponse(excelFile.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': excelFile.mimeType,
        'Content-Disposition': `attachment; filename="${excelFile.filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting license plates:', error);
    return NextResponse.json(
      { error: 'Failed to export license plates data' },
      { status: 500 }
    );
  }
}
