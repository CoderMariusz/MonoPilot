/**
 * Label Print Service (Story 05.14)
 * Purpose: Generate ZPL labels for License Plates
 *
 * Features:
 * - ZPL template generation for 4x6, 4x3, 3x2 labels
 * - CODE128 barcode for LP number
 * - QR code with LP metadata JSON
 * - Bulk label generation
 * - Special character escaping
 *
 * AC Coverage:
 * - AC-1: ZPL template generation
 * - AC-3: Missing optional fields handling
 * - AC-8: Service methods
 * - AC-9: QR code data structure
 * - AC-13: Performance requirements
 */

// =============================================================================
// Types
// =============================================================================

export interface LPLabelData {
  lp_number: string
  product_name: string
  quantity: number
  uom: string
  batch_number?: string | null
  expiry_date?: string | null
  manufacture_date?: string | null
  location_path?: string | null
  product_id?: string
  qr_data?: string
}

export interface LabelGenerationOptions {
  copies?: number
  label_size?: '4x6' | '4x3' | '3x2'
  include_qr?: boolean
  concat?: boolean
}

// =============================================================================
// Constants
// =============================================================================

// Label dimensions in dots (203 DPI)
const LABEL_DIMENSIONS = {
  '4x6': { width: 812, height: 1218 }, // 4" x 6" at 203 DPI
  '4x3': { width: 812, height: 609 }, // 4" x 3" at 203 DPI
  '3x2': { width: 609, height: 406 }, // 3" x 2" at 203 DPI
}

// Default positions for 4x6 label
const POSITIONS_4x6 = {
  barcode: { x: 50, y: 50 },
  qr: { x: 550, y: 50 },
  product_label: { x: 50, y: 200 },
  product_value: { x: 160, y: 200 },
  qty_label: { x: 50, y: 240 },
  qty_value: { x: 160, y: 240 },
  batch_label: { x: 50, y: 280 },
  batch_value: { x: 160, y: 280 },
  expiry_label: { x: 50, y: 320 },
  expiry_value: { x: 160, y: 320 },
  location_label: { x: 50, y: 360 },
  location_value: { x: 160, y: 360 },
}

// =============================================================================
// Label Print Service
// =============================================================================

export class LabelPrintService {
  /**
   * Build ZPL string for a single LP label
   * AC-1: ZPL template generation
   *
   * @param data - LP label data
   * @param options - Generation options
   * @returns ZPL string
   */
  static buildZPL(data: LPLabelData, options: LabelGenerationOptions = {}): string {
    const copies = options.copies ?? 1
    const labelSize = options.label_size ?? '4x6'
    const includeQR = options.include_qr ?? true

    const dimensions = LABEL_DIMENSIONS[labelSize]
    const positions = POSITIONS_4x6 // Use 4x6 positions, adjust for smaller labels

    // Format data with defaults
    const formattedData = {
      lp_number: data.lp_number,
      product_name: this.truncateText(data.product_name, 40),
      quantity: String(data.quantity),
      uom: data.uom,
      batch_number: data.batch_number || '--',
      expiry_date: this.formatDate(data.expiry_date) || '--',
      location_path: this.truncateText(data.location_path || 'Unassigned', 35),
    }

    // Generate QR data
    const qrData = includeQR ? this.escapeZPL(this.generateQRData(data)) : ''

    // Build ZPL template
    let zpl = `^XA
^MMT
^PW${dimensions.width}
^LL${dimensions.height}
^LS0

^CF0,28
^FO${positions.barcode.x},30^FDLicense Plate^FS

^BY3,3,100
^FO${positions.barcode.x},${positions.barcode.y}^BCN,100,Y,N,N
^FD${formattedData.lp_number}^FS
`

    // Add QR code if enabled
    if (includeQR && qrData) {
      zpl += `
^FO${positions.qr.x},${positions.qr.y}^BQN,2,4
^FDQA,${qrData}^FS
`
    }

    // Add text fields
    zpl += `
^CF0,24
^FO${positions.product_label.x},${positions.product_value.y}^FDProduct:^FS
^FO${positions.product_value.x},${positions.product_value.y}^FD${this.escapeZPL(formattedData.product_name)}^FS

^FO${positions.qty_label.x},${positions.qty_value.y}^FDQuantity:^FS
^FO${positions.qty_value.x},${positions.qty_value.y}^FD${formattedData.quantity} ${formattedData.uom}^FS

^FO${positions.batch_label.x},${positions.batch_value.y}^FDBatch:^FS
^FO${positions.batch_value.x},${positions.batch_value.y}^FD${this.escapeZPL(formattedData.batch_number)}^FS

^FO${positions.expiry_label.x},${positions.expiry_value.y}^FDExpiry:^FS
^FO${positions.expiry_value.x},${positions.expiry_value.y}^FD${formattedData.expiry_date}^FS

^FO${positions.location_label.x},${positions.location_value.y}^FDLocation:^FS
^FO${positions.location_value.x},${positions.location_value.y}^A0N,20,20^FD${this.escapeZPL(formattedData.location_path)}^FS

^PQ${copies},0,1,Y

^XZ`

    return zpl
  }

