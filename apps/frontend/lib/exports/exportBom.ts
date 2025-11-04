import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client-browser';

interface BomItemExport {
  material_code: string;
  material_name: string;
  quantity: number;
  uom: string;
  scrap_pct: number;
  consume_whole_lp: boolean;
  line: string;
  allergens: string;
  sequence: number;
  is_optional: boolean;
  is_phantom: boolean;
  notes: string;
}

/**
 * Export BOM to Excel file
 * @param bomId - BOM ID to export
 * @param filename - Optional filename (defaults to BOM-{product_part_number}-v{version}.xlsx)
 */
export async function exportBomToXlsx(
  bomId: number,
  filename?: string
): Promise<void> {
  try {
    // Fetch BOM header
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select(`
        id,
        version,
        status,
        line_id,
        product:products(
          part_number,
          description
        )
      `)
      .eq('id', bomId)
      .single();

    if (bomError || !bom) {
      throw new Error(`Failed to fetch BOM: ${bomError?.message || 'Not found'}`);
    }

    // Fetch BOM items with material details
    const { data: items, error: itemsError } = await supabase
      .from('bom_items')
      .select(`
        material_id,
        quantity,
        uom,
        sequence,
        scrap_std_pct,
        consume_whole_lp,
        line_id,
        is_optional,
        is_phantom,
        priority,
        material:products(
          part_number,
          description,
          allergens:product_allergens(
            allergen_id,
            allergen:allergens(code, name)
          )
        )
      `)
      .eq('bom_id', bomId)
      .order('sequence');

    if (itemsError) {
      throw new Error(`Failed to fetch BOM items: ${itemsError.message}`);
    }

    // Fetch production lines for line_id mapping
    const { data: lines } = await supabase
      .from('production_lines')
      .select('id, code, name');

    const lineMap = new Map(
      lines?.map(line => [line.id, line.code]) || []
    );

    // Transform items for export
    const exportData: BomItemExport[] = (items || []).map((item: any) => {
      // Get line codes
      const lineCodes = item.line_id
        ? item.line_id.map((id: number) => lineMap.get(id) || String(id)).join(', ')
        : 'All lines';

      // Get allergen codes (inherited from material)
      const allergens = item.material?.allergens
        ?.map((pa: any) => pa.allergen?.code)
        .filter(Boolean)
        .join(', ') || '-';

      return {
        material_code: item.material?.part_number || '-',
        material_name: item.material?.description || '-',
        quantity: item.quantity,
        uom: item.uom,
        scrap_pct: item.scrap_std_pct || 0,
        consume_whole_lp: item.consume_whole_lp || false,
        line: lineCodes,
        allergens: allergens,
        sequence: item.sequence,
        is_optional: item.is_optional || false,
        is_phantom: item.is_phantom || false,
        notes: item.priority ? `Priority: ${item.priority}` : '',
      };
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create header sheet with BOM metadata
    const headerData = [
      ['BOM Export'],
      [''],
      ['Product:', (bom.product as any)?.part_number || '-'],
      ['Description:', (bom.product as any)?.description || '-'],
      ['Version:', bom.version],
      ['Status:', bom.status],
      ['Lines:', bom.line_id ? bom.line_id.map(id => lineMap.get(id) || id).join(', ') : 'All lines'],
      ['Exported:', new Date().toISOString()],
      [''],
    ];

    const headerSheet = XLSX.utils.aoa_to_sheet(headerData);
    XLSX.utils.book_append_sheet(workbook, headerSheet, 'BOM Info');

    // Create items sheet
    const itemsSheet = XLSX.utils.json_to_sheet(exportData, {
      header: [
        'material_code',
        'material_name',
        'quantity',
        'uom',
        'scrap_pct',
        'consume_whole_lp',
        'line',
        'allergens',
        'sequence',
        'is_optional',
        'is_phantom',
        'notes',
      ],
    });

    // Set column widths
    itemsSheet['!cols'] = [
      { wch: 15 }, // material_code
      { wch: 30 }, // material_name
      { wch: 10 }, // quantity
      { wch: 8 },  // uom
      { wch: 10 }, // scrap_pct
      { wch: 12 }, // consume_whole_lp
      { wch: 15 }, // line
      { wch: 20 }, // allergens
      { wch: 8 },  // sequence
      { wch: 10 }, // is_optional
      { wch: 10 }, // is_phantom
      { wch: 20 }, // notes
    ];

    // Rename headers to be more user-friendly
    const range = XLSX.utils.decode_range(itemsSheet['!ref']!);
    itemsSheet['A1'] = { t: 's', v: 'Material Code' };
    itemsSheet['B1'] = { t: 's', v: 'Material Name' };
    itemsSheet['C1'] = { t: 's', v: 'Quantity' };
    itemsSheet['D1'] = { t: 's', v: 'UoM' };
    itemsSheet['E1'] = { t: 's', v: 'Scrap %' };
    itemsSheet['F1'] = { t: 's', v: '1:1 Consume' };
    itemsSheet['G1'] = { t: 's', v: 'Production Lines' };
    itemsSheet['H1'] = { t: 's', v: 'Allergens (Inherited)' };
    itemsSheet['I1'] = { t: 's', v: 'Sequence' };
    itemsSheet['J1'] = { t: 's', v: 'Optional' };
    itemsSheet['K1'] = { t: 's', v: 'Phantom' };
    itemsSheet['L1'] = { t: 's', v: 'Notes' };

    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'BOM Items');

    // Generate filename
    const defaultFilename = `BOM-${(bom.product as any)?.part_number || bomId}-v${bom.version}.xlsx`;
    const finalFilename = filename || defaultFilename;

    // Write file
    XLSX.writeFile(workbook, finalFilename);

    console.log(`BOM exported successfully: ${finalFilename}`);
  } catch (error: any) {
    console.error('Error exporting BOM:', error);
    throw new Error(`Failed to export BOM: ${error.message}`);
  }
}

/**
 * Export multiple BOMs to a single Excel file (one sheet per BOM)
 */
export async function exportMultipleBoms(
  bomIds: number[],
  filename?: string
): Promise<void> {
  // TODO: Implement multi-BOM export if needed
  throw new Error('Multi-BOM export not yet implemented');
}

