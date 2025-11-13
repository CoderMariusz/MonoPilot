/**
 * EPIC-002 Phase 4: Scanner UX - ZPL Label Generation
 *
 * ZPL (Zebra Programming Language) utilities for generating labels
 * for industrial Zebra label printers
 */

export interface PalletLabelData {
  pallet_number: string;
  pallet_type: string;
  wo_number?: string | null;
  product_description?: string | null;
  item_count: number;
  total_quantity: number;
  uom?: string;
  created_at: string;
  closed_at?: string | null;
}

/**
 * Generate ZPL code for a pallet label (4x6 inch label, 203 DPI)
 *
 * Layout:
 * - Header: Company name / title
 * - Pallet Number: Large barcode (Code 128) + human-readable text
 * - Details: WO, Product, Item count, Quantity
 * - Footer: Date/Time
 *
 * @param data Pallet label data
 * @returns ZPL code string ready to send to Zebra printer
 */
export function generatePalletLabelZPL(data: PalletLabelData): string {
  const {
    pallet_number,
    pallet_type,
    wo_number,
    product_description,
    item_count,
    total_quantity,
    uom,
    created_at,
    closed_at
  } = data;

  // Format dates
  const createdDate = new Date(created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Truncate long product descriptions
  const productText = product_description
    ? (product_description.length > 40
        ? product_description.substring(0, 37) + '...'
        : product_description)
    : 'N/A';

  // Build ZPL code
  const zpl = `
^XA
^CF0,40
^FO50,30^FDMonoPilot MES^FS

^CF0,30
^FO50,80^FDPallet Label^FS

^BY3,3,100
^FO50,130^BC^FD${pallet_number}^FS

^CF0,50
^FO50,250^FD${pallet_number}^FS

^CF0,30
^FO50,320^FDType: ${pallet_type}^FS

${wo_number ? `^FO50,360^FDWO: ${wo_number}^FS` : ''}

^CF0,25
^FO50,${wo_number ? 400 : 360}^FDProduct:^FS
^FO50,${wo_number ? 430 : 390}^FD${productText}^FS

^FO50,${wo_number ? 470 : 430}^FDItems: ${item_count} | Qty: ${total_quantity} ${uom || ''}^FS

^CF0,20
^FO50,${wo_number ? 520 : 480}^FDCreated: ${createdDate}^FS

^FO50,${wo_number ? 550 : 510}^GB700,1,3^FS

^XZ
`.trim();

  return zpl;
}

/**
 * Generate a simple test label for printer testing
 *
 * @returns ZPL code for a test label
 */
export function generateTestLabelZPL(): string {
  return `
^XA
^CF0,50
^FO100,100^FDTest Label^FS
^FO100,180^FDMonoPilot MES^FS

^BY3,3,80
^FO100,250^BC^FDTEST-001^FS

^CF0,30
^FO100,350^FDTEST-001^FS

^CF0,20
^FO100,400^FD${new Date().toLocaleString()}^FS

^XZ
`.trim();
}

/**
 * Send ZPL code to a network printer (IP address)
 * Note: This requires server-side execution and network access to printer
 *
 * @param zpl ZPL code to print
 * @param printerIP IP address of Zebra printer
 * @param printerPort Port number (default 9100 for Zebra)
 * @returns Promise<boolean> Success status
 */
export async function sendToPrinter(
  zpl: string,
  printerIP: string,
  printerPort: number = 9100
): Promise<boolean> {
  // This would require a server-side TCP socket connection
  // For now, this is a placeholder that would be implemented
  // using Node.js net module or a printing service

  console.log('Sending ZPL to printer:', printerIP, printerPort);
  console.log('ZPL Code:', zpl);

  // In a real implementation, you would:
  // 1. Open a TCP socket to printerIP:printerPort
  // 2. Send the ZPL string
  // 3. Close the connection
  // 4. Handle errors

  // For now, return true to simulate success
  return true;
}

/**
 * Download ZPL code as a text file (for manual printing or testing)
 *
 * @param zpl ZPL code
 * @param filename Filename for download
 */
export function downloadZPLFile(zpl: string, filename: string = 'label.zpl'): void {
  const blob = new Blob([zpl], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
