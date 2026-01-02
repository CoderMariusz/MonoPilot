/**
 * Excel Service
 * Story: 03.6 - PO Bulk Operations
 *
 * Service for parsing and generating Excel files.
 * Uses the xlsx library for both parsing and generation.
 *
 * Methods:
 * - parseFile: Parse .xlsx or .csv file to rows
 * - createWorkbook: Create new Excel workbook
 * - addSheet: Add sheet to workbook
 * - downloadWorkbook: Generate file buffer for download
 *
 * @module excel-service
 */

import * as XLSX from 'xlsx'

/**
 * Workbook type alias for xlsx library
 */
export type Workbook = XLSX.WorkBook

/**
 * Worksheet type alias for xlsx library
 */
export type WorkSheet = XLSX.WorkSheet

/**
 * Supported file types for import
 */
export const SUPPORTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
  'application/csv', // .csv (alternative MIME type)
]

/**
 * Maximum file size for import (5MB)
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

/**
 * Excel Service class
 * Handles Excel file parsing and generation
 */
export class ExcelService {
  /**
   * Parse an Excel or CSV file into rows of data.
   * First row is assumed to be headers.
   *
   * @param file - File object to parse
   * @returns Promise<any[][]> - Array of rows (each row is array of cell values)
   * @throws Error if file format is unsupported or parsing fails
   */
  static async parseFile(file: File): Promise<unknown[][]> {
    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('FILE_TOO_LARGE')
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    const isValidExtension = ['xlsx', 'xls', 'csv'].includes(extension || '')
    const isValidMimeType = SUPPORTED_FILE_TYPES.includes(file.type) || file.type === ''

    if (!isValidExtension && !isValidMimeType) {
      throw new Error('INVALID_FILE_FORMAT')
    }

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })

      // Get first sheet
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        throw new Error('EMPTY_WORKBOOK')
      }

      const sheet = workbook.Sheets[sheetName]

      // Convert to array of arrays
      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: false,
        defval: null,
      })

      return data
    } catch (error) {
      if (error instanceof Error) {
        if (['FILE_TOO_LARGE', 'INVALID_FILE_FORMAT', 'EMPTY_WORKBOOK'].includes(error.message)) {
          throw error
        }
      }
      console.error('Error parsing file:', error)
      throw new Error('PARSE_ERROR')
    }
  }

  /**
   * Parse file buffer directly (for API routes receiving Buffer)
   *
   * @param buffer - ArrayBuffer or Buffer
   * @param filename - Original filename for extension detection
   * @returns Array of rows
   */
  static parseBuffer(buffer: ArrayBuffer | Buffer, filename: string): unknown[][] {
    const extension = filename.split('.').pop()?.toLowerCase()
    const isValidExtension = ['xlsx', 'xls', 'csv'].includes(extension || '')

    if (!isValidExtension) {
      throw new Error('INVALID_FILE_FORMAT')
    }

    try {
      const workbook = XLSX.read(buffer, { type: 'array' })

      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        throw new Error('EMPTY_WORKBOOK')
      }

      const sheet = workbook.Sheets[sheetName]

      const data = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        raw: false,
        defval: null,
      })

      return data
    } catch (error) {
      if (error instanceof Error) {
        if (['INVALID_FILE_FORMAT', 'EMPTY_WORKBOOK'].includes(error.message)) {
          throw error
        }
      }
      console.error('Error parsing buffer:', error)
      throw new Error('PARSE_ERROR')
    }
  }

  /**
   * Create a new Excel workbook.
   *
   * @returns Workbook - New xlsx workbook
   */
  static createWorkbook(): Workbook {
    return XLSX.utils.book_new()
  }

  /**
   * Add a sheet to an existing workbook.
   *
   * @param workbook - Existing workbook
   * @param name - Sheet name
   * @param data - 2D array of data (first row is headers)
   * @returns WorkSheet - The created worksheet
   */
  static addSheet(workbook: Workbook, name: string, data: unknown[][]): WorkSheet {
    const sheet = XLSX.utils.aoa_to_sheet(data)

    // Set column widths based on content
    const colWidths: number[] = []
    for (const row of data) {
      for (let i = 0; i < row.length; i++) {
        const cellLength = String(row[i] || '').length
        colWidths[i] = Math.max(colWidths[i] || 10, Math.min(cellLength + 2, 50))
      }
    }
    sheet['!cols'] = colWidths.map(w => ({ wch: w }))

    XLSX.utils.book_append_sheet(workbook, sheet, name)
    return sheet
  }

  /**
   * Add a sheet from JSON objects.
   *
   * @param workbook - Existing workbook
   * @param name - Sheet name
   * @param data - Array of objects
   * @param headers - Optional custom headers (default: object keys)
   * @returns WorkSheet - The created worksheet
   */
  static addSheetFromJSON(
    workbook: Workbook,
    name: string,
    data: Record<string, unknown>[],
    headers?: string[]
  ): WorkSheet {
    const sheet = XLSX.utils.json_to_sheet(data, { header: headers })

    // Set column widths
    const colWidths: number[] = []
    const jsonHeaders = headers || Object.keys(data[0] || {})

    for (let i = 0; i < jsonHeaders.length; i++) {
      let maxLen = jsonHeaders[i].length
      for (const row of data) {
        const cellValue = row[jsonHeaders[i]]
        const cellLength = String(cellValue || '').length
        maxLen = Math.max(maxLen, cellLength)
      }
      colWidths[i] = Math.min(maxLen + 2, 50)
    }
    sheet['!cols'] = colWidths.map(w => ({ wch: w }))

    XLSX.utils.book_append_sheet(workbook, sheet, name)
    return sheet
  }

  /**
   * Generate workbook as Buffer for download/response.
   *
   * @param workbook - Workbook to convert
   * @returns Buffer - Excel file buffer
   */
  static workbookToBuffer(workbook: Workbook): Buffer {
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })
    return Buffer.from(excelBuffer)
  }

  /**
   * Generate workbook as ArrayBuffer (for browser download).
   *
   * @param workbook - Workbook to convert
   * @returns ArrayBuffer - Excel file buffer
   */
  static workbookToArrayBuffer(workbook: Workbook): ArrayBuffer {
    const excelBuffer = XLSX.write(workbook, {
      type: 'array',
      bookType: 'xlsx',
    })
    return excelBuffer
  }

  /**
   * Download workbook (client-side only).
   * Triggers browser file download.
   *
   * @param workbook - Workbook to download
   * @param filename - Download filename
   */
  static downloadWorkbook(workbook: Workbook, filename: string): void {
    XLSX.writeFile(workbook, filename)
  }

  /**
   * Extract headers from parsed data.
   * Normalizes header names for matching.
   *
   * @param data - Parsed file data (first row is headers)
   * @returns string[] - Normalized header names
   */
  static extractHeaders(data: unknown[][]): string[] {
    if (!data || data.length === 0) {
      return []
    }

    return data[0].map(cell =>
      String(cell || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]/g, '_')
    )
  }

  /**
   * Map raw data to objects using headers.
   *
   * @param data - Parsed file data (first row is headers)
   * @param headerMap - Optional mapping from file headers to output keys
   * @returns Array of objects
   */
  static mapToObjects<T extends Record<string, unknown>>(
    data: unknown[][],
    headerMap?: Record<string, string>
  ): T[] {
    if (!data || data.length < 2) {
      return []
    }

    const headers = this.extractHeaders(data)
    const rows = data.slice(1)

    return rows.map(row => {
      const obj: Record<string, unknown> = {}

      headers.forEach((header, index) => {
        const key = headerMap?.[header] || header
        obj[key] = row[index] ?? null
      })

      return obj as T
    })
  }

  /**
   * Validate required columns exist in headers.
   *
   * @param headers - Extracted headers
   * @param required - Required column names (normalized)
   * @returns { valid: boolean, missing: string[] }
   */
  static validateRequiredColumns(
    headers: string[],
    required: string[]
  ): { valid: boolean; missing: string[] } {
    const normalized = headers.map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    const missing = required.filter(req => !normalized.includes(req))

    return {
      valid: missing.length === 0,
      missing,
    }
  }
}

