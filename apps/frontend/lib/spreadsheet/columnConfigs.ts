/**
 * Column configurations for Spreadsheet Mode (PO/WO bulk entry)
 *
 * Defines column definitions, validators, and formatters for:
 * - Purchase Order (PO) bulk entry
 * - Work Order (WO) bulk entry
 */

import type { ColumnConfig, SpreadsheetRow } from '@/components/SpreadsheetTable';
import { ProductsAPI } from '@/lib/api/products';
import { SuppliersAPI } from '@/lib/api/suppliers';
import { WarehousesAPI } from '@/lib/api/warehouses';
import { ProductionLinesAPI } from '@/lib/api/productionLines';
import { BomsAPI } from '@/lib/api/boms';

// ============================================================================
// Purchase Order Row Type
// ============================================================================

export interface POSpreadsheetRow extends SpreadsheetRow {
  product_code: string;
  product_name?: string;
  supplier_name?: string;
  quantity: number | string;
  uom?: string;
  unit_price?: number | string;
  currency?: string;
  requested_delivery_date?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  notes?: string;
  // Resolved references
  _product_id?: string;
  _supplier_id?: string;
}

// ============================================================================
// Work Order Row Type
// ============================================================================

export interface WOSpreadsheetRow extends SpreadsheetRow {
  product_code: string;
  product_name?: string;
  quantity: number | string;
  uom?: string;
  production_line?: string;
  production_line_name?: string;
  scheduled_start?: string; // ISO datetime
  scheduled_end?: string; // ISO datetime
  due_date?: string; // ISO date
  bom_version?: string;
  shift?: 'day' | 'night' | 'overtime';
  priority?: number | string;
  notes?: string;
  // Resolved references
  _product_id?: string;
  _line_id?: string;
  _bom_id?: string;
}

// ============================================================================
// Validators
// ============================================================================

const validators = {
  required: (value: any) => {
    const isValid = value !== null && value !== undefined && value !== '';
    return {
      isValid,
      message: isValid ? undefined : 'Required field',
    };
  },

  positiveNumber: (value: any) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    const isValid = !isNaN(num) && num > 0;
    return {
      isValid,
      message: isValid ? undefined : 'Must be a positive number',
    };
  },

  date: (value: any) => {
    if (!value) return { isValid: false, message: 'Required field' };
    const date = new Date(value);
    const isValid = !isNaN(date.getTime());
    return {
      isValid,
      message: isValid ? undefined : 'Invalid date format',
    };
  },

  futureDate: (value: any) => {
    if (!value) return { isValid: false, message: 'Required field' };
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isValid = date >= today;
    return {
      isValid,
      message: isValid ? undefined : 'Date must be in the future',
    };
  },

  productCode: async (value: string) => {
    if (!value) return { isValid: false, message: 'Required field' };
    try {
      const products = await ProductsAPI.getAll();
      const product = products.find(
        (p) => p.part_number.toLowerCase() === value.toLowerCase()
      );
      if (!product) {
        return { isValid: false, message: 'Product not found' };
      }
      if (!product.is_active) {
        return { isValid: false, message: 'Product is inactive' };
      }
      return { isValid: true };
    } catch (error) {
      return { isValid: false, message: 'Validation error' };
    }
  },
};

// ============================================================================
// PO Column Configuration
// ============================================================================

