/**
 * Sales Order Import Service - Unit Tests (Story 07.5)
 * Purpose: Test SO CSV import operations for SalesOrderService.importSalesOrdersFromCSV
 * Phase: RED - Tests will fail until implementation exists
 *
 * Test Cases from tests.yaml:
 * - AC-IMPORT-01: Import - CSV Parse - Happy Path
 * - AC-IMPORT-02: Import - CSV Parse - Extended Format
 * - AC-IMPORT-03: Import - CSV Grouping by Customer
 * - AC-IMPORT-04: Import - Invalid Customer
 * - AC-IMPORT-05: Import - Invalid Product
 * - AC-IMPORT-06: Import - Invalid Quantity
 * - AC-IMPORT-07: Import - Invalid Unit Price
 * - AC-IMPORT-08: Import - Invalid Date Format
 * - AC-IMPORT-09: Import - Mixed Valid and Invalid Rows
 * - AC-IMPORT-19: Import - Allergen Validation Reset
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Import after mocks
import { SalesOrderService } from '../sales-order-service'

describe('SalesOrderService.importSalesOrdersFromCSV (Story 07.5)', () => {
  const TEST_ORG_ID = '22222222-2222-2222-2222-222222222222'

  // Mock customer lookup
  const mockCustomers = [
    { id: 'cust-001', code: 'ACME001', name: 'Acme Corporation', org_id: TEST_ORG_ID },
    { id: 'cust-002', code: 'BETA002', name: 'Beta Industries', org_id: TEST_ORG_ID },
    { id: 'cust-003', code: 'GAMMA003', name: 'Gamma Foods', org_id: TEST_ORG_ID },
  ]

  // Mock product lookup
  const mockProducts = [
    { id: 'prod-001', code: 'PROD-001', name: 'Widget A', org_id: TEST_ORG_ID },
    { id: 'prod-002', code: 'PROD-002', name: 'Widget B', org_id: TEST_ORG_ID },
    { id: 'prod-003', code: 'PROD-003', name: 'Widget C', org_id: TEST_ORG_ID },
    { id: 'prod-004', code: 'PROD-004', name: 'Widget D', org_id: TEST_ORG_ID },
  ]

  // Helper function to setup standard mocks for happy path
  function setupHappyPathMocks() {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'customers') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (col === 'code') {
                const customer = mockCustomers.find(c => c.code === val)
                return {
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: customer ? { id: customer.id, default_shipping_address_id: null } : null,
                      error: customer ? null : { message: 'Not found' },
                    }),
                  }),
                }
              }
              return {
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }
            }),
          }),
        }
      }
      if (table === 'products') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation((col: string, val: string) => {
              if (col === 'code') {
                const product = mockProducts.find(p => p.code === val)
                return {
                  eq: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({
                        data: product ? { id: product.id, std_price: 10.50 } : null,
                        error: product ? null : { message: 'Not found' },
                      }),
                    }),
                  }),
                }
              }
              return {
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }
            }),
          }),
        }
      }
      return { select: vi.fn() }
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-22'))
    setupHappyPathMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('AC-IMPORT-01: Import - CSV Parse - Happy Path', () => {
    it('should parse CSV with minimal columns successfully', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
BETA002,PROD-001,200,10.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result).toBeDefined()
      expect(result.validatedRows).toBeDefined()
      expect(result.validatedRows.length).toBe(3)
    })

    it('should mark all valid rows with valid=true', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
BETA002,PROD-001,200,10.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      result.validatedRows.forEach((row: any) => {
        expect(row.valid).toBe(true)
        expect(row.error).toBeUndefined()
      })
    })

    it('should parse quantity as number', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].quantity).toBe(100)
      expect(typeof result.validatedRows[0].quantity).toBe('number')
    })

    it('should parse unit_price as number with decimals', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].unit_price).toBe(10.50)
    })
  })

  describe('AC-IMPORT-02: Import - CSV Parse - Extended Format', () => {
    it('should parse optional columns: customer_po, promised_ship_date, notes', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price,customer_po,promised_ship_date,notes
ACME001,PROD-001,100,10.50,PO-12345,2025-12-20,Rush order`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].customer_po).toBe('PO-12345')
      expect(result.validatedRows[0].promised_ship_date).toBe('2025-12-20')
      expect(result.validatedRows[0].notes).toBe('Rush order')
    })

    it('should handle empty optional fields as null', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price,customer_po,promised_ship_date,notes
ACME001,PROD-002,50,25.00,,,`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].customer_po).toBeNull()
      expect(result.validatedRows[0].promised_ship_date).toBeNull()
      expect(result.validatedRows[0].notes).toBeNull()
    })

    it('should handle mixed populated and empty optional fields', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price,customer_po,promised_ship_date,notes
ACME001,PROD-001,100,10.50,PO-12345,,Special handling`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].customer_po).toBe('PO-12345')
      expect(result.validatedRows[0].promised_ship_date).toBeNull()
      expect(result.validatedRows[0].notes).toBe('Special handling')
    })
  })

  describe('AC-IMPORT-03: Import - CSV Grouping by Customer', () => {
    it('should group rows by customer_code', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
BETA002,PROD-001,200,10.00
BETA002,PROD-003,75,15.00
GAMMA003,PROD-004,300,5.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.customerGroups).toBeDefined()
      expect(Object.keys(result.customerGroups).length).toBe(3)
      expect(result.customerGroups['ACME001'].length).toBe(2)
      expect(result.customerGroups['BETA002'].length).toBe(2)
      expect(result.customerGroups['GAMMA003'].length).toBe(1)
    })

    it('should create one SO per customer group', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
BETA002,PROD-001,200,10.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      // When actually creating SOs
      expect(result.ordersToCreate).toBe(2)
    })
  })

  describe('AC-IMPORT-04: Import - Invalid Customer', () => {
    it('should mark row invalid when customer_code does not exist', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
INVALID,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[0].error).toBe('Customer INVALID not found')
    })

    it('should continue processing after invalid customer', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
INVALID,PROD-001,100,10.50
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[1].valid).toBe(true)
    })
  })

  describe('AC-IMPORT-05: Import - Invalid Product', () => {
    it('should mark row invalid when product_code does not exist', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,INVALID-PROD,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[0].error).toBe('Product INVALID-PROD not found')
    })

    it('should continue processing after invalid product', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,INVALID-PROD,100,10.50
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows.length).toBe(2)
      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[1].valid).toBe(true)
    })
  })

  describe('AC-IMPORT-06: Import - Invalid Quantity', () => {
    it('should mark row invalid when quantity is 0', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,0,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[0].error).toBe('Quantity must be greater than zero')
    })

    it('should mark row invalid when quantity is negative', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,-5,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[0].error).toBe('Quantity must be greater than zero')
    })

    it('should mark row invalid when quantity is not a number', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,abc,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
    })
  })

  describe('AC-IMPORT-07: Import - Invalid Unit Price', () => {
    it('should mark row invalid when unit_price is negative', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,-5.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[0].error).toBe('Unit price cannot be negative')
    })

    it('should accept unit_price of 0 (free items)', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,0`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(true)
      expect(result.validatedRows[0].unit_price).toBe(0)
    })
  })

  describe('AC-IMPORT-08: Import - Invalid Date Format', () => {
    it('should mark row invalid when promised_ship_date has invalid format', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price,promised_ship_date
ACME001,PROD-001,100,10.50,12/20/2025`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
      expect(result.validatedRows[0].error).toBe('Invalid date format (use YYYY-MM-DD)')
    })

    it('should accept valid ISO date format YYYY-MM-DD', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price,promised_ship_date
ACME001,PROD-001,100,10.50,2025-12-20`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(true)
      expect(result.validatedRows[0].promised_ship_date).toBe('2025-12-20')
    })
  })

  describe('AC-IMPORT-09: Import - Mixed Valid and Invalid Rows', () => {
    it('should process all rows and track valid/invalid separately', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
INVALID,PROD-001,100,10.50
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows.length).toBe(3)
      expect(result.validCount).toBe(2)
      expect(result.invalidCount).toBe(1)
    })

    it('should include row number in error for invalid rows', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
INVALID,PROD-001,100,10.50
ACME001,PROD-002,50,25.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[1].rowNumber).toBe(2)
      expect(result.validatedRows[1].valid).toBe(false)
    })

    it('should add errors to errors array', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
INVALID,PROD-001,100,10.50
ACME001,INVALID-PROD,50,25.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.errors).toBeDefined()
      expect(result.errors.length).toBe(2)
    })
  })

  describe('AC-IMPORT-19: Import - Allergen Validation Reset', () => {
    it('should set allergen_validated to false for all created SOs', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      // When SOs are created, they should have allergen_validated = false
      expect(result.defaultValues?.allergen_validated).toBe(false)
    })
  })

  describe('CSV File Structure Validation', () => {
    it('should reject empty CSV content', async () => {
      const csvContent = ''

      await expect(
        SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)
      ).rejects.toThrow('CSV file is empty')
    })

    it('should reject CSV without header row', async () => {
      const csvContent = `ACME001,PROD-001,100,10.50`

      await expect(
        SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)
      ).rejects.toThrow('CSV must have header row')
    })

    it('should reject CSV missing required columns', async () => {
      const csvContent = `customer_code,product_code
ACME001,PROD-001`

      await expect(
        SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)
      ).rejects.toThrow('Missing required columns: quantity')
    })

    it('should handle CSV with extra whitespace', async () => {
      const csvContent = `customer_code , product_code , quantity , unit_price
ACME001 , PROD-001 , 100 , 10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].customer_code).toBe('ACME001')
      expect(result.validatedRows[0].quantity).toBe(100)
    })

    it('should handle CSV with quoted fields', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price,notes
ACME001,PROD-001,100,10.50,"This is a note, with comma"`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].notes).toBe('This is a note, with comma')
    })
  })

  describe('CSV Row Validation Schema', () => {
    it('should reject empty customer_code', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
    })

    it('should reject empty product_code', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
    })

    it('should reject empty quantity', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.validatedRows[0].valid).toBe(false)
    })
  })

  describe('Org Isolation', () => {
    it('should only lookup customers within org scope', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      // Customer lookup should filter by org_id
      expect(result.validatedRows[0].resolvedCustomerId).toBeDefined()
    })

    it('should only lookup products within org scope', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      // Product lookup should filter by org_id
      expect(result.validatedRows[0].resolvedProductId).toBeDefined()
    })
  })

  describe('Import Result Summary', () => {
    it('should return summary with ordersToCreate count', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
BETA002,PROD-002,50,25.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.ordersToCreate).toBe(2)
    })

    it('should return summary with linesToCreate count', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
ACME001,PROD-001,100,10.50
ACME001,PROD-002,50,25.00
BETA002,PROD-001,200,10.00`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.linesToCreate).toBe(3)
    })

    it('should return summary with errors count', async () => {
      const csvContent = `customer_code,product_code,quantity,unit_price
INVALID,PROD-001,100,10.50
ACME001,PROD-001,100,10.50`

      const result = await SalesOrderService.importSalesOrdersFromCSV(csvContent, TEST_ORG_ID)

      expect(result.errors.length).toBe(1)
    })
  })
})
