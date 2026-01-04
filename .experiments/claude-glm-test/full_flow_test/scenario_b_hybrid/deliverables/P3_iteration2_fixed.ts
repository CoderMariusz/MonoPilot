import type { LicensePlate } from '@/lib/types/license-plate';

export type LabelSize = '4x6' | '4x3' | '3x2';

export interface PrintLabelOptions {
  size: LabelSize;
  copies: number;
  includeQR?: boolean;
}

export class LabelPrintService {
  private static readonly LABEL_DIMENSIONS = {
    '4x6': { width: 812, length: 1218 },
    '4x3': { width: 812, length: 609 },
    '3x2': { width: 609, length: 406 },
  };

  private static readonly QR_POSITIONS = {
    '4x6': { x: 600, y: 50 },
    '4x3': { x: 550, y: 50 },
    '3x2': { x: 400, y: 50 },
  };

  private static readonly BARCODE_POSITIONS = {
    '4x6': { x: 50, y: 900 },
    '4x3': { x: 50, y: 450 },
    '3x2': { x: 50, y: 280 },
  };

  static generateZPL(lp: LicensePlate, options: PrintLabelOptions): string {
    this.validatePrintRequest(options);

    const dimensions = this.LABEL_DIMENSIONS[options.size];
    const qrData = options.includeQR !== false ? this.generateQRData(lp) : null;

    return `^XA
^PW${dimensions.width}
^LL${dimensions.length}
^PQ${options.copies}

${this.generateQRCode(qrData, options.size)}
${this.generateBarcode(lp.lp_number, options.size)}
${this.generateTextFields(lp)}
^XZ`;
  }

  static generateBulkZPL(lps: LicensePlate[], options: PrintLabelOptions): string {
    if (lps.length > 100) {
      throw new Error('Maximum 100 license plates per bulk print');
    }

    return lps.map(lp => this.generateZPL(lp, options)).join('\n');
  }

  static validatePrintRequest(options: PrintLabelOptions): void {
    const validSizes: LabelSize[] = ['4x6', '4x3', '3x2'];
    
    if (!validSizes.includes(options.size)) {
      throw new Error('Invalid label size');
    }

    if (options.copies < 1 || options.copies > 100) {
      throw new Error('Copies must be between 1 and 100');
    }
  }

  private static generateQRData(lp: LicensePlate): string {
    const qrData = {
      lp_number: lp.lp_number,
      product_code: lp.product.code,
      product_name: lp.product.name, // Full name in QR
      batch: lp.batch_number || '--',
      expiry: lp.expiry_date || 'N/A',
      quantity: lp.quantity,
      uom: lp.uom,
      warehouse: lp.warehouse.code,
      location: lp.location.name,
    };

    return JSON.stringify(qrData);
  }

  private static generateQRCode(qrData: string | null, size: LabelSize): string {
    if (!qrData) {
      return '';
    }

    const pos = this.QR_POSITIONS[size];
    return `^FO${pos.x},${pos.y}
^BQN,2,6
^FD${qrData}^FS`;
  }

  private static generateBarcode(lpNumber: string, size: LabelSize): string {
    const pos = this.BARCODE_POSITIONS[size];
    return `^FO${pos.x},${pos.y}
^BCN,100,Y,N,N
^FD${lpNumber}^FS`;
  }

  private static generateTextFields(lp: LicensePlate): string {
    const productName = lp.product.name.length > 40 
      ? lp.product.name.substring(0, 40) 
      : lp.product.name;

    const batch = lp.batch_number || '--';
    const expiry = lp.expiry_date || 'N/A';
    const manufacture = lp.manufacture_date ? `Mfg: ${lp.manufacture_date}` : '';
    const quantity = `${lp.quantity.toFixed(1)} ${lp.uom}`;
    const warehouse = lp.warehouse.code;
    const location = lp.location.name;

    return `^FO50,150
^A,N,24,24
^FDProduct: ${productName}^FS

^FO50,200
^A,N,18,18
^FDLP#: ${lp.lp_number}^FS

^FO50,240
^A,N,18,18
^FDBatch: ${batch}^FS

^FO50,280
^A,N,18,18
^FDExp: ${expiry}^FS

${manufacture ? `^FO50,320
^A,N,18,18
^FD${manufacture}^FS` : ''}

^FO50,${manufacture ? 360 : 320}
^A,N,24,24
^FDQty: ${quantity}^FS

^FO50,${manufacture ? 400 : 360}
^A,N,18,18
^FDWH: ${warehouse}^FS

^FO50,${manufacture ? 440 : 400}
^A,N,18,18
^FDLoc: ${location}^FS`;
  }
}