// Mock XLSX implementation for deployment
const XLSX = {
  utils: {
    json_to_sheet: (data: any[]) => ({ data }),
    book_new: () => ({}),
    book_append_sheet: (wb: any, ws: any, name: string) => {},
    decode_range: (ref: string) => ({ s: { r: 0, c: 0 }, e: { r: 0, c: 0 } }),
    encode_cell: (cell: any) => 'A1',
  },
  write: (workbook: any, options: any) => new ArrayBuffer(0),
};

// Common styling for Excel exports
export const excelStyles = {
  header: {
    font: { bold: true, size: 12 },
    fill: { fgColor: { rgb: 'E6E6FA' } },
    alignment: { horizontal: 'center' }
  },
  data: {
    font: { size: 11 },
    alignment: { horizontal: 'left' }
  },
  number: {
    font: { size: 11 },
    alignment: { horizontal: 'right' }
  },
  date: {
    font: { size: 11 },
    alignment: { horizontal: 'center' }
  }
};

// Format date for Excel (UTC + Europe/London columns)
export function formatDateForExcel(date: string | Date): {
  utc: string;
  london: string;
} {
  const d = new Date(date);
  const utc = d.toISOString();
  const london = d.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return { utc, london };
}

// Create Excel workbook with common styling
export function createExcelWorkbook(data: any[], sheetName: string, headers: string[]): any {
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Set column widths
  const colWidths = headers.map(header => ({ wch: Math.max(header.length, 15) }));
  ws['!cols'] = colWidths;
  
  // Apply styles to header row
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    
    ws[cellAddress].s = excelStyles.header;
  }
  
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  return wb;
}

// Export yield data to Excel
export function exportYieldToExcel(
  data: any[],
  kpiScope: 'PR' | 'FG',
  bucket: 'day' | 'week' | 'month'
): any {
  const headers = kpiScope === 'PR' 
    ? [
        'Production Date (UTC)',
        'Production Date (London)',
        'Production Line',
        'Product',
        'Part Number',
        'Work Orders',
        'Total Input (kg)',
        'Total Output (kg)',
        'PR Yield %',
        'PR Consumption/kg',
        'Plan Accuracy %'
      ]
    : [
        'Production Date (UTC)',
        'Production Date (London)',
        'Production Line',
        'Product',
        'Part Number',
        'Work Orders',
        'Planned Boxes',
        'Actual Boxes',
        'Avg Box Weight (kg)',
        'Total FG Weight (kg)',
        'Total Meat Input (kg)',
        'FG Yield %',
        'Plan Accuracy %',
        'Waste (kg)'
      ];

  const formattedData = data.map(row => {
    const dates = formatDateForExcel(row.production_date_utc || row.production_date);
    return {
      'Production Date (UTC)': dates.utc,
      'Production Date (London)': dates.london,
      'Production Line': row.production_line,
      'Product': row.product,
      'Part Number': row.part_number,
      'Work Orders': row.work_order_count,
      ...(kpiScope === 'PR' ? {
        'Total Input (kg)': row.total_input_kg,
        'Total Output (kg)': row.total_output_kg,
        'PR Yield %': row.pr_yield_percent,
        'PR Consumption/kg': row.pr_consumption_per_kg,
        'Plan Accuracy %': row.plan_accuracy_percent
      } : {
        'Planned Boxes': row.total_planned_boxes,
        'Actual Boxes': row.total_actual_boxes,
        'Avg Box Weight (kg)': row.avg_box_weight_kg,
        'Total FG Weight (kg)': row.total_fg_weight_kg,
        'Total Meat Input (kg)': row.total_meat_input_kg,
        'FG Yield %': row.fg_yield_percent,
        'Plan Accuracy %': row.plan_accuracy_percent,
        'Waste (kg)': row.waste_kg
      })
    };
  });

  return createExcelWorkbook(formattedData, `${kpiScope} Yield ${bucket}`, headers);
}

// Export consumption data to Excel
export function exportConsumeToExcel(data: any[]): any {
  const headers = [
    'WO Number',
    'Production Date (UTC)',
    'Production Date (London)',
    'Product',
    'Material',
    'Material Part Number',
    'BOM Standard (kg)',
    'Actual Consumed (kg)',
    'Variance (kg)',
    'Variance %',
    'Production Line',
    'Work Order Status',
    'One to One',
    'Optional'
  ];

  const formattedData = data.map(row => {
    const dates = formatDateForExcel(row.production_date_utc || row.production_date_london);
    return {
      'WO Number': row.wo_number,
      'Production Date (UTC)': dates.utc,
      'Production Date (London)': dates.london,
      'Product': row.product,
      'Material': row.material,
      'Material Part Number': row.material_part_number,
      'BOM Standard (kg)': row.bom_standard_kg,
      'Actual Consumed (kg)': row.actual_consumed_kg,
      'Variance (kg)': row.variance_kg,
      'Variance %': row.variance_percent,
      'Production Line': row.production_line,
      'Work Order Status': row.work_order_status,
      'One to One': row.one_to_one ? 'Yes' : 'No',
      'Optional': row.is_optional ? 'Yes' : 'No'
    };
  });

  return createExcelWorkbook(formattedData, 'Consumption Variance', headers);
}

