// P3: GREEN Implementation - Label Print Service
// Story: 05.14 - LP Label Printing (ZPL)
// Agent: BACKEND-DEV (Claude - Scenario A)
// Phase: 3/7 - TDD GREEN phase

import type { LicensePlate } from '@/lib/types/license-plate';

// ========================================
// TYPES
// ========================================

export type LabelSize = '4x6' | '4x3' | '3x2';

export interface PrintLabelOptions {
  size: LabelSize;
  copies: number;
  includeQR?: boolean;
}

export interface LabelDimensions {
  width: number;  // dots
  length: number; // dots
}

export interface QRCodeData {
  lp_number: string;
  product_code: string;
  product_name: string;
  batch: string | null;
  expiry: string | null;
  quantity: number;
  uom: string;
  warehouse: string;
  location: string;
}

// ========================================
// LABEL PRINT SERVICE
// ========================================

export class LabelPrintService {
  // ZPL dot density: 203 DPI (8 dots per mm)
  private static readonly DPI = 203;

  // Label size configurations (in dots)
  private static readonly LABEL_DIMENSIONS: Record<LabelSize, LabelDimensions> = {
    '4x6': { width: 812, length: 1218 }, // 4" x 6" at 203 DPI
    '4x3': { width: 812, length: 609 },  // 4" x 3" at 203 DPI
    '3x2': { width: 609, length: 406 },  // 3" x 2" at 203 DPI
  };

  /**
   * Generate ZPL code for a single LP label
   */
  static generateZPL(lp: LicensePlate, options: PrintLabelOptions): string {
    this.validatePrintRequest(options);

    const dims = this.LABEL_DIMENSIONS[options.size];
    const productName = this.truncateProductName(lp.product.name);
    const batch = lp.batch_number || '--';
    const expiry = lp.expiry_date || 'N/A';
    const mfgDate = lp.manufacture_date || null;

    let zpl = '';

    // ZPL Header
    zpl += '^XA\n'; // Start format
    zpl += `^PW${dims.width}\n`; // Print width
    zpl += `^LL${dims.length}\n`; // Label length
    zpl += `^PQ${options.copies}\n`; // Print quantity

    // ===== QR CODE (if enabled) =====
    if (options.includeQR !== false) {
      const qrData = this.buildQRData(lp);
      zpl += this.generateQRCode(qrData, options.size);
    }

    // ===== BARCODE (LP Number - CODE128) =====
    zpl += this.generateBarcode(lp.lp_number, options.size);

    // ===== TEXT FIELDS =====
    zpl += this.generateTextField('Product', productName, 50, 150, 'medium');
    zpl += this.generateTextField('LP#', lp.lp_number, 50, 200, 'small');
    zpl += this.generateTextField('Batch', batch, 50, 240, 'small');
    zpl += this.generateTextField('Exp', expiry, 50, 280, 'small');

    if (mfgDate) {
      zpl += this.generateTextField('Mfg', mfgDate, 50, 320, 'small');
    }

    // Quantity with UOM
    const qtyText = `${lp.quantity.toFixed(1)} ${lp.uom}`;
    zpl += this.generateTextField('Qty', qtyText, 50, 360, 'medium');

    // Warehouse and Location
    zpl += this.generateTextField('WH', lp.warehouse.code, 50, 400, 'small');
    zpl += this.generateTextField('Loc', lp.location.name, 50, 440, 'small');

    // ZPL Footer
    zpl += '^XZ\n'; // End format

    return zpl;
  }

  /**
   * Generate ZPL for bulk printing multiple LPs
   */
  static generateBulkZPL(lps: LicensePlate[], options: PrintLabelOptions): string {
    if (lps.length > 100) {
      throw new Error('Maximum 100 license plates per bulk print');
    }

    return lps.map(lp => this.generateZPL(lp, options)).join('\n');
  }

  /**
   * Validate print request parameters
   */
  static validatePrintRequest(options: PrintLabelOptions): void {
    const validSizes: LabelSize[] = ['4x6', '4x3', '3x2'];

    if (!validSizes.includes(options.size)) {
      throw new Error('Invalid label size. Must be one of: 4x6, 4x3, 3x2');
    }

    if (options.copies < 1 || options.copies > 100) {
      throw new Error('Copies must be between 1 and 100');
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Truncate product name to 40 characters for label display
   */
  private static truncateProductName(name: string): string {
    return name.length > 40 ? name.substring(0, 40) : name;
  }

  /**
   * Build QR code data structure
   */
  private static buildQRData(lp: LicensePlate): QRCodeData {
    return {
      lp_number: lp.lp_number,
      product_code: lp.product.code,
      product_name: lp.product.name,
      batch: lp.batch_number,
      expiry: lp.expiry_date,
      quantity: lp.quantity,
      uom: lp.uom,
      warehouse: lp.warehouse.code,
      location: lp.location.name,
    };
  }

  /**
   * Generate QR Code ZPL command
   */
  private static generateQRCode(data: QRCodeData, size: LabelSize): string {
    const jsonData = JSON.stringify(data);

    // QR code position varies by label size
    const positions = {
      '4x6': { x: 600, y: 50 },
      '4x3': { x: 500, y: 50 },
      '3x2': { x: 400, y: 50 },
    };

    const pos = positions[size];

    let zpl = '';
    zpl += `^FO${pos.x},${pos.y}\n`; // Field Origin
    zpl += '^BQN,2,6\n'; // QR Code: Normal orientation, Model 2, Magnification 6
    zpl += `^FD${jsonData}^FS\n`; // Field Data + Field Separator

    return zpl;
  }

  /**
   * Generate CODE128 Barcode ZPL command
   */
  private static generateBarcode(lpNumber: string, size: LabelSize): string {
    const positions = {
      '4x6': { x: 50, y: 500 },
      '4x3': { x: 50, y: 450 },
      '3x2': { x: 50, y: 300 },
    };

    const pos = positions[size];

    let zpl = '';
    zpl += `^FO${pos.x},${pos.y}\n`; // Field Origin
    zpl += '^BCN,100,Y,N,N\n'; // CODE128: Normal, Height 100, Print interpretation line
    zpl += `^FD${lpNumber}^FS\n`; // Field Data + Field Separator

    return zpl;
  }

  /**
   * Generate text field ZPL command
   */
  private static generateTextField(
    label: string,
    value: string,
    x: number,
    y: number,
    fontSize: 'small' | 'medium' | 'large'
  ): string {
    const fontSizes = {
      small: 'A,N,18,18',
      medium: 'A,N,24,24',
      large: 'A,N,32,32',
    };

    let zpl = '';
    zpl += `^FO${x},${y}\n`; // Field Origin
    zpl += `^${fontSizes[fontSize]}\n`; // Font
    zpl += `^FD${label}: ${value}^FS\n`; // Field Data + Field Separator

    return zpl;
  }
}

export default LabelPrintService;
