/**
 * Scanner Receive Test Data Fixtures
 * 
 * Fixtures for BUG-SC-002 Fix: /scanner/receive shows 0/0 line items
 * 
 * Purpose: Define test data for scanner receive feature testing
 * Created: 2025-02-09
 * Status: Seed script validates this data exists before running tests
 */

/**
 * Test Supplier for Scanner Receive
 */
export const SCANNER_TEST_SUPPLIER = {
  code: 'TEST-SUPP-001',
  name: 'Test Supplier SC',
  contact_email: 'test@supplier.com',
  contact_phone: '+1-555-0001',
  address: '123 Test Street, Test City',
  payment_terms: 'Net 30'
} as const;

/**
 * Test Warehouse for Scanner Receive
 */
export const SCANNER_TEST_WAREHOUSE = {
  code: 'TEST-WH-01',
  name: 'Test Warehouse',
  type: 'FINISHED_GOODS'
} as const;

/**
 * Test Products for Scanner Receive
 */
export const SCANNER_TEST_PRODUCTS = [
  {
    code: 'TEST-PROD-001',
    name: 'Test Product 001',
    uom: 'KG',
    shelf_life_days: 365
  },
  {
    code: 'TEST-PROD-002',
    name: 'Test Product 002',
    uom: 'KG',
    shelf_life_days: 365
  },
  {
    code: 'TEST-PROD-003',
    name: 'Test Product 003',
    uom: 'KG',
    shelf_life_days: 365
  }
] as const;

/**
 * Test Purchase Orders with Line Items
 * 
 * These POs are created with status 'confirmed' so they appear
 * in the pending receipts list on /scanner/receive
 */
export const SCANNER_TEST_POS = [
  {
    po_number: 'PO-2025-00001',
    status: 'confirmed',
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    lines: [
      {
        product_code: 'TEST-PROD-001',
        quantity: 100,
        unit_price: 50,
        uom: 'KG'
      },
      {
        product_code: 'TEST-PROD-002',
        quantity: 150,
        unit_price: 60,
        uom: 'KG'
      },
      {
        product_code: 'TEST-PROD-003',
        quantity: 200,
        unit_price: 70,
        uom: 'KG'
      }
    ]
  },
  {
    po_number: 'PO-2025-00002',
    status: 'confirmed',
    expected_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    lines: [
      {
        product_code: 'TEST-PROD-001',
        quantity: 100,
        unit_price: 50,
        uom: 'KG'
      },
      {
        product_code: 'TEST-PROD-002',
        quantity: 150,
        unit_price: 60,
        uom: 'KG'
      },
      {
        product_code: 'TEST-PROD-003',
        quantity: 200,
        unit_price: 70,
        uom: 'KG'
      }
    ]
  }
] as const;

/**
 * Expected display values for Scanner Receive tests
 */
export const SCANNER_RECEIVE_EXPECTED = {
  pendingPOs: 2,
  linesPerPO: 3,
  totalPendingLines: 6,
  po1Number: 'PO-2025-00001',
  po2Number: 'PO-2025-00002',
  // Each line should display as "received_qty / ordered_qty"
  // Example: "0 / 100 KG" initially
  lineDisplayFormat: /^\d+\s+\/\s+\d+\s+[A-Z]+$/
} as const;

/**
 * Helper to check if scanner receives the correct line count
 */
export function validateScannerLineCount(displayText: string): boolean {
  // Display format should be "X / Y UOM" or "X/Y UOM"
  const regex = /^\d+\s*\/\s*\d+\s+[A-Z]+$/;
  return regex.test(displayText);
}

/**
 * Helper to extract line counts from display text
 */
export function parseScannerLineDisplay(displayText: string): { received: number; ordered: number } | null {
  const match = displayText.match(/^(\d+)\s*\/\s*(\d+)\s+[A-Z]+$/);
  if (!match) return null;
  
  return {
    received: parseInt(match[1], 10),
    ordered: parseInt(match[2], 10)
  };
}
