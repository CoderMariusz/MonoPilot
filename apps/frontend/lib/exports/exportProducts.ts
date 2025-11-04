import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client-browser';

interface ProductExport {
  part_number: string;
  description: string;
  group: string;
  type: string;
  active_bom_version: string;
  product_version: string;
  supplier: string;
  is_active: boolean;
  uom: string;
  std_price: number | null;
  lead_time_days: number | null;
  shelf_life_days: number | null;
  production_lines: string;
}

/**
 * Export products to Excel file
 * @param filters - Optional filters (group, type, is_active, etc.)
 * @param filename - Optional filename (defaults to Products-Export-{timestamp}.xlsx)
 */
export async function exportProductsToXlsx(
  filters?: {
    group?: string[];
    type?: string[];
    is_active?: boolean;
    has_active_bom?: boolean;
  },
  filename?: string
): Promise<void> {
  try {
    // Build query
    let query = supabase
      .from('products')
      .select(`
        part_number,
        description,
        group:product_group,
        product_type,
        product_version,
        uom,
        is_active,
        std_price,
        lead_time_days,
        shelf_life_days,
        production_lines,
        supplier:suppliers(name),
        boms:boms!product_id(
          id,
          version,
          status
        )
      `)
      .order('part_number');

    // Apply filters
    if (filters?.group && filters.group.length > 0) {
      query = query.in('product_group', filters.group);
    }

    if (filters?.type && filters.type.length > 0) {
      query = query.in('product_type', filters.type);
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data: products, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    // Fetch production lines for mapping
    const { data: lines } = await supabase
      .from('production_lines')
      .select('id, code, name');

    const lineMap = new Map(
      lines?.map(line => [String(line.id), line.code]) || []
    );

    // Transform products for export
    let exportData: ProductExport[] = (products || []).map((product: any) => {
      // Get active BOM
      const activeBom = product.boms?.find((b: any) => b.status === 'active');
      const activeBomVersion = activeBom ? activeBom.version : '-';

      // Filter by has_active_bom if specified
      if (filters?.has_active_bom !== undefined) {
        const hasActiveBom = activeBom !== undefined;
        if (filters.has_active_bom !== hasActiveBom) {
          return null; // Will be filtered out
        }
      }

      // Get production line codes
      const linesCodes = product.production_lines
        ? product.production_lines
            .map((lineId: string) => lineMap.get(lineId) || lineId)
            .join(', ')
        : '-';

      return {
        part_number: product.part_number,
        description: product.description || '-',
        group: product.group || '-',
        type: product.product_type || '-',
        active_bom_version: activeBomVersion,
        product_version: product.product_version || '1.0',
        supplier: product.supplier?.name || '-',
        is_active: product.is_active,
        uom: product.uom || '-',
        std_price: product.std_price,
        lead_time_days: product.lead_time_days,
        shelf_life_days: product.shelf_life_days,
        production_lines: linesCodes,
      };
    }).filter(Boolean); // Remove nulls from has_active_bom filter

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create header sheet with export metadata
    const headerData = [
      ['Products Export'],
      [''],
      ['Exported:', new Date().toISOString()],
      ['Total Products:', exportData.length],
      ['Filters:', JSON.stringify(filters || {})],
      [''],
    ];

    const headerSheet = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.book_append_sheet(workbook, headerSheet, 'Export Info');

    // Create products sheet
    const productsSheet = XLSX.utils.json_to_sheet(exportData, {
      header: [
        'part_number',
        'description',
        'group',
        'type',
        'active_bom_version',
        'product_version',
        'supplier',
        'is_active',
        'uom',
        'std_price',
        'lead_time_days',
        'shelf_life_days',
        'production_lines',
      ],
    });

    // Set column widths
    productsSheet['!cols'] = [
      { wch: 15 }, // part_number
      { wch: 35 }, // description
      { wch: 12 }, // group
      { wch: 10 }, // type
      { wch: 15 }, // active_bom_version
      { wch: 12 }, // product_version
      { wch: 20 }, // supplier
      { wch: 10 }, // is_active
      { wch: 8 },  // uom
      { wch: 12 }, // std_price
      { wch: 12 }, // lead_time_days
      { wch: 12 }, // shelf_life_days
      { wch: 20 }, // production_lines
    ];

    // Rename headers to be more user-friendly
    productsSheet['A1'] = { t: 's', v: 'Part Number' };
    productsSheet['B1'] = { t: 's', v: 'Description' };
    productsSheet['C1'] = { t: 's', v: 'Group' };
    productsSheet['D1'] = { t: 's', v: 'Type' };
    productsSheet['E1'] = { t: 's', v: 'Active BOM Version' };
    productsSheet['F1'] = { t: 's', v: 'Product Version' };
    productsSheet['G1'] = { t: 's', v: 'Supplier' };
    productsSheet['H1'] = { t: 's', v: 'Active' };
    productsSheet['I1'] = { t: 's', v: 'UoM' };
    productsSheet['J1'] = { t: 's', v: 'Std Price' };
    productsSheet['K1'] = { t: 's', v: 'Lead Time (days)' };
    productsSheet['L1'] = { t: 's', v: 'Shelf Life (days)' };
    productsSheet['M1'] = { t: 's', v: 'Production Lines' };

    XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `Products-Export-${timestamp}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Write file
    XLSX.writeFile(workbook, finalFilename);

    console.log(`Products exported successfully: ${finalFilename}`);
  } catch (error: any) {
    console.error('Error exporting products:', error);
    throw new Error(`Failed to export products: ${error.message}`);
  }
}

/**
 * Export products summary (aggregated stats)
 */
export async function exportProductsSummary(filename?: string): Promise<void> {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('product_group, product_type, is_active');

    if (!products) {
      throw new Error('No products found');
    }

    // Calculate stats
    const byGroup = products.reduce((acc: Record<string, number>, p) => {
      acc[p.product_group] = (acc[p.product_group] || 0) + 1;
      return acc;
    }, {});

    const byType = products.reduce((acc: Record<string, number>, p) => {
      acc[p.product_type] = (acc[p.product_type] || 0) + 1;
      return acc;
    }, {});

    const activeCount = products.filter(p => p.is_active).length;
    const inactiveCount = products.length - activeCount;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Products Summary'],
      [''],
      ['Total Products:', products.length],
      ['Active:', activeCount],
      ['Inactive:', inactiveCount],
      [''],
      ['By Group:'],
      ...Object.entries(byGroup).map(([group, count]) => [group, count]),
      [''],
      ['By Type:'],
      ...Object.entries(byType).map(([type, count]) => [type, count]),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const defaultFilename = `Products-Summary-${timestamp}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Write file
    XLSX.writeFile(workbook, finalFilename);

    console.log(`Products summary exported successfully: ${finalFilename}`);
  } catch (error: any) {
    console.error('Error exporting products summary:', error);
    throw new Error(`Failed to export products summary: ${error.message}`);
  }
}

