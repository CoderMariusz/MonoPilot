/**
 * Excel Paste Handler for Spreadsheet Mode
 *
 * Handles pasting TSV (Tab-Separated Values) data from Excel into the spreadsheet grid.
 * Supports:
 * - Column mapping by position or header name
 * - Header row detection
 * - Data validation
 * - Row creation from pasted data
 */

import type { SpreadsheetRow, ColumnConfig } from '@/components/SpreadsheetTable';

export interface PasteResult<T extends SpreadsheetRow> {
  rows: T[];
  warnings: string[];
  errors: string[];
}

export interface PasteOptions {
  hasHeaderRow?: boolean; // If true, first row is treated as column headers
  startRowNumber?: number; // Starting row number for new rows
  columnMapping?: Record<string, number>; // Map column key to TSV column index
}

/**
 * Parse pasted TSV data into spreadsheet rows
 */
export function parsePastedData<T extends SpreadsheetRow>(
  pastedData: string[][],
  columns: ColumnConfig<T>[],
  options: PasteOptions = {}
): PasteResult<T> {
  const {
    hasHeaderRow = false,
    startRowNumber = 1,
    columnMapping,
  } = options;

  const rows: T[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Determine column mapping
  let mapping: Record<string, number>;

  if (columnMapping) {
    // Use provided mapping
    mapping = columnMapping;
  } else if (hasHeaderRow && pastedData.length > 0) {
    // Auto-detect mapping from header row
    mapping = detectColumnMapping(pastedData[0], columns);
  } else {
    // Default: map by position (first editable column = first TSV column, etc.)
    mapping = createPositionalMapping(columns);
  }

  // Data rows start at index 0 (no header) or 1 (with header)
  const dataStartIndex = hasHeaderRow ? 1 : 0;
  const dataRows = pastedData.slice(dataStartIndex);

  if (dataRows.length === 0) {
    warnings.push('No data rows found in pasted content');
    return { rows, warnings, errors };
  }

  // Parse each data row
  dataRows.forEach((dataRow, idx) => {
    const rowNumber = startRowNumber + idx;
    const row: T = {
      id: `row-${Date.now()}-${idx}`,
      _rowNumber: rowNumber,
      _validationStatus: 'pending',
      _isDirty: true,
    } as T;

    // Map TSV columns to spreadsheet columns
    Object.entries(mapping).forEach(([columnKey, tsvIndex]) => {
      if (tsvIndex < dataRow.length) {
        const value = dataRow[tsvIndex]?.trim() || '';
        (row as any)[columnKey] = value;
      }
    });

    // Validate required fields
    const missingFields: string[] = [];
    columns.forEach((col) => {
      if (col.required && !row[col.key as keyof T]) {
        missingFields.push(col.name);
      }
    });

    if (missingFields.length > 0) {
      row._validationStatus = 'error';
      row._validationMessage = `Missing required fields: ${missingFields.join(', ')}`;
      errors.push(`Row ${rowNumber}: ${row._validationMessage}`);
    }

    rows.push(row);
  });

  if (rows.length > 0) {
    warnings.push(`Successfully parsed ${rows.length} rows from Excel`);
  }

  return { rows, warnings, errors };
}

/**
 * Detect column mapping from header row
 * Maps header names to column keys (case-insensitive, fuzzy matching)
 */
function detectColumnMapping<T extends SpreadsheetRow>(
  headerRow: string[],
  columns: ColumnConfig<T>[]
): Record<string, number> {
  const mapping: Record<string, number> = {};

  columns.forEach((col) => {
    const columnKey = col.key as string;
    if (columnKey.startsWith('_')) return; // Skip internal columns

    // Try exact match (case-insensitive)
    const exactMatchIdx = headerRow.findIndex(
      (header) => header.trim().toLowerCase() === col.name.toLowerCase()
    );

    if (exactMatchIdx !== -1) {
      mapping[columnKey] = exactMatchIdx;
      return;
    }

    // Try fuzzy match (remove spaces, asterisks, common suffixes)
    const normalizedColName = normalizeColumnName(col.name);
    const fuzzyMatchIdx = headerRow.findIndex((header) => {
      const normalizedHeader = normalizeColumnName(header);
      return normalizedHeader === normalizedColName;
    });

    if (fuzzyMatchIdx !== -1) {
      mapping[columnKey] = fuzzyMatchIdx;
      return;
    }

    // Try common aliases
    const aliases = getColumnAliases(columnKey);
    for (const alias of aliases) {
      const aliasIdx = headerRow.findIndex(
        (header) => header.trim().toLowerCase() === alias.toLowerCase()
      );
      if (aliasIdx !== -1) {
        mapping[columnKey] = aliasIdx;
        return;
      }
    }
  });

  return mapping;
}

/**
 * Create positional mapping (first editable column = first TSV column, etc.)
 */
function createPositionalMapping<T extends SpreadsheetRow>(
  columns: ColumnConfig<T>[]
): Record<string, number> {
  const mapping: Record<string, number> = {};
  let tsvIndex = 0;

  columns.forEach((col) => {
    const columnKey = col.key as string;
    if (columnKey.startsWith('_')) return; // Skip internal columns
    if (col.editable === false) return; // Skip read-only columns

    mapping[columnKey] = tsvIndex;
    tsvIndex++;
  });

  return mapping;
}

/**
 * Normalize column name for fuzzy matching
 */
function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '') // Remove spaces
    .replace(/\*/g, '') // Remove asterisks (required markers)
    .replace(/\(.*?\)/g, '') // Remove parentheses content
    .trim();
}

