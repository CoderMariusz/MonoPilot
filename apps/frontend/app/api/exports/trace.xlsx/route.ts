import { NextRequest, NextResponse } from 'next/server';
import { getForwardTrace, getBackwardTrace } from '@/lib/api/traceability';
import { exportTraceToExcel, generateExcelFile } from '@/lib/utils/exportHelpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lpNumber = searchParams.get('lp');
    const direction = searchParams.get('direction') || 'forward';

    if (!lpNumber) {
      return NextResponse.json(
        { error: 'License plate number is required' },
        { status: 400 }
      );
    }

    let traceData: any[] = [];

    if (direction === 'forward') {
      const forwardTrace = await getForwardTrace(lpNumber);
      if (forwardTrace.success && forwardTrace.data) {
        // Flatten the trace tree for export
        const flattenTree = (node: any, depth = 0): any[] => {
          const result = [{
            node_id: node.id,
            node_type: node.type,
            node_number: node.data.lp_number || node.data.wo_number || node.data.po_number,
            product_description: node.data.product_description || node.data.description,
            quantity: node.data.quantity || 0,
            uom: node.data.uom || '',
            qa_status: node.data.qa_status || 'N/A',
            stage_suffix: node.data.stage_suffix || '',
            location: node.data.location || '',
            parent_node: node.parent?.id || '',
            depth,
            composition_qty: null,
            pallet_code: null
          }];

          node.children?.forEach((child: any) => {
            result.push(...flattenTree(child, depth + 1));
          });

          return result;
        };

        traceData = flattenTree(forwardTrace.data.tree.root);
      }
    } else {
      const backwardTrace = await getBackwardTrace(lpNumber);
      if (backwardTrace.success && backwardTrace.data) {
        // Flatten the trace tree for export
        const flattenTree = (node: any, depth = 0): any[] => {
          const result = [{
            node_id: node.id,
            node_type: node.type,
            node_number: node.data.lp_number || node.data.wo_number || node.data.po_number,
            product_description: node.data.product_description || node.data.description,
            quantity: node.data.quantity || 0,
            uom: node.data.uom || '',
            qa_status: node.data.qa_status || 'N/A',
            stage_suffix: node.data.stage_suffix || '',
            location: node.data.location || '',
            parent_node: node.parent?.id || '',
            depth,
            composition_qty: null,
            pallet_code: null
          }];

          node.children?.forEach((child: any) => {
            result.push(...flattenTree(child, depth + 1));
          });

          return result;
        };

        traceData = flattenTree(backwardTrace.data.tree.root);
      }
    }

    if (traceData.length === 0) {
      return NextResponse.json(
        { error: 'No traceability data found' },
        { status: 404 }
      );
    }

    // Generate Excel file
    const workbook = exportTraceToExcel(traceData);
    const excelFile = generateExcelFile(workbook, `Traceability_${direction}_${lpNumber}_${new Date().toISOString().split('T')[0]}`);

    return new NextResponse(excelFile.buffer as any, {
      status: 200,
      headers: {
        'Content-Type': excelFile.mimeType,
        'Content-Disposition': `attachment; filename="${excelFile.filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Error exporting traceability data:', error);
    return NextResponse.json(
      { error: 'Failed to export traceability data' },
      { status: 500 }
    );
  }
}