// Export traceability data to Excel
export function exportTraceToExcel(data: any[]): any {
  const headers = [
    'Node ID',
    'Node Type',
    'Node Number',
    'Product Description',
    'Quantity',
    'UOM',
    'QA Status',
    'Stage Suffix',
    'Location',
    'Parent Node',
    'Depth',
    'Composition Qty',
    'Pallet Code'
  ];

  const formattedData = data.map(row => ({
    'Node ID': row.node_id,
    'Node Type': row.node_type,
    'Node Number': row.node_number,
    'Product Description': row.product_description,
    'Quantity': row.quantity,
    'UOM': row.uom,
    'QA Status': row.qa_status,
    'Stage Suffix': row.stage_suffix,
    'Location': row.location,
    'Parent Node': row.parent_node,
    'Depth': row.depth,
    'Composition Qty': row.composition_qty,
    'Pallet Code': row.pallet_code
  }));

  return createExcelWorkbook(formattedData, 'Traceability', headers);
}

// Export work orders to Excel
export function exportWorkOrdersToExcel(data: any[]): any {
  const headers = [
    'WO Number',
    'Product',
    'Part Number',
    'Quantity',
    'UOM',
    'Priority',
    'Status',
    'KPI Scope',
    'Scheduled Start',
    'Scheduled End',
    'Actual Start',
    'Actual End',
    'Actual Output Qty',
    'Line Number',
    'Current Operation',
    'Planned Boxes',
    'Actual Boxes',
    'Box Weight (kg)',
    'Closed At',
    'Created At'
  ];

  const formattedData = data.map(row => {
    const scheduledStart = formatDateForExcel(row.scheduled_start);
    const scheduledEnd = formatDateForExcel(row.scheduled_end);
    const actualStart = formatDateForExcel(row.actual_start);
    const actualEnd = formatDateForExcel(row.actual_end);
    const closedAt = formatDateForExcel(row.closed_at);
    const createdAt = formatDateForExcel(row.created_at);

    return {
      'WO Number': row.wo_number,
      'Product': row.product?.description,
      'Part Number': row.product?.part_number,
      'Quantity': row.quantity,
      'UOM': row.uom,
      'Priority': row.priority,
      'Status': row.status,
      'KPI Scope': row.kpi_scope,
      'Scheduled Start (UTC)': scheduledStart.utc,
      'Scheduled Start (London)': scheduledStart.london,
      'Scheduled End (UTC)': scheduledEnd.utc,
      'Scheduled End (London)': scheduledEnd.london,
      'Actual Start (UTC)': actualStart.utc,
      'Actual Start (London)': actualStart.london,
      'Actual End (UTC)': actualEnd.utc,
      'Actual End (London)': actualEnd.london,
      'Actual Output Qty': row.actual_output_qty,
      'Line Number': row.line_number,
      'Current Operation': row.current_operation_seq,
      'Planned Boxes': row.planned_boxes,
      'Actual Boxes': row.actual_boxes,
      'Box Weight (kg)': row.box_weight_kg,
      'Closed At (UTC)': closedAt.utc,
      'Closed At (London)': closedAt.london,
      'Created At (UTC)': createdAt.utc,
      'Created At (London)': createdAt.london
    };
  });

  return createExcelWorkbook(formattedData, 'Work Orders', headers);
}

// Export license plates to Excel
export function exportLicensePlatesToExcel(data: any[]): any {
  const headers = [
    'LP Number',
    'Product',
    'Part Number',
    'Quantity',
    'UOM',
    'Location',
    'QA Status',
    'Stage Suffix',
    'Parent LP',
    'Origin Type',
    'Available Qty',
    'Reserved Qty',
    'Created At'
  ];

  const formattedData = data.map(row => {
    const createdAt = formatDateForExcel(row.created_at);

    return {
      'LP Number': row.lp_number,
      'Product': row.product_description,
      'Part Number': row.product_part_number,
      'Quantity': row.quantity,
      'UOM': row.uom,
      'Location': row.location_name,
      'QA Status': row.qa_status,
      'Stage Suffix': row.stage_suffix,
      'Parent LP': row.parent_lp_number,
      'Origin Type': row.origin_type,
      'Available Qty': row.available_qty,
      'Reserved Qty': row.reserved_qty,
      'Created At (UTC)': createdAt.utc,
      'Created At (London)': createdAt.london
    };
  });

  return createExcelWorkbook(formattedData, 'License Plates', headers);
}

// Export stock moves to Excel
export function exportStockMovesToExcel(data: any[]): any {
  const headers = [
    'Move Number',
    'LP Number',
    'Move Type',
    'Status',
    'Quantity',
    'UOM',
    'Move Date',
    'WO Number',
    'Source',
    'Created At'
  ];

  const formattedData = data.map(row => {
    const moveDate = formatDateForExcel(row.move_date);
    const createdAt = formatDateForExcel(row.created_at);

    return {
      'Move Number': row.move_number,
      'LP Number': row.lp_number,
      'Move Type': row.move_type,
      'Status': row.status,
      'Quantity': row.quantity,
      'UOM': row.uom,
      'Move Date (UTC)': moveDate.utc,
      'Move Date (London)': moveDate.london,
      'WO Number': row.wo_number,
      'Source': row.source,
      'Created At (UTC)': createdAt.utc,
      'Created At (London)': createdAt.london
    };
  });

  return createExcelWorkbook(formattedData, 'Stock Moves', headers);
}

// Generate Excel file buffer
export function generateExcelBuffer(workbook: any): Buffer {
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

// Generate Excel file with filename
export function generateExcelFile(workbook: any, filename: string): {
  buffer: Buffer;
  filename: string;
  mimeType: string;
} {
  const buffer = generateExcelBuffer(workbook);
  return {
    buffer,
    filename: `${filename}.xlsx`,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}