  /**
   * Generate ZPL for multiple LPs
   *
   * @param dataArray - Array of LP label data
   * @param options - Generation options
   * @returns Array of ZPL strings or concatenated string
   */
  static generateBulkLabels(
    dataArray: LPLabelData[],
    options: LabelGenerationOptions = {}
  ): string[] | string {
    if (dataArray.length === 0) {
      return options.concat ? '' : []
    }

    const labels = dataArray.map((data) => this.buildZPL(data, options))

    if (options.concat) {
      return labels.join('\n')
    }

    return labels
  }

  /**
   * Generate QR code data JSON
   * AC-9: QR code data structure
   *
   * @param data - LP label data
   * @returns JSON string for QR code
   */
  static generateQRData(data: LPLabelData): string {
    const qrObject = {
      lp: data.lp_number,
      product: data.product_name, // Full name in QR (not truncated)
      product_id: data.product_id || null,
      qty: data.quantity,
      uom: data.uom,
      batch: data.batch_number || null,
      expiry: data.expiry_date || null,
      location: data.location_path || null,
    }

    return JSON.stringify(qrObject)
  }

  /**
   * Escape special ZPL characters
   * AC-8: Special character escaping
   *
   * @param text - Raw text
   * @returns ZPL-safe text
   */
  static escapeZPL(text: string): string {
    if (!text) return ''

    return text
      .replace(/\\/g, '\\\\') // Escape backslash first
      .replace(/\^/g, '\\^') // Escape caret
      .replace(/~/g, '\\~') // Escape tilde
  }

  /**
   * Truncate text with ellipsis
   *
   * @param text - Text to truncate
   * @param maxLength - Maximum length
   * @returns Truncated text
   */
  static truncateText(text: string | null | undefined, maxLength: number): string {
    if (!text) return ''
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength - 3) + '...'
  }

  /**
   * Format date as YYYY-MM-DD
   *
   * @param dateStr - Date string (ISO or YYYY-MM-DD)
   * @returns Formatted date or null
   */
  static formatDate(dateStr: string | null | undefined): string | null {
    if (!dateStr) return null

    // Handle ISO date strings
    if (dateStr.includes('T')) {
      return dateStr.split('T')[0]
    }

    // Already in YYYY-MM-DD format
    return dateStr
  }

  /**
   * Validate label data
   *
   * @param data - LP label data
   * @returns Validation result
   */
  static validateData(data: LPLabelData): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.lp_number) {
      errors.push('LP number is required')
    }

    if (!data.product_name) {
      errors.push('Product name is required')
    }

    if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      errors.push('Quantity must be a positive number')
    }

    if (!data.uom) {
      errors.push('UoM is required')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Get label dimensions
   *
   * @param size - Label size
   * @returns Dimensions in dots
   */
  static getDimensions(size: '4x6' | '4x3' | '3x2' = '4x6'): { width: number; height: number } {
    return LABEL_DIMENSIONS[size]
  }
}

// Export singleton for convenience
export const labelPrintService = new LabelPrintService()