/**
 * Default header mapping for PO import files.
 * Maps common variations to standard field names.
 */
export const PO_IMPORT_HEADER_MAP: Record<string, string> = {
  // Product code variations
  'product_code': 'product_code',
  'productcode': 'product_code',
  'product': 'product_code',
  'sku': 'product_code',
  'item_code': 'product_code',
  'item': 'product_code',
  'material': 'product_code',
  'material_code': 'product_code',

  // Quantity variations
  'quantity': 'quantity',
  'qty': 'quantity',
  'amount': 'quantity',
  'order_qty': 'quantity',
  'order_quantity': 'quantity',

  // Expected delivery variations
  'expected_delivery': 'expected_delivery',
  'delivery_date': 'expected_delivery',
  'eta': 'expected_delivery',
  'due_date': 'expected_delivery',
  'expected_date': 'expected_delivery',

  // Unit price variations
  'unit_price': 'unit_price',
  'price': 'unit_price',
  'unitprice': 'unit_price',
  'cost': 'unit_price',
  'unit_cost': 'unit_price',

  // Notes variations
  'notes': 'notes',
  'note': 'notes',
  'comments': 'notes',
  'comment': 'notes',
  'remarks': 'notes',

  // Warehouse variations
  'warehouse_code': 'warehouse_code',
  'warehouse': 'warehouse_code',
  'location': 'warehouse_code',
}

/**
 * Required columns for PO import
 */
export const PO_IMPORT_REQUIRED_COLUMNS = ['product_code', 'quantity']
