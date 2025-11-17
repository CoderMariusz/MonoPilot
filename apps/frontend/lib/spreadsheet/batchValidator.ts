/**
 * Batch Validation Engine for Spreadsheet Mode
 *
 * Validates multiple rows simultaneously with:
 * - Product lookup and caching
 * - Duplicate detection
 * - Date validation
 * - Cross-row validation
 * - Missing required fields
 */

import type { SpreadsheetRow, ColumnConfig, ValidationStatus } from '@/components/SpreadsheetTable';
import type { POSpreadsheetRow, WOSpreadsheetRow } from './columnConfigs';
import { ProductsAPI } from '@/lib/api/products';
import { SuppliersAPI } from '@/lib/api/suppliers';
import { WarehousesAPI } from '@/lib/api/warehouses';
import { ProductionLinesAPI } from '@/lib/api/productionLines';
import type { Product, Supplier, Warehouse, ProductionLine, Bom } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult<T extends SpreadsheetRow> {
  rows: T[];
  summary: {
    total: number;
    valid: number;
    warnings: number;
    errors: number;
  };
  duplicates: {
    field: string;
    value: string;
    rowNumbers: number[];
  }[];
}

export interface ValidationCache {
  products: Map<string, Product>;
  suppliers: Map<string, Supplier>;
  warehouses: Map<string, Warehouse>;
  productionLines: Map<string, ProductionLine>;
  boms: Map<string, Bom[]>;
  lastUpdated: number;
}

// ============================================================================
// Cache Management
// ============================================================================