export const getPOColumns = (): ColumnConfig<POSpreadsheetRow>[] => [
  {
    key: 'product_code',
    name: 'Product Code',
    width: 150,
    required: true,
    editable: true,
    type: 'text',
    validator: (value, row) => {
      if (!value) return { isValid: false, message: 'Required' };
      // Validation happens async during batch validation
      return { isValid: true };
    },
  },
  {
    key: 'product_name',
    name: 'Product Name',
    width: 250,
    editable: false,
    formatter: (value, row) => {
      return row._product_id ? value || 'Loading...' : '';
    },
  },
  {
    key: 'supplier_name',
    name: 'Supplier',
    width: 180,
    editable: false,
    formatter: (value, row) => {
      return row._supplier_id ? value || 'Loading...' : '';
    },
  },
  {
    key: 'quantity',
    name: 'Quantity',
    width: 120,
    required: true,
    editable: true,
    type: 'number',
    validator: validators.positiveNumber,
    formatter: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toFixed(2) : value;
    },
  },
  {
    key: 'uom',
    name: 'UoM',
    width: 80,
    editable: false,
    formatter: (value, row) => {
      return row._product_id ? value || '' : '';
    },
  },
  {
    key: 'unit_price',
    name: 'Unit Price',
    width: 120,
    editable: true,
    type: 'number',
    validator: (value) => {
      if (!value) return { isValid: true }; // Optional
      const num = typeof value === 'string' ? parseFloat(value) : value;
      const isValid = !isNaN(num) && num >= 0;
      return {
        isValid,
        message: isValid ? undefined : 'Must be a non-negative number',
      };
    },
    formatter: (value, row) => {
      if (!value) return '';
      const num = typeof value === 'string' ? parseFloat(value) : value;
      const currency = row.currency || 'USD';
      return !isNaN(num) ? `${num.toFixed(2)} ${currency}` : value;
    },
  },
  {
    key: 'currency',
    name: 'Currency',
    width: 100,
    editable: true,
    type: 'select',
    options: [
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
      { value: 'PLN', label: 'PLN' },
    ],
  },
  {
    key: 'requested_delivery_date',
    name: 'Delivery Date',
    width: 150,
    editable: true,
    type: 'date',
    validator: validators.futureDate,
  },
  {
    key: 'warehouse_name',
    name: 'Warehouse',
    width: 150,
    editable: false,
    formatter: (value, row) => {
      return row.warehouse_id ? value || 'Unknown' : '';
    },
  },
  {
    key: 'notes',
    name: 'Notes',
    width: 200,
    editable: true,
    type: 'text',
  },
];

// ============================================================================
// WO Column Configuration
// ============================================================================

export const getWOColumns = (): ColumnConfig<WOSpreadsheetRow>[] => [
  {
    key: 'product_code',
    name: 'Product Code',
    width: 150,
    required: true,
    editable: true,
    type: 'text',
    validator: (value) => {
      if (!value) return { isValid: false, message: 'Required' };
      return { isValid: true };
    },
  },
  {
    key: 'product_name',
    name: 'Product Name',
    width: 250,
    editable: false,
    formatter: (value, row) => {
      return row._product_id ? value || 'Loading...' : '';
    },
  },
  {
    key: 'quantity',
    name: 'Quantity',
    width: 120,
    required: true,
    editable: true,
    type: 'number',
    validator: validators.positiveNumber,
    formatter: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return !isNaN(num) ? num.toFixed(2) : value;
    },
  },
  {
    key: 'uom',
    name: 'UoM',
    width: 80,
    editable: false,
    formatter: (value, row) => {
      return row._product_id ? value || '' : '';
    },
  },
  {
    key: 'production_line_name',
    name: 'Production Line',
    width: 150,
    editable: false,
    formatter: (value, row) => {
      return row._line_id ? value || 'Auto-assign' : 'Auto-assign';
    },
  },
  {
    key: 'scheduled_start',
    name: 'Start Time',
    width: 180,
    required: true,
    editable: true,
    type: 'datetime',
    validator: validators.date,
    formatter: (value) => {
      if (!value) return '';
      const date = new Date(value);
      return !isNaN(date.getTime())
        ? date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : value;
    },
  },
  {
    key: 'scheduled_end',
    name: 'End Time',
    width: 180,
    editable: false,
    formatter: (value, row) => {
      // Auto-calculated based on BOM routing time
      if (!value && row.scheduled_start && row._bom_id) {
        return 'Auto-calc';
      }
      if (!value) return '';
      const date = new Date(value);
      return !isNaN(date.getTime())
        ? date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : value;
    },
  },
  {
    key: 'due_date',
    name: 'Due Date',
    width: 130,
    editable: true,
    type: 'date',
    validator: validators.futureDate,
  },
  {
    key: 'bom_version',
    name: 'BOM Version',
    width: 120,
    editable: false,
    formatter: (value, row) => {
      return row._bom_id ? value || 'Latest' : 'Latest';
    },
  },
  {
    key: 'shift',
    name: 'Shift',
    width: 100,
    editable: true,
    type: 'select',
    options: [
      { value: 'day', label: 'Day (08:00-16:00)' },
      { value: 'night', label: 'Night (16:00-00:00)' },
      { value: 'overtime', label: 'Overtime' },
    ],
  },
  {
    key: 'priority',
    name: 'Priority',
    width: 90,
    editable: false,
    formatter: (value, row) => {
      // Priority is auto-calculated based on row order
      return row._rowNumber.toString();
    },
  },
  {
    key: 'notes',
    name: 'Notes',
    width: 200,
    editable: true,
    type: 'text',
  },
];