/**
 * Get common aliases for column keys
 */
function getColumnAliases(columnKey: string): string[] {
  const aliasMap: Record<string, string[]> = {
    product_code: ['sku', 'part number', 'partno', 'item code', 'product'],
    product_name: ['name', 'description', 'item name', 'product description'],
    quantity: ['qty', 'amount', 'count'],
    uom: ['unit', 'unit of measure', 'um'],
    unit_price: ['price', 'cost', 'rate'],
    requested_delivery_date: [
      'delivery date',
      'due date',
      'requested date',
      'delivery',
    ],
    scheduled_start: ['start', 'start time', 'start date', 'begin'],
    scheduled_end: ['end', 'end time', 'end date', 'finish'],
    production_line: ['line', 'prod line', 'manufacturing line'],
    warehouse_name: ['warehouse', 'wh', 'location'],
    supplier_name: ['supplier', 'vendor'],
    notes: ['note', 'comments', 'remark'],
  };

  return aliasMap[columnKey] || [];
}

/**
 * Validate pasted data before creating rows
 */
export function validatePastedData<T extends SpreadsheetRow>(
  rows: T[],
  columns: ColumnConfig<T>[]
): { valid: T[]; invalid: T[] } {
  const valid: T[] = [];
  const invalid: T[] = [];

  rows.forEach((row) => {
    let hasErrors = false;

    columns.forEach((col) => {
      // Check required fields
      if (col.required && !row[col.key as keyof T]) {
        hasErrors = true;
        row._validationStatus = 'error';
        row._validationMessage = row._validationMessage
          ? `${row._validationMessage}; Missing ${col.name}`
          : `Missing ${col.name}`;
      }

      // Run custom validators
      if (col.validator && row[col.key as keyof T]) {
        const result = col.validator(row[col.key as keyof T], row);
        if (!result.isValid) {
          hasErrors = true;
          row._validationStatus = 'error';
          row._validationMessage = row._validationMessage
            ? `${row._validationMessage}; ${col.name}: ${result.message}`
            : `${col.name}: ${result.message}`;
        }
      }
    });

    if (hasErrors) {
      invalid.push(row);
    } else {
      row._validationStatus = 'valid';
      valid.push(row);
    }
  });

  return { valid, invalid };
}

/**
 * Example usage:
 *
 * // User pastes from Excel:
 * // Product Code  Quantity  Delivery Date
 * // PROD-001      100       2025-12-01
 * // PROD-002      200       2025-12-15
 *
 * const pastedData = [
 *   ['Product Code', 'Quantity', 'Delivery Date'],
 *   ['PROD-001', '100', '2025-12-01'],
 *   ['PROD-002', '200', '2025-12-15'],
 * ];
 *
 * const result = parsePastedData(pastedData, poColumns, {
 *   hasHeaderRow: true,
 *   startRowNumber: 1,
 * });
 *
 * console.log(result.rows); // 2 POSpreadsheetRow objects
 * console.log(result.warnings); // ["Successfully parsed 2 rows from Excel"]
 * console.log(result.errors); // []
 */