let validationCache: ValidationCache = {
  products: new Map(),
  suppliers: new Map(),
  warehouses: new Map(),
  productionLines: new Map(),
  boms: new Map(),
  lastUpdated: 0,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Initialize or refresh validation cache
 */
export async function initializeValidationCache(): Promise<void> {
  const now = Date.now();

  // Skip if cache is fresh
  if (now - validationCache.lastUpdated < CACHE_TTL) {
    return;
  }

  console.log('Refreshing validation cache...');

  try {
    // Load all reference data in parallel
    const [products, suppliers, warehouses, productionLines] = await Promise.all([
      ProductsAPI.getAll(),
      SuppliersAPI.getAll(),
      WarehousesAPI.getAll(),
      ProductionLinesAPI.getAll(),
    ]);

    // Build lookup maps
    validationCache.products = new Map(
      products.map((p) => [p.part_number.toLowerCase(), p])
    );

    validationCache.suppliers = new Map(
      suppliers.map((s) => [s.id.toString(), s])
    );

    validationCache.warehouses = new Map(
      warehouses.map((w) => [w.id.toString(), w])
    );

    validationCache.productionLines = new Map(
      productionLines.map((pl) => [pl.id.toString(), pl])
    );

    // BOMs are loaded on-demand per product (products have activeBom property)
    validationCache.boms = new Map();

    validationCache.lastUpdated = now;

    console.log(
      `Cache refreshed: ${products.length} products, ${suppliers.length} suppliers, ${warehouses.length} warehouses, ${productionLines.length} production lines`
    );
  } catch (error) {
    console.error('Failed to initialize validation cache:', error);
    throw new Error('Failed to load reference data for validation');
  }
}

/**
 * Clear validation cache (useful for testing or manual refresh)
 */
export function clearValidationCache(): void {
  validationCache = {
    products: new Map(),
    suppliers: new Map(),
    warehouses: new Map(),
    productionLines: new Map(),
    boms: new Map(),
    lastUpdated: 0,
  };
}

// ============================================================================
// Product Lookup
// ============================================================================

/**
 * Lookup product by code (case-insensitive)
 */
export function lookupProduct(productCode: string): Product | null {
  if (!productCode) return null;
  return validationCache.products.get(productCode.toLowerCase()) || null;
}

/**
 * Get active BOM for a product (from product.activeBom)
 */
export function getLatestActiveBOM(product: Product): Bom | null {
  return product.activeBom || null;
}

// ============================================================================
// PO Validation
// ============================================================================

/**
 * Validate Purchase Order rows
 */
export async function validatePORows(
  rows: POSpreadsheetRow[]
): Promise<ValidationResult<POSpreadsheetRow>> {
  // Ensure cache is initialized
  await initializeValidationCache();

  const validatedRows: POSpreadsheetRow[] = [];
  const duplicates: ValidationResult<POSpreadsheetRow>['duplicates'] = [];

  // Track duplicate product codes
  const productCodeCount = new Map<string, number[]>();

  rows.forEach((row, idx) => {
    const validatedRow = { ...row };
    let hasErrors = false;
    let hasWarnings = false;
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate product code (required)
    if (!validatedRow.product_code?.trim()) {
      errors.push('Product code is required');
      hasErrors = true;
    } else {
      const product = lookupProduct(validatedRow.product_code);

      if (!product) {
        errors.push(`Product '${validatedRow.product_code}' not found`);
        hasErrors = true;
      } else {
        // Product found - populate derived fields
        validatedRow._product_id = product.id.toString();
        validatedRow.product_name = product.description;
        validatedRow.uom = product.uom;
        validatedRow._supplier_id = product.supplier_id?.toString() || '';

        // Validate product is active
        if (!product.is_active) {
          errors.push(`Product '${validatedRow.product_code}' is inactive`);
          hasErrors = true;
        }

        // Validate product has supplier
        if (!product.supplier_id) {
          errors.push(`Product '${validatedRow.product_code}' has no supplier assigned`);
          hasErrors = true;
        } else {
          const supplier = validationCache.suppliers.get(product.supplier_id.toString());
          validatedRow.supplier_name = supplier?.name || 'Unknown';

          // Pre-fill currency from supplier default
          if (!validatedRow.currency && supplier?.currency) {
            validatedRow.currency = supplier.currency;
          }
        }
      }

      // Track duplicates
      const key = validatedRow.product_code.toLowerCase();
      if (!productCodeCount.has(key)) {
        productCodeCount.set(key, []);
      }
      productCodeCount.get(key)!.push(validatedRow._rowNumber);
    }

    // 2. Validate quantity (required, positive)
    const qty = typeof validatedRow.quantity === 'string'
      ? parseFloat(validatedRow.quantity)
      : validatedRow.quantity;

    if (!validatedRow.quantity || isNaN(qty) || qty <= 0) {
      errors.push('Quantity must be a positive number');
      hasErrors = true;
    }

    // 3. Validate unit price (optional, non-negative)
    if (validatedRow.unit_price) {
      const price = typeof validatedRow.unit_price === 'string'
        ? parseFloat(validatedRow.unit_price)
        : validatedRow.unit_price;

      if (isNaN(price) || price < 0) {
        errors.push('Unit price must be a non-negative number');
        hasErrors = true;
      }
    }

    // 4. Validate delivery date (optional, future)
    if (validatedRow.requested_delivery_date) {
      const deliveryDate = new Date(validatedRow.requested_delivery_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(deliveryDate.getTime())) {
        errors.push('Invalid delivery date format');
        hasErrors = true;
      } else if (deliveryDate < today) {
        warnings.push('Delivery date is in the past');
        hasWarnings = true;
      }
    }

    // 5. Validate warehouse (optional - will be selected globally)
    // Warehouse validation happens at submission time

    // Set validation status
    if (hasErrors) {
      validatedRow._validationStatus = 'error';
      validatedRow._validationMessage = errors.join('; ');
    } else if (hasWarnings) {
      validatedRow._validationStatus = 'warning';
      validatedRow._validationMessage = warnings.join('; ');
    } else {
      validatedRow._validationStatus = 'valid';
      validatedRow._validationMessage = undefined;
    }

    validatedRows.push(validatedRow);
  });

  // Detect duplicates
  productCodeCount.forEach((rowNumbers, productCode) => {
    if (rowNumbers.length > 1) {
      duplicates.push({
        field: 'product_code',
        value: productCode,
        rowNumbers,
      });
    }
  });

  // Calculate summary
  const summary = {
    total: validatedRows.length,
    valid: validatedRows.filter((r) => r._validationStatus === 'valid').length,
    warnings: validatedRows.filter((r) => r._validationStatus === 'warning').length,
    errors: validatedRows.filter((r) => r._validationStatus === 'error').length,
  };

  return { rows: validatedRows, summary, duplicates };
}

// ============================================================================
// WO Validation
// ============================================================================

/**
 * Validate Work Order rows
 */
export async function validateWORows(
  rows: WOSpreadsheetRow[]
): Promise<ValidationResult<WOSpreadsheetRow>> {
  // Ensure cache is initialized
  await initializeValidationCache();

  const validatedRows: WOSpreadsheetRow[] = [];
  const duplicates: ValidationResult<WOSpreadsheetRow>['duplicates'] = [];

  // Track duplicate product codes (same product + same scheduled_start = potential duplicate)
  const productScheduleKey = new Map<string, number[]>();

  rows.forEach((row, idx) => {
    const validatedRow = { ...row };
    let hasErrors = false;
    let hasWarnings = false;
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Validate product code (required)
    if (!validatedRow.product_code?.trim()) {
      errors.push('Product code is required');
      hasErrors = true;
    } else {
      const product = lookupProduct(validatedRow.product_code);

      if (!product) {
        errors.push(`Product '${validatedRow.product_code}' not found`);
        hasErrors = true;
      } else {
        // Product found - populate derived fields
        validatedRow._product_id = product.id.toString();
        validatedRow.product_name = product.description;
        validatedRow.uom = product.uom;

        // Validate product is active
        if (!product.is_active) {
          errors.push(`Product '${validatedRow.product_code}' is inactive`);
          hasErrors = true;
        }

        // Get latest active BOM
        const bom = getLatestActiveBOM(product);
        if (bom) {
          validatedRow._bom_id = bom.id.toString();
          validatedRow.bom_version = bom.version || 'Latest';
        } else {
          warnings.push(`No active BOM found for '${validatedRow.product_code}'`);
          hasWarnings = true;
        }
      }
    }

    // 2. Validate quantity (required, positive)
    const qty = typeof validatedRow.quantity === 'string'
      ? parseFloat(validatedRow.quantity)
      : validatedRow.quantity;

    if (!validatedRow.quantity || isNaN(qty) || qty <= 0) {
      errors.push('Quantity must be a positive number');
      hasErrors = true;
    }

    // 3. Validate scheduled_start (required, valid date)
    if (!validatedRow.scheduled_start) {
      errors.push('Scheduled start time is required');
      hasErrors = true;
    } else {
      const startDate = new Date(validatedRow.scheduled_start);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid scheduled start time format');
        hasErrors = true;
      }
    }

    // 4. Validate due_date (optional, future)
    if (validatedRow.due_date) {
      const dueDate = new Date(validatedRow.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(dueDate.getTime())) {
        errors.push('Invalid due date format');
        hasErrors = true;
      } else if (dueDate < today) {
        warnings.push('Due date is in the past');
        hasWarnings = true;
      }
    }

    // 5. Auto-calculate priority based on row order
    validatedRow.priority = validatedRow._rowNumber;

    // 6. Track potential duplicates (same product + same day)
    if (validatedRow.product_code && validatedRow.scheduled_start) {
      const startDate = new Date(validatedRow.scheduled_start);
      const dateKey = startDate.toISOString().split('T')[0];
      const key = `${validatedRow.product_code.toLowerCase()}_${dateKey}`;

      if (!productScheduleKey.has(key)) {
        productScheduleKey.set(key, []);
      }
      productScheduleKey.get(key)!.push(validatedRow._rowNumber);
    }

    // Set validation status
    if (hasErrors) {
      validatedRow._validationStatus = 'error';
      validatedRow._validationMessage = errors.join('; ');
    } else if (hasWarnings) {
      validatedRow._validationStatus = 'warning';
      validatedRow._validationMessage = warnings.join('; ');
    } else {
      validatedRow._validationStatus = 'valid';
      validatedRow._validationMessage = undefined;
    }

    validatedRows.push(validatedRow);
  });

  // Detect potential duplicates (same product scheduled on same day)
  productScheduleKey.forEach((rowNumbers, key) => {
    if (rowNumbers.length > 1) {
      duplicates.push({
        field: 'product_code + scheduled_start',
        value: key,
        rowNumbers,
      });
    }
  });

  // Calculate summary
  const summary = {
    total: validatedRows.length,
    valid: validatedRows.filter((r) => r._validationStatus === 'valid').length,
    warnings: validatedRows.filter((r) => r._validationStatus === 'warning').length,
    errors: validatedRows.filter((r) => r._validationStatus === 'error').length,
  };

  return { rows: validatedRows, summary, duplicates };
}
